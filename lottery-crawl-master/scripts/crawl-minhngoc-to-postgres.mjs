import { config } from 'dotenv';
import pg from 'pg';
import { crawlDates, todayVietnam } from '../src/daily-crawler.mjs';

config();
const [from = todayVietnam(), to = from] = process.argv.slice(2);
if (!process.env.DATABASE_URL) throw new Error('Cần DATABASE_URL trong .env.');

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const result = await crawlDates(client, from, to);
  console.log(JSON.stringify(result));
  if (result.failedDays) process.exitCode = 1;
} finally {
  await client.end();
}
