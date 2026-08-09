import pool from './db.mjs';

const addDays = (date, amount) => {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
};

function resultPayload(snapshot, actual) {
  const candidates = new Map();
  const addCandidates = (targets, source) => {
    (targets || []).forEach((number) => {
      if (!candidates.has(number)) candidates.set(number, { number, sources: [] });
      candidates.get(number).sources.push(source);
    });
  };
  (snapshot.payload?.items || []).forEach((signal) => {
    addCandidates(signal.targets, signal.formula || signal.group);
  });
  addCandidates(snapshot.payload?.recommendationOne?.targets, 'Ưu tiên 1 số');
  addCandidates(snapshot.payload?.recommendation?.targets, 'Đề xuất ưu tiên 2 số');

  const pending = new Set(candidates.keys());
  const byDay = Array.from({ length: snapshot.window_size }, (_, offset) => {
    const date = addDays(snapshot.target_date, offset);
    const appeared = (actual.get(date) || []).filter((number) => number.length >= snapshot.number_size).map((number) => number.slice(-snapshot.number_size));
    const matched = [...new Set(appeared.filter((number) => pending.has(number)))];
    matched.forEach((number) => pending.delete(number));
    return {
      day: offset + 1,
      date,
      available: actual.has(date),
      hits: appeared.filter((number) => matched.includes(number)).length,
      matched,
      evidence: matched.map((number) => ({ number, sources: [...new Set(candidates.get(number).sources)] })),
    };
  });
  const matched = [...new Set(byDay.flatMap((day) => day.matched))];
  return {
    numbers: matched,
    matched,
    matchedCount: matched.length,
    totalPredicted: candidates.size,
    predicted: [...candidates.values()].map((candidate) => ({ ...candidate, sources: [...new Set(candidate.sources)] })),
    hits: byDay.reduce((total, day) => total + day.hits, 0),
    byDay,
  };
}

export async function storeVipResultHistory(targetDate) {
  const snapshots = await pool.query(`SELECT target_date::text AS target_date, vip_mode, number_size, window_size, payload
    FROM vip_strategy_snapshots WHERE target_date = $1`, [targetDate]);
  if (!snapshots.rowCount) return 0;
  const latestDate = addDays(targetDate, 2);
  const prizes = await pool.query(`SELECT draw_date::text AS draw_date, numbers
    FROM lottery_prizes WHERE draw_date BETWEEN $1 AND $2`, [targetDate, latestDate]);
  const actual = new Map();
  prizes.rows.forEach((row) => actual.set(row.draw_date, [...(actual.get(row.draw_date) || []), ...row.numbers]));
  for (const snapshot of snapshots.rows) {
    const payload = resultPayload(snapshot, actual);
    await pool.query(`INSERT INTO vip_result_history (target_date, vip_mode, number_size, window_size, payload, generated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (target_date, vip_mode, number_size, window_size)
      DO UPDATE SET payload = EXCLUDED.payload, generated_at = NOW()`,
    [snapshot.target_date, snapshot.vip_mode, snapshot.number_size, snapshot.window_size, JSON.stringify(payload)]);
  }
  return snapshots.rowCount;
}
