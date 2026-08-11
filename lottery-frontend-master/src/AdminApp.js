import { useEffect, useMemo, useState } from 'react';
import DateInput from './DateInput';
import './admin.css';
import './admin-features.css';
import './admin-user-plans.css';
import './admin-user-actions.css';
import './admin-payments.css';
import './admin-notifications.css';
import './admin-vip-results.css';
import './admin-research-backtest.css';
import NoticePopup from './NoticePopup';
import BalancedDistinctBacktest from './BalancedDistinctBacktest';

const API = '/api/admin';
const menu = [
  ['overview', 'Tổng quan', 'Theo dõi dữ liệu và vận hành'],
  ['api', 'Quản lý API', 'Nguồn dữ liệu và lịch quét'],
  ['payments', 'Cổng thanh toán', 'Thiết lập phương thức nạp gói'],
  ['notifications', 'Thông báo', 'Yêu cầu nạp gói và Telegram'],
  ['users', 'Quản lý User', 'Tài khoản và quyền truy cập'],
  ['plans', 'Gói thành viên', 'Gói miễn phí và VIP'],
  ['vip-results', 'Kết quả VIP', 'Đối chiếu kết quả VIP theo ngày'],
  ['research', 'Backtest nội bộ', 'Kiểm chứng mẫu số trước khi đưa vào VIP'],
  ['database', 'Database kết quả', 'Tra cứu kết quả đã lưu'],
];
const formatDate = (value) => value ? new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('vi-VN') : '—';
const formatMoney = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))}đ`;
const crawlerTime = (value) => String(value || '').match(/^([01]\d|2[0-3]):[0-5]\d$/)?.[0] || '19:00';

const PLAN_FEATURES = [
  { group: 'Tính toán thường', label: 'Thường · 2 số · khung 1 ngày' },
  { group: 'Tính toán thường', label: 'Thường · 2 số · khung 2 ngày' },
  { group: 'Tính toán thường', label: 'Thường · 2 số · khung 3 ngày' },
  { group: 'Tính toán thường', label: 'Thường · 3 số · khung 1 ngày' },
  { group: 'Tính toán thường', label: 'Thường · 3 số · khung 2 ngày' },
  { group: 'Tính toán thường', label: 'Thường · 3 số · khung 3 ngày' },
  { group: 'Quyền Lợi VIP 1', label: 'VIP 1 · 2 số · khung 1 ngày' },
  { group: 'Quyền Lợi VIP 1', label: 'VIP 1 · 2 số · khung 2 ngày' },
  { group: 'Quyền Lợi VIP 1', label: 'VIP 1 · 2 số · khung 3 ngày' },
  { group: 'Quyền Lợi VIP 1', label: 'VIP 1 · 3 số · khung 1 ngày' },
  { group: 'Quyền Lợi VIP 1', label: 'VIP 1 · 3 số · khung 2 ngày' },
  { group: 'Quyền Lợi VIP 1', label: 'VIP 1 · 3 số · khung 3 ngày' },
  { group: 'Quyền Lợi VIP 2', label: 'VIP 2 · 2 số · khung 1 ngày' },
  { group: 'Quyền Lợi VIP 2', label: 'VIP 2 · 2 số · khung 2 ngày' },
  { group: 'Quyền Lợi VIP 2', label: 'VIP 2 · 2 số · khung 3 ngày' },
  { group: 'Quyền Lợi VIP 2', label: 'VIP 2 · 3 số · khung 1 ngày' },
  { group: 'Quyền Lợi VIP 2', label: 'VIP 2 · 3 số · khung 2 ngày' },
  { group: 'Quyền Lợi VIP 2', label: 'VIP 2 · 3 số · khung 3 ngày' },
];

async function request(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'Không thể tải dữ liệu CMS.');
  return body;
}

function Card({ label, value, note }) {
  return <article className="cms-stat"><span>{label}</span><strong>{value ?? '—'}</strong>{note && <small>{note}</small>}</article>;
}

function VipResults({ data, range, onRangeChange, onLoad }) {
  const labels = { vip1: 'VIP 1 · Tối ưu Win Rate', vip2: 'VIP 2 · Tối ưu Mẫu' };
  const totals = (item) => ({
    matched: item.matchedCount ?? item.matched?.length ?? 0,
    predicted: item.totalPredicted ?? item.predicted?.length ?? 0,
  });
  return <><section className="cms-panel cms-form-panel"><div><p className="cms-kicker">KẾT QUẢ VIP ĐÃ VỀ</p><h2>Đối chiếu theo lịch sử</h2><p className="cms-muted">Chỉ hiển thị các lựa chọn VIP đã xuất hiện trong khung ngày được chọn.</p></div><form className="cms-inline-form cms-vip-results-filter" onSubmit={(event) => { event.preventDefault(); onLoad(); }}><label>Từ ngày<DateInput min="2026-01-01" value={range.from} onChange={(value) => onRangeChange({ ...range, from: value })} /></label><label>Đến ngày<DateInput min={range.from} value={range.to} onChange={(value) => onRangeChange({ ...range, to: value })} /></label><label>Khung<select value={range.window} onChange={(event) => onRangeChange({ ...range, window: event.target.value })}><option value="1">1 ngày</option><option value="2">2 ngày</option><option value="3">3 ngày</option></select></label><label>Kiểu số<select value={range.numberSize} onChange={(event) => onRangeChange({ ...range, numberSize: event.target.value })}><option value="2">Lô 2 số</option><option value="3">Lô 3 số</option></select></label><button>Tải kết quả VIP</button></form></section><section className="cms-vip-result-grid">{data?.days?.length ? data.days.map((day) => { const total = day.items.reduce((sum, item) => sum + totals(item).matched, 0); const predicted = day.items.reduce((sum, item) => sum + totals(item).predicted, 0); return <article key={day.date}><header><b>Dự báo từ {formatDate(day.date)}</b><span>{total}/{predicted || '—'} số đã về</span></header>{day.items.map((item) => { const result = totals(item); return <section key={item.vipMode}><small>{labels[item.vipMode]} · {item.numberSize} số · Khung {item.window} ngày · toàn bộ tín hiệu đã quét</small><strong>{item.numbers.join(' · ')}</strong><b className="cms-vip-hit-count">{result.matched}/{result.predicted || '—'} số đã về</b><div>{item.byDay.map((entry) => <p className={entry.hits ? 'hit' : ''} key={entry.day}>Ngày {entry.day} · {formatDate(entry.date)}: <b>{!entry.available ? 'chờ kết quả' : entry.hits ? `${entry.hits} lần` : 'chưa về'}</b>{entry.matched.length ? ` · ${entry.matched.join(' · ')}` : ''}{entry.evidence?.length ? <small> · {entry.evidence.map((proof) => `${proof.number} ← ${proof.sources.join(', ')}`).join(' | ')}</small> : null}</p>)}</div></section>; })}</article>; }) : <section className="cms-panel cms-vip-results-empty">Chưa có kết quả VIP đã về trong khoảng ngày đang chọn. Hãy chạy lệnh nạp lịch sử trước.</section>}</section></>;
}

function VipResultSourceFilter({ range, onRangeChange, onLoad }) {
  return <section className="cms-panel cms-vip-source-filter"><div><p className="cms-kicker">LỌC NGUỒN TẠO SỐ</p><h3>Chỉ xem số đã về theo công thức</h3><p className="cms-muted">Bao gồm hai đề xuất ưu tiên và bốn nguồn tạo số. Chọn một nguồn rồi tải lại để đối chiếu.</p></div><label>Nguồn tạo số<select value={range.source} onChange={(event) => onRangeChange({ ...range, source: event.target.value })}><option value="all">Tất cả nguồn tạo số</option><option value="priority-one">Ưu tiên 1 số</option><option value="priority-two">Đề xuất ưu tiên 2 số</option><option value="bac-nho">Bạc nhớ D+1</option><option value="bong-am-duong">Bóng âm – dương</option><option value="ghep-g7">Ghép giải bảy</option><option value="ghep-gdb-g4-g5">Ghép GĐB – G4 – G5</option></select></label><button onClick={onLoad}>Lọc kết quả đã về</button></section>;
}

function InternalBacktest({ report, onRefresh, loading, referenceReport, onRefreshReference, referenceLoading }) {
  const percent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;
  return <><section className="cms-panel cms-research-intro"><div><p className="cms-kicker">NGHIÊN CỨU NỘI BỘ</p><h2>Kiểm chứng mẫu số từ tài liệu</h2><p className="cms-muted">Tự chạy sau lần quét dữ liệu thành công. Chỉ đánh giá D+1 và không tự thay đổi kết quả VIP.</p></div><div><button onClick={onRefresh} disabled={loading}>{loading ? 'Đang chạy…' : 'Chạy lại backtest'}</button>{report?.generatedAt && <small className="cms-muted">Cập nhật: {new Date(report.generatedAt).toLocaleString('vi-VN')}</small>}</div></section>{report ? <><section className="cms-panel"><p className="cms-muted">Dữ liệu: {formatDate(report.sourceFrom)} — {formatDate(report.sourceThrough)} · baseline một lô 2 số: <b>{percent(report.baselineRate)}</b> · tiêu chuẩn đưa vào VIP: tối thiểu 500 mẫu, cận dưới 95% vượt baseline ở toàn lịch sử <b>và</b> 365 kỳ gần nhất.</p></section><section className="cms-research-grid">{report.methods?.map((method) => <article className="cms-panel cms-research-method" key={method.key}><span className={`cms-badge ${method.eligible ? 'active' : 'inactive'}`}>{method.eligible ? 'Đạt nghiên cứu' : 'Chưa đạt'}</span><p className="cms-kicker">MẪU KIỂM CHỨNG</p><h2>{method.name}</h2><p>{method.description}</p><div className="cms-research-metrics"><div><span>Tỷ lệ mỗi lựa chọn</span><b>{percent(method.rate)}</b></div><div><span>Cận dưới 95%</span><b>{percent(method.lowerBound)}</b></div><div><span>Thắng / mẫu</span><b>{method.wins}/{method.samples}</b></div><div><span>365 kỳ gần nhất</span><b>{percent(method.recentRate)}</b></div><div><span>Cận dưới 365 kỳ</span><b>{percent(method.recentLowerBound)}</b></div><div><span>Baseline</span><b>{percent(method.baselineRate)}</b></div></div><p className="cms-research-note">{method.note}</p></article>)}</section><section className="cms-panel cms-research-unavailable"><p className="cms-kicker">CHƯA ĐỦ CÔNG THỨC</p><h2>Không dùng để chọn số</h2><ul>{report.unavailableMethods?.map((item) => <li key={item}>{item}</li>)}</ul></section></> : <section className="cms-panel"><h2>Chưa có báo cáo</h2><p className="cms-muted">Bấm “Chạy lại backtest” để tạo báo cáo đầu tiên; sau đó hệ thống tự cập nhật sau lần quét 19h.</p></section>}<ReferenceFormulaBacktest report={referenceReport} onRefresh={onRefreshReference} loading={referenceLoading} /></>;
}

function ReferenceFormulaBacktest({ report, onRefresh, loading }) {
  const percent = (value) => `${(Number(value || 0) * 100).toFixed(1)}%`;
  return <section className="cms-research-reference"><section className="cms-panel cms-research-intro"><div><p className="cms-kicker">CÔNG THỨC THAM KHẢO</p><h2>Backtest theo ngày trong tuần và giải thưởng</h2><p className="cms-muted">Các công thức từ tài liệu mới chỉ để theo dõi. Dù kết quả thế nào, hệ thống không tự đưa chúng vào VIP 1, VIP 2 hoặc đề xuất ưu tiên.</p></div><div><button onClick={onRefresh} disabled={loading}>{loading ? 'Đang chạy…' : 'Chạy backtest công thức tham khảo'}</button>{report?.generatedAt && <small className="cms-muted">Cập nhật: {new Date(report.generatedAt).toLocaleString('vi-VN')}</small>}</div></section>{report ? <><section className="cms-panel"><p className="cms-muted">Dữ liệu: {formatDate(report.sourceFrom)} — {formatDate(report.sourceThrough)}. “Tỷ lệ theo kỳ” là khả năng dàn/công thức có ít nhất một kết quả đề trùng trong một ngày; tỷ lệ này luôn được so với baseline ghi trong từng ô.</p></section><section className="cms-research-grid">{report.methods?.map((method) => <article className="cms-panel cms-research-method" key={method.key}><span className="cms-badge inactive">Chỉ theo dõi</span><p className="cms-kicker">CÔNG THỨC TÀI LIỆU</p><h2>{method.name}</h2><p>{method.description}</p><div className="cms-research-metrics"><div><span>Tỷ lệ mỗi lựa chọn</span><b>{percent(method.rate)}</b></div><div><span>Tỷ lệ theo kỳ</span><b>{percent(method.dayRate)}</b></div><div><span>Trúng / mẫu</span><b>{method.wins}/{method.samples}</b></div><div><span>365 kỳ gần nhất</span><b>{percent(method.recentRate)}</b></div><div><span>Cận dưới 95%</span><b>{percent(method.lowerBound)}</b></div><div><span>Baseline</span><b>{percent(method.baselineRate)}</b></div></div><p className="cms-research-note">{method.note}</p></article>)}</section><section className="cms-panel cms-research-unavailable"><p className="cms-kicker">KHÔNG THỂ TÁI LẬP</p><h2>Không chạy tự động</h2><ul>{report.unavailableMethods?.map((item) => <li key={item}>{item}</li>)}</ul></section></> : <section className="cms-panel"><h2>Chưa có báo cáo công thức tham khảo</h2><p className="cms-muted">Bấm nút chạy để tạo báo cáo. Kết quả sẽ được lưu lại trong database để lần mở sau chỉ đọc dữ liệu đã có.</p></section>}</section>;
}

export default function AdminApp() {
  const [token, setToken] = useState(() => sessionStorage.getItem('xsmbCmsToken') || '');
  const [page, setPage] = useState('overview');
  const [data, setData] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ username: 'admin', password: '' });
  const [resultRange, setResultRange] = useState({ from: '2005-01-01', to: new Date().toISOString().slice(0, 10) });
  const [vipResultRange, setVipResultRange] = useState({ from: '2026-01-01', to: new Date().toISOString().slice(0, 10), window: '3', numberSize: '2', source: 'all' });
  const active = useMemo(() => menu.find(([key]) => key === page), [page]);

  async function load(target = page) {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const endpoint = target === 'overview' ? '/overview' : target === 'api' ? '/api-status' : target === 'payments' ? '/payments' : target === 'notifications' ? '/notifications' : target === 'users' ? '/users' : target === 'plans' ? '/plans' : target === 'vip-results' ? `/vip-results?from=${vipResultRange.from}&to=${vipResultRange.to}&window=${vipResultRange.window}&numberSize=${vipResultRange.numberSize}&source=${vipResultRange.source}` : target === 'research' ? '/research-backtest' : `/results?from=${resultRange.from}&to=${resultRange.to}`;
      const next = await request(endpoint, token);
      const plans = target === 'users' ? await request('/plans', token) : null;
      setData((current) => ({ ...current, [target]: next, ...(plans ? { plans } : {}) }));
    } catch (err) {
      if (/phiên quản trị/i.test(err.message)) { sessionStorage.removeItem('xsmbCmsToken'); setToken(''); }
      setError(err.message);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page]);

  async function handleLogin(event) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const result = await request('/login', '', { method: 'POST', body: JSON.stringify(credentials) });
      sessionStorage.setItem('xsmbCmsToken', result.token); setToken(result.token);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  function logout() { sessionStorage.removeItem('xsmbCmsToken'); setToken(''); setData({}); }

  async function createUser(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await request('/users', token, { method: 'POST', body: JSON.stringify({ username: form.get('username'), fullName: form.get('fullName'), role: form.get('role'), membershipPlanId: form.get('plan') || null }) });
      event.currentTarget.reset(); await load('users');
    } catch (err) { setError(err.message); }
  }
  async function updateUser(user, field, value) {
    try { await request(`/users/${user.id}`, token, { method: 'PATCH', body: JSON.stringify({ role: field === 'role' ? value : user.role, status: field === 'status' ? value : user.status, membershipPlanId: field === 'plan' ? (value || null) : user.membership_plan_id }) }); await load('users'); } catch (err) { setError(err.message); }
  }
  async function deleteUser(user) {
    if (!window.confirm(`Xoá vĩnh viễn user “${user.username}”? Hành động này không thể hoàn tác.`)) return;
    try { await request(`/users/${user.id}`, token, { method: 'DELETE' }); await load('users'); } catch (err) { setError(err.message); }
  }
  async function createPlan(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await request('/plans', token, { method: 'POST', body: JSON.stringify({ name: form.get('name'), price: Number(form.get('price')), durationDays: Number(form.get('durationDays')), features: String(form.get('features')).split(',').map((item) => item.trim()).filter(Boolean) }) });
      event.currentTarget.reset(); await load('plans');
    } catch (err) { setError(err.message); }
  }
  async function togglePlan(plan) {
    try { await request(`/plans/${plan.id}`, token, { method: 'PATCH', body: JSON.stringify({ status: plan.status === 'active' ? 'inactive' : 'active' }) }); await load('plans'); } catch (err) { setError(err.message); }
  }
  async function saveCrawler(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      setError(''); setNotice('');
      await request('/settings/crawler', token, { method: 'PUT', body: JSON.stringify({ settingValue: { source: form.get('source'), schedule: form.get('schedule'), enabled: form.get('enabled') === 'on' } }) });
      await load('api');
      setNotice('Đã lưu lịch quét. Server sẽ áp dụng giờ mới trong tối đa 1 phút.');
    } catch (err) { setError(err.message); }
  }
  async function savePayments(settings) {
    try {
      await request('/payments', token, { method: 'PUT', body: JSON.stringify({ settings }) });
      await load('payments');
    } catch (err) { setError(err.message); throw err; }
  }
  async function saveTelegram(values) {
    try {
      await request('/notifications/telegram', token, { method: 'PUT', body: JSON.stringify(values) });
      await load('notifications');
    } catch (err) { setError(err.message); throw err; }
  }
  async function resolvePaymentRequest(id, status) {
    const label = status === 'approved' ? 'xác nhận đã thanh toán và nâng gói' : 'từ chối yêu cầu';
    if (!window.confirm(`Bạn có chắc muốn ${label}?`)) return;
    try {
      await request(`/payment-requests/${id}`, token, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load('notifications');
    } catch (err) { setError(err.message); }
  }
  async function refreshResearch() {
    try {
      setLoading(true); setError('');
      const result = await request('/research-backtest/refresh', token, { method: 'POST', body: '{}' });
      setData((current) => ({ ...current, research: result }));
      setNotice('Đã cập nhật báo cáo backtest nội bộ.');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }
  async function refreshReferenceResearch() {
    try {
      setLoading(true); setError('');
      const result = await request('/research-backtest/reference/refresh', token, { method: 'POST', body: '{}' });
      setData((current) => ({ ...current, research: { ...(current.research || {}), referenceReport: result.report } }));
      setNotice('Đã cập nhật backtest công thức tham khảo. Các công thức này chưa tác động VIP.');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  if (!token) return <main className="cms-login-page"><NoticePopup message={error} type="error" onClose={() => setError('')} /><section className="cms-login-card"><a className="cms-login-brand" href="/">Kết quả <b>XSMB</b><span>CMS</span></a><p className="cms-kicker">KHU VỰC QUẢN TRỊ</p><h1>Đăng nhập quản trị</h1><p>Quản lý vận hành ketquaxsmb.online.</p><form onSubmit={handleLogin}><label>Tên đăng nhập<input autoComplete="username" value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} /></label><label>Mật khẩu<input type="password" autoComplete="current-password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} /></label><button disabled={loading}>{loading ? 'Đang kiểm tra…' : 'Vào CMS'}</button></form><a className="cms-back" href="/">← Quay lại website</a></section></main>;

  const content = () => {
    if (page === 'plans') return <PlanManager plans={data.plans?.plans} onCreate={createPlan} onToggle={togglePlan} onSave={async (plan, values) => {
      try {
        await request(`/plans/${plan.id}`, token, { method: 'PATCH', body: JSON.stringify({ ...values, status: plan.status }) });
        await load('plans');
      } catch (err) { setError(err.message); throw err; }
    }} />;
    if (page === 'overview') {
      const overview = data.overview;
      return <><div className="cms-stat-grid"><Card label="Kỳ quay đã lưu" value={overview?.draws.total?.toLocaleString('vi-VN')} note={`Từ ${formatDate(overview?.draws.first_date)} đến ${formatDate(overview?.draws.latest_date)}`} /><Card label="User đang hoạt động" value={overview?.users.active} note={`${overview?.users.total ?? 0} user trong CMS`} /><Card label="Gói đang mở bán" value={overview?.plans.active} note={`${overview?.plans.total ?? 0} gói đã cấu hình`} /></div><section className="cms-panel"><div className="cms-panel-title"><div><p className="cms-kicker">NHẬT KÝ QUÉT DỮ LIỆU</p><h2>Lần vận hành gần nhất</h2></div><span className="cms-badge">PostgreSQL local</span></div><div className="cms-table-wrap"><table><thead><tr><th>Nguồn</th><th>Khoảng dữ liệu</th><th>Thành công</th><th>Lỗi</th><th>Hoàn tất</th></tr></thead><tbody>{overview?.crawlRuns?.map((run, index) => <tr key={index}><td>{run.source_name}</td><td>{formatDate(run.from_date)} — {formatDate(run.to_date)}</td><td><b className="cms-success">{run.successful_days}</b> ngày</td><td>{run.failed_days}</td><td>{run.finished_at ? new Date(run.finished_at).toLocaleString('vi-VN') : 'Đang chạy'}</td></tr>) || <tr><td colSpan="5">Chưa có nhật ký.</td></tr>}</tbody></table></div></section></>;
    }
    if (page === 'api') {
      const crawlerSetting = data.api?.settings?.find((setting) => setting.setting_key === 'crawler');
      const crawler = crawlerSetting?.setting_value || {};
      return <>
        <section className="cms-service-grid">{data.api?.services?.map((service) => <article className="cms-service" key={service.name}><span className={`cms-state ${service.status}`}></span><div><b>{service.name}</b><small>{service.path}</small></div><em>{service.detail || 'Đang hoạt động'}</em></article>)}</section>
        <section className="cms-panel cms-form-panel">
          <div><p className="cms-kicker">CẤU HÌNH QUÉT</p><h2>Nguồn và lịch cập nhật</h2><p className="cms-muted">Giờ đã lưu được server đọc tự động, theo múi giờ Việt Nam.</p></div>
          <form className="cms-inline-form" key={crawlerSetting?.updated_at || 'crawler-default'} onSubmit={saveCrawler}>
            <label>Nguồn dữ liệu<input name="source" defaultValue={crawler.source || 'Minh Ngọc'} /></label>
            <label>Lịch quét<input name="schedule" type="time" defaultValue={crawlerTime(crawler.schedule)} required /></label>
            <label className="cms-checkbox"><input name="enabled" type="checkbox" defaultChecked={crawler.enabled !== false} /> Bật quét tự động</label>
            <button>Lưu cấu hình</button>
          </form>
        </section>
      </>;
    }
    if (page === 'payments') return <PaymentSettings settings={data.payments?.settings} updatedAt={data.payments?.updatedAt} onSave={savePayments} />;
    if (page === 'notifications') return <NotificationCenter data={data.notifications} onSaveTelegram={saveTelegram} onResolve={resolvePaymentRequest} />;
    if (page === 'vip-results') return <><VipResultSourceFilter range={vipResultRange} onRangeChange={setVipResultRange} onLoad={() => load('vip-results')} /><VipResults data={data['vip-results']} range={vipResultRange} onRangeChange={setVipResultRange} onLoad={() => load('vip-results')} /></>;
    if (page === 'research') return <><BalancedDistinctBacktest token={token} maxDate={data.research?.report?.sourceThrough} /><InternalBacktest report={data.research?.report} onRefresh={refreshResearch} loading={loading} referenceReport={data.research?.referenceReport} onRefreshReference={refreshReferenceResearch} referenceLoading={loading} /></>;
    if (page === 'users') return <><section className="cms-panel cms-form-panel"><div><p className="cms-kicker">THÊM TÀI KHOẢN</p><h2>Tạo user mới</h2></div><form className="cms-inline-form cms-user-form" onSubmit={createUser}><label>Tên đăng nhập<input name="username" required placeholder="vd: thanhnguyen" /></label><label>Họ tên<input name="fullName" placeholder="Không bắt buộc" /></label><label>Vai trò<select name="role"><option value="member">Member</option><option value="admin">Admin</option></select></label><label>Gói<select name="plan"><option value="">Chưa có gói</option>{data.plans?.plans?.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}</select></label><button>Tạo user</button></form></section><UserTable users={data.users?.users} plans={data.plans?.plans} onUpdate={updateUser} onDelete={deleteUser} /></>;
    if (page === 'plans') return <><section className="cms-plan-grid">{data.plans?.plans?.map((plan) => <article className="cms-plan" key={plan.id}><div><span className={`cms-badge ${plan.status}`}>{plan.status === 'active' ? 'Đang mở' : 'Tạm ẩn'}</span><h2>{plan.name}</h2><strong>{formatMoney(plan.price)}</strong><small>{plan.duration_days} ngày</small></div><ul>{plan.features?.map((feature) => <li key={feature}>{feature}</li>)}</ul><button className="cms-text-button" onClick={() => togglePlan(plan)}>{plan.status === 'active' ? 'Tạm ẩn gói' : 'Mở lại gói'}</button></article>)}</section><section className="cms-panel cms-form-panel"><div><p className="cms-kicker">GÓI MỚI</p><h2>Thêm gói thành viên</h2></div><form className="cms-inline-form" onSubmit={createPlan}><label>Tên gói<input name="name" required /></label><label>Giá (VNĐ)<input name="price" type="number" min="0" required /></label><label>Số ngày<input name="durationDays" type="number" min="1" required /></label><label>Tính năng<input name="features" placeholder="Cách nhau bằng dấu phẩy" /></label><button>Tạo gói</button></form></section></>;
    return <><section className="cms-panel cms-form-panel"><div><p className="cms-kicker">POSTGRESQL</p><h2>Tra cứu kết quả đã lưu</h2><p className="cms-muted">Hiển thị giải đặc biệt để kiểm tra nhanh dữ liệu kỳ quay.</p></div><form className="cms-inline-form cms-results-filter" onSubmit={(event) => { event.preventDefault(); load('database'); }}><label>Từ ngày<DateInput value={resultRange.from} onChange={(value) => setResultRange({ ...resultRange, from: value })} /></label><label>Đến ngày<DateInput value={resultRange.to} onChange={(value) => setResultRange({ ...resultRange, to: value })} /></label><button>Tải kết quả</button></form></section><section className="cms-panel"><div className="cms-panel-title"><div><p className="cms-kicker">KẾT QUẢ XSMB</p><h2>{data.database?.total?.toLocaleString('vi-VN') || 0} kỳ trong khoảng chọn</h2></div></div><div className="cms-table-wrap"><table><thead><tr><th>Ngày quay</th><th>Giải đặc biệt</th><th>Thời gian lưu</th></tr></thead><tbody>{data.database?.results?.map((row) => <tr key={row.draw_date}><td><b>{formatDate(row.draw_date)}</b></td><td className="cms-special">{row.special_prize?.join(' · ')}</td><td>{new Date(row.crawled_at).toLocaleString('vi-VN')}</td></tr>) || <tr><td colSpan="3">Đang tải dữ liệu…</td></tr>}</tbody></table></div></section></>;
  };

  return <div className="cms-app"><NoticePopup message={error || notice} type={error ? 'error' : 'success'} onClose={() => { setError(''); setNotice(''); }} /><header className="cms-topbar"><a href="/" className="cms-site-link">← Website</a><div><span className="cms-kicker">KEQUAXSMB.ONLINE</span><strong>Control room</strong></div><button className="cms-logout" onClick={logout}>Đăng xuất</button></header><div className="cms-layout"><aside className="cms-sidebar"><a className="cms-brand" href="/admin"><span>KS</span><b>Kết quả <em>XSMB</em></b></a><p className="cms-sidebar-label">QUẢN TRỊ HỆ THỐNG</p><nav>{menu.map(([key, label]) => <button className={page === key ? 'active' : ''} key={key} onClick={() => setPage(key)}>{label}</button>)}</nav><div className="cms-sidebar-note"><b>PostgreSQL</b><span>Đang kết nối dữ liệu XSMB local.</span></div></aside><main className="cms-workspace"><div className="cms-heading"><div><p className="cms-kicker">CMS WORKSPACE</p><h1>{active?.[1]}</h1><p>{active?.[2]}</p></div>{loading && <span className="cms-loading">Đang cập nhật…</span>}</div>{content()}</main></div></div>;
}

const DEFAULT_PAYMENT_SETTINGS = {
  vietqr: { enabled: false, bankCode: '', accountNumber: '', accountName: '', transferContent: '' },
  momo: { enabled: false, partnerCode: '', endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create' },
  zalopay: { enabled: false, appId: '', endpoint: 'https://sb-openapi.zalopay.vn/v2/create' },
  viettelpay: { enabled: false, merchantCode: '', endpoint: '' },
};

const PAYMENT_GATEWAYS = [
  { key: 'vietqr', name: 'Chuyển khoản ngân hàng · VietQR', description: 'Hiện mã thanh toán qua ngân hàng trên trang nạp gói.', fields: [['bankCode', 'Mã ngân hàng', 'VD: VCB'], ['accountNumber', 'Số tài khoản', ''], ['accountName', 'Tên chủ tài khoản', ''], ['transferContent', 'Nội dung chuyển khoản', 'VD: XSMB {username}']] },
  { key: 'momo', name: 'MoMo', description: 'Sẵn sàng lưu định danh đối tác; khóa bí mật sẽ cấu hình bằng biến môi trường khi tích hợp API thật.', fields: [['partnerCode', 'Partner code', ''], ['endpoint', 'API endpoint', '']] },
  { key: 'zalopay', name: 'ZaloPay', description: 'Sẵn sàng lưu App ID và endpoint sandbox/production.', fields: [['appId', 'App ID', ''], ['endpoint', 'API endpoint', '']] },
  { key: 'viettelpay', name: 'Viettel Money', description: 'Sẵn sàng lưu mã merchant và endpoint tích hợp.', fields: [['merchantCode', 'Merchant code', ''], ['endpoint', 'API endpoint', '']] },
];

function PaymentSettings({ settings, updatedAt, onSave }) {
  const [form, setForm] = useState(DEFAULT_PAYMENT_SETTINGS);
  const [saving, setSaving] = useState(false);
  useEffect(() => setForm(Object.fromEntries(Object.keys(DEFAULT_PAYMENT_SETTINGS).map((key) => [key, { ...DEFAULT_PAYMENT_SETTINGS[key], ...(settings?.[key] || {}) }]))), [settings]);
  const change = (gateway, field, value) => setForm((current) => ({ ...current, [gateway]: { ...current[gateway], [field]: value } }));
  async function submit(event) {
    event.preventDefault(); setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  }
  return <form className="cms-payment-form" onSubmit={submit}><section className="cms-panel cms-payment-intro"><div><p className="cms-kicker">THIẾT LẬP CỔNG</p><h2>Phương thức thanh toán</h2><p className="cms-muted">Bật phương thức sau khi đã có thông tin merchant. Cấu hình này mới chuẩn bị luồng nạp gói, chưa tự tạo giao dịch hoặc tự kích hoạt thành viên.</p></div>{updatedAt && <small>Cập nhật: {new Date(updatedAt).toLocaleString('vi-VN')}</small>}</section><div className="cms-payment-grid">{PAYMENT_GATEWAYS.map((gateway) => <section className="cms-panel cms-payment-card" key={gateway.key}><header><div><p className="cms-kicker">CỔNG THANH TOÁN</p><h2>{gateway.name}</h2></div><label className="cms-gateway-toggle"><input type="checkbox" checked={form[gateway.key].enabled} onChange={(event) => change(gateway.key, 'enabled', event.target.checked)} /><span>{form[gateway.key].enabled ? 'Đang bật' : 'Chưa bật'}</span></label></header><p className="cms-muted">{gateway.description}</p><div className="cms-payment-fields">{gateway.fields.map(([field, label, placeholder]) => <label key={field}>{label}<input value={form[gateway.key][field]} placeholder={placeholder} onChange={(event) => change(gateway.key, field, event.target.value)} /></label>)}</div></section>)}</div><div className="cms-payment-actions"><button disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu cấu hình cổng thanh toán'}</button></div></form>;
}

function NotificationCenter({ data, onSaveTelegram, onResolve }) {
  const [telegram, setTelegram] = useState({ token: '', chatId: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => setTelegram({ token: '', chatId: data?.telegram?.chatId || '' }), [data?.telegram?.chatId]);
  async function save(event) { event.preventDefault(); setSaving(true); try { await onSaveTelegram(telegram); } finally { setSaving(false); } }
  const method = { vietqr: 'VietQR', momo: 'MoMo', zalopay: 'ZaloPay', viettelpay: 'Viettel Money' };
  return <><section className="cms-panel cms-telegram-panel"><div><p className="cms-kicker">THÔNG BÁO TELEGRAM</p><h2>Nhận yêu cầu nạp gói</h2><p className="cms-muted">Bot token được lưu vào file .env trên server và không hiển thị lại trên CMS.</p></div><form onSubmit={save}><label>Bot token<input type="password" value={telegram.token} placeholder={data?.telegram?.tokenConfigured ? 'Đã lưu token — để trống nếu không đổi' : '123456:ABC-DEF…'} onChange={(event) => setTelegram({ ...telegram, token: event.target.value })} /></label><label>Chat ID / tên channel<input value={telegram.chatId} placeholder="VD: -1001234567890 hoặc @kequaxsmb" onChange={(event) => setTelegram({ ...telegram, chatId: event.target.value })} required /></label><button disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu Telegram'}</button></form></section><section className="cms-panel"><div className="cms-panel-title"><div><p className="cms-kicker">YÊU CẦU THANH TOÁN</p><h2>{data?.requests?.filter((item) => item.status === 'pending').length || 0} yêu cầu chờ xử lý</h2></div></div><div className="cms-table-wrap"><table><thead><tr><th>Mã giao dịch</th><th>Thành viên</th><th>Gói</th><th>Phương thức</th><th>Số tiền</th><th>Thời điểm</th><th>Trạng thái</th><th>Xử lý</th></tr></thead><tbody>{data?.requests?.map((item) => <tr key={item.id}><td><b className="cms-special">{item.transaction_code || '—'}</b></td><td><b>{item.username}</b><small>{item.email || '—'}</small></td><td>{item.plan_name}</td><td>{method[item.payment_method] || item.payment_method}</td><td>{formatMoney(item.amount)}</td><td>{new Date(item.created_at).toLocaleString('vi-VN')}</td><td><span className={`cms-badge ${item.status === 'pending' ? '' : item.status === 'rejected' ? 'inactive' : ''}`}>{item.status === 'pending' ? 'Chờ xác nhận' : item.status === 'approved' ? 'Đã duyệt' : 'Đã từ chối'}</span></td><td>{item.status === 'pending' ? <div className="cms-payment-request-actions"><button onClick={() => onResolve(item.id, 'approved')}>Xác nhận</button><button onClick={() => onResolve(item.id, 'rejected')}>Từ chối</button></div> : '—'}</td></tr>) || <tr><td colSpan="8">Chưa có yêu cầu thanh toán.</td></tr>}</tbody></table></div></section></>;
}

function UserTable({ users, plans, onUpdate, onDelete }) {
  return <section className="cms-panel"><div className="cms-panel-title"><div><p className="cms-kicker">DANH SÁCH USER</p><h2>{users?.length || 0} tài khoản</h2></div></div><div className="cms-table-wrap"><table><thead><tr><th>User</th><th>Vai trò</th><th>Gói thành viên</th><th>Trạng thái</th><th>Thao tác</th><th>Ngày tạo</th></tr></thead><tbody>{users?.map((user) => <tr key={user.id}><td><b>{user.username}</b><small>{user.full_name || '—'}</small></td><td><select value={user.role} onChange={(event) => onUpdate(user, 'role', event.target.value)}><option value="member">Member</option><option value="admin">Admin</option></select></td><td><MembershipPlanEditor user={user} plans={plans} onSave={onUpdate} /></td><td><button className={`cms-status ${user.status}`} onClick={() => onUpdate(user, 'status', user.status === 'active' ? 'inactive' : 'active')}>{user.status === 'active' ? 'Đang hoạt động' : 'Đình chỉ'}</button></td><td>{user.role === 'member' ? <button className="cms-delete-user" onClick={() => onDelete(user)}>Xoá user</button> : <small>Admin được bảo vệ</small>}</td><td>{formatDate(user.created_at)}</td></tr>) || <tr><td colSpan="6">Đang tải user…</td></tr>}</tbody></table></div></section>;
}

function MembershipPlanEditor({ user, plans, onSave }) {
  const [planId, setPlanId] = useState(String(user.membership_plan_id || ''));
  useEffect(() => setPlanId(String(user.membership_plan_id || '')), [user.membership_plan_id]);
  const changed = planId !== String(user.membership_plan_id || '');
  return <div className="cms-plan-editor"><select value={planId} onChange={(event) => setPlanId(event.target.value)}><option value="">Chưa cấp gói</option>{plans?.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {formatMoney(plan.price)}</option>)}</select><button className="cms-save-plan" disabled={!changed} onClick={() => onSave(user, 'plan', planId)}>Lưu gói</button><small>{user.membership_plan_name ? 'Gói hiện tại có thể thay đổi.' : 'Chọn gói rồi bấm Lưu gói.'}</small></div>;
}

function PlanManager({ plans, onCreate, onToggle, onSave }) {
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [enabledFeatures, setEnabledFeatures] = useState([]);

  function openEdit(plan) {
    const existing = (plan.features || []).map((feature) => feature.replace(/^VIP ·/, 'VIP 1 ·')).filter((feature) => PLAN_FEATURES.some((item) => item.label === feature));
    const fallback = plan.id === 1 ? PLAN_FEATURES.slice(0, 3) : plan.id === 2 ? PLAN_FEATURES.slice(0, 6) : PLAN_FEATURES;
    setEnabledFeatures(existing.length ? existing : fallback.map((item) => item.label));
    setEditing(plan);
  }

  async function submitEdit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    try {
      await onSave(editing, {
        name: form.get('name'),
        price: Number(form.get('price')),
        durationDays: Number(form.get('durationDays')),
        features: enabledFeatures,
      });
      setEditing(null);
    } finally { setSaving(false); }
  }

  return <>
    <section className="cms-plan-grid">{plans?.map((plan) => <article className="cms-plan" key={plan.id}><div><span className={`cms-badge ${plan.status}`}>{plan.status === 'active' ? 'Đang hiển thị' : 'Tạm ẩn'}</span><h2>{plan.name}</h2><strong>{formatMoney(plan.price)}</strong><small>{plan.duration_days} ngày</small></div><ul>{plan.features?.map((feature) => <li key={feature}>{feature}</li>)}</ul><div className="cms-plan-actions"><button className="cms-text-button" onClick={() => openEdit(plan)}>Sửa gói</button><button className="cms-text-button" onClick={() => onToggle(plan)}>{plan.status === 'active' ? 'Ẩn ngoài site' : 'Hiển thị ngoài site'}</button></div></article>)}</section>
    {editing && <section className="cms-panel cms-edit-panel"><div><p className="cms-kicker">CHỈNH SỬA GÓI</p><h2>{editing.name}</h2><p className="cms-muted">Chọn các chức năng được mở trong gói. Lưu xong, thông tin sẽ xuất hiện ngay tại trang chủ.</p></div><form className="cms-edit-plan-form" onSubmit={submitEdit}><div className="cms-edit-fields"><label>Tên gói<input name="name" required defaultValue={editing.name} /></label><label>Giá (VNĐ)<input name="price" type="number" min="0" required defaultValue={editing.price} /></label><label>Số ngày<input name="durationDays" type="number" min="1" required defaultValue={editing.duration_days} /></label></div><FeatureSwitches selected={enabledFeatures} onToggle={(label) => setEnabledFeatures((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label])} /><div className="cms-edit-actions"><button disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button><button type="button" className="cms-cancel-button" onClick={() => setEditing(null)}>Hủy</button></div></form></section>}
    <section className="cms-panel cms-form-panel"><div><p className="cms-kicker">GÓI MỚI</p><h2>Thêm gói thành viên</h2><p className="cms-muted">Gói mới mặc định được hiển thị trên site.</p></div><form className="cms-inline-form cms-plan-form" onSubmit={onCreate}><label>Tên gói<input name="name" required /></label><label>Giá (VNĐ)<input name="price" type="number" min="0" required /></label><label>Số ngày<input name="durationDays" type="number" min="1" required /></label><label>Tính năng<input name="features" placeholder="Cách nhau bằng dấu phẩy" /></label><button>Tạo và hiển thị</button></form></section>
  </>;
}

function FeatureSwitches({ selected, onToggle }) {
  return <div className="cms-feature-switches">{['Tính toán thường', 'Quyền Lợi VIP 1', 'Quyền Lợi VIP 2'].map((group) => <section className="cms-feature-group" key={group}><h3>{group}</h3>{PLAN_FEATURES.filter((item) => item.group === group).map((item) => <label className="cms-feature-switch" key={item.label}><span>{item.label.replace(/^(Thường|VIP 1|VIP 2) · /, '')}</span><input type="checkbox" checked={selected.includes(item.label)} onChange={() => onToggle(item.label)} /><i aria-hidden="true"></i></label>)}</section>)}</div>;
}
