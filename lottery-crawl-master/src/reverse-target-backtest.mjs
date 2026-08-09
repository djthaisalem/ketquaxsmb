import assert from 'node:assert/strict';
import pool from './db.mjs';

const pairValues = [
  ['00', '55'], ['01', '10'], ['02', '20'], ['03', '30'], ['04', '40'], ['05', '50'], ['06', '60'], ['07', '70'], ['08', '80'], ['09', '90'],
  ['11', '66'], ['12', '21'], ['13', '31'], ['14', '41'], ['15', '51'], ['16', '61'], ['17', '71'], ['18', '81'], ['19', '91'], ['22', '77'],
  ['23', '32'], ['24', '42'], ['25', '52'], ['26', '62'], ['27', '72'], ['28', '82'], ['29', '92'], ['33', '88'], ['34', '43'], ['35', '53'],
  ['36', '63'], ['37', '73'], ['38', '83'], ['39', '93'], ['44', '99'], ['45', '54'], ['46', '64'], ['47', '74'], ['48', '84'], ['49', '94'],
  ['56', '65'], ['57', '75'], ['58', '85'], ['59', '95'], ['67', '76'], ['68', '86'], ['69', '96'], ['78', '87'], ['79', '97'], ['89', '98'],
];

const pairs = pairValues.map(([left, right], index) => ({ id: `P${String(index + 1).padStart(2, '0')}`, values: [Number(left), Number(right)] }));
const prizeOrder = ['db', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'];
const ruleDefinitions = [
  {
    key: 'balanced-2of3-2of2',
    name: 'Balanced: 2/3 combo + 2/2 cặp',
    formula: '|combo ∩ L(d)| ≥ 2 và pair ⊆ L(d)',
    description: 'Rule chính của tài liệu V1. Chỉ ghi nhận khi tối thiểu hai vị trí combo và đủ hai số của cặp cùng xuất hiện trong kỳ lịch sử.',
  },
  {
    key: 'strict-3of3-2of2',
    name: 'Strict: 3/3 combo + 2/2 cặp',
    formula: '|combo ∩ L(d)| = 3 và pair ⊆ L(d)',
    description: 'Đối chứng chặt: cả ba vị trí combo cùng xuất hiện, đồng thời cặp xuất hiện đầy đủ.',
  },
  {
    key: 'loose-1of3-2of2',
    name: 'Loose: 1/3 combo + 2/2 cặp',
    formula: '|combo ∩ L(d)| ≥ 1 và pair ⊆ L(d)',
    description: 'Đối chứng rộng để kiểm tra hiện tượng bão hòa tín hiệu; không dùng làm rule ưu tiên.',
  },
  {
    key: 'intersection-pair-hit',
    name: 'Baseline: giao combo–cặp + cặp về đủ',
    formula: 'pair ⊆ L(d) và pair ∩ combo ≠ ∅',
    description: 'Baseline từ tài liệu thứ hai. Điều kiện giao combo–cặp là tĩnh nên chỉ dùng so sánh, không dùng làm bằng chứng chọn combo.',
  },
];

function toLoto(value) {
  return Number(String(value).slice(-2).padStart(2, '0'));
}

function wilsonInterval(wins, samples) {
  if (!samples) return { low: 0, high: 0 };
  const z = 1.959963984540054;
  const rate = wins / samples;
  const denominator = 1 + (z * z) / samples;
  const centre = rate + (z * z) / (2 * samples);
  const margin = z * Math.sqrt((rate * (1 - rate) + (z * z) / (4 * samples)) / samples);
  return { low: Math.max(0, (centre - margin) / denominator), high: Math.min(1, (centre + margin) / denominator) };
}

function createCombos(positions) {
  const combos = [];
  for (let first = 0; first < positions.length - 2; first += 1) {
    for (let second = first + 1; second < positions.length - 1; second += 1) {
      for (let third = second + 1; third < positions.length; third += 1) {
        combos.push({ id: `${first + 1}-${second + 1}-${third + 1}`, values: [positions[first], positions[second], positions[third]] });
      }
    }
  }
  return combos;
}

function comboMatchCount(combo, day) {
  return Number(day.has[combo.values[0]]) + Number(day.has[combo.values[1]]) + Number(day.has[combo.values[2]]);
}

function pairIntersects(combo, pair) {
  return combo.values.includes(pair.values[0]) || combo.values.includes(pair.values[1]);
}

function matchesRule(ruleKey, combo, pair, day) {
  if (!day.has[pair.values[0]] || !day.has[pair.values[1]]) return false;
  const count = comboMatchCount(combo, day);
  if (ruleKey === 'balanced-2of3-2of2') return count >= 2;
  if (ruleKey === 'strict-3of3-2of2') return count === 3;
  if (ruleKey === 'loose-1of3-2of2') return count >= 1;
  return pairIntersects(combo, pair);
}

function rowsForRule(hits, definition, combos, sampleSize) {
  const rows = [];
  for (let comboIndex = 0; comboIndex < combos.length; comboIndex += 1) {
    for (let pairIndex = 0; pairIndex < pairs.length; pairIndex += 1) {
      const hit = hits[(comboIndex * pairs.length) + pairIndex];
      const interval = wilsonInterval(hit, sampleSize);
      rows.push({
        comboIndex,
        pairIndex,
        comboId: combos[comboIndex].id,
        comboValues: combos[comboIndex].values.map((value) => String(value).padStart(2, '0')),
        pairId: pairs[pairIndex].id,
        pair: pairs[pairIndex].values.map((value) => String(value).padStart(2, '0')),
        n: sampleSize,
        hit,
        miss: sampleSize - hit,
        rate: sampleSize ? hit / sampleSize : 0,
        wilsonLow: interval.low,
        wilsonHigh: interval.high,
      });
    }
  }
  rows.sort((left, right) => right.wilsonLow - left.wilsonLow || right.rate - left.rate || right.n - left.n || left.comboId.localeCompare(right.comboId));
  return rows;
}

function periodStats(row, definition, history) {
  const ranges = [
    ['2005–2020', '2005-01-01', '2020-12-31'],
    ['2021–2024', '2021-01-01', '2024-12-31'],
    ['2025–nay', '2025-01-01', '9999-12-31'],
  ];
  const combo = { values: row.comboValues.map(Number) };
  const pair = { values: row.pair.map(Number) };
  return ranges.map(([label, from, to]) => {
    const days = history.filter((day) => day.date >= from && day.date <= to);
    const hit = days.reduce((total, day) => total + Number(matchesRule(definition.key, combo, pair, day)), 0);
    return { label, n: days.length, hit, rate: days.length ? hit / days.length : 0 };
  }).filter((period) => period.n);
}

async function loadDailyLoto() {
  const result = await pool.query(`SELECT draw_date::text AS date, prize_code, numbers
    FROM lottery_prizes
    ORDER BY draw_date, array_position($1::text[], prize_code)`, [prizeOrder]);
  const byDate = new Map();
  result.rows.forEach((row) => {
    if (!byDate.has(row.date)) byDate.set(row.date, { date: row.date, positions: [] });
    byDate.get(row.date).positions.push(...row.numbers.map(toLoto));
  });
  return [...byDate.values()].map((draw) => {
    const has = new Uint8Array(100);
    draw.positions.forEach((value) => { has[value] = 1; });
    return { ...draw, has };
  }).sort((left, right) => left.date.localeCompare(right.date));
}

export async function calculateReverseTargetBacktest(targetDate) {
  const draws = await loadDailyLoto();
  const validDraws = draws.filter((draw) => draw.positions.length === 27);
  const target = validDraws.find((draw) => draw.date === targetDate) || validDraws.at(-1);
  if (!target) throw new Error('Chưa có ngày dữ liệu đủ 27 vị trí để chạy soi ngược.');
  const history = validDraws.filter((draw) => draw.date < target.date && draw.date >= '2005-01-01');
  if (history.length < 200) throw new Error('Chưa đủ dữ liệu lịch sử để chạy soi ngược.');
  const combos = createCombos(target.positions);
  if (combos.length !== 2925) throw new Error(`Ngày ${target.date} không tạo được đúng 2.925 combo.`);

  const hitTables = Object.fromEntries(ruleDefinitions.map((rule) => [rule.key, new Uint16Array(combos.length * pairs.length)]));
  for (const day of history) {
    const pairHits = pairs.map((pair, index) => (day.has[pair.values[0]] && day.has[pair.values[1]] ? index : -1)).filter((index) => index >= 0);
    if (!pairHits.length) continue;
    for (let comboIndex = 0; comboIndex < combos.length; comboIndex += 1) {
      const combo = combos[comboIndex];
      const count = comboMatchCount(combo, day);
      if (!count) continue;
      const offset = comboIndex * pairs.length;
      for (const pairIndex of pairHits) {
        const pair = pairs[pairIndex];
        if (count >= 1) hitTables['loose-1of3-2of2'][offset + pairIndex] += 1;
        if (count >= 2) hitTables['balanced-2of3-2of2'][offset + pairIndex] += 1;
        if (count === 3) hitTables['strict-3of3-2of2'][offset + pairIndex] += 1;
        if (pairIntersects(combo, pair)) hitTables['intersection-pair-hit'][offset + pairIndex] += 1;
      }
    }
  }

  const rules = ruleDefinitions.map((definition) => {
    const ranked = rowsForRule(hitTables[definition.key], definition, combos, history.length);
    const top = ranked.slice(0, 10).map((row, index) => ({ ...row, rank: index + 1, periods: periodStats(row, definition, history) }));
    return {
      ...definition,
      researchOnly: true,
      sampleSize: history.length,
      top,
      best: top[0],
      note: definition.key === 'intersection-pair-hit'
        ? 'Baseline tĩnh: chỉ đối chiếu, không coi là bằng chứng dự báo hay đưa vào VIP.'
        : 'Soi ngược theo ngày target: chỉ là thống kê đồng xuất hiện lịch sử, không phải dự đoán out-of-sample cho ngày target.',
    };
  });

  return {
    kind: 'reverse-target-research',
    targetDate: target.date,
    sourceFrom: history[0].date,
    sourceThrough: history.at(-1).date,
    historicalDays: history.length,
    targetPositions: target.positions.map((value) => String(value).padStart(2, '0')),
    targetComboCount: combos.length,
    pairCount: pairs.length,
    message: 'Kết quả chỉ phục vụ backtest soi ngược. Không tác động VIP 1, VIP 2 hoặc đề xuất cho người dùng.',
    rules,
  };
}

export function runReverseTargetMatchRuleTests() {
  const combo = { values: [50, 61, 62] };
  const pair = { values: [16, 61] };
  const makeDay = (values) => {
    const has = new Uint8Array(100);
    values.forEach((value) => { has[value] = 1; });
    return { has };
  };
  assert.equal(matchesRule('balanced-2of3-2of2', combo, pair, makeDay([16, 50, 61])), true);
  assert.equal(matchesRule('balanced-2of3-2of2', combo, pair, makeDay([16, 50, 62])), false);
  assert.equal(matchesRule('balanced-2of3-2of2', combo, pair, makeDay([16, 61])), false);
  assert.equal(matchesRule('strict-3of3-2of2', combo, pair, makeDay([16, 50, 61])), false);
  assert.equal(matchesRule('strict-3of3-2of2', combo, pair, makeDay([16, 50, 61, 62])), true);
  assert.equal(matchesRule('intersection-pair-hit', combo, pair, makeDay([16, 61])), true);
  return true;
}
