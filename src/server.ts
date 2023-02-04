import App from '@/app';
import validateEnv from '@utils/validateEnv';

import EpicGamesController from '@/controllers/EpicGamesController';
import SteamGameController from '@/controllers/SteamGamesController';

validateEnv();

const cronJobs = [new SteamGameController(), new EpicGamesController()];

const app = new App(cronJobs);

app.listen();
