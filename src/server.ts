import App from '@/app';
import SteamGameController from '@/controllers/SteamGamesController';
import validateEnv from '@utils/validateEnv';
import EpicGamesController from './controllers/EpicGamesController';

validateEnv();

const cronJobs = [new SteamGameController(), new EpicGamesController()];

const app = new App(cronJobs);

app.listen();
