import axios from 'axios';

const EXPECTED_PRIZE_COUNTS = { db: 1, g1: 1, g2: 2, g3: 6, g4: 4, g5: 6, g6: 3, g7: 4 };

function formatSourceDate(date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).replaceAll('/', '-');
}

export function parseIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`Ngày không hợp lệ: ${value}. Dùng định dạng YYYY-MM-DD.`);
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`Ngày không hợp lệ: ${value}.`);
  }
  return date;
}

export async function crawlMinhNgoc(date) {
  const sourceDate = formatSourceDate(date);
  const sourceUrl = `https://www.minhngoc.net.vn/ket-qua-xo-so/mien-bac/${sourceDate}.html`;
  const response = await axios.get(sourceUrl, {
    headers: { 'User-Agent': 'lottery-crawler/1.0' },
    timeout: 30_000,
  });
  const html = response.data;
  const expectedTitleDate = sourceDate.replaceAll('-', '/');
  if (!html.includes(`Miền Bắc ${expectedTitleDate}`)) {
    throw new Error(`${sourceDate}: nguồn không có kết quả cho ngày này.`);
  }
  if (!html.includes('bkqtinhmienbac')) {
    throw new Error('Không tìm thấy bảng kết quả miền Bắc.');
  }

  const prizes = {};
  for (const [prize, expectedCount] of Object.entries(EXPECTED_PRIZE_COUNTS)) {
    const className = prize === 'db' ? 'giaidb' : `giai${prize.slice(1)}`;
    const cell = html.match(new RegExp(`<td[^>]*class=["'][^"']*\\b${className}\\b[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`, 'i'));
    const numbers = cell?.[1].replace(/<[^>]*>/g, ' ').match(/\b\d+\b/g) ?? [];
    if (numbers.length !== expectedCount) {
      throw new Error(`${sourceDate}: ${prize} có ${numbers.length}/${expectedCount} số.`);
    }
    prizes[prize] = numbers;
  }

  return { drawDate: date.toISOString().slice(0, 10), sourceUrl, prizes };
}
