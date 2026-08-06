import { useEffect, useState } from 'react';
import NumberQueryPanel from './NumberQueryPanel';
import DateInput from './DateInput';

const formatDate = (value) => value ? value.split('-').reverse().join('/') : '—';

function GapCard({ title, items, kind }) {
  const [open, setOpen] = useState(false);
  const text = kind === 'head' ? 'Đầu là chữ số hàng chục. Số kỳ là số kỳ liên tiếp đầu này chưa xuất hiện.' : 'Đuôi là chữ số hàng đơn vị. Số kỳ là số kỳ liên tiếp đuôi này chưa xuất hiện.';
  return <article className="panel"><div className="stats-card-title"><h3>{title}</h3><button className="explain-button" onClick={() => setOpen(!open)} aria-expanded={open}>!</button></div><p>Số kỳ liên tiếp chưa xuất hiện.</p>{open && <div className="stats-explanation"><b>Giải thích</b><span>{text}</span></div>}<div className="gap-grid">{items.map((item) => <span key={item.digit}><b>{item.digit}</b><em>{item.currentMiss} kỳ</em><small>max {item.longestMiss}</small></span>)}</div></article>;
}

function SummaryColumn({ title, description, explanation, children }) {
  const [open, setOpen] = useState(false);
  return <div><div className="stats-card-title"><h3>{title}</h3><button className="explain-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`Giải thích ${title}`}>!</button></div><p>{description}</p>{open && <div className="stats-explanation"><b>Cách tính</b><span>{explanation}</span></div>}{children}</div>;
}

export default function StatsPanel({ analysis, request }) {
  const [summary, setSummary] = useState(null);
  const [from, setFrom] = useState('2005-01-01');
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (analysis) { setSummary(analysis); setFrom(analysis.from); setTo(analysis.to); } }, [analysis]);
  if (!analysis) return null;
  const data = summary || analysis;
  async function refreshSummary(event) { event.preventDefault(); setLoading(true); try { const params = new URLSearchParams({ from, to, prize: 'all' }); setSummary(await request(`/lottery/statistics/advanced?${params}`)); } finally { setLoading(false); } }
  return <section className="stats-panel">
    <form className="summary-filter panel" onSubmit={refreshSummary}><label>Từ ngày<DateInput value={from} onChange={setFrom} /></label><label>Đến ngày<DateInput value={to} onChange={setTo} /></label><button type="submit">{loading ? 'Đang tính…' : 'Cập nhật 3 bảng'}</button></form>
    <div className="stats-summary-grid"><article className="panel"><div className="stats-three-columns"><SummaryColumn title="Top lô về nhiều" description={`10 lô về nhiều · ${formatDate(data.from)} đến ${formatDate(data.to)}.`} explanation="Đếm số lần 2 số cuối của tất cả giải xuất hiện trong khoảng ngày đang phân tích; xếp từ cao xuống thấp."><div className="number-chips">{data.frequency.slice(0, 10).map((item) => <span key={item.number}><b>{item.number}</b>{item.frequency}</span>)}</div></SummaryColumn><SummaryColumn title="Top Lô 2 số" description="10 cặp 2 số xuất hiện nhiều nhất." explanation="Lấy 2 số cuối của mọi giải, cộng số lần xuất hiện trong khoảng thời gian đã chọn và xếp từ cao xuống thấp."><div className="event-list">{data.frequency.slice(0, 10).map((item) => <span key={`two${item.number}`}>Lô <b>{item.number}</b> · <b>{item.frequency} lần</b></span>)}</div></SummaryColumn><SummaryColumn title="Top Lô 3 số" description="10 bộ 3 số xuất hiện nhiều nhất." explanation="Lấy 3 số cuối của mọi giải, cộng số lần xuất hiện trong khoảng thời gian đã chọn và xếp từ cao xuống thấp."><div className="event-list">{(data.frequencyThreeDigits || []).slice(0, 10).map((item) => <span key={`three${item.number}`}>Lô <b>{item.number}</b> · <b>{item.frequency} lần</b></span>)}</div></SummaryColumn></div></article></div>
    <div className="stats-panel-heading"><div><p className="eyebrow">THỐNG KÊ MỞ RỘNG</p><h2>Nhìn nhanh dữ liệu toàn bộ kỳ quay</h2></div><span>{analysis.drawCount.toLocaleString('vi-VN')} kỳ đã phân tích</span></div>
    <NumberQueryPanel request={request} />
    <div className="stats-card-grid"><GapCard title="Đầu: số kỳ liên tiếp chưa xuất hiện" items={analysis.missHeads} kind="head" /><GapCard title="Đuôi: số kỳ liên tiếp chưa xuất hiện" items={analysis.missTails} kind="tail" /></div>
  </section>;
}
