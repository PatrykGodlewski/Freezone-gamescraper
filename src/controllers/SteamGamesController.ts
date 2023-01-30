import ProgressBar from 'progress';
import SteamAPI from 'steamapi';

import { SteamGameData } from '@/types/SteamGameDetails.type';
import { db } from '@/utils/database';
import { logger } from '@/utils/logger';
import { createImagesJson, validateDate } from '@/utils/utils';
import IgnoreFile from '@utils/IgnoreFile';
import { errorHandler } from '@utils/errorHandler';
import { z } from 'zod';

type SteamApiErrorMessages = 'No app found' | 'Too Many Requests';
const STEAM_ERROR_MESSAGES = { noAppFound: 'No app found', tooManyRequests: 'Too Many Requests' };

export default class SteamGamesController {
  bar: ProgressBar;
  steamApi: SteamAPI;
  ignoreFiles: IgnoreFile;
  constructor() {
    this.bar = null;
    this.steamApi = new SteamAPI(process.env.STEAM_API_KEY ?? '');
    this.ignoreFiles = new IgnoreFile();
  }

  makeLoadingBar(barLenght: number) {
    this.bar = new ProgressBar('-> Fetching [:bar] :current/:total :etas ', {
      total: barLenght,
      width: 30,
      complete: '=',
      incomplete: ' ',
    });
  }

  async *steamGameGenerator() {
    const appList = await this.steamApi.getAppList();
    this.makeLoadingBar(appList.length);
    for (const { appid, name } of appList) {
      try {
        this.bar.tick();
        const isGameCached = !!this.ignoreFiles.find(appid);
        if (isGameCached) {
          logger.info(`Skipping ${name}`);
          continue;
        }
        yield (await this.steamApi.getGameDetails(String(appid))) as SteamGameData;
        this.ignoreFiles.add({ appid, found: true });
      } catch (error) {
        const message = errorHandler(error) as SteamApiErrorMessages;

        switch (message) {
          case STEAM_ERROR_MESSAGES.noAppFound:
            this.ignoreFiles.add({ appid, found: false });
            logger.info(`${message}: ${appid}`);
            yield null;
            break;
          case STEAM_ERROR_MESSAGES.tooManyRequests:
            this.ignoreFiles.remove(appid);
            logger.info(message, `Next retry in 5 minutes`);
            yield { done: true };
            return;
          default:
            logger.error(message);
            break;
        }
      }
    }
  }

  createSteamGameData({ name, steam_appid, is_free, release_date, short_description, header_image, type }: SteamGameData) {
    const SteamGameSchema = z.object({
      game_name: z.string(),
      app_id: z.string(),
      is_free: z.boolean(),
      images: z.string(),
      release_date: z.date().nullable(),
      description: z.string(),
      game_vendor: z.literal('steam'),
      game_type: z.literal('game'),
    });

    const gameData = {
      game_name: name,
      app_id: String(steam_appid),
      is_free,
      images: createImagesJson({ h: header_image, v: null }),
      release_date: validateDate(release_date.date),
      description: short_description,
      game_vendor: 'steam',
      game_type: type,
    };
    const zodCheck = SteamGameSchema.safeParse(gameData);
    if (!zodCheck.success) throw new Error(zodCheck + __filename);
    return gameData;
  }

  async start() {
    try {
      for await (const steamGame of this.steamGameGenerator()) {
        if (!steamGame) continue;
        if (steamGame.done) {
          this.ignoreFiles.saveTemp();
          logger.info(`Done, restarting after 5 minutes`);
          return;
        }
        if (steamGame.type !== 'game') continue;

        const game = this.createSteamGameData(steamGame);

        await db.game.upsert({
          where: { app_id: game.app_id },
          create: game,
          // TODO: update only changed fields
          update: game,
        });
      }
    } catch (error) {
      const message = errorHandler(error);
      logger.error(message);
    }
  }
}
