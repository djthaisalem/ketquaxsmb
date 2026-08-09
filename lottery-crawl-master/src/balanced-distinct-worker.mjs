import pool from './db.mjs';
import { calculateBalancedDistinctWalkForward } from './balanced-distinct-walk-forward.mjs';

const [from, to] = process.argv.slice(2);

try {
  const report = await calculateBalancedDistinctWalkForward({
    from,
    to,
    onProgress: (progress) => process.send?.({ type: 'progress', progress }),
  });
  process.send?.({ type: 'complete', report });
} catch (error) {
  process.send?.({ type: 'error', error: error.message });
} finally {
  await pool.end();
  process.disconnect?.();
}
