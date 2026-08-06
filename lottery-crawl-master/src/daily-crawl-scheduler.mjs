import { runCrawl } from './controllers/crawl.controller.mjs';
import { refreshHomepageForecasts, refreshHomepageStatistics, refreshVipStrategySnapshots } from './controllers/dashboard.controller.mjs';
import { todayVietnam } from './daily-crawler.mjs';

function vietnamClock() {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  return Object.fromEntries(parts.filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]));
}

export function startDailyCrawlSchedule() {
  if (process.env.AUTO_CRAWL === 'false') return;
  let lastRunDate = '';
  setInterval(async () => {
    const clock = vietnamClock();
    const date = todayVietnam();
    if (clock.hour !== '19' || clock.minute !== '00' || lastRunDate === date) return;
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
      await refreshVipStrategySnapshots(targetDate);
      console.log(`Daily crawl ${date}: ${result.successfulDays} saved, ${result.failedDays} failed.`);
    } catch (error) {
      console.error(`Daily crawl ${date} failed: ${error.message}`);
    }
  }, 15_000);
  console.log('Daily crawler is scheduled for 19:00 Asia/Ho_Chi_Minh.');
}
