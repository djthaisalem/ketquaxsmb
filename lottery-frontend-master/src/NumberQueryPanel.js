import { useState } from 'react';
import DateInput from './DateInput';

const formatDate = (value) => value ? value.split('-').reverse().join('/') : '—';

export default function NumberQueryPanel({ request }) {
  const [numbers, setNumbers] = useState('');
  const [compare, setCompare] = useState('');
  const [from, setFrom] = useState('2005-01-01');
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const params = new URLSearchParams({ numbers, compare, from, to });
      setResult(await request(`/lottery/statistics/numbers?${params}`));
      setMessage('');
    } catch (error) { setMessage(error.message); } finally { setLoading(false); }
  }

  return <article className="panel number-query-panel"><div><p className="eyebrow">Tra cứu lô thông minh</p><h2>Đếm lần xuất hiện và so sánh cùng kỳ</h2><p>Nhập lô đúng 2 chữ số. Nhiều lô ngăn cách bằng dấu phẩy hoặc dấu gạch ngang: <b>01,10,23</b> hoặc <b>01-10-23</b>.</p></div><form onSubmit={submit}><label>Lô cần tra<input value={numbers} onChange={(event) => setNumbers(event.target.value)} placeholder="Ví dụ: 01,10" /></label><label>Lô so sánh (không bắt buộc)<input value={compare} onChange={(event) => setCompare(event.target.value)} placeholder="Ví dụ: 23-32" /></label><label>Từ ngày<DateInput min="2005-01-01" value={from} onChange={setFrom} /></label><label>Đến ngày<DateInput value={to} onChange={setTo} /></label><button>{loading ? 'Đang thống kê...' : 'Thống kê'}</button></form>{message && <p className="query-error">{message}</p>}{result && <div className="query-results"><div><h3>Lô cần tra</h3>{result.targets.map((item) => <p key={item.number}><b>{item.number}</b> xuất hiện <strong>{item.occurrences}</strong> lần · {item.days.length} kỳ<div>{item.days.slice(0, 12).map((day) => <span key={day.date}>{formatDate(day.date)}{day.count > 1 ? ` ×${day.count}` : ''}</span>)}</div></p>)}</div>{result.compare.length > 0 && <div><h3>So sánh cùng kỳ</h3><p><strong>{result.cooccurrences.length}</strong> kỳ có ít nhất một lô ở mỗi ô cùng xuất hiện.</p><div>{result.cooccurrences.slice(0, 30).map((item) => <span key={item.date}>{formatDate(item.date)}</span>)}</div></div>}</div>}</article>;
}
