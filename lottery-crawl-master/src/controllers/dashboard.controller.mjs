import pool from '../db.mjs';

const vipSnapshotRefreshes = new Map();

const prizeLabels = { db: 'Đặc biệt', g1: 'Giải nhất', g2: 'Giải nhì', g3: 'Giải ba', g4: 'Giải tư', g5: 'Giải năm', g6: 'Giải sáu', g7: 'Giải bảy' };

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || '');
}

function formatDraw(rows) {
  if (!rows.length) return null;
  return {
    date: rows[0].draw_date,
    prizes: Object.fromEntries(rows.map((row) => [row.prize_code, { label: prizeLabels[row.prize_code], numbers: row.numbers }])),
  };
}

async function getDraw(date) {
  const result = await pool.query(
    'SELECT draw_date::text AS draw_date, prize_code, numbers FROM lottery_prizes WHERE draw_date = $1 ORDER BY prize_code',
    [date],
  );
  return formatDraw(result.rows);
}

export async function latest(req, res, next) {
  try {
    const result = await pool.query('SELECT MAX(draw_date)::text AS date FROM lottery_draws');
    const draw = result.rows[0].date ? await getDraw(result.rows[0].date) : null;
    res.json(draw);
  } catch (error) { next(error); }
}

export async function byDate(req, res, next) {
  try {
    if (!isDate(req.params.date)) return res.status(400).json({ message: 'Ngày phải theo định dạng YYYY-MM-DD.' });
    const draw = await getDraw(req.params.date);
    if (!draw) return res.status(404).json({ message: 'Chưa có dữ liệu ngày này.' });
    res.json(draw);
  } catch (error) { next(error); }
}

export async function overview(req, res, next) {
  try {
    const [drawCount, newest, running] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count, MIN(draw_date)::text AS first_date, MAX(draw_date)::text AS last_date FROM lottery_draws'),
      pool.query('SELECT MAX(draw_date)::text AS date FROM lottery_draws'),
      pool.query('SELECT successful_days, failed_days, finished_at FROM crawl_runs ORDER BY id DESC LIMIT 1'),
    ]);
    res.json({
      data: drawCount.rows[0],
      latest: newest.rows[0].date ? await getDraw(newest.rows[0].date) : null,
      crawl: running.rows[0] || null,
    });
  } catch (error) { next(error); }
}

export async function frequency(req, res, next) {
  try {
    const from = isDate(req.query.from) ? req.query.from : '2005-01-01';
    const to = isDate(req.query.to) ? req.query.to : new Date().toISOString().slice(0, 10);
    const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
    const result = await pool.query(
      `SELECT RIGHT(number, 2) AS number, COUNT(*)::int AS frequency
       FROM lottery_prizes CROSS JOIN LATERAL UNNEST(numbers) AS number
       WHERE draw_date BETWEEN $1 AND $2
       GROUP BY RIGHT(number, 2) ORDER BY frequency DESC, number ASC LIMIT $3`,
      [from, to, limit],
    );
    res.json({ from, to, items: result.rows });
  } catch (error) { next(error); }
}

export async function refreshHomepageStatistics() {
  const result = await pool.query(
    `SELECT RIGHT(number, 2) AS number, COUNT(*)::int AS frequency
     FROM lottery_prizes CROSS JOIN LATERAL UNNEST(numbers) AS number
     GROUP BY RIGHT(number, 2) ORDER BY frequency DESC, number ASC LIMIT 10`,
  );
  await pool.query(
    `INSERT INTO homepage_statistics (statistic_key, payload, generated_at)
     VALUES ('top-loto', $1, NOW())
     ON CONFLICT (statistic_key) DO UPDATE SET payload = EXCLUDED.payload, generated_at = NOW()`,
    [JSON.stringify(result.rows)],
  );
}

export async function homepageStatistics(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT payload, generated_at FROM homepage_statistics WHERE statistic_key = 'top-loto'`,
    );
    const row = result.rows[0];
    res.json({ items: row?.payload || [], generated_at: row?.generated_at || null });
  } catch (error) { next(error); }
}

export async function gaps(req, res, next) {
  try {
    const from = isDate(req.query.from) ? req.query.from : '2005-01-01';
    const to = isDate(req.query.to) ? req.query.to : new Date().toISOString().slice(0, 10);
    const result = await pool.query(
      `SELECT day::date::text AS date
       FROM generate_series($1::date, $2::date, INTERVAL '1 day') day
       LEFT JOIN lottery_draws ON draw_date = day::date
       WHERE draw_date IS NULL ORDER BY day DESC`,
      [from, to],
    );
    res.json({ from, to, items: result.rows });
  } catch (error) { next(error); }
}

function getRange(query) {
  return {
    from: isDate(query.from) ? query.from : '2005-01-01',
    to: isDate(query.to) ? query.to : new Date().toISOString().slice(0, 10),
    prize: ['all', 'db', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'].includes(query.prize) ? query.prize : 'all',
  };
}

function parseLotos(value) {
  const numbers = (value || '').split(/[\s,;\-]+/).filter(Boolean);
  if (!numbers.length || numbers.some((number) => !/^\d{2}$/.test(number))) return null;
  return [...new Set(numbers)];
}

export async function numberQuery(req, res, next) {
  try {
    const from = isDate(req.query.from) ? req.query.from : '2005-01-01';
    const to = isDate(req.query.to) ? req.query.to : new Date().toISOString().slice(0, 10);
    const targets = parseLotos(req.query.numbers);
    const compare = req.query.compare ? parseLotos(req.query.compare) : [];
    if (!targets) return res.status(400).json({ message: 'Nhập lô gồm đúng 2 chữ số, cách nhau bởi dấu phẩy hoặc dấu gạch ngang.' });
    if (req.query.compare && !compare) return res.status(400).json({ message: 'Ô so sánh phải gồm các lô 2 chữ số.' });
    const draws = await rangeDraws({ from, to, prize: 'all' });
    const summaryFor = (numbers) => numbers.map((number) => {
      const dates = draws.flatMap((draw) => {
        const count = draw.numbers.filter((value) => value === number).length;
        return count ? [{ date: draw.date, count }] : [];
      });
      return { number, occurrences: dates.reduce((sum, item) => sum + item.count, 0), days: dates };
    });
    const targetItems = summaryFor(targets);
    const compareItems = compare.length ? summaryFor(compare) : [];
    const cooccurrences = compare.length ? draws.flatMap((draw) => {
      const targetHits = draw.numbers.filter((number) => targets.includes(number)).length;
      const compareHits = draw.numbers.filter((number) => compare.includes(number)).length;
      return targetHits && compareHits ? [{ date: draw.date, targetHits, compareHits }] : [];
    }) : [];
    res.json({ from, to, targets: targetItems, compare: compareItems, cooccurrences });
  } catch (error) { next(error); }
}

async function rangeDraws({ from, to, prize, digits = 2 }) {
  const result = await pool.query(
    `SELECT draw_date::text AS draw_date, prize_code, numbers
     FROM lottery_prizes WHERE draw_date BETWEEN $1 AND $2 AND ($3 = 'all' OR prize_code = $3)
     ORDER BY draw_date, prize_code`,
    [from, to, prize],
  );
  const draws = new Map();
  for (const row of result.rows) {
    if (!draws.has(row.draw_date)) draws.set(row.draw_date, []);
    draws.get(row.draw_date).push(...row.numbers.filter((number) => number.length >= digits).map((number) => number.slice(-digits)));
  }
  return [...draws.entries()].map(([date, numbers]) => ({ date, numbers }));
}

function frequencyFrom(draws) {
  const counts = new Map();
  draws.forEach(({ numbers }) => numbers.forEach((number) => counts.set(number, (counts.get(number) || 0) + 1)));
  return [...counts.entries()].map(([number, frequency]) => ({ number, frequency })).sort((a, b) => b.frequency - a.frequency || a.number.localeCompare(b.number));
}

function missingRuns(draws, position) {
  return Array.from({ length: 10 }, (_, digit) => {
    let currentMiss = 0;
    let longestMiss = 0;
    let run = 0;
    draws.forEach(({ numbers }) => {
      const appeared = numbers.some((number) => number[position] === String(digit));
      run = appeared ? 0 : run + 1;
      longestMiss = Math.max(longestMiss, run);
    });
    for (let index = draws.length - 1; index >= 0; index -= 1) {
      if (draws[index].numbers.some((number) => number[position] === String(digit))) break;
      currentMiss += 1;
    }
    return { digit: String(digit), currentMiss, longestMiss };
  }).sort((a, b) => b.currentMiss - a.currentMiss || a.digit.localeCompare(b.digit));
}

function repeats(draws, minimum) {
  return draws.flatMap(({ date, numbers }) => {
    const daily = frequencyFrom([{ numbers }]);
    return daily.filter((item) => item.frequency >= minimum).map((item) => ({ date, ...item }));
  }).sort((a, b) => b.frequency - a.frequency || b.date.localeCompare(a.date));
}

function combinations(frequency, size) {
  const candidates = frequency.slice(0, 12);
  const items = [];
  const build = (start, picked) => {
    if (picked.length === size) {
      items.push({ numbers: picked.map((item) => item.number), frequency: picked.reduce((sum, item) => sum + item.frequency, 0) });
      return;
    }
    for (let index = start; index < candidates.length; index += 1) build(index + 1, [...picked, candidates[index]]);
  };
  build(0, []);
  return items.sort((a, b) => b.frequency - a.frequency).slice(0, 20);
}

export async function advanced(req, res, next) {
  try {
    const range = getRange(req.query);
    const draws = await rangeDraws(range);
    const threeDigitDraws = await rangeDraws({ ...range, digits: 3 });
    const frequency = frequencyFrom(draws);
    const threeDigitFrequency = frequencyFrom(threeDigitDraws);
    res.json({
      ...range,
      drawCount: draws.length,
      frequency: frequency.slice(0, 30),
      frequencyThreeDigits: threeDigitFrequency.slice(0, 30),
      doubles: repeats(draws, 2).slice(0, 30),
      triples: repeats(draws, 3).slice(0, 30),
      missHeads: missingRuns(draws, 0),
      missTails: missingRuns(draws, 1),
      pairs: combinations(frequency, 2),
      triplesCombination: combinations(frequency, 3),
    });
  } catch (error) { next(error); }
}

function fiftyPairs() {
  const pairs = [['00', '55'], ['11', '66'], ['22', '77'], ['33', '88'], ['44', '99']];
  for (let tens = 0; tens <= 9; tens += 1) for (let units = tens + 1; units <= 9; units += 1) pairs.push([`${tens}${units}`, `${units}${tens}`]);
  return pairs;
}

export async function tripleReport(req, res, next) {
  try {
    if (!isDate(req.query.date)) return res.status(400).json({ message: 'Chọn ngày theo định dạng YYYY-MM-DD.' });
    const target = (req.query.numbers || '').split(',').map((number) => number.trim()).filter((number) => /^\d{2}$/.test(number));
    if (target.length !== 3) return res.status(400).json({ message: 'Nhập đúng ba lô, ví dụ 00,01,02 hoặc 01,01,10.' });
    const window = ['1', '2', '3'].includes(req.query.window) ? Number(req.query.window) : 3;
    const draws = await rangeDraws({ from: '2010-01-01', to: req.query.date, prize: 'all' });
    const index = draws.findIndex((draw) => draw.date === req.query.date);
    if (index < 0) return res.status(404).json({ message: 'Chưa có dữ liệu cho ngày đã chọn.' });
    const pairStats = fiftyPairs().map((numbers) => ({ numbers, wins: 0, misses: 0 }));
    let signals = 0;
    for (let position = 0; position < index; position += 1) {
      const available = new Map();
      draws[position].numbers.forEach((number) => available.set(number, (available.get(number) || 0) + 1));
      const required = new Map();
      target.forEach((number) => required.set(number, (required.get(number) || 0) + 1));
      if (![...required].every(([number, count]) => (available.get(number) || 0) >= count)) continue;
      signals += 1;
      const future = draws.slice(position + 1, position + 1 + window).flatMap((draw) => draw.numbers);
      pairStats.forEach((pair) => {
        if (future.some((number) => pair.numbers.includes(number))) pair.wins += 1;
        else pair.misses += 1;
      });
    }
    const items = pairStats.map((item) => ({ ...item, rate: signals ? Math.round((item.wins / signals) * 1000) / 10 : 0 })).sort((a, b) => b.rate - a.rate || b.wins - a.wins);
    res.json({ date: req.query.date, target, window, signals, items });
  } catch (error) { next(error); }
}

const bacNhoRules = [
  { trigger: ['00'], targets: ['10', '99'] },
  { trigger: ['01', '10'], targets: ['06', '60', '89', '98'] },
  { trigger: ['02', '20'], targets: ['12', '21', '22'] },
  { trigger: ['03', '30'], targets: ['13', '31', '79', '97'] },
  { trigger: ['04', '40'], targets: ['14', '41', '59', '95'] },
  { trigger: ['05', '50'], targets: ['15', '51', '49', '94'] },
];

const duong = { 0: '5', 1: '6', 2: '7', 3: '8', 4: '9', 5: '0', 6: '1', 7: '2', 8: '3', 9: '4' };
const am = { 0: '7', 1: '4', 2: '9', 3: '6', 4: '1', 5: '8', 6: '3', 7: '0', 8: '5', 9: '2' };

function mapNumber(value, map) {
  return value.split('').map((digit) => map[digit]).join('');
}

async function strategyDraws() {
  const result = await pool.query(
    `SELECT draw_date::text AS draw_date, prize_code, numbers FROM lottery_prizes
     ORDER BY draw_date, prize_code`,
  );
  const grouped = new Map();
  for (const row of result.rows) {
    if (!grouped.has(row.draw_date)) grouped.set(row.draw_date, { date: row.draw_date, prizes: {}, numbers: [] });
    const draw = grouped.get(row.draw_date);
    draw.prizes[row.prize_code] = row.numbers;
    draw.numbers.push(...row.numbers.map((number) => number.slice(-2)));
    draw.threeNumbers = [...(draw.threeNumbers || []), ...row.numbers.filter((number) => number.length >= 3).map((number) => number.slice(-3))];
  }
  return [...grouped.values()];
}

function fixedSignals(draw) {
  return bacNhoRules
    .filter((rule) => rule.trigger.some((number) => draw.numbers.includes(number)))
    .map((rule) => ({ formula: `Bạc nhớ: ${rule.trigger.join(' / ')}`, rule: `Bạc nhớ: ${rule.trigger.join(' / ')}`, targets: rule.targets }));
}

function bongSignals(draw) {
  const db = draw.prizes.db?.[0];
  if (!db) return [];
  const source = db.slice(-2);
  return [
    { formula: `Bóng dương GĐB ${source}`, rule: 'Bóng dương GĐB', targets: [mapNumber(source, duong)] },
    { formula: `Bóng âm GĐB ${source}`, rule: 'Bóng âm GĐB', targets: [mapNumber(source, am)] },
  ];
}

function g7Signals(draw) {
  const g7 = draw.prizes.g7 || [];
  if (g7.length < 2) return [];
  const target = `${g7[0][0]}${g7[1].slice(-1)}`;
  return [{ formula: `Ghép G7 (${g7[0]} · ${g7[1]})`, rule: 'Ghép G7', targets: [target, target.split('').reverse().join('')] }];
}

function specialSignals(draw) {
  const db = draw.prizes.db?.[0];
  const g4 = draw.prizes.g4?.[0];
  const g5 = draw.prizes.g5?.[0];
  if (!db || !g4 || !g5) return [];
  const tail = db.slice(-1);
  return [
    { formula: `GĐB đuôi ${tail} ghép G4.1 ${g4[0]}`, rule: 'GĐB ghép G4.1', targets: [`${tail}${g4[0]}`, `${g4[0]}${tail}`] },
    { formula: `GĐB đuôi ${tail} ghép G5.1 ${g5[0]}`, rule: 'GĐB ghép G5.1', targets: [`${tail}${g5[0]}`, `${g5[0]}${tail}`] },
  ];
}

function threeDigitSignals(derive) {
  return (draw) => derive(draw).map((signal) => ({
    ...signal,
    formula: `${signal.formula} · 3 số`,
    rule: `${signal.rule || signal.formula} · 3 số`,
    targets: signal.targets.flatMap((tail) => Array.from({ length: 10 }, (_, prefix) => `${prefix}${tail}`)),
  }));
}

function evaluateSignals(draws, index, derive, window, startIndex = 0, numberKey = 'numbers') {
  const totals = new Map();
  for (let position = startIndex; position + window < index; position += 1) {
    const future = draws.slice(position + 1, position + 1 + window).flatMap((draw) => draw[numberKey]);
    derive(draws[position]).forEach((signal) => {
      const item = totals.get(signal.rule || signal.formula) || { signals: 0, wins: 0, targetWins: signal.targets.map(() => 0) };
      item.signals += 1;
      if (signal.targets.some((number) => future.includes(number))) item.wins += 1;
      signal.targets.forEach((number, targetIndex) => {
        if (future.includes(number)) item.targetWins[targetIndex] += 1;
      });
      totals.set(signal.rule || signal.formula, item);
    });
  }
  return totals;
}

function ratesByDay(draws, index, derive, rule, targetIndexes, window, startIndex, numberKey = 'numbers') {
  let signals = 0;
  const wins = Array.from({ length: window }, () => 0);
  for (let position = startIndex; position + window < index; position += 1) {
    const signal = derive(draws[position]).find((item) => (item.rule || item.formula) === rule);
    const targets = signal ? targetIndexes.map((targetIndex) => signal.targets[targetIndex]).filter(Boolean) : [];
    if (!targets.length) continue;
    signals += 1;
    draws.slice(position + 1, position + 1 + window).forEach((draw, dayIndex) => {
      if (targets.some((target) => draw[numberKey].includes(target))) wins[dayIndex] += 1;
    });
  }
  return wins.map((value, index) => ({ day: index + 1, wins: value, rate: signals ? Math.round(value * 1000 / signals) / 10 : 0 }));
}

function buildStrategyReport(draws, index, definitions, numberKey, window, startIndex) {
  const items = definitions.flatMap(([group, derive]) => {
    const history = evaluateSignals(draws, index, derive, window, startIndex, numberKey);
    return derive(draws[index]).map((signal) => {
      const stats = history.get(signal.rule || signal.formula) || { signals: 0, wins: 0, targetWins: [] };
      const targetStats = signal.targets.map((number, targetIndex) => {
        const wins = stats.targetWins[targetIndex] || 0;
        return { number, index: targetIndex, wins, rate: stats.signals ? Math.round(wins * 1000 / stats.signals) / 10 : 0 };
      }).sort((a, b) => b.rate - a.rate || b.wins - a.wins || a.number.localeCompare(b.number)).slice(0, 2);
      return { group, ...signal, targets: targetStats.map((item) => item.number), targetStats, byDay: ratesByDay(draws, index, derive, signal.rule || signal.formula, targetStats.map((item) => item.index), window, startIndex, numberKey), signals: stats.signals, wins: targetStats[0]?.wins || 0, misses: stats.signals - (targetStats[0]?.wins || 0), rate: targetStats[0]?.rate || 0 };
    });
  });
  const models = definitions.flatMap(([group, derive]) => derive(draws[index]).map((signal) => {
    const item = items.find((value) => value.group === group && value.formula === signal.formula);
    return item?.targetStats[0] ? { group, derive, rule: signal.rule || signal.formula, item, targetIndex: item.targetStats[0].index } : null;
  }).filter(Boolean));
  const scorePlan = (modelsInPlan) => {
    let signals = 0;
    let wins = 0;
    let comboWins = 0;
    const dayWins = Array.from({ length: window }, () => 0);
    for (let position = startIndex; position + window < index; position += 1) {
      const targets = modelsInPlan.map((model) => model.derive(draws[position]).find((signal) => (signal.rule || signal.formula) === model.rule)?.targets[model.targetIndex]);
      if (targets.some((target) => !target)) continue;
      signals += 1;
      const futureDays = draws.slice(position + 1, position + 1 + window);
      const future = futureDays.flatMap((draw) => draw[numberKey]);
      if (targets.some((target) => future.includes(target))) wins += 1;
      if (targets.length > 1 && targets.every((target) => future.includes(target))) comboWins += 1;
      futureDays.forEach((draw, dayIndex) => {
        if (targets.some((target) => draw[numberKey].includes(target))) dayWins[dayIndex] += 1;
      });
    }
    return { models: modelsInPlan, signals, wins, comboWins, dayWins, rate: signals ? Math.round(wins * 1000 / signals) / 10 : 0, comboRate: signals ? Math.round(comboWins * 1000 / signals) / 10 : 0 };
  };
  const plans = models.flatMap((model, modelIndex) => [
    scorePlan([model]),
    ...models.slice(modelIndex + 1).filter((other) => other.group !== model.group).map((other) => scorePlan([model, other])),
  ]);
  const eligible = plans.filter((plan) => plan.signals >= 30).sort((a, b) => b.rate - a.rate || b.signals - a.signals);
  const selectedPlan = eligible[0] || plans.sort((a, b) => b.rate - a.rate || b.signals - a.signals)[0];
  const onePlans = plans.filter((plan) => plan.models.length === 1);
  const eligibleOne = onePlans.filter((plan) => plan.signals >= 30).sort((a, b) => b.rate - a.rate || b.signals - a.signals);
  const selectedOne = eligibleOne[0] || onePlans.sort((a, b) => b.rate - a.rate || b.signals - a.signals)[0];
  const xienPlans = plans.filter((plan) => plan.models.length === 2);
  const eligibleXien = xienPlans.filter((plan) => plan.signals >= 30).sort((a, b) => b.comboRate - a.comboRate || b.signals - a.signals);
  const selectedXien = eligibleXien[0] || xienPlans.sort((a, b) => b.comboRate - a.comboRate || b.signals - a.signals)[0];
  const recommendation = selectedPlan ? {
    group: selectedPlan.models.length > 1 ? 'Kết hợp 2 phương pháp' : selectedPlan.models[0].group,
    formula: selectedPlan.models.map((model) => model.item.formula).join(' + '),
    targets: selectedPlan.models.map((model) => model.item.targetStats[0].number),
    signals: selectedPlan.signals,
    wins: selectedPlan.wins,
    misses: selectedPlan.signals - selectedPlan.wins,
    rate: selectedPlan.rate,
    byDay: selectedPlan.dayWins.map((wins, dayIndex) => ({ day: dayIndex + 1, wins, rate: selectedPlan.signals ? Math.round(wins * 1000 / selectedPlan.signals) / 10 : 0 })),
  } : null;
  const recommendationOne = selectedOne ? { targets: selectedOne.models.map((model) => model.item.targetStats[0].number), formula: selectedOne.models.map((model) => model.item.formula).join(' + '), signals: selectedOne.signals, wins: selectedOne.wins, rate: selectedOne.rate, byDay: selectedOne.dayWins.map((wins, dayIndex) => ({ day: dayIndex + 1, wins, rate: selectedOne.signals ? Math.round(wins * 1000 / selectedOne.signals) / 10 : 0 })) } : null;
  const recommendationXien = selectedXien ? { targets: selectedXien.models.map((model) => model.item.targetStats[0].number), formula: selectedXien.models.map((model) => model.item.formula).join(' + '), signals: selectedXien.signals, wins: selectedXien.comboWins, rate: selectedXien.comboRate } : null;
  return { items, recommendation, recommendationOne, recommendationXien };
}

function addDays(date, amount) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function homepageForecastRows(twoNumber, threeNumber) {
  const two = twoNumber.recommendation;
  const twoOne = twoNumber.recommendationOne;
  const twoXien = twoNumber.recommendationXien || two;
  const three = threeNumber.recommendation;
  const item = (category, numbers, source) => ({ category, numbers, formula: source.formula, rate: source.rate, wins: source.wins, signals: source.signals });
  return [
    item('2so', two.targets, two),
    item('3so', three.targets, three),
    item('lo-xien', twoXien.targets, twoXien),
    item('de', twoOne.targets.slice(0, 1), twoOne),
    item('cap-so', two.targets, two),
    item('dac-biet', three.targets.slice(0, 1), three),
  ];
}

export async function refreshHomepageForecasts(targetDates) {
  const draws = await strategyDraws();
  const definitions = [
    ['Bạc nhớ D+1', fixedSignals], ['Bóng âm – dương', bongSignals], ['Ghép giải bảy', g7Signals], ['Ghép GĐB – G4 – G5', specialSignals],
  ];
  const threeNumberDefinitions = definitions.map(([group, derive]) => [group, threeDigitSignals(derive)]);
  const from = '2019-01-01';
  const startIndex = Math.max(0, draws.findIndex((draw) => draw.date >= from));
  for (const targetDate of targetDates) {
    let signalIndex = -1;
    for (let index = draws.length - 1; index >= 0; index -= 1) {
      if (draws[index].date < targetDate) { signalIndex = index; break; }
    }
    if (signalIndex <= startIndex) continue;
    const twoNumber = buildStrategyReport(draws, signalIndex, definitions, 'numbers', 1, startIndex);
    const threeNumber = buildStrategyReport(draws, signalIndex, threeNumberDefinitions, 'threeNumbers', 1, startIndex);
    for (const row of homepageForecastRows(twoNumber, threeNumber)) {
      await pool.query(
        `INSERT INTO homepage_forecasts (target_date, category, numbers, formula, rate, wins, signals, generated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         ON CONFLICT (target_date, category) DO UPDATE SET numbers = EXCLUDED.numbers, formula = EXCLUDED.formula, rate = EXCLUDED.rate, wins = EXCLUDED.wins, signals = EXCLUDED.signals, generated_at = NOW()`,
        [targetDate, row.category, JSON.stringify(row.numbers), row.formula, row.rate, row.wins, row.signals],
      );
    }
  }
}

export async function homepageForecasts(req, res, next) {
  try {
    const today = isDate(req.query.date) ? req.query.date : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const dates = [-2, -1, 0].map((offset) => addDays(today, offset));
    const result = await pool.query('SELECT target_date::text AS target_date, category, numbers, formula, rate::float AS rate, wins, signals, generated_at FROM homepage_forecasts WHERE target_date = ANY($1::date[]) ORDER BY target_date, category', [dates]);
    res.json({ dates, items: result.rows, ready: result.rows.length === dates.length * 6 });
  } catch (error) { next(error); }
}

function rangeCandidates(draws, index, definitions, numberKey, window) {
  const yearStarts = [...new Set(draws.slice(0, index).map((draw) => draw.date.slice(0, 4)))].map((year) => `${year}-01-01`);
  return yearStarts.map((from) => {
    const startIndex = Math.max(0, draws.findIndex((draw) => draw.date >= from));
    const report = buildStrategyReport(draws, index, definitions, numberKey, window, startIndex);
    return { from, report };
  }).filter((item) => item.report.recommendation);
}

function selectVipWinRate(candidates) {
  const eligible = candidates.filter((item) => item.report.recommendation.signals >= 30);
  const selected = (eligible.length ? eligible : candidates).sort((a, b) => b.report.recommendation.rate - a.report.recommendation.rate || b.report.recommendation.signals - a.report.recommendation.signals)[0];
  return { ...selected.report, from: selected.from, auto: true, vipMode: 'vip1' };
}

function selectVipSample(candidates) {
  const maxSignals = Math.max(...candidates.map((item) => item.report.recommendation.signals), 1);
  const minimumSignals = Math.max(120, Math.ceil(maxSignals * 0.45));
  const eligible = candidates.filter((item) => item.report.recommendation.signals >= minimumSignals);
  const selected = (eligible.length ? eligible : candidates).sort((a, b) => b.report.recommendation.rate - a.report.recommendation.rate || b.report.recommendation.signals - a.report.recommendation.signals)[0];
  return { ...selected.report, from: selected.from, auto: true, vipMode: 'vip2', minimumSignals };
}

function bestRangeReport(draws, index, definitions, numberKey, window) {
  return selectVipWinRate(rangeCandidates(draws, index, definitions, numberKey, window));
}

export async function strategies(req, res, next) {
  try {
    if (!isDate(req.query.date)) return res.status(400).json({ message: 'Chọn ngày YYYY-MM-DD.' });
    const from = isDate(req.query.from) ? req.query.from : '2005-01-01';
    const window = ['1', '2', '3'].includes(req.query.window) ? Number(req.query.window) : 3;
    const draws = await strategyDraws();
    const index = draws.findIndex((draw) => draw.date === req.query.date);
    if (index < 0) return res.status(404).json({ message: 'Chưa có dữ liệu ngày đã chọn.' });
    const startIndex = Math.max(0, draws.findIndex((draw) => draw.date >= from));
    const definitions = [
      ['Bạc nhớ D+1', fixedSignals], ['Bóng âm – dương', bongSignals], ['Ghép giải bảy', g7Signals], ['Ghép GĐB – G4 – G5', specialSignals],
    ];
    if (req.query.auto === 'true') {
      const threeNumberDefinitions = definitions.map(([group, derive]) => [group, threeDigitSignals(derive)]);
      const twoNumber = bestRangeReport(draws, index, definitions, 'numbers', window);
      const threeNumber = bestRangeReport(draws, index, threeNumberDefinitions, 'threeNumbers', window);
      return res.json({ date: req.query.date, from: twoNumber.from, window, ...twoNumber, threeNumber: { ...threeNumber, date: req.query.date } });
    }
    const twoNumber = buildStrategyReport(draws, index, definitions, 'numbers', window, startIndex);
    const threeNumberDefinitions = definitions.map(([group, derive]) => [group, threeDigitSignals(derive)]);
    const threeNumber = buildStrategyReport(draws, index, threeNumberDefinitions, 'threeNumbers', window, startIndex);
    res.json({ date: req.query.date, from, window, ...twoNumber, threeNumber });
  } catch (error) { next(error); }
}

export async function refreshVipStrategySnapshots(targetDate, { modes = ['vip1', 'vip2'], windows = [1, 2, 3], numberSizes = [2, 3] } = {}) {
  const draws = await strategyDraws();
  let index = -1;
  for (let position = draws.length - 1; position >= 0; position -= 1) {
    if (draws[position].date < targetDate) { index = position; break; }
  }
  if (index < 0) throw new Error(`Chưa có dữ liệu trước ngày ${targetDate} để tạo VIP snapshot.`);
  const definitions = [
    ['Bạc nhớ D+1', fixedSignals], ['Bóng âm – dương', bongSignals], ['Ghép giải bảy', g7Signals], ['Ghép GĐB – G4 – G5', specialSignals],
  ];
  const definitions3 = definitions.map(([group, derive]) => [group, threeDigitSignals(derive)]);
  for (const window of windows) {
    for (const [numberSize, list, numberKey] of [[2, definitions, 'numbers'], [3, definitions3, 'threeNumbers']].filter(([numberSize]) => numberSizes.includes(numberSize))) {
      const candidates = rangeCandidates(draws, index, list, numberKey, window);
      const reports = { vip1: selectVipWinRate(candidates), vip2: selectVipSample(candidates) };
      for (const mode of modes) {
        const report = reports[mode];
        await pool.query(`INSERT INTO vip_strategy_snapshots (target_date, vip_mode, number_size, window_size, from_date, payload, generated_at)
          VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (target_date, vip_mode, number_size, window_size) DO UPDATE SET from_date = EXCLUDED.from_date, payload = EXCLUDED.payload, generated_at = NOW()`,
        [targetDate, report.vipMode, numberSize, window, report.from, JSON.stringify(report)]);
      }
    }
  }
}

async function ensureVipStrategySnapshots(targetDate, mode, window) {
  const existing = await pool.query(`SELECT COUNT(*)::int AS count
    FROM vip_strategy_snapshots
    WHERE target_date = $1 AND vip_mode = $2 AND window_size = $3
      AND number_size IN (2, 3)`, [targetDate, mode, window]);
  if (existing.rows[0].count === 2) return false;

  const cacheKey = `${targetDate}:${mode}:${window}`;
  let refresh = vipSnapshotRefreshes.get(cacheKey);
  if (!refresh) {
    refresh = refreshVipStrategySnapshots(targetDate, { modes: [mode], windows: [window], numberSizes: [2, 3] })
      .finally(() => vipSnapshotRefreshes.delete(cacheKey));
    vipSnapshotRefreshes.set(cacheKey, refresh);
  }
  await refresh;
  return true;
}

export async function vipStrategies(req, res, next) {
  try {
    const mode = ['vip1', 'vip2'].includes(req.query.mode) ? req.query.mode : 'vip1';
    const window = ['1', '2', '3'].includes(req.query.window) ? Number(req.query.window) : 3;
    const requestedDate = isDate(req.query.date) ? req.query.date : null;
    const latest = requestedDate ? null : await pool.query(`SELECT COALESCE(
      (SELECT MAX(target_date)::text FROM vip_strategy_snapshots WHERE vip_mode = $1 AND window_size = $2),
      (SELECT MAX(draw_date)::text FROM lottery_draws)
    ) AS target_date`, [mode, window]);
    const targetDate = requestedDate || latest.rows[0].target_date;
    const generated = targetDate ? await ensureVipStrategySnapshots(targetDate, mode, window) : false;
    if (!targetDate) return res.status(404).json({ message: 'VIP đang chuẩn bị dữ liệu. Vui lòng thử lại sau.' });
    const rows = await pool.query('SELECT number_size, from_date::text AS from_date, payload FROM vip_strategy_snapshots WHERE target_date = $1 AND vip_mode = $2 AND window_size = $3 ORDER BY number_size', [targetDate, mode, window]);
    const two = rows.rows.find((row) => row.number_size === 2);
    const three = rows.rows.find((row) => row.number_size === 3);
    if (!two || !three) return res.status(404).json({ message: `Chưa có snapshot VIP cho ngày ${targetDate}.` });
    return res.json({ date: targetDate, from: two.from_date, window, vipMode: mode, snapshotGenerated: generated, ...(two.payload), threeNumber: { ...(three.payload), date: targetDate } });
  } catch (error) { return next(error); }
}
