import { db } from '@utils/database';
import { logger } from '@utils/logger';
import { OfferGame, getGames } from 'epic-free-games';
import { z } from 'zod';

type EpicGame = OfferGame & {
  offerMappings: [{ pageSlug: string; pageType: string }];
  catalogNs: { mappings: [{ pageSlug: string; pageType: string }] };
};

export default class EpicGamesController {
  async start() {
    try {
      const { currentGames, nextGames } = (await getGames('US', true)) as { currentGames: EpicGame[]; nextGames: EpicGame[] };
      const isGame = await db.game.findUnique({ where: { app_id: currentGames[0].id } });
      if (isGame) return;
      await this.purgeEpicGames();
      for (const gameGroup of [currentGames, nextGames]) {
        for (const game of gameGroup) {
          const epicGameData = this.createEpicGamesData(game);
          await db.game.create({ data: epicGameData });
        }
      }
    } catch (error: any) {
      logger.error(error.message);
    }
  }

  async purgeEpicGames() {
    await db.game.deleteMany({ where: { game_vendor: 'epic' } });
  }

  createEpicGamesData(game) {
    const EpicGameSchema = z.object({
      app_id: z.string(),
      game_type: z.string(),
      game_vendor: z.literal('epic'),
      game_name: z.string(),
      description: z.string(),
      is_free: z.boolean(),
      images: z.string(),
      url_slug: z.string(),
      release_date: z.date().nullable(),
    });

    const gameData = {
      app_id: game.id,
      game_type: game.offerType,
      game_vendor: 'epic',
      game_name: game.title,
      description: game.description,
      is_free: game.price.totalPrice.discountPrice === 0,
      images: JSON.stringify(game.keyImages),
      url_slug: game?.offerMappings[0]?.pageSlug ?? game?.catalogNs?.mappings[0]?.pageSlug,
      release_date: null,
    };

    const zodCheck = EpicGameSchema.safeParse(gameData);
    if (!zodCheck.success) throw new Error(zodCheck.error + __filename);
    return gameData;
  }
}
