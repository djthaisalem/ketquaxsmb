import { refreshHomepageForecasts, refreshHomepageStatistics } from '../src/controllers/dashboard.controller.mjs';

const referenceDate = process.argv[2] || new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date());
const dates = [-2, -1, 0, 1].map((offset) => {
  const value = new Date(`${referenceDate}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
});

await refreshHomepageForecasts(dates);
await refreshHomepageStatistics();
console.log(`Homepage forecasts refreshed: ${dates.join(', ')}`);
process.exit(0);
