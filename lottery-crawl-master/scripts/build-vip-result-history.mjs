import { config } from 'dotenv';
import pool from '../src/db.mjs';
import { refreshVipStrategySnapshots } from '../src/controllers/dashboard.controller.mjs';
import { storeVipResultHistory } from '../src/vip-result-history.mjs';

config();

const option = (name, fallback) => process.argv.find((value) => value.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;
const from = option('from', '2026-07-01');
const historyOnly = process.argv.includes('--history-only');
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');
if (!validDate(from)) throw new Error('Tham số --from phải là YYYY-MM-DD.');

const latest = await pool.query('SELECT MAX(draw_date)::text AS date FROM lottery_draws');
const to = option('to', latest.rows[0].date);
if (!validDate(to) || from > to) throw new Error('Khoảng ngày không hợp lệ.');

let stored = 0;
try {
  for (let current = from; current <= to;) {
    if (!historyOnly) await refreshVipStrategySnapshots(current);
    stored += await storeVipResultHistory(current);
    const next = new Date(`${current}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    current = next.toISOString().slice(0, 10);
    console.log(`Đã lưu kết quả VIP đến ${current}.`);
  }
  console.log(`Hoàn tất: ${stored} bản ghi kết quả VIP từ ${from} đến ${to}.`);
} finally {
  await pool.end();
}
