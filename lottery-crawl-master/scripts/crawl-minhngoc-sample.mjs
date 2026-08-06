import { mkdir, writeFile } from 'node:fs/promises';

const START_DATE = new Date(Date.UTC(2010, 0, 1));
const DAY_COUNT = 10;
const PRIZES = [
  ['db', 'giaidb'],
  ['g1', 'giai1'],
  ['g2', 'giai2'],
  ['g3', 'giai3'],
  ['g4', 'giai4'],
  ['g5', 'giai5'],
  ['g6', 'giai6'],
  ['g7', 'giai7'],
];
const EXPECTED_PRIZE_COUNTS = { db: 1, g1: 1, g2: 2, g3: 6, g4: 4, g5: 6, g6: 3, g7: 4 };

function formatDate(date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).replaceAll('/', '-');
}

function prizeNumbers(html, className) {
  const cell = html.match(new RegExp(`<td[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`, 'i'));
  if (!cell) {
    throw new Error(`Không tìm thấy ô kết quả ${className}`);
  }

  return cell[1].replace(/<[^>]*>/g, ' ').match(/\b\d+\b/g) ?? [];
}

async function crawlDate(date) {
  const formattedDate = formatDate(date);
  const url = `https://www.minhngoc.net.vn/ket-qua-xo-so/mien-bac/${formattedDate}.html`;
  const response = await fetch(url, {
    headers: { 'user-agent': 'lottery-data-verification/1.0' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const html = await response.text();
  if (!html.includes('bkqtinhmienbac')) {
    throw new Error('Trang không chứa bảng kết quả miền Bắc');
  }

  const prizes = Object.fromEntries(PRIZES.map(([key, className]) => [key, prizeNumbers(html, className)]));
  for (const [prize, expectedCount] of Object.entries(EXPECTED_PRIZE_COUNTS)) {
    if (prizes[prize].length !== expectedCount) {
      throw new Error(`${formattedDate}: ${prize} có ${prizes[prize].length}/${expectedCount} số`);
    }
  }

  return {
    draw_date: formattedDate,
    source_url: url,
    prizes,
  };
}

const results = [];
for (let offset = 0; offset < DAY_COUNT; offset += 1) {
  const date = new Date(START_DATE);
  date.setUTCDate(START_DATE.getUTCDate() + offset);
  const result = await crawlDate(date);
  results.push(result);
  console.log(`Đã crawl ${result.draw_date}`);
  await new Promise((resolve) => setTimeout(resolve, 1000));
}

await mkdir('output', { recursive: true });
await writeFile('output/minhngoc-sample-2010-01-01-to-2010-01-10.json', `${JSON.stringify(results, null, 2)}\n`);
console.log(`Hoàn tất ${results.length} ngày.`);
