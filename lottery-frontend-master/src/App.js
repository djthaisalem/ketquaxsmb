import { useEffect, useMemo, useState } from 'react';
import './index.css';
import './mobile-usability.css';
import StrategyPanel from './StrategyPanel';
import StatsPanel from './StatsPanel';
import StrategyAccess from './StrategyAccess';
import DateInput from './DateInput';
import NoticePopup from './NoticePopup';
import { applySeo } from './seo';

const API_URL = '/api';
const prizeOrder = ['db', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7'];

function getHeadsAndTails(draw) {
  const groups = Array.from({ length: 10 }, (_, number) => ({ number, heads: [], tails: [] }));
  Object.values(draw?.prizes || {}).flatMap((prize) => prize.numbers).forEach((value) => {
    const loto = value.slice(-2);
    groups[Number(loto[0])].heads.push(loto);
    groups[Number(loto[1])].tails.push(loto);
  });
  return groups;
}

function formatDate(value) {
  return value ? value.split('-').reverse().join('/') : '—';
}

export default function App() {
  const [overview, setOverview] = useState(null);
  const [draw, setDraw] = useState(null);
  const [frequency, setFrequency] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [analysisFrom, setAnalysisFrom] = useState('2005-01-01');
  const [analysisTo, setAnalysisTo] = useState(new Date().toISOString().slice(0, 10));
  const [analysisPrize, setAnalysisPrize] = useState('all');
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [tripleInput, setTripleInput] = useState('');
  const [tripleWindow, setTripleWindow] = useState('3');
  const [tripleReport, setTripleReport] = useState(null);
  const [activeView, setActiveView] = useState(new URLSearchParams(window.location.search).get('tab') || 'result');

  const headTail = useMemo(() => getHeadsAndTails(draw), [draw]);
  const maxFrequency = Math.max(...frequency.map((item) => item.frequency), 1);

  function selectView(view) {
    setActiveView(view);
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('tab', view);
    window.history.replaceState(null, '', nextUrl);
    applySeo();
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, options);
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || body.error || 'Không thể tải dữ liệu.');
    }
    return response.json();
  }

  async function loadDashboard() {
    setLoading(true);
    try {
      const [nextOverview, nextFrequency, nextGaps] = await Promise.all([
        request('/lottery/dashboard'),
        request('/lottery/statistics/frequency?limit=10'),
        request('/lottery/data-gaps'),
      ]);
      setOverview(nextOverview);
      setDraw(nextOverview.latest);
      setDate(nextOverview.latest?.date || '');
      setFrequency(nextFrequency.items);
      setGaps(nextGaps.items);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function findDraw(event) {
    event.preventDefault();
    if (!date) return;
    setLoading(true);
    try {
      setDraw(await request(`/lottery/draws/${date}`));
      setMessage('');
    } catch (error) {
      setDraw(null);
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAnalysis(event) {
    event?.preventDefault();
    setAnalysisLoading(true);
    try {
      const params = new URLSearchParams({ from: analysisFrom, to: analysisTo, prize: analysisPrize });
      setAnalysis(await request(`/lottery/statistics/advanced?${params}`));
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function loadTripleReport(event) {
    event.preventDefault();
    try {
      const params = new URLSearchParams({ date, numbers: tripleInput, window: tripleWindow });
      setTripleReport(await request(`/lottery/statistics/triple-report?${params}`));
    } catch (error) { setMessage(error.message); }
  }

  // Dữ liệu tổng quan được tải một lần khi mở dashboard.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadDashboard(); loadAnalysis(); }, []);

  return (
    <div className={`app-shell view-${activeView}`}>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Loto Analytics trang chủ">
          <img className="brand-mark" src="/logo.png?v=xsmb2" alt="KetQuaXSMB" />
          <span>Loto<span>Analytics</span></span>
        </a>
      </header>

      <nav className="workspace-nav">
        <a href="/">Trang chủ</a>
        <button className={activeView === 'result' ? 'active' : ''} onClick={() => selectView('result')}>Kết quả</button>
        <button className={activeView === 'analysis' ? 'active' : ''} onClick={() => selectView('analysis')}>Thống kê</button>
        <button className={activeView === 'strategy' ? 'active' : ''} onClick={() => selectView('strategy')}>Chiến lược</button>
      </nav>

      <main id="top" className="page">
        <section className="hero">
          <div>
            <p className="eyebrow">Xổ số miền Bắc</p>
            <h1>Tra cứu nhanh, <em>đọc dữ liệu dễ.</em></h1>
            <p className="hero-copy">Kết quả từng ngày, bảng lô tô đầu–đuôi và tần suất xuất hiện được gom vào một không gian làm việc rõ ràng.</p>
          </div>
          <form className="date-search" onSubmit={findDraw}>
            <label htmlFor="draw-date">Tra cứu kỳ quay</label>
            <div>
              <DateInput id="draw-date" min="2005-01-01" value={date} onChange={setDate} />
              <button type="submit">Xem kết quả</button>
            </div>
          </form>
        </section>

        <NoticePopup message={message} type="error" onClose={() => setMessage('')} />

        <section className="metric-grid" aria-label="Tổng quan dữ liệu">
          <article><p>Kỳ quay đã lưu</p><strong>{overview?.data?.count?.toLocaleString('vi-VN') || '—'}</strong><span>Từ {formatDate(overview?.data?.first_date)}</span></article>
          <article><p>Kỳ mới nhất</p><strong>{formatDate(overview?.data?.last_date)}</strong><span>Đã đồng bộ từ nguồn Minh Ngọc</span></article>
          <article><p>Ngày cần kiểm tra</p><strong>{gaps.length}</strong><span>Trong khoảng dữ liệu đã chọn</span></article>
        </section>

        <section className="content-grid">
          <article className="panel result-panel">
            <div className="panel-heading">
              <div><p className="eyebrow">Kết quả kỳ quay</p><h2>{formatDate(draw?.date)}</h2></div>
              <span className={loading ? 'status loading' : 'status'}>{loading ? 'Đang tải' : 'Đã cập nhật'}</span>
            </div>
            {draw ? <div className="prize-list">
              {prizeOrder.map((key) => {
                const prize = draw.prizes[key];
                return prize && <div className={`prize-row ${key === 'db' ? 'special' : ''}`} key={key}>
                  <span>{prize.label}</span><div>{prize.numbers.map((number) => <b key={number}>{number}</b>)}</div>
                </div>;
              })}
            </div> : <div className="empty">Chọn một ngày để xem bảng kết quả.</div>}
          </article>

          <article className="panel loto-panel">
            <div className="panel-heading"><div><p className="eyebrow">Lô tô 2 số</p><h2>Đầu · đuôi</h2></div><span className="muted">{formatDate(draw?.date)}</span></div>
            <div className="headtail-table">
              <div className="headtail-head"><span>Đầu</span><span>Về</span><span>Về</span><span>Đuôi</span></div>
              {headTail.map((group) => <div className="headtail-row" key={group.number}><b>{group.number}</b><span>{group.heads.join(', ') || '—'}</span><span>{group.tails.join(', ') || '—'}</span><b>{group.number}</b></div>)}
            </div>
          </article>
        </section>

        <section className="bottom-grid">
          <article className="panel frequency-panel">
            <div className="panel-heading"><div><p className="eyebrow">Thống kê toàn bộ dữ liệu</p><h2>Top lô về nhiều</h2></div><span className="muted">2 số cuối của mọi giải</span></div>
            <div className="bars">{frequency.map((item, index) => <div className="bar-row" key={item.number}><span className="rank">{String(index + 1).padStart(2, '0')}</span><b>{item.number}</b><div className="bar-track"><i style={{ width: `${(item.frequency / maxFrequency) * 100}%` }} /></div><strong>{item.frequency}</strong></div>)}</div>
          </article>
          <article className="panel quality-panel">
            <p className="eyebrow">Chất lượng dữ liệu</p><h2>{gaps.length ? 'Có ngày chưa có dữ liệu' : 'Dữ liệu đang liền mạch'}</h2>
            <p>{gaps.length ? `Có ${gaps.length} ngày cần crawl lại. Các ngày gần nhất được liệt kê bên dưới.` : 'Không phát hiện ngày trống trong phạm vi dữ liệu hiện có.'}</p>
            {gaps.length > 0 && <div className="gap-tags">{gaps.slice(0, 6).map((gap) => <span key={gap.date}>{formatDate(gap.date)}</span>)}</div>}
            <button className="outline-button" onClick={loadDashboard}>Làm mới dữ liệu</button>
          </article>
        </section>

        <StatsPanel analysis={analysis} request={request} />
        <section className="analysis-section" id="analysis">
          {activeView === 'strategy' ? <StrategyAccess><StrategyPanel date={date} onDateChange={setDate} request={request} onError={setMessage} /></StrategyAccess> : <StrategyPanel date={date} onDateChange={setDate} request={request} onError={setMessage} />}
          <div className="analysis-intro"><p className="eyebrow">Bộ công thức nâng cao</p><h2>Phân tích theo khoảng ngày</h2><p>Chọn khoảng dữ liệu và nhóm giải. Kết quả được tính lại từ toàn bộ kỳ quay trong PostgreSQL.</p></div>
          <form className="analysis-filter" onSubmit={loadAnalysis}>
            <label>Từ ngày<DateInput value={analysisFrom} onChange={setAnalysisFrom} /></label>
            <label>Đến ngày<DateInput value={analysisTo} onChange={setAnalysisTo} /></label>
            <label>Nhóm giải<select value={analysisPrize} onChange={(event) => setAnalysisPrize(event.target.value)}><option value="all">Tất cả giải</option><option value="db">Đặc biệt</option><option value="g1">Giải nhất</option><option value="g2">Giải nhì</option><option value="g3">Giải ba</option><option value="g4">Giải tư</option><option value="g5">Giải năm</option><option value="g6">Giải sáu</option><option value="g7">Giải bảy</option></select></label>
            <button type="submit">{analysisLoading ? 'Đang tính…' : 'Cập nhật thống kê'}</button>
          </form>
          {analysis && <>
            <p className="analysis-summary">Đã phân tích <b>{analysis.drawCount.toLocaleString('vi-VN')}</b> kỳ quay · {formatDate(analysis.from)} → {formatDate(analysis.to)}</p>
            <div className="analysis-grid">
              <article className="panel analysis-card"><h3>Tần suất lô</h3><p>30 lô có số lần xuất hiện cao nhất.</p><div className="number-chips">{analysis.frequency.slice(0, 15).map((item) => <span key={item.number}><b>{item.number}</b>{item.frequency}</span>)}</div></article>
              <article className="panel analysis-card"><h3>Về kép / về ba</h3><p>Một lô xuất hiện từ 2 hoặc 3 lần trong cùng kỳ.</p><div className="event-list">{analysis.doubles.slice(0, 6).map((item) => <span key={`d${item.date}${item.number}`}>{formatDate(item.date)} · <b>{item.number}</b> ×{item.frequency}</span>)}{analysis.triples.slice(0, 4).map((item) => <span className="triple" key={`t${item.date}${item.number}`}>{formatDate(item.date)} · <b>{item.number}</b> ×{item.frequency}</span>)}</div></article>
              <article className="panel analysis-card"><h3>Gan đầu</h3><p>Số kỳ liên tiếp mỗi đầu chưa xuất hiện.</p><div className="gap-grid">{analysis.missHeads.map((item) => <span key={item.digit}><b>{item.digit}</b><em>{item.currentMiss} kỳ</em><small>max {item.longestMiss}</small></span>)}</div></article>
              <article className="panel analysis-card"><h3>Gan đuôi</h3><p>Số kỳ liên tiếp mỗi đuôi chưa xuất hiện.</p><div className="gap-grid">{analysis.missTails.map((item) => <span key={item.digit}><b>{item.digit}</b><em>{item.currentMiss} kỳ</em><small>max {item.longestMiss}</small></span>)}</div></article>
              <article className="panel analysis-card wide"><h3>Tổ hợp 2 số / 3 số</h3><p>Tạo từ 12 lô có tần suất cao nhất; tổng = tổng tần suất từng lô trong tổ hợp.</p><div className="combo-columns"><div><strong>2 số</strong>{analysis.pairs.slice(0, 8).map((item) => <span key={item.numbers.join()}>{item.numbers.join(' · ')} <b>{item.frequency}</b></span>)}</div><div><strong>3 số</strong>{analysis.triplesCombination.slice(0, 8).map((item) => <span key={item.numbers.join()}>{item.numbers.join(' · ')} <b>{item.frequency}</b></span>)}</div></div></article>
            </div>
          </>}
          <article className="panel triple-panel"><h3>Tín hiệu bộ ba & 50 cặp</h3><p>Nhập ba lô của ngày đang chọn, ví dụ <b>00,01,02</b>. Một cặp được tính “về” nếu xuất hiện ít nhất một lần trong khung.</p><form onSubmit={loadTripleReport}><input value={tripleInput} onChange={(event) => setTripleInput(event.target.value)} placeholder="00,01,02" /><select value={tripleWindow} onChange={(event) => setTripleWindow(event.target.value)}><option value="2">Khung 2 ngày</option><option value="3">Khung 3 ngày</option></select><button>Phân tích 50 cặp</button></form>{tripleReport && <><p>{tripleReport.signals} tín hiệu lịch sử</p><div className="triple-results">{tripleReport.items.slice(0, 12).map((item) => <span key={item.numbers.join()}><b>{item.numbers.join('–')}</b> {item.wins} về / {item.misses} trượt · {item.rate}%</span>)}</div></>}</article>
        </section>
      </main>
    </div>
  );
}
