import { refreshVipStrategySnapshots } from '../src/controllers/dashboard.controller.mjs';

const targetDates = process.argv.slice(2);
if (!targetDates.length || targetDates.some((date) => !/^\d{4}-\d{2}-\d{2}$/.test(date))) throw new Error('Dùng: node scripts/refresh-vip-strategies.mjs YYYY-MM-DD [...]');
for (const targetDate of targetDates) {
  await refreshVipStrategySnapshots(targetDate);
  console.log(`Đã lưu VIP 1 và VIP 2 cho ${targetDate}.`);
}
process.exit(0);
