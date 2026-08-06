import { config } from 'dotenv';
import { fileURLToPath } from 'url';

config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const targetDate = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate || '')) {
  throw new Error('VIP snapshot worker requires a target date in YYYY-MM-DD format.');
}

const [{ refreshVipStrategySnapshots }, { default: pool }] = await Promise.all([
  import('./controllers/dashboard.controller.mjs'),
  import('./db.mjs'),
]);

try {
  await refreshVipStrategySnapshots(targetDate);
  console.log(`VIP snapshots saved for ${targetDate}.`);
} catch (error) {
  console.error(`VIP snapshot refresh failed for ${targetDate}: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
