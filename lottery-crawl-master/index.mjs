/*
 * import libs
 */
import cors from 'cors';
import { config } from 'dotenv';
import express, { json } from 'express';
import helmet from 'helmet';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
/*
 * import components
 */
import rootRoute from './src/routes/router.mjs';
import { startDailyCrawlSchedule } from './src/daily-crawl-scheduler.mjs';

// run dot env config
config();

/*
 * defined variable
 */
const port = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendBuildPath = path.resolve(__dirname, '../lottery-frontend-master/build');
const landingPagePath = path.resolve(__dirname, '../lottery-frontend-master/public/landing-source.html');

const app = express();
const httpServer = http.createServer(app);

/*
 * use middleware
 */
app.enable('trust proxy');

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()) : false }));
app.use(json());
app.use(express.static(frontendBuildPath, { index: false }));

/*
 * defined route
 */
app.use('/api', rootRoute);


app.get('/', (req, res) => {
  res.sendFile(landingPagePath);
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(frontendBuildPath, 'index.html'));
});

/*
 * run server
 */
httpServer.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  if (process.env.DISABLE_DAILY_SCHEDULE !== 'true') startDailyCrawlSchedule();
});
