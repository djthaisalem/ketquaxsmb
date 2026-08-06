import crypto from 'node:crypto';
import pool from '../db.mjs';
import { refreshHomepageForecasts } from './dashboard.controller.mjs';
import { allowLoginAttempt, clearLoginFailures, recordLoginFailure } from '../auth-security.mjs';
import { notifyTelegram } from '../telegram.mjs';

const sessions = new Map();
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'Allin@8888';
const scrypt = (password, salt) => new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, (error, key) => error ? reject(error) : resolve(key.toString('hex'))));
const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  return `scrypt$${salt}$${await scrypt(password, salt)}`;
};
const verifyPassword = async (password, stored) => {
  const [kind, salt, expected] = String(stored || '').split('$');
  const actual = kind === 'scrypt' && salt && expected ? await scrypt(password, salt) : await scrypt(password, 'kequaxsmb-member');
  const target = kind === 'scrypt' && expected ? expected : stored;
  return target?.length === actual.length && crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(target, 'hex'));
};
const validPassword = (password) => typeof password === 'string' && password.length >= 10 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);
const authenticate = async (req, res, next) => {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) return res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn.' });
  const active = await pool.query("SELECT 1 FROM cms_users WHERE id = $1 AND status = 'active'", [session.memberId]);
  if (!active.rowCount) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Tài khoản đã bị đình chỉ hoặc không còn tồn tại.' });
  }
  req.memberId = session.memberId;
  req.memberToken = token;
  return next();
};
export const invalidateMemberSessions = (memberId, keepToken = null) => {
  for (const [token, session] of sessions) if (session.memberId === Number(memberId) && token !== keepToken) sessions.delete(token);
};
const memberRecord = async (id) => {
  const result = await pool.query(`SELECT u.id, u.username, u.full_name, u.email, u.role, u.membership_plan_id, u.pending_membership_plan_id, u.trial_ends_at,
    p.name AS plan_name, p.price AS plan_price, p.duration_days AS plan_duration_days,
    pending.name AS pending_plan_name, pending.price AS pending_plan_price, payment.transaction_code AS pending_transaction_code
    FROM cms_users u
    LEFT JOIN membership_plans p ON p.id = u.membership_plan_id
    LEFT JOIN membership_plans pending ON pending.id = u.pending_membership_plan_id
    LEFT JOIN LATERAL (SELECT transaction_code FROM payment_requests WHERE member_id = u.id AND status = 'pending' ORDER BY created_at DESC LIMIT 1) payment ON TRUE
    WHERE u.id = $1 AND u.status = 'active'`, [id]);
  if (!result.rowCount) return null;
  const member = result.rows[0];
  return { ...member, id: Number(member.id), membership_plan_id: member.membership_plan_id ? Number(member.membership_plan_id) : null, pending_membership_plan_id: member.pending_membership_plan_id ? Number(member.pending_membership_plan_id) : null, plan_price: member.plan_price ? Number(member.plan_price) : null, pending_plan_price: member.pending_plan_price ? Number(member.pending_plan_price) : null, trial_active: member.trial_ends_at ? new Date(member.trial_ends_at) > new Date() : false };
};

export const activePlans = async (_req, res, next) => {
  try {
    const result = await pool.query("SELECT id, name, price, duration_days, features FROM membership_plans WHERE status = 'active' ORDER BY price ASC, id ASC");
    return res.json({ plans: result.rows.map((plan) => ({ ...plan, id: Number(plan.id), price: Number(plan.price), duration_days: Number(plan.duration_days) })) });
  } catch (error) { return next(error); }
};

const paymentLabels = { vietqr: 'Chuyển khoản ngân hàng (VietQR)', momo: 'MoMo', zalopay: 'ZaloPay', viettelpay: 'Viettel Money' };
const transactionAlphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const transactionCode = () => Array.from({ length: 8 }, () => transactionAlphabet[crypto.randomInt(transactionAlphabet.length)]).join('');

export const paymentMethods = async (_req, res, next) => {
  try {
    const result = await pool.query("SELECT setting_value FROM api_settings WHERE setting_key = 'payment_gateways'");
    const settings = result.rows[0]?.setting_value || {};
    const methods = Object.keys(paymentLabels).filter((key) => settings[key]?.enabled).map((key) => ({
      key,
      label: paymentLabels[key],
      instructions: key === 'vietqr' ? {
        bankCode: settings[key].bankCode || '', accountNumber: settings[key].accountNumber || '', accountName: settings[key].accountName || '', transferContent: settings[key].transferContent || 'XSMB {username}',
      } : null,
    }));
    return res.json({ methods });
  } catch (error) { return next(error); }
};

export const registerMember = async (req, res, next) => {
  try {
    const { username, email, password } = req.body || {};
    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username || '') || !/^\S+@\S+\.\S+$/.test(email || '') || !validPassword(password)) return res.status(400).json({ error: 'Mật khẩu cần từ 10 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.' });
    const passwordHash = await hashPassword(password);
    const created = await pool.query(`INSERT INTO cms_users (username, email, password_hash, role, status, trial_ends_at)
      VALUES ($1, $2, $3, 'member', 'active', NOW() + INTERVAL '2 days') RETURNING id`, [username.toLowerCase(), email.toLowerCase(), passwordHash]);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { memberId: created.rows[0].id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
    return res.status(201).json({ token, member: await memberRecord(created.rows[0].id) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Tên đăng nhập hoặc email đã được sử dụng.' });
    return next(error);
  }
};

export const requireVip = async (req, res, next) => {
  try {
    const result = await pool.query(`SELECT 1
      FROM cms_users u
      JOIN membership_plans p ON p.id = u.membership_plan_id AND p.status = 'active'
      WHERE u.id = $1 AND u.status = 'active'`, [req.memberId]);
    if (!result.rowCount) return res.status(403).json({ error: 'Tính năng VIP cần gói thành viên đang hoạt động.' });
    return next();
  } catch (error) { return next(error); }
};

export const loginMember = async (req, res, next) => {
  try {
    if (!allowLoginAttempt('member', req, res)) return;
    const { username, password } = req.body || {};
    const result = await pool.query('SELECT id, username, password_hash FROM cms_users WHERE LOWER(username) = LOWER($1) AND status = \'active\'', [username || '']);
    if (!result.rowCount) { recordLoginFailure('member', req); return res.status(401).json({ error: 'Thông tin đăng nhập chưa đúng.' }); }
    const user = result.rows[0];
    const valid = user.password_hash ? await verifyPassword(password || '', user.password_hash) : user.username === adminUsername && password === adminPassword;
    if (!valid) { recordLoginFailure('member', req); return res.status(401).json({ error: 'Thông tin đăng nhập chưa đúng.' }); }
    clearLoginFailures('member', req);
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { memberId: user.id, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 });
    return res.json({ token, member: await memberRecord(user.id) });
  } catch (error) { return next(error); }
};

export const getMemberAccount = async (req, res, next) => {
  try {
    const member = await memberRecord(req.memberId);
    if (!member) return res.status(404).json({ error: 'Không tìm thấy tài khoản.' });
    return res.json({ member });
  } catch (error) { return next(error); }
};

export const updateMemberEmail = async (req, res, next) => {
  try {
    const { email } = req.body || {};
    if (!/^\S+@\S+\.\S+$/.test(email || '')) return res.status(400).json({ error: 'Email chưa hợp lệ.' });
    await pool.query('UPDATE cms_users SET email = $1, updated_at = NOW() WHERE id = $2', [email.toLowerCase(), req.memberId]);
    return res.json({ member: await memberRecord(req.memberId) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Email này đã được sử dụng.' });
    return next(error);
  }
};

export const updateMemberPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!validPassword(newPassword)) return res.status(400).json({ error: 'Mật khẩu mới cần từ 10 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.' });
    const result = await pool.query('SELECT username, password_hash FROM cms_users WHERE id = $1', [req.memberId]);
    const user = result.rows[0];
    const valid = user.password_hash ? await verifyPassword(currentPassword || '', user.password_hash) : user.username === adminUsername && currentPassword === adminPassword;
    if (!valid) return res.status(401).json({ error: 'Mật khẩu hiện tại chưa đúng.' });
    await pool.query('UPDATE cms_users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [await hashPassword(newPassword), req.memberId]);
    invalidateMemberSessions(req.memberId, req.memberToken);
    return res.json({ ok: true });
  } catch (error) { return next(error); }
};

export const requestPlan = async (req, res, next) => {
  try {
    const { planId, paymentMethod } = req.body || {};
    const plan = await pool.query("SELECT id, name, price FROM membership_plans WHERE id = $1 AND status = 'active'", [planId]);
    if (!plan.rowCount) return res.status(404).json({ error: 'Gói thành viên không tồn tại.' });
    const configured = await pool.query("SELECT setting_value FROM api_settings WHERE setting_key = 'payment_gateways'");
    const method = String(paymentMethod || '');
    if (!paymentLabels[method] || !configured.rows[0]?.setting_value?.[method]?.enabled) return res.status(400).json({ error: 'Vui lòng chọn một phương thức thanh toán đang hoạt động.' });
    const payment = plan.rows[0];
    await pool.query('UPDATE cms_users SET pending_membership_plan_id = $1, updated_at = NOW() WHERE id = $2', [planId, req.memberId]);
    let created;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        created = await pool.query(`INSERT INTO payment_requests (member_id, plan_id, payment_method, amount, transaction_code, status)
          VALUES ($1, $2, $3, $4, $5, 'draft') RETURNING id, transaction_code`, [req.memberId, payment.id, method, payment.price, transactionCode()]);
        break;
      } catch (error) {
        if (error.code !== '23505' || attempt === 4) throw error;
      }
    }
    const member = await memberRecord(req.memberId);
    const code = created.rows[0].transaction_code;
    const instructions = method === 'vietqr' ? {
      bankCode: configured.rows[0].setting_value[method].bankCode || '', accountNumber: configured.rows[0].setting_value[method].accountNumber || '', accountName: configured.rows[0].setting_value[method].accountName || '', transferContent: code,
    } : null;
    return res.json({ member, paymentRequest: { id: Number(created.rows[0].id), code, method, label: paymentLabels[method], instructions } });
  } catch (error) { return next(error); }
};

export const submitPaymentRequest = async (req, res, next) => {
  try {
    const request = await pool.query(`SELECT r.id, r.transaction_code, r.payment_method, r.amount, p.name AS plan_name, u.username
      FROM payment_requests r JOIN membership_plans p ON p.id = r.plan_id JOIN cms_users u ON u.id = r.member_id
      WHERE r.id = $1 AND r.member_id = $2 AND r.status = 'draft'`, [req.params.id, req.memberId]);
    if (!request.rowCount) return res.status(404).json({ error: 'Không tìm thấy yêu cầu thanh toán đang chờ xác nhận.' });
    const payment = request.rows[0];
    await pool.query("UPDATE payment_requests SET status = 'pending', updated_at = NOW() WHERE id = $1", [payment.id]);
    void notifyTelegram(`Yêu cầu thanh toán mới #${payment.id}\nMã giao dịch: ${payment.transaction_code}\nUser: ${payment.username}\nGói: ${payment.plan_name}\nSố tiền: ${Number(payment.amount).toLocaleString('vi-VN')}đ\nThanh toán: ${paymentLabels[payment.payment_method]}`);
    return res.json({ ok: true });
  } catch (error) { return next(error); }
};

export const vipTrialResults = async (req, res, next) => {
  try {
    const dates = await pool.query('SELECT draw_date::text AS date FROM lottery_draws ORDER BY draw_date DESC LIMIT 3');
    const dayList = dates.rows.map((row) => row.date).sort();
    if (!dayList.length) return res.json({ days: [] });
    let forecasts = await pool.query("SELECT target_date::text AS date, category, numbers, formula, rate::float AS rate FROM homepage_forecasts WHERE target_date = ANY($1::date[]) AND category IN ('de', '2so', '3so')", [dayList]);
    if (forecasts.rows.length < dayList.length * 3) {
      await refreshHomepageForecasts(dayList);
      forecasts = await pool.query("SELECT target_date::text AS date, category, numbers, formula, rate::float AS rate FROM homepage_forecasts WHERE target_date = ANY($1::date[]) AND category IN ('de', '2so', '3so')", [dayList]);
    }
    const prizes = await pool.query('SELECT draw_date::text AS date, numbers FROM lottery_prizes WHERE draw_date = ANY($1::date[])', [dayList]);
    const numbersByDate = new Map();
    prizes.rows.forEach((row) => numbersByDate.set(row.date, [...(numbersByDate.get(row.date) || []), ...row.numbers]));
    const forecastsByDate = new Map();
    forecasts.rows.forEach((row) => forecastsByDate.set(`${row.date}-${row.category}`, row));
    const summary = dayList.map((date) => ({
      date,
      items: ['de', '2so', '3so'].map((category) => {
        const forecast = forecastsByDate.get(`${date}-${category}`);
        if (!forecast) return { category, available: false };
        const digits = category === '2so' ? 2 : 3;
        const predicted = forecast.numbers.map(String);
        const actual = (numbersByDate.get(date) || []).filter((number) => number.length >= digits).map((number) => number.slice(-digits));
        const matches = actual.filter((number) => predicted.includes(number));
        return { category, available: true, numbers: predicted, formula: forecast.formula, rate: forecast.rate, hits: matches.length, matched: [...new Set(matches)] };
      }),
    })).reverse();
    return res.json({ days: summary });
  } catch (error) { return next(error); }
};

export const vipHistory = async (_req, res, next) => {
  try {
    const numberSize = String(_req.query.numberSize) === '3' ? 3 : 2;
    const window = ['1', '2', '3'].includes(String(_req.query.window)) ? Number(_req.query.window) : 3;
    const sources = await pool.query(`SELECT DISTINCT s.target_date::text AS date FROM vip_strategy_snapshots s
      WHERE s.window_size = $1 AND s.number_size = $2 AND s.target_date <= (SELECT MAX(draw_date) FROM lottery_draws)
      ORDER BY 1 DESC LIMIT 3`, [window, numberSize]);
    const dayList = sources.rows.map((row) => row.date);
    if (!dayList.length) return res.json({ numberSize, window, days: [] });
    const addDays = (date, amount) => { const value = new Date(`${date}T00:00:00Z`); value.setUTCDate(value.getUTCDate() + amount); return value.toISOString().slice(0, 10); };
    const actualDates = [...new Set(dayList.flatMap((date) => Array.from({ length: window }, (_, offset) => addDays(date, offset))))];
    const [snapshots, prizes] = await Promise.all([
      pool.query('SELECT target_date::text AS date, vip_mode, number_size, payload FROM vip_strategy_snapshots WHERE target_date = ANY($1::date[]) AND window_size = $2 AND number_size = $3', [dayList, window, numberSize]),
      pool.query('SELECT draw_date::text AS date, prize_code, numbers FROM lottery_prizes WHERE draw_date = ANY($1::date[])', [actualDates]),
    ]);
    const actual = new Map();
    prizes.rows.forEach((row) => actual.set(row.date, [...(actual.get(row.date) || []), ...row.numbers.map((number) => ({ number, prize: row.prize_code.toUpperCase() }))]));
    const rows = new Map(snapshots.rows.map((row) => [`${row.date}-${row.vip_mode}-${row.number_size}`, row]));
    const days = dayList.map((date) => {
      const items = ['vip1', 'vip2'].flatMap((vipMode) => [numberSize].flatMap((numberSize) => {
        const snapshot = rows.get(`${date}-${vipMode}-${numberSize}`);
        const candidates = new Map();
        (snapshot?.payload?.items || []).forEach((signal) => {
          (signal.targets || []).forEach((number) => {
            if (!candidates.has(number)) candidates.set(number, { number, sources: [] });
            candidates.get(number).sources.push(signal.formula || signal.group);
          });
        });
        if (!candidates.size) return [];
        const pending = new Set(candidates.keys());
        const byDay = Array.from({ length: window }, (_, offset) => {
          const resultDate = addDays(date, offset);
          const available = actual.has(resultDate);
          const resultNumbers = actual.get(resultDate) || [];
          const appeared = resultNumbers.filter(({ number }) => number.length >= numberSize).map(({ number }) => number.slice(-numberSize));
          const matches = appeared.filter((number) => pending.has(number));
          const matched = [...new Set(matches)];
          matched.forEach((number) => pending.delete(number));
          const evidence = matched.map((number) => ({ number, sources: [...new Set(candidates.get(number).sources)] }));
          return { day: offset + 1, date: resultDate, available, hits: matches.length, matched, evidence };
        });
        const hits = byDay.reduce((total, day) => total + day.hits, 0);
        const matched = [...new Set(byDay.flatMap((day) => day.matched))];
        return hits ? [{ vipMode, numberSize, numbers: matched, hits, matched, byDay }] : [];
      }));
      return { date, items };
    }).filter((day) => day.items.length);
    return res.json({ numberSize, window, days });
  } catch (error) { return next(error); }
};

export { authenticate };
