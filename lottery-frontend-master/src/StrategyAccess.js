import { createContext, useEffect, useState } from 'react';
import './member-dashboard.css';
import './member-vip-summary.css';
import './member-vip-history.css';
import './member-payments.css';
import './member-payments-qr.css';

const STORAGE_KEY = 'kequaxsmb-member-token';
const API = '/api/lottery';
const money = (value) => `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))}đ`;
const formatDate = (value) => value ? new Date(value).toLocaleDateString('vi-VN') : '—';
export const MemberContext = createContext(null);

async function api(path, token, options = {}) {
  const response = await fetch(`${API}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Không thể xử lý yêu cầu.');
  return data;
}

export default function StrategyAccess({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY) || '');
  const [member, setMember] = useState(null);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    api('/member/account', token).then(({ member: account }) => setMember(account)).catch(() => { localStorage.removeItem(STORAGE_KEY); setToken(''); });
  }, [token]);

  async function submit(event) {
    event.preventDefault(); setMessage('');
    try {
      const payload = mode === 'login' ? { username: form.username, password: form.password } : form;
      const result = await api(`/member/${mode}`, '', { method: 'POST', body: JSON.stringify(payload) });
      localStorage.setItem(STORAGE_KEY, result.token); setToken(result.token); setMember(result.member);
    } catch (error) { setMessage(error.message); }
  }

  if (!member) return <section className="strategy-access panel"><p className="eyebrow">KHU VỰC THÀNH VIÊN</p><h2>Mở khóa Chiến lược</h2><p>Đăng nhập để xem các công thức, kiểm thử lịch sử và quản lý gói thành viên.</p><div className="access-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setMessage(''); }}>Đăng nhập</button><button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setMessage(''); }}>Đăng ký</button></div><form onSubmit={submit}><label>Tên đăng nhập<input value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} required /></label>{mode === 'register' && <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>}<label>Mật khẩu<input type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength="10" title="Ít nhất 10 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt" required /></label>{mode === 'register' && <small>Mật khẩu: ít nhất 10 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</small>}{message && <small className="access-message">{message}</small>}<button type="submit">{mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button></form></section>;

  return <MemberDashboard member={member} token={token} setMember={setMember} logout={() => { localStorage.removeItem(STORAGE_KEY); setToken(''); setMember(null); }} strategy={children} />;
}

function MemberDashboard({ member, token, setMember, logout, strategy }) {
  const [tab, setTab] = useState('strategy');
  const [plans, setPlans] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [numberSize, setNumberSize] = useState('2');
  const [vipWindow, setVipWindow] = useState('2');
  const [vipHistory, setVipHistory] = useState([]);
  const [vipLoading, setVipLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [email, setEmail] = useState(member.email || '');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  useEffect(() => { if (tab === 'plans') Promise.all([api('/membership-plans'), api('/payment-methods')]).then(([{ plans: items }, { methods }]) => { setPlans(items); setPaymentMethods(methods); }).catch((error) => setNotice(error.message)); }, [tab]);
  useEffect(() => {
    setVipLoading(true);
    api(`/member/vip-history?numberSize=${numberSize}&window=${vipWindow}`, token).then(({ days }) => setVipHistory(days)).catch((error) => setNotice(error.message)).finally(() => setVipLoading(false));
  }, [token, numberSize, vipWindow]);
  async function updateEmail(event) { event.preventDefault(); try { const { member: account } = await api('/member/email', token, { method: 'PUT', body: JSON.stringify({ email }) }); setMember(account); setNotice('Đã cập nhật email.'); } catch (error) { setNotice(error.message); } }
  async function updatePassword(event) { event.preventDefault(); try { await api('/member/password', token, { method: 'PUT', body: JSON.stringify(passwords) }); setPasswords({ currentPassword: '', newPassword: '' }); setNotice('Đã đổi mật khẩu.'); } catch (error) { setNotice(error.message); } }
  function choosePlan(plan) { if (!paymentMethods.length) return setNotice('Hiện chưa có phương thức thanh toán nào được mở. Vui lòng liên hệ quản trị viên.'); setSelectedPlan(plan); }
  async function submitPayment(paymentMethod, paymentRequestId = null) { try { if (paymentRequestId) { await api(`/member/payment-requests/${paymentRequestId}/submit`, token, { method: 'POST' }); setSelectedPlan(null); setNotice('Đã thông báo thanh toán cho quản trị viên. Gói sẽ được kích hoạt sau khi đối soát.'); return null; } const { member: account, paymentRequest } = await api('/member/plan-request', token, { method: 'POST', body: JSON.stringify({ planId: selectedPlan.id, paymentMethod }) }); setMember(account); return paymentRequest; } catch (error) { setNotice(error.message); return null; } }
  const membership = { canUseVip: Boolean(member.membership_plan_id), token, numberSize, setNumberSize, vipWindow, setVipWindow, openPlans: () => { setNotice('Tính năng VIP cần gói thành viên. Hãy chọn gói phù hợp để kích hoạt.'); setTab('plans'); } };

  return <MemberContext.Provider value={membership}><section className="member-dashboard"><header className="member-dashboard-head"><div><p className="eyebrow">TÀI KHOẢN THÀNH VIÊN</p><h2>Xin chào, {member.username}</h2><span>{member.plan_name ? `Gói hiện tại: ${member.plan_name}` : 'Tài khoản cơ bản — chưa có gói thành viên.'}</span></div><button className="member-logout" onClick={logout}>Đăng xuất</button></header><VipHistorySummary days={vipHistory} loading={vipLoading} numberSize={numberSize} window={vipWindow} /><nav className="member-tabs"><button className={tab === 'strategy' ? 'active' : ''} onClick={() => setTab('strategy')}>Chiến lược</button><button className={tab === 'plans' ? 'active' : ''} onClick={() => setTab('plans')}>Gói & nạp</button><button className={tab === 'account' ? 'active' : ''} onClick={() => setTab('account')}>Tài khoản</button></nav>{notice && <div className="member-notice">{notice}</div>}{tab === 'strategy' && strategy}{tab === 'plans' && <><div className="member-plan-grid">{plans.map((plan) => <article key={plan.id}><span>{plan.id === member.membership_plan_id ? 'ĐANG SỬ DỤNG' : plan.id === member.pending_membership_plan_id ? 'ĐANG CHỜ XỬ LÝ' : `${plan.duration_days} ngày`}</span><h3>{plan.name}</h3><b>{money(plan.price)}</b><ul>{plan.features?.map((feature) => <li key={feature}>{feature}</li>)}</ul><button disabled={plan.id === member.membership_plan_id || plan.id === member.pending_membership_plan_id} onClick={() => choosePlan(plan)}>{plan.id === member.membership_plan_id ? 'Gói hiện tại' : plan.id === member.pending_membership_plan_id ? 'Đã gửi yêu cầu' : 'Chọn gói này'}</button></article>)}</div>{selectedPlan && <PaymentChooser plan={selectedPlan} methods={paymentMethods} username={member.username} onClose={() => setSelectedPlan(null)} onSubmit={submitPayment} />}</>}{tab === 'account' && <div className="member-account-grid"><article><p className="eyebrow">THÔNG TIN TÀI KHOẢN</p><h3>{member.username}</h3><p>Gói đang dùng: <b>{member.plan_name || 'Chưa có'}</b></p>{member.pending_plan_name && <p>Đang chờ nạp: <b>{member.pending_plan_name}</b></p>}<form onSubmit={updateEmail}><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><button>Lưu email</button></form></article><article><p className="eyebrow">BẢO MẬT</p><h3>Đổi mật khẩu</h3><form onSubmit={updatePassword}><label>Mật khẩu hiện tại<input type="password" value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} required /></label><label>Mật khẩu mới<input type="password" minLength="10" title="Ít nhất 10 ký tự gồm chữ hoa, chữ thường, số và ký tự đặc biệt" value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} required /></label><small>Mật khẩu mới cần ít nhất 10 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</small><button>Đổi mật khẩu</button></form></article></div>}</section></MemberContext.Provider>;
}

function PaymentChooser({ plan, methods, onClose, onSubmit }) {
  const [method, setMethod] = useState(methods[0]?.key || '');
  const [receipt, setReceipt] = useState(null);
  async function createReceipt() { const created = await onSubmit(method); if (created) setReceipt(created); }
  async function confirmPaid() { await onSubmit(method, receipt.id); }
  if (receipt) {
    const info = receipt.instructions;
    const qrUrl = info?.bankCode && info?.accountNumber ? `https://img.vietqr.io/image/${encodeURIComponent(info.bankCode)}-${encodeURIComponent(info.accountNumber)}-compact2.png?amount=${plan.price}&addInfo=${encodeURIComponent(receipt.code)}&accountName=${encodeURIComponent(info.accountName || '')}` : '';
    return <div className="member-payment-modal"><section className="member-payment-chooser"><header><div><p className="eyebrow">THÔNG TIN THANH TOÁN</p><h3>{receipt.label}</h3></div><button onClick={onClose}>Đóng</button></header><div className="member-payment-code"><span>Mã giao dịch / nội dung chuyển khoản</span><b>{receipt.code}</b></div>{info && <div className="member-transfer-details"><div><b>Chuyển đúng số tiền: {money(plan.price)}</b><span>Ngân hàng: {info.bankCode}</span><span>Số tài khoản: {info.accountNumber}</span><span>Chủ tài khoản: {info.accountName}</span><span>Nội dung: <strong>{receipt.code}</strong></span></div>{qrUrl && <img src={qrUrl} alt="Mã thanh toán VietQR" />}</div>}<p className="member-payment-note">Sau khi hoàn tất thanh toán, bấm nút bên dưới để gửi yêu cầu đối soát cho quản trị viên.</p><button className="member-payment-submit" onClick={confirmPaid}>Tôi đã thanh toán</button></section></div>;
  }
  return <section className="member-payment-chooser"><header><div><p className="eyebrow">THANH TOÁN GÓI</p><h3>{plan.name} · {money(plan.price)}</h3></div><button onClick={onClose}>Đóng</button></header><p>Chọn phương thức để tạo mã giao dịch riêng và hiển thị thông tin thanh toán.</p><div className="member-payment-methods">{methods.map((item) => <button className={method === item.key ? 'active' : ''} key={item.key} onClick={() => setMethod(item.key)}>{item.label}</button>)}</div><button className="member-payment-submit" disabled={!method} onClick={createReceipt}>Tạo mã thanh toán</button></section>;
}

function VipHistorySummary({ days, loading, numberSize, window }) {
  const label = { vip1: 'VIP 1 · Win Rate', vip2: 'VIP 2 · Tối ưu Mẫu' };
  return <section className="member-vip-summary"><div className="member-vip-summary-heading"><div><p className="eyebrow">KẾT QUẢ VIP ĐÃ VỀ</p><h3>Đối chiếu khung {window} ngày · VIP {numberSize} số</h3></div></div>{loading ? <p className="member-vip-empty">Đang kiểm tra kết quả thực tế…</p> : days.length ? <div className="member-vip-history">{days.map((day) => <article key={day.date}><header><b>Dự báo từ {formatDate(day.date)}</b><span>{day.items.reduce((total, item) => total + item.matched.length, 0)} số đã về</span></header>{day.items.map((item) => <div key={`${item.vipMode}-${item.numberSize}`}><small>{label[item.vipMode]} · {item.numberSize} số · Khung {window} ngày · toàn bộ tín hiệu đã quét</small><strong>{item.numbers.join(' · ')}</strong><b>{item.hits} lần về</b><section className="vip-history-window">{item.byDay.map((result) => <span className={result.hits ? 'hit' : ''} key={result.day}>Ngày {result.day} · {formatDate(result.date)}: <b>{!result.available ? 'chờ kết quả' : result.hits ? `${result.hits} lần` : 'chưa về'}</b>{result.matched.length ? ` · ${result.matched.join(' · ')}` : ''}{result.evidence?.length ? <small className="vip-history-proof"> · {result.evidence.map((proof) => `${proof.number} ← ${proof.sources.join(', ')}`).join(' | ')}</small> : null}</span>)}</section></div>)}</article>)}</div> : <p className="member-vip-empty">Trong các khung {window} ngày đã hoàn tất chưa có lựa chọn VIP {numberSize} số nào về.</p>}</section>;
}
