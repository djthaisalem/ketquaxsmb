import pool from '../src/db.mjs';
import { calculateBalancedDistinctWalkForward } from '../src/balanced-distinct-walk-forward.mjs';

const from = process.argv[2] || '2026-01-01';
const to = process.argv[3] || '2026-01-31';

try {
  const report = await calculateBalancedDistinctWalkForward({ from, to });
  console.log(JSON.stringify({ from, to, summary: report.summary, monthly: report.monthly }, null, 2));
} finally {
  await pool.end();
}
