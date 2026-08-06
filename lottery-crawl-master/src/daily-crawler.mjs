import { crawlMinhNgoc, parseIsoDate } from './minhngoc-crawler.mjs';

function isoTodayVietnam() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

async function crawlWithRetry(date) {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try { return await crawlMinhNgoc(date); } catch (error) {
      lastError = error;
      if (attempt < 3) await new Promise((resolve) => setTimeout(resolve, attempt * 5_000));
    }
  }
  throw lastError;
}

export async function crawlDates(client, from, to = from) {
  const fromDate = parseIsoDate(from);
  const toDate = parseIsoDate(to);
  if (fromDate > toDate) throw new Error('Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.');
  const run = await client.query(
    'INSERT INTO crawl_runs (source_name, from_date, to_date) VALUES ($1, $2, $3) RETURNING id',
    ['minhngoc', from, to],
  );
  const errors = [];
  let successfulDays = 0;
  try {
    for (let date = new Date(fromDate); date <= toDate; date.setUTCDate(date.getUTCDate() + 1)) {
      const isoDate = date.toISOString().slice(0, 10);
      try {
        const result = await crawlWithRetry(date);
        await client.query('BEGIN');
        await client.query(
          `INSERT INTO lottery_draws (draw_date, source_url, crawled_at, updated_at)
           VALUES ($1, $2, NOW(), NOW())
           ON CONFLICT (draw_date) DO UPDATE SET source_url = EXCLUDED.source_url, updated_at = NOW()`,
          [result.drawDate, result.sourceUrl],
        );
        for (const [prizeCode, numbers] of Object.entries(result.prizes)) {
          await client.query(
            `INSERT INTO lottery_prizes (draw_date, prize_code, numbers) VALUES ($1, $2, $3)
             ON CONFLICT (draw_date, prize_code) DO UPDATE SET numbers = EXCLUDED.numbers`,
            [result.drawDate, prizeCode, numbers],
          );
        }
        await client.query('COMMIT');
        successfulDays += 1;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {});
        errors.push({ date: isoDate, message: error.message });
      }
    }
  } finally {
    await client.query(
      'UPDATE crawl_runs SET finished_at = NOW(), successful_days = $1, failed_days = $2, errors = $3 WHERE id = $4',
      [successfulDays, errors.length, JSON.stringify(errors), run.rows[0].id],
    );
  }
  return { from, to, successfulDays, failedDays: errors.length, errors };
}

export function todayVietnam() {
  return isoTodayVietnam();
}
