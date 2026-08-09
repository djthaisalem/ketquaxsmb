import { useEffect, useMemo, useState } from 'react';
import DateInput from './DateInput';
import './balanced-distinct-backtest.css';
import './balanced-distinct-progress.css';

const formatDate = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('vi-VN') : '—';
const percent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;
const methodOptions = [
  { key: 'all', label: 'Cả 3 phương pháp' },
  { key: 'balanced-distinct', label: 'Balanced Distinct — 2 cặp' },
  { key: 'gan-top-2', label: 'Lô gan — 2 số vắng lâu nhất' },
  { key: 'roi-3-ky', label: 'Lô rơi 3 kỳ — tối đa 2 số' },
];

function PredictionCell({ row }) {
  if (row.selectionType === 'pairs') return row.selections.map((selection) => <span className="cms-balanced-pair" key={selection.pair.join('-')}>
    <b>{selection.pair.join('–')}</b>
    <small>Combo {selection.combo.join('·')} · mẫu {selection.wins}/{selection.samples}</small>
  </span>);
  return row.predictions.map((prediction) => <span className="cms-balanced-pair cms-balanced-number" key={prediction.number}>
    <b>{prediction.number}</b>
    <small>{Number.isFinite(prediction.gap) ? `Vắng ${prediction.gap} kỳ` : 'Về trong cả 3 kỳ trước'}</small>
  </span>);
}

function DayCell({ result, late = false }) {
  const className = result.hit ? (late ? 'late-hit' : 'hit') : '';
  return <td className={className}>
    {result.available ? result.hit ? `✓ ${result.matches.join(', ')}` : '—' : 'Chờ kết quả'}
    <small>{formatDate(result.date)}</small>
  </td>;
}

export default function BalancedDistinctBacktest({ token, maxDate }) {
  const [range, setRange] = useState({ from: '2026-01-01', to: maxDate || new Date().toISOString().slice(0, 10) });
  const [report, setReport] = useState(null);
  const [selectedMethodKey, setSelectedMethodKey] = useState('all');
  const [activeMethodKey, setActiveMethodKey] = useState('balanced-distinct');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState({ completed: 0, total: 0, date: null });
  const [page, setPage] = useState(1);
  const pageSize = 31;

  useEffect(() => {
    if (maxDate && range.to > maxDate) setRange((current) => ({ ...current, to: maxDate }));
  }, [maxDate, range.to]);

  const methods = report?.methods || [];
  const visibleMethods = selectedMethodKey === 'all' ? methods : methods.filter((method) => method.key === selectedMethodKey);
  const activeMethod = visibleMethods.find((method) => method.key === activeMethodKey) || visibleMethods[0] || null;
  const visibleRows = useMemo(() => activeMethod?.rows?.slice((page - 1) * pageSize, page * pageSize) || [], [activeMethod, page]);
  const totalPages = Math.max(1, Math.ceil((activeMethod?.rows?.length || 0) / pageSize));

  function chooseMethod(key) {
    setActiveMethodKey(key);
    setPage(1);
  }

  async function run(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setProgress({ completed: 0, total: 0, date: null });
    try {
      const response = await fetch('/api/admin/research-backtest/balanced-distinct/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(range),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Không thể chạy backtest.');
      let job = payload.job;
      while (job?.status === 'running') {
        setProgress(job.progress || { completed: 0, total: 0, date: null });
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const statusResponse = await fetch(`/api/admin/research-backtest/balanced-distinct/jobs/${job.id}`, { headers: { Authorization: `Bearer ${token}` } });
        const statusPayload = await statusResponse.json();
        if (!statusResponse.ok) throw new Error(statusPayload.error || 'Không thể đọc tiến độ backtest.');
        job = statusPayload.job;
      }
      if (job?.status === 'error') throw new Error(job.error || 'Backtest đã dừng do lỗi.');
      if (!job?.report) throw new Error('Backtest hoàn tất nhưng không có báo cáo.');
      setReport(job.report);
      setActiveMethodKey(selectedMethodKey === 'all' ? (job.report.methods?.[0]?.key || 'balanced-distinct') : selectedMethodKey);
      setPage(1);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  return <section className="cms-balanced-backtest">
    <section className="cms-panel cms-balanced-filter">
      <div><p className="cms-kicker">BACKTEST WALK-FORWARD · CHỈ LOCAL</p><h2>So sánh 3 phương pháp</h2><p className="cms-muted">Một khoảng ngày dùng chung; mỗi kỳ đều khóa số trước khi đối chiếu D+1 và D+2.</p></div>
      <form className="cms-inline-form" onSubmit={run}>
        <label>Từ ngày<DateInput min="2005-01-01" max={range.to} value={range.from} onChange={(from) => setRange({ ...range, from })} /></label>
        <label>Đến ngày<DateInput min={range.from} max={maxDate} value={range.to} onChange={(to) => setRange({ ...range, to })} /></label>
        <label>Phương pháp<select value={selectedMethodKey} onChange={(event) => {
          const key = event.target.value;
          setSelectedMethodKey(key);
          setActiveMethodKey(key === 'all' ? 'balanced-distinct' : key);
          setPage(1);
        }}>{methodOptions.map((method) => <option value={method.key} key={method.key}>{method.label}</option>)}</select></label>
        <button disabled={loading}>{loading ? 'Đang kiểm tra…' : 'Chạy backtest'}</button>
      </form>
      {loading && <div className="cms-balanced-running"><span>Đang chạy tuần tự từng ngày và đối chiếu dữ liệu ngoài mẫu.</span><b>{progress.total ? `${progress.completed}/${progress.total} kỳ · ${Math.round((progress.completed / progress.total) * 100)}%` : 'Đang chuẩn bị dữ liệu…'}</b>{progress.total ? <i style={{ width: `${Math.round((progress.completed / progress.total) * 100)}%` }} /> : null}</div>}
      {message && <p className="cms-balanced-error">{message}</p>}
    </section>

    {activeMethod && <>
      <nav className="cms-balanced-method-tabs" aria-label="Chọn phương pháp backtest">
        {visibleMethods.map((method) => <button type="button" className={method.key === activeMethod.key ? 'active' : ''} onClick={() => chooseMethod(method.key)} key={method.key}>
          <b>{method.name}</b><small>{method.summary.evaluatedDay1} kỳ có dự đoán</small>
        </button>)}
      </nav>
      <section className="cms-panel cms-balanced-method-note"><div><p className="cms-kicker">PHƯƠNG PHÁP ĐANG XEM</p><h2>{activeMethod.name}</h2></div><p>{activeMethod.description}</p></section>

      <section className="cms-balanced-cards">
        <article><span>Số kỳ có dự đoán</span><strong>{activeMethod.summary.evaluatedDay1}</strong><small>{activeMethod.summary.pending} kỳ đang chờ</small></article>
        <article><span>Trúng ngày 1</span><strong>{activeMethod.summary.day1Wins} · {percent(activeMethod.summary.day1Rate)}</strong><small>Ưu tiên chính</small></article>
        <article><span>Chỉ trúng ngày 2</span><strong>{activeMethod.summary.day2OnlyWins} · {percent(activeMethod.summary.day2OnlyRate)}</strong><small>Đã loại kỳ trúng ngày 1</small></article>
        <article><span>Tổng trong 2 ngày</span><strong>{activeMethod.summary.combinedWins} · {percent(activeMethod.summary.combinedRate)}</strong><small>{activeMethod.summary.evaluatedTwoDays} kỳ đủ D+2</small></article>
      </section>

      <section className={`cms-balanced-verdict ${activeMethod.summary.status.key}`}>
        <div><span>Đánh giá</span><strong>{activeMethod.summary.status.label}</strong></div>
        <p>{activeMethod.summary.status.message}</p>
        <button type="button" onClick={(event) => event.currentTarget.parentElement.classList.toggle('open')}>! Giải thích cách đánh giá</button>
        <div className="cms-balanced-technical">
          <span>Baseline: <b>{percent(activeMethod.summary.baselineRate)}</b></span>
          <span>Chênh lệch ngày 1: <b>{activeMethod.summary.lift >= 0 ? '+' : ''}{percent(activeMethod.summary.lift)}</b></span>
          <span>Cận dưới 95% (ngày 1): <b>{percent(activeMethod.summary.wilsonLow)}</b></span>
          <span>Cận trên 95% (ngày 1): <b>{percent(activeMethod.summary.wilsonHigh)}</b></span>
        </div>
      </section>

      <section className="cms-panel">
        <div className="cms-panel-title"><div><p className="cms-kicker">ĐỘ ỔN ĐỊNH</p><h2>Kết quả theo tháng</h2></div></div>
        <div className="cms-table-wrap"><table className="cms-balanced-monthly"><thead><tr><th>Tháng</th><th>Số kỳ</th><th>Ngày 1</th><th>Chỉ ngày 2</th><th>Tổng 2 ngày</th><th>Baseline</th><th>Đánh giá</th></tr></thead><tbody>{activeMethod.monthly.map((item) => <tr key={item.month}><td><b>{item.month.slice(5)}/{item.month.slice(0, 4)}</b></td><td>{item.evaluatedDay1}</td><td>{item.day1Wins} · {percent(item.day1Rate)}</td><td>{item.day2OnlyWins} · {percent(item.day2OnlyRate)}</td><td>{item.combinedWins} · {percent(item.combinedRate)}</td><td>{percent(item.baselineRate)}</td><td><span className={`cms-balanced-status ${item.status.key}`}>{item.status.label}</span></td></tr>)}</tbody></table></div>
      </section>

      <section className="cms-panel">
        <div className="cms-panel-title"><div><p className="cms-kicker">CHI TIẾT TỪNG KỲ</p><h2>{activeMethod.selectionLabel} và kết quả thực tế</h2></div><span className="cms-muted">Trang {page}/{totalPages}</span></div>
        <div className="cms-table-wrap"><table className="cms-balanced-detail"><thead><tr><th>Ngày tạo số</th><th>{activeMethod.selectionLabel}</th><th>Ngày 1</th><th>Ngày 2</th><th>Tổng kết</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={row.sourceDate}><td><b>{formatDate(row.sourceDate)}</b><small>{row.selectionType === 'pairs' ? `${row.distinctValues} số khác nhau · ${row.comboCount} combo` : row.methodKey === 'gan-top-2' ? 'Xếp theo số kỳ chưa xuất hiện' : 'Tín hiệu từ 3 kỳ liền trước'}</small></td><td><PredictionCell row={row} /></td><DayCell result={row.day1} /><DayCell result={row.day2} late={!row.day1.hit} /><td><span className={`cms-balanced-status ${row.day1.hit ? 'day1' : row.day2.hit ? 'day2' : row.day1.available ? 'miss' : 'pending'}`}>{row.day1.hit ? 'Trúng ngày 1' : row.day2.hit ? 'Trúng ngày 2' : row.day1.available ? 'Trượt' : 'Đang chờ'}</span></td></tr>)}</tbody></table></div>
        <div className="cms-balanced-pagination"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)}>← Trang trước</button><button disabled={page === totalPages} onClick={() => setPage((value) => value + 1)}>Trang sau →</button></div>
      </section>
    </>}
  </section>;
}
