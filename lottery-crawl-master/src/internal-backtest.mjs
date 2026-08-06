import pool from './db.mjs';

const twoDigits = (value) => String(value).slice(-2).padStart(2, '0');
const values = Array.from({ length: 100 }, (_, index) => String(index).padStart(2, '0'));

function wilsonLowerBound(wins, samples) {
  if (!samples) return 0;
  const z = 1.96;
  const rate = wins / samples;
  const denominator = 1 + (z * z) / samples;
  const centre = rate + (z * z) / (2 * samples);
  const margin = z * Math.sqrt((rate * (1 - rate) + (z * z) / (4 * samples)) / samples);
  return Math.max(0, (centre - margin) / denominator);
}

function reportMethod({ key, name, description, samples, wins, evaluatedDays, winningDays, recentSamples, recentWins, baselineRate, note }) {
  const rate = samples ? wins / samples : 0;
  const lowerBound = wilsonLowerBound(wins, samples);
  const recentRate = recentSamples ? recentWins / recentSamples : 0;
  const recentLowerBound = wilsonLowerBound(recentWins, recentSamples);
  return {
    key,
    name,
    description,
    samples,
    wins,
    rate,
    evaluatedDays,
    winningDays,
    dayRate: evaluatedDays ? winningDays / evaluatedDays : 0,
    baselineRate,
    lowerBound,
    recentSamples,
    recentWins,
    recentRate,
    recentLowerBound,
    eligible: samples >= 500 && lowerBound > baselineRate && recentSamples >= 100 && recentLowerBound > baselineRate,
    note,
  };
}

export async function calculateInternalBacktest() {
  const result = await pool.query('SELECT draw_date::text AS date, numbers FROM lottery_prizes ORDER BY draw_date');
  const byDate = new Map();

  result.rows.forEach((row) => {
    if (!byDate.has(row.date)) byDate.set(row.date, { date: row.date, numbers: new Set() });
    row.numbers.forEach((number) => byDate.get(row.date).numbers.add(twoDigits(number)));
  });

  const draws = [...byDate.values()];
  if (draws.length < 40) throw new Error('Chưa đủ dữ liệu để chạy backtest nội bộ.');

  const baselineRate = draws.reduce((sum, draw) => sum + draw.numbers.size / 100, 0) / draws.length;
  const gan = { samples: 0, wins: 0, evaluatedDays: 0, winningDays: 0, recentSamples: 0, recentWins: 0 };
  const roi3 = { samples: 0, wins: 0, evaluatedDays: 0, winningDays: 0, recentSamples: 0, recentWins: 0 };
  const lastSeen = Array(100).fill(null);
  const recentStart = Math.max(30, draws.length - 365);

  draws.forEach((draw, index) => {
    if (index >= 30) {
      const ganCandidates = values
        .map((number, valueIndex) => ({ number, gap: lastSeen[valueIndex] === null ? index : index - lastSeen[valueIndex] - 1 }))
        .sort((left, right) => right.gap - left.gap || left.number.localeCompare(right.number))
        .slice(0, 2)
        .map((item) => item.number);
      const ganHits = ganCandidates.filter((number) => draw.numbers.has(number));
      gan.samples += ganCandidates.length;
      gan.wins += ganHits.length;
      gan.evaluatedDays += 1;
      gan.winningDays += ganHits.length ? 1 : 0;
      if (index >= recentStart) {
        gan.recentSamples += ganCandidates.length;
        gan.recentWins += ganHits.length;
      }
    }

    if (index >= 3) {
      const roiCandidates = values.filter((number) => [1, 2, 3].every((offset) => draws[index - offset].numbers.has(number))).slice(0, 2);
      if (roiCandidates.length) {
        const roiHits = roiCandidates.filter((number) => draw.numbers.has(number));
        roi3.samples += roiCandidates.length;
        roi3.wins += roiHits.length;
        roi3.evaluatedDays += 1;
        roi3.winningDays += roiHits.length ? 1 : 0;
        if (index >= recentStart) {
          roi3.recentSamples += roiCandidates.length;
          roi3.recentWins += roiHits.length;
        }
      }
    }

    draw.numbers.forEach((number) => { lastSeen[Number(number)] = index; });
  });

  return {
    sourceFrom: draws[0].date,
    sourceThrough: draws.at(-1).date,
    target: 'D+1',
    baselineRate,
    methods: [
      reportMethod({
        key: 'gan-top-2',
        name: 'Lô gan · 2 số vắng lâu nhất',
        description: 'Mỗi kỳ lấy đúng hai lô có số kỳ liên tiếp chưa xuất hiện dài nhất.',
        ...gan,
        baselineRate,
        note: 'Đây là mẫu đối chứng: chỉ dùng nếu toàn lịch sử và 365 kỳ gần nhất cùng vượt baseline theo kiểm định thống kê.',
      }),
      reportMethod({
        key: 'roi-3-ky',
        name: 'Lô rơi 3 kỳ · tối đa 2 số',
        description: 'Chỉ lấy lô đã xuất hiện ở cả ba kỳ ngay trước đó; nếu nhiều hơn hai số, ưu tiên thứ tự số tăng dần để quy tắc luôn tái tạo được.',
        ...roi3,
        baselineRate,
        note: 'Chưa đưa vào VIP nếu toàn lịch sử hoặc 365 kỳ gần nhất có cận dưới 95% không vượt baseline.',
      }),
    ],
    unavailableMethods: [
      'Cầu động 7 ngày: tài liệu không công bố phép biến đổi từ 7 kỳ sang số chốt.',
      'Lô kép từ GĐB: tài liệu không nêu quy tắc ghép cụ thể.',
      'Đầu – đuôi đề: chỉ nêu đầu/đuôi được chọn, không nêu quy tắc sinh 4 cặp đề.',
    ],
  };
}

export async function refreshInternalBacktest() {
  const report = await calculateInternalBacktest();
  const generatedAt = new Date().toISOString();
  await pool.query(`INSERT INTO internal_backtest_reports (report_key, source_through_date, payload, generated_at)
    VALUES ('document-patterns', $1, $2, NOW())
    ON CONFLICT (report_key) DO UPDATE SET source_through_date = EXCLUDED.source_through_date, payload = EXCLUDED.payload, generated_at = NOW()`,
  [report.sourceThrough, JSON.stringify(report)]);
  return { ...report, generatedAt };
}

export async function getInternalBacktest() {
  const result = await pool.query(`SELECT source_through_date::text AS source_through_date, payload, generated_at
    FROM internal_backtest_reports WHERE report_key = 'document-patterns'`);
  if (!result.rowCount) return null;
  return { ...result.rows[0].payload, sourceThrough: result.rows[0].source_through_date, generatedAt: result.rows[0].generated_at };
}
