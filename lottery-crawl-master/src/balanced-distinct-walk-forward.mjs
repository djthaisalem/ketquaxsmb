import assert from 'node:assert/strict';
import pool from './db.mjs';

const pairValues = [
  [0, 55], [1, 10], [2, 20], [3, 30], [4, 40], [5, 50], [6, 60], [7, 70], [8, 80], [9, 90],
  [11, 66], [12, 21], [13, 31], [14, 41], [15, 51], [16, 61], [17, 71], [18, 81], [19, 91], [22, 77],
  [23, 32], [24, 42], [25, 52], [26, 62], [27, 72], [28, 82], [29, 92], [33, 88], [34, 43], [35, 53],
  [36, 63], [37, 73], [38, 83], [39, 93], [44, 99], [45, 54], [46, 64], [47, 74], [48, 84], [49, 94],
  [56, 65], [57, 75], [58, 85], [59, 95], [67, 76], [68, 86], [69, 96], [78, 87], [79, 97], [89, 98],
];

const pairs = pairValues.map((values, index) => ({ id: `P${String(index + 1).padStart(2, '0')}`, values }));
const prizeOrder = ['db', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'];
const reportCache = new Map();

function toLoto(value) {
  return Number(String(value).slice(-2).padStart(2, '0'));
}

function formatNumber(value) {
  return String(value).padStart(2, '0');
}

function wilson(wins, samples) {
  if (!samples) return { low: 0, high: 0 };
  const z = 1.959963984540054;
  const rate = wins / samples;
  const denominator = 1 + (z * z) / samples;
  const centre = rate + (z * z) / (2 * samples);
  const margin = z * Math.sqrt((rate * (1 - rate) + (z * z) / (4 * samples)) / samples);
  return { low: Math.max(0, (centre - margin) / denominator), high: Math.min(1, (centre + margin) / denominator) };
}

function comboKey(values) {
  return [...values].sort((left, right) => left - right).join(',');
}

function createDistinctCombos(values) {
  const unique = [...new Set(values)].sort((left, right) => left - right);
  const combos = [];
  for (let first = 0; first < unique.length - 2; first += 1) {
    for (let second = first + 1; second < unique.length - 1; second += 1) {
      for (let third = second + 1; third < unique.length; third += 1) {
        const comboValues = [unique[first], unique[second], unique[third]];
        combos.push({ key: comboKey(comboValues), values: comboValues });
      }
    }
  }
  return { unique, combos, indexByKey: new Map(combos.map((combo, index) => [combo.key, index])) };
}

function matchingComboIndexes(targetValues, indexByKey, day) {
  const matched = targetValues.filter((value) => day.has[value]);
  if (matched.length < 2) return [];
  const unmatched = targetValues.filter((value) => !day.has[value]);
  const indexes = [];

  for (let first = 0; first < matched.length - 1; first += 1) {
    for (let second = first + 1; second < matched.length; second += 1) {
      for (const third of unmatched) indexes.push(indexByKey.get(comboKey([matched[first], matched[second], third])));
    }
  }
  for (let first = 0; first < matched.length - 2; first += 1) {
    for (let second = first + 1; second < matched.length - 1; second += 1) {
      for (let third = second + 1; third < matched.length; third += 1) {
        indexes.push(indexByKey.get(comboKey([matched[first], matched[second], matched[third]])));
      }
    }
  }
  return indexes.filter(Number.isInteger);
}

function pairHits(draw) {
  const indexes = [];
  pairs.forEach((pair, index) => {
    if (draw.has[pair.values[0]] && draw.has[pair.values[1]]) indexes.push(index);
  });
  return indexes;
}

async function loadDraws() {
  const result = await pool.query(`SELECT draw_date::text AS date, prize_code, numbers
    FROM lottery_prizes
    ORDER BY draw_date, array_position($1::text[], prize_code)`, [prizeOrder]);
  const byDate = new Map();
  result.rows.forEach((row) => {
    if (!byDate.has(row.date)) byDate.set(row.date, []);
    byDate.get(row.date).push(...row.numbers.map(toLoto));
  });
  return [...byDate.entries()].map(([date, positions]) => {
    const has = new Uint8Array(100);
    positions.forEach((value) => { has[value] = 1; });
    const draw = { date, positions, has };
    return { ...draw, pairHits: pairHits(draw) };
  }).filter((draw) => draw.positions.length === 27).sort((left, right) => left.date.localeCompare(right.date));
}

function chooseCandidates(target, history) {
  const { unique, combos, indexByKey } = createDistinctCombos(target.positions);
  if (combos.length === 0) return { selected: [], distinctValues: unique.length, comboCount: 0 };

  const support = new Uint16Array(combos.length);
  const recentSupport = new Uint16Array(combos.length);
  const hits = new Uint16Array(combos.length * pairs.length);
  const recentHits = new Uint16Array(combos.length * pairs.length);
  const pairCounts = new Uint16Array(pairs.length);
  const recentStart = Math.max(0, history.length - 365);

  history.forEach((day, dayIndex) => {
    const isRecent = dayIndex >= recentStart;
    day.pairHits.forEach((pairIndex) => { pairCounts[pairIndex] += 1; });
    const matchedCombos = matchingComboIndexes(unique, indexByKey, day);
    for (const comboIndex of matchedCombos) {
      support[comboIndex] += 1;
      if (isRecent) recentSupport[comboIndex] += 1;
      const offset = comboIndex * pairs.length;
      for (const pairIndex of day.pairHits) {
        hits[offset + pairIndex] += 1;
        if (isRecent) recentHits[offset + pairIndex] += 1;
      }
    }
  });

  const bestByPair = [];
  for (let pairIndex = 0; pairIndex < pairs.length; pairIndex += 1) {
    let best = null;
    const baselineRate = pairCounts[pairIndex] / history.length;
    for (let comboIndex = 0; comboIndex < combos.length; comboIndex += 1) {
      const samples = support[comboIndex];
      const recentSamples = recentSupport[comboIndex];
      if (samples < 30 || recentSamples < 10) continue;
      const wins = hits[(comboIndex * pairs.length) + pairIndex];
      const recentWins = recentHits[(comboIndex * pairs.length) + pairIndex];
      const rate = wins / samples;
      const recentRate = recentWins / recentSamples;
      const interval = wilson(wins, samples);
      const recentInterval = wilson(recentWins, recentSamples);
      const lift = rate - baselineRate;
      const score = (0.55 * interval.low) + (0.25 * recentInterval.low) + (0.20 * Math.max(0, lift));
      const candidate = {
        pairIndex,
        pair: pairs[pairIndex].values.map(formatNumber),
        combo: combos[comboIndex].values.map(formatNumber),
        samples,
        wins,
        rate,
        recentSamples,
        recentWins,
        recentRate,
        baselineRate,
        lift,
        wilsonLow: interval.low,
        score,
        eligible: lift > 0 && interval.low > baselineRate,
      };
      if (!best || candidate.score > best.score) best = candidate;
    }
    if (best) bestByPair.push(best);
  }

  bestByPair.sort((left, right) => Number(right.eligible) - Number(left.eligible) || right.score - left.score || right.lift - left.lift);
  return { selected: bestByPair.slice(0, 2), distinctValues: unique.length, comboCount: combos.length };
}

function pairMatches(draw, candidate) {
  if (!draw) return false;
  const [left, right] = candidate.pair.map(Number);
  return Boolean(draw.has[left] && draw.has[right]);
}

function baselineForSelection(history, selected) {
  if (!selected.length) return 0;
  const wins = history.reduce((total, day) => total + Number(selected.some((candidate) => pairMatches(day, candidate))), 0);
  return wins / history.length;
}

function createSimpleSelections(draws) {
  const lastSeen = Array(100).fill(null);
  return draws.map((draw, index) => {
    draw.positions.forEach((number) => { lastSeen[number] = index; });
    const gan = index < 29 ? [] : Array.from({ length: 100 }, (_, number) => ({
      number: formatNumber(number),
      gap: lastSeen[number] === null ? index + 1 : index - lastSeen[number],
    })).sort((left, right) => right.gap - left.gap || left.number.localeCompare(right.number)).slice(0, 2);
    const roi3 = index < 2 ? [] : Array.from({ length: 100 }, (_, number) => formatNumber(number))
      .filter((number) => [0, 1, 2].every((offset) => draws[index - offset].has[Number(number)]))
      .slice(0, 2)
      .map((number) => ({ number }));
    return { gan, roi3 };
  });
}

function simpleMatches(draw, selected) {
  if (!draw) return [];
  return selected.filter((candidate) => draw.has[Number(candidate.number)]).map((candidate) => candidate.number);
}

function baselineForNumbers(history, selected) {
  if (!selected.length) return 0;
  return history.reduce((total, draw) => total + Number(selected.some((candidate) => draw.has[Number(candidate.number)])), 0) / history.length;
}

function simpleRow({ target, targetIndex, draws, history, selected, methodKey }) {
  if (!selected.length) return null;
  const day1 = draws[targetIndex + 1];
  const day2 = draws[targetIndex + 2];
  const day1Matches = simpleMatches(day1, selected);
  const day2Matches = simpleMatches(day2, selected);
  return {
    sourceDate: target.date,
    methodKey,
    selectionType: 'numbers',
    predictions: selected,
    baselineRate: baselineForNumbers(history, selected),
    day1: { date: day1?.date || null, available: Boolean(day1), hit: day1Matches.length > 0, matches: day1Matches },
    day2: { date: day2?.date || null, available: Boolean(day2), hit: day2Matches.length > 0, matches: day2Matches },
  };
}

function summarize(rows) {
  const evaluatedDay1 = rows.filter((row) => row.day1.available);
  const evaluatedTwoDays = rows.filter((row) => row.day2.available);
  const day1Wins = evaluatedDay1.filter((row) => row.day1.hit).length;
  const day2OnlyWins = evaluatedTwoDays.filter((row) => !row.day1.hit && row.day2.hit).length;
  const combinedWins = evaluatedTwoDays.filter((row) => row.day1.hit || row.day2.hit).length;
  const baselineRate = evaluatedDay1.length
    ? evaluatedDay1.reduce((total, row) => total + row.baselineRate, 0) / evaluatedDay1.length
    : 0;
  const day1Rate = evaluatedDay1.length ? day1Wins / evaluatedDay1.length : 0;
  const combinedRate = evaluatedTwoDays.length ? combinedWins / evaluatedTwoDays.length : 0;
  const day1Wilson = wilson(day1Wins, evaluatedDay1.length);
  const lift = day1Rate - baselineRate;
  const status = evaluatedDay1.length < 30
    ? { key: 'insufficient', label: 'Chưa đủ mẫu', message: 'Cần ít nhất 30 kỳ đã đối chiếu.' }
    : lift <= 0
      ? { key: 'ineffective', label: 'Không hiệu quả', message: 'Tỷ lệ ngày 1 chưa vượt cách chọn thông thường.' }
      : day1Wilson.low <= baselineRate
        ? { key: 'monitor', label: 'Theo dõi thêm', message: 'Có chênh lệch dương nhưng cận dưới thống kê chưa vượt baseline.' }
        : { key: 'signal', label: 'Có tín hiệu', message: 'Kết quả ngoài mẫu và cận dưới thống kê đều vượt baseline.' };

  return {
    totalRows: rows.length,
    evaluatedDay1: evaluatedDay1.length,
    evaluatedTwoDays: evaluatedTwoDays.length,
    pending: rows.length - evaluatedDay1.length,
    day1Wins,
    day1Rate,
    day2OnlyWins,
    day2OnlyRate: evaluatedTwoDays.length ? day2OnlyWins / evaluatedTwoDays.length : 0,
    combinedWins,
    combinedRate,
    baselineRate,
    lift,
    wilsonLow: day1Wilson.low,
    wilsonHigh: day1Wilson.high,
    status,
  };
}

function monthly(rows) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = row.sourceDate.slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return [...groups.entries()].map(([month, monthRows]) => ({ month, ...summarize(monthRows) }));
}

export async function calculateBalancedDistinctWalkForward({ from, to, onProgress = null }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || '') || !/^\d{4}-\d{2}-\d{2}$/.test(to || '')) throw new Error('Khoảng ngày backtest không hợp lệ.');
  if (from > to) throw new Error('Ngày bắt đầu phải trước ngày kết thúc.');
  const cacheKey = `${from}:${to}`;
  if (reportCache.has(cacheKey)) return { ...reportCache.get(cacheKey), cached: true };

  const draws = await loadDraws();
  const simpleSelections = createSimpleSelections(draws);
  const targets = draws.filter((draw) => draw.date >= from && draw.date <= to);
  if (!targets.length) throw new Error('Không có kỳ quay hợp lệ trong khoảng đã chọn.');
  if (targets.length > 370) throw new Error('Mỗi lần chỉ backtest tối đa 370 ngày để bảo vệ máy local.');

  const rows = [];
  const ganRows = [];
  const roiRows = [];
  for (let targetOffset = 0; targetOffset < targets.length; targetOffset += 1) {
    const target = targets[targetOffset];
    const targetIndex = draws.findIndex((draw) => draw.date === target.date);
    const history = draws.slice(0, targetIndex);
    if (history.length < 200) continue;
    const selection = chooseCandidates(target, history);
    const day1 = draws[targetIndex + 1];
    const day2 = draws[targetIndex + 2];
    if (selection.selected.length >= 2) {
      const day1Matches = selection.selected.filter((candidate) => pairMatches(day1, candidate)).map((candidate) => candidate.pair.join('-'));
      const day2Matches = selection.selected.filter((candidate) => pairMatches(day2, candidate)).map((candidate) => candidate.pair.join('-'));
      rows.push({
        sourceDate: target.date,
        methodKey: 'balanced-distinct',
        selectionType: 'pairs',
        distinctValues: selection.distinctValues,
        comboCount: selection.comboCount,
        selections: selection.selected,
        baselineRate: baselineForSelection(history, selection.selected),
        day1: { date: day1?.date || null, available: Boolean(day1), hit: day1Matches.length > 0, matches: day1Matches },
        day2: { date: day2?.date || null, available: Boolean(day2), hit: day2Matches.length > 0, matches: day2Matches },
      });
    }
    const ganRow = simpleRow({ target, targetIndex, draws, history, selected: simpleSelections[targetIndex].gan, methodKey: 'gan-top-2' });
    const roiRow = simpleRow({ target, targetIndex, draws, history, selected: simpleSelections[targetIndex].roi3, methodKey: 'roi-3-ky' });
    if (ganRow) ganRows.push(ganRow);
    if (roiRow) roiRows.push(roiRow);
    if (onProgress) onProgress({ completed: targetOffset + 1, total: targets.length, date: target.date });
  }

  const methods = [
    {
      key: 'balanced-distinct',
      name: 'Balanced Distinct',
      description: 'Chọn 2 cặp cố định bằng combo 3 số khác nhau và dữ liệu lịch sử trước ngày dự đoán.',
      selectionLabel: 'Hai cặp dự đoán',
      summary: summarize(rows),
      monthly: monthly(rows),
      rows,
    },
    {
      key: 'gan-top-2',
      name: 'Lô gan – 2 số',
      description: 'Chọn 2 số có chuỗi kỳ chưa xuất hiện dài nhất, chỉ dùng thông tin trước ngày dự đoán.',
      selectionLabel: 'Hai số dự đoán',
      summary: summarize(ganRows),
      monthly: monthly(ganRows),
      rows: ganRows,
    },
    {
      key: 'roi-3-ky',
      name: 'Lô rơi 3 kỳ',
      description: 'Chọn tối đa 2 số đã xuất hiện trong cả 3 kỳ liền trước; ngày không có tín hiệu không tính vào mẫu.',
      selectionLabel: 'Số dự đoán',
      summary: summarize(roiRows),
      monthly: monthly(roiRows),
      rows: roiRows,
    },
  ];
  const report = {
    kind: 'balanced-distinct-walk-forward',
    researchOnly: true,
    from,
    to,
    generatedAt: new Date().toISOString(),
    rule: 'Combo gồm 3 số khác nhau; lịch sử khớp ít nhất 2/3 số và đủ 2/2 số của cặp. Mỗi ngày khóa 2 cặp trước khi kiểm tra D+1/D+2.',
    methods,
    summary: methods[0].summary,
    monthly: methods[0].monthly,
    rows,
  };
  reportCache.set(cacheKey, report);
  return report;
}

export function runBalancedDistinctTests() {
  const target = createDistinctCombos([2, 2, 20, 55, 55]);
  assert.deepEqual(target.unique, [2, 20, 55]);
  assert.equal(target.combos.length, 1);
  const has = new Uint8Array(100);
  has[2] = 1;
  assert.deepEqual(matchingComboIndexes(target.unique, target.indexByKey, { has }), []);
  has[20] = 1;
  assert.deepEqual(matchingComboIndexes(target.unique, target.indexByKey, { has }), [0]);
  const makeDraw = (numbers) => {
    const drawHas = new Uint8Array(100);
    numbers.forEach((number) => { drawHas[number] = 1; });
    return { positions: numbers, has: drawHas };
  };
  const roiDraws = [makeDraw([7]), makeDraw([7]), makeDraw([7]), makeDraw([8])];
  assert.deepEqual(createSimpleSelections(roiDraws)[2].roi3, [{ number: '07' }]);
  assert.deepEqual(createSimpleSelections(roiDraws)[3].roi3, []);
  const ganDraws = Array.from({ length: 31 }, () => makeDraw([0]));
  assert.deepEqual(createSimpleSelections(ganDraws)[30].gan.map((item) => item.number), ['01', '02']);
  return true;
}
