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

function createStats() {
  return { samples: 0, wins: 0, evaluatedDays: 0, winningDays: 0, recentSamples: 0, recentWins: 0 };
}

function addSample(stats, { index, recentStart, samples = 1, wins = 0, won = false }) {
  stats.samples += samples;
  stats.wins += wins;
  stats.evaluatedDays += 1;
  if (won) stats.winningDays += 1;
  if (index >= recentStart) {
    stats.recentSamples += samples;
    stats.recentWins += wins;
  }
}

function referenceMethod({ key, name, description, baselineRate, stats, note }) {
  const report = reportMethod({ key, name, description, baselineRate, note, ...stats });
  return { ...report, eligible: false, researchOnly: true };
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

async function referenceDraws() {
  const result = await pool.query('SELECT draw_date::text AS date, prize_code, numbers FROM lottery_prizes ORDER BY draw_date, prize_code');
  const byDate = new Map();
  result.rows.forEach((row) => {
    if (!byDate.has(row.date)) byDate.set(row.date, { date: row.date, prizes: {} });
    byDate.get(row.date).prizes[row.prize_code] = row.numbers.map(String);
  });
  return [...byDate.values()];
}

const special = (draw) => String(draw.prizes.db?.[0] || '').slice(-2);
const firstPrize = (draw) => String(draw.prizes.g1?.[0] || '');
const prizeSeven = (draw) => (draw.prizes.g7 || []).map(String);
const weekday = (draw) => new Date(`${draw.date}T00:00:00Z`).getUTCDay();
const isDouble = (value) => value.length === 2 && value[0] === value[1];
const nextDigit = (digit, change) => String((Number(digit) + change + 10) % 10);

export async function calculateReferenceFormulaBacktest() {
  const draws = await referenceDraws();
  if (draws.length < 40) throw new Error('Chưa đủ dữ liệu để chạy backtest công thức tham khảo.');
  const recentStart = Math.max(30, draws.length - 365);
  const stats = {
    monTueTouch: createStats(), mondayTouch: createStats(), wedPair: createStats(), thuTouch: createStats(),
    dbDouble: createStats(), g7ListedDouble: createStats(), g7CrossDouble: createStats(), g7Mix: createStats(), complement: createStats(),
  };
  const listedG7 = new Set(['05', '50', '16', '61', '27', '72', '38', '83', '49', '94']);

  for (let index = 0; index < draws.length; index += 1) {
    const draw = draws[index];
    const db = special(draw);
    if (weekday(draw) === 1 && draws[index + 6] && db.length === 2 && special(draws[index + 1]).length === 2) {
      const sum = Number(db[0]) + Number(special(draws[index + 1])[0]);
      const digit = String(sum > 9 ? Math.floor(sum / 10) + (sum % 10) : sum);
      for (let offset = 2; offset <= 6; offset += 1) {
        const hit = special(draws[index + offset]).includes(digit);
        addSample(stats.monTueTouch, { index: index + offset, recentStart, wins: hit ? 1 : 0, won: hit });
      }
      for (let offset = 1; offset <= 6; offset += 1) {
        const hit = special(draws[index + offset]).includes(db[0]);
        addSample(stats.mondayTouch, { index: index + offset, recentStart, wins: hit ? 1 : 0, won: hit });
      }
    }

    if (weekday(draw) === 3 && draws[index + 7] && db.length === 2) {
      const targets = new Set([...new Set(firstPrize(draw).split(''))].map((digit) => `${db[0]}${digit}`));
      for (let offset = 1; offset <= 7; offset += 1) {
        const hit = targets.has(special(draws[index + offset]));
        addSample(stats.wedPair, { index: index + offset, recentStart, samples: targets.size, wins: hit ? 1 : 0, won: hit });
      }
    }

    if (weekday(draw) === 4 && draws[index + 7] && db.length === 2) {
      const touches = new Set([nextDigit(db[0], -1), nextDigit(db[0], 1)]);
      for (let offset = 1; offset <= 7; offset += 1) {
        const hit = [...touches].some((digit) => special(draws[index + offset]).includes(digit));
        addSample(stats.thuTouch, { index: index + offset, recentStart, wins: hit ? 1 : 0, won: hit });
      }
    }

    if (draws[index + 1] && isDouble(db)) {
      const hit = isDouble(special(draws[index + 1]));
      addSample(stats.dbDouble, { index: index + 1, recentStart, wins: hit ? 1 : 0, won: hit });
    }

    const g7 = prizeSeven(draw);
    if (draws[index + 1] && g7.filter((value) => listedG7.has(value)).length >= 2) {
      const hit = isDouble(special(draws[index + 1]));
      addSample(stats.g7ListedDouble, { index: index + 1, recentStart, wins: hit ? 1 : 0, won: hit });
    }

    if (draws[index + 3] && g7.length >= 4 && (g7[0][0] === g7[3][1] || g7[0][1] === g7[3][0])) {
      for (let offset = 1; offset <= 3; offset += 1) {
        const hit = isDouble(special(draws[index + offset]));
        addSample(stats.g7CrossDouble, { index: index + offset, recentStart, wins: hit ? 1 : 0, won: hit });
      }
    }

    if (draws[index + 1] && g7.length) {
      const digits = [...new Set(g7.join('').split(''))];
      const targets = new Set();
      digits.forEach((left) => digits.forEach((right) => { if (left !== right) targets.add(`${left}${right}`); }));
      const hit = targets.has(special(draws[index + 1]));
      addSample(stats.g7Mix, { index: index + 1, recentStart, samples: targets.size, wins: hit ? 1 : 0, won: hit });
    }

    if (index >= 2 && draws[index + 2]) {
      const previousOne = special(draws[index - 2]);
      const previousTwo = special(draws[index - 1]);
      if (previousOne.length === 2 && previousTwo.length === 2) {
        const left = (10 - ((Number(previousOne[0]) + Number(previousOne[1])) % 10)) % 10;
        const right = (10 - ((Number(previousTwo[0]) + Number(previousTwo[1])) % 10)) % 10;
        const target = `${left}${right}`;
        for (let offset = 0; offset <= 2; offset += 1) {
          const hit = special(draws[index + offset]) === target;
          addSample(stats.complement, { index: index + offset, recentStart, wins: hit ? 1 : 0, won: hit });
        }
      }
    }
  }

  return {
    sourceFrom: draws[0].date,
    sourceThrough: draws.at(-1).date,
    target: 'Đề trong ngày/kỳ theo công thức',
    methods: [
      referenceMethod({ key: 'mon-tue-touch', name: 'Thứ 2 + Thứ 3: tổng đầu GĐB', description: 'Cộng chữ số đầu GĐB Thứ 2 và Thứ 3, rút gọn về một chạm; kiểm tra đề từ Thứ 4 đến Chủ nhật.', baselineRate: 0.19, stats: stats.monTueTouch, note: 'Chỉ theo dõi. Một chạm xuất hiện trong đề ngẫu nhiên xấp xỉ 19%.' }),
      referenceMethod({ key: 'monday-touch', name: 'Đầu GĐB Thứ 2', description: 'Dùng chữ số đầu GĐB Thứ 2 làm chạm và kiểm tra đề từ Thứ 3 đến Chủ nhật.', baselineRate: 0.19, stats: stats.mondayTouch, note: 'Chỉ theo dõi. Không dùng tỷ lệ lô vì một chạm trong 27 lô gần như luôn xuất hiện.' }),
      referenceMethod({ key: 'wed-gdb-g1', name: 'Thứ 4: giữa GĐB ghép G1', description: 'Lấy số đầu GĐB (tài liệu gọi số giữa) ghép lần lượt với chữ số khác nhau của G1; kiểm tra đề 7 ngày.', baselineRate: 0.01, stats: stats.wedPair, note: 'Tỷ lệ mỗi lựa chọn được đối chiếu với đề ngẫu nhiên 1/100.' }),
      referenceMethod({ key: 'thu-plus-minus-touch', name: 'Thứ 5: đầu đề ±1', description: 'Lấy đầu của đề, cộng/trừ một đơn vị thành hai chạm; kiểm tra đề trong 7 ngày tiếp.', baselineRate: 0.36, stats: stats.thuTouch, note: 'Chỉ theo dõi. Hai chạm xuất hiện trong đề ngẫu nhiên xấp xỉ 36%.' }),
      referenceMethod({ key: 'db-double', name: 'Đuôi GĐB kép', description: 'Khi hai số cuối GĐB là kép, kiểm tra đề kép ở ngày kế tiếp.', baselineRate: 0.10, stats: stats.dbDouble, note: 'Mẫu hiện có chỉ là tín hiệu yếu; không dùng để chọn VIP.' }),
      referenceMethod({ key: 'g7-listed-double', name: 'G7 có 2 cặp đối xứng', description: 'Nếu G7 có ít nhất hai cặp trong danh sách đối xứng của tài liệu, kiểm tra đề kép ngày sau.', baselineRate: 0.10, stats: stats.g7ListedDouble, note: 'Mẫu nhỏ, chỉ theo dõi.' }),
      referenceMethod({ key: 'g7-cross-double', name: 'G7.1/G7.4 đối đầu', description: 'Hai chữ số đầu-cuối đối đầu trùng nhau, kiểm tra đề kép trong 3 ngày.', baselineRate: 0.10, stats: stats.g7CrossDouble, note: 'Không dùng tỷ lệ cộng dồn làm winrate vì 3 ngày luôn cao hơn 1 ngày.' }),
      referenceMethod({ key: 'g7-mix', name: 'Ghép dàn chữ số G7', description: 'Lấy các chữ số khác nhau từ 4 giải G7 và ghép thành các cặp có thứ tự; kiểm tra đề ngày sau.', baselineRate: 0.01, stats: stats.g7Mix, note: 'Dàn thường rất rộng; chỉ dùng để kiểm chứng, không dùng làm số ưu tiên.' }),
      referenceMethod({ key: 'complement-xy', name: 'Bù tổng XY từ 2 đề trước', description: 'Tạo XY bằng số bù của từng đề trước về bội số 10, kiểm tra đề trong 3 ngày.', baselineRate: 0.01, stats: stats.complement, note: 'Một số đề duy nhất, so với nền ngẫu nhiên 1% mỗi ngày.' }),
    ],
    unavailableMethods: ['Các cầu tam giác/soi hình: tài liệu không định nghĩa nhất quán vị trí giải và chiều ghép, nên không thể backtest tái lập.', 'Cầu lô kép dạng “nuôi lô”: không dùng vì xác suất có ít nhất một lô kép trong một kỳ vốn đã rất cao.'],
  };
}

export async function refreshReferenceFormulaBacktest() {
  const report = await calculateReferenceFormulaBacktest();
  await pool.query(`INSERT INTO internal_backtest_reports (report_key, source_through_date, payload, generated_at)
    VALUES ('reference-formulas', $1, $2, NOW())
    ON CONFLICT (report_key) DO UPDATE SET source_through_date = EXCLUDED.source_through_date, payload = EXCLUDED.payload, generated_at = NOW()`,
  [report.sourceThrough, JSON.stringify(report)]);
  return { ...report, generatedAt: new Date().toISOString() };
}

export async function getReferenceFormulaBacktest() {
  const result = await pool.query(`SELECT source_through_date::text AS source_through_date, payload, generated_at
    FROM internal_backtest_reports WHERE report_key = 'reference-formulas'`);
  if (!result.rowCount) return null;
  return { ...result.rows[0].payload, sourceThrough: result.rows[0].source_through_date, generatedAt: result.rows[0].generated_at };
}
