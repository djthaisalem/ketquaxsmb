import { config } from 'dotenv';
import { fileURLToPath } from 'url';

config({ path: fileURLToPath(new URL('../.env', import.meta.url)) });

const targetDate = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate || '')) {
  throw new Error('VIP snapshot worker requires a target date in YYYY-MM-DD format.');
}

const allowedModes = ['vip1', 'vip2'];
const allowedWindows = [1, 2, 3];
const allowedNumberSizes = [2, 3];
let requested = {};
try { requested = JSON.parse(process.argv[3] || '{}'); } catch { requested = {}; }
const options = {
  modes: Array.isArray(requested.modes) ? requested.modes.filter((value) => allowedModes.includes(value)) : allowedModes,
  windows: Array.isArray(requested.windows) ? requested.windows.map(Number).filter((value) => allowedWindows.includes(value)) : allowedWindows,
  numberSizes: Array.isArray(requested.numberSizes) ? requested.numberSizes.map(Number).filter((value) => allowedNumberSizes.includes(value)) : allowedNumberSizes,
};
if (!options.modes.length) options.modes = allowedModes;
if (!options.windows.length) options.windows = allowedWindows;
if (!options.numberSizes.length) options.numberSizes = allowedNumberSizes;

const [{ refreshVipStrategySnapshots }, { storeVipResultHistory }, { default: pool }] = await Promise.all([
  import('./controllers/dashboard.controller.mjs'),
  import('./vip-result-history.mjs'),
  import('./db.mjs'),
]);

try {
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [`vip-snapshot:${targetDate}`]);
    await refreshVipStrategySnapshots(targetDate, options);
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtext($1))', [`vip-snapshot:${targetDate}`]).catch(() => {});
    client.release();
  }
  await storeVipResultHistory(targetDate);
  console.log(`VIP snapshots saved for ${targetDate}.`);
} catch (error) {
  console.error(`VIP snapshot refresh failed for ${targetDate}: ${error.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
