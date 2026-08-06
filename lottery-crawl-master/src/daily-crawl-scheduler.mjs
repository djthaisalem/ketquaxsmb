import { runCrawl } from './controllers/crawl.controller.mjs';
import { refreshHomepageForecasts, refreshHomepageStatistics } from './controllers/dashboard.controller.mjs';
import pool from './db.mjs';
import { todayVietnam } from './daily-crawler.mjs';
import { storeVipResultHistory } from './vip-result-history.mjs';
import { refreshInternalBacktest } from './internal-backtest.mjs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const defaultCrawlerSettings = { schedule: '19:00', enabled: true };
let cachedCrawlerSettings = defaultCrawlerSettings;
let crawlerSettingsReadAt = 0;
const vipSnapshotWorkerPath = fileURLToPath(new URL('./vip-snapshot-worker.mjs', import.meta.url));

function queueVipSnapshotRefresh(targetDate) {
  const worker = spawn(process.execPath, [vipSnapshotWorkerPath, targetDate], {
    detached: true,
    env: process.env,
    stdio: 'ignore',
    windowsHide: true,
  });
  worker.unref();
  console.log(`VIP snapshot refresh queued for ${targetDate}.`);
}

function vietnamClock() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

async function getCrawlerSettings() {
  if (Date.now() - crawlerSettingsReadAt < 60_000) return cachedCrawlerSettings;
  crawlerSettingsReadAt = Date.now();
  try {
    const result = await pool.query("SELECT setting_value FROM api_settings WHERE setting_key = 'crawler'");
    const value = result.rows[0]?.setting_value || {};
    const schedule = String(value.schedule || defaultCrawlerSettings.schedule).match(/^([01]\d|2[0-3]):[0-5]\d$/)?.[0] || defaultCrawlerSettings.schedule;
    cachedCrawlerSettings = { schedule, enabled: value.enabled !== false };
  } catch (error) {
    console.error(`Unable to read crawler settings: ${error.message}`);
  }
  return cachedCrawlerSettings;
}

export function startDailyCrawlSchedule() {
  if (process.env.AUTO_CRAWL === 'false') return;
  let lastRunDate = '';
  setInterval(async () => {
    const clock = vietnamClock();
    const date = todayVietnam();
    const settings = await getCrawlerSettings();
    const [hour, minute] = settings.schedule.split(':');
    if (!settings.enabled || clock.hour !== hour || clock.minute !== minute || lastRunDate === date) return;
    lastRunDate = date;
    try {
      const result = await runCrawl(date);
      const nextDate = new Date(`${date}T00:00:00Z`);
      nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      const targetDate = nextDate.toISOString().slice(0, 10);
      const homepageDates = [-2, -1, 0, 1].map((offset) => {
        const value = new Date(`${date}T00:00:00Z`);
        value.setUTCDate(value.getUTCDate() + offset);
        return value.toISOString().slice(0, 10);
      });
      await refreshHomepageForecasts(homepageDates);
      await refreshHomepageStatistics();
      await Promise.all([-2, -1, 0].map((offset) => {
        const value = new Date(`${date}T00:00:00Z`);
        value.setUTCDate(value.getUTCDate() + offset);
        return storeVipResultHistory(value.toISOString().slice(0, 10));
      }));
      await refreshInternalBacktest();
      queueVipSnapshotRefresh(targetDate);
      console.log(`Daily crawl ${date}: ${result.successfulDays} saved, ${result.failedDays} failed.`);
    } catch (error) {
      console.error(`Daily crawl ${date} failed: ${error.message}`);
    }
  }, 15_000);
  console.log('Daily crawler reads its schedule from CMS (Asia/Ho_Chi_Minh).');
}
