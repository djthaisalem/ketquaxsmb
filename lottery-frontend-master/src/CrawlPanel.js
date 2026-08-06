import { useState } from 'react';

export default function CrawlPanel({ apiUrl }) {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  async function crawlToday() {
    setLoading(true);
    setStatus('Đang quét kết quả mới từ Minh Ngọc...');
    try {
      const response = await fetch(`${apiUrl}/lottery/crawl`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Không thể crawl dữ liệu.');
      setStatus(data.failedDays ? `Đã lưu ${data.successfulDays} ngày, còn ${data.failedDays} ngày lỗi.` : `Đã cập nhật dữ liệu ngày ${data.from}.`);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <div className="crawl-panel"><div><b>Cập nhật dữ liệu</b><span>Hệ thống tự quét lúc 19:00 mỗi ngày (giờ Việt Nam).</span></div><button onClick={crawlToday} disabled={loading}>{loading ? 'Đang quét...' : 'Quét dữ liệu hôm nay'}</button>{status && <small>{status}</small>}</div>;
}
