import pool from './db.mjs';
import { refreshInternalBacktest } from './internal-backtest.mjs';

try {
  const report = await refreshInternalBacktest();
  console.log(`Internal backtest refreshed through ${report.sourceThrough}.`);
} catch (error) {
  console.error(`Internal backtest refresh failed: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
