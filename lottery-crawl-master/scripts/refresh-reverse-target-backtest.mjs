import { calculateReverseTargetBacktest } from '../src/reverse-target-backtest.mjs';

const targetDate = process.argv[2];
const report = await calculateReverseTargetBacktest(targetDate);

console.log(`Đã chạy backtest soi ngược độc lập cho ngày target ${report.targetDate}.`);
for (const rule of report.rules) {
  const best = rule.top?.[0];
  if (!best) continue;
  console.log(`${rule.name}: ${best.comboValues.join('-')} + ${best.pair.join('-')} · ${best.hit}/${best.n} · ${(best.rate * 100).toFixed(2)}% · Wilson ${(best.wilsonLow * 100).toFixed(2)}%`);
}
