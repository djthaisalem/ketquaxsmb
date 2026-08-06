import pool from '../db.mjs';
import { crawlDates, todayVietnam } from '../daily-crawler.mjs';

let running = false;

export function isCrawlRunning() {
  return running;
}

export async function runCrawl(date = todayVietnam()) {
  if (running) throw new Error('Một tiến trình crawl đang chạy.');
  running = true;
  const client = await pool.connect();
  try {
    return await crawlDates(client, date);
  } finally {
    client.release();
    running = false;
  }
}

export async function crawlToday(req, res, next) {
  try {
    const date = /^\d{4}-\d{2}-\d{2}$/.test(req.body?.date || '') ? req.body.date : todayVietnam();
    const result = await runCrawl(date);
    res.json(result);
  } catch (error) { next(error); }
}
