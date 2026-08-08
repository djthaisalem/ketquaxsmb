import crypto from 'node:crypto';
import pool from '../db.mjs';
import { invalidateMemberSessions } from './membership.controller.mjs';
import { allowLoginAttempt, clearLoginFailures, recordLoginFailure } from '../auth-security.mjs';
import { saveTelegramSettings, telegramSettings } from '../telegram.mjs';
import { getInternalBacktest, getReferenceFormulaBacktest, refreshInternalBacktest, refreshReferenceFormulaBacktest } from '../internal-backtest.mjs';

const sessions = new Map();
const adminUsername = process.env.ADMIN_USERNAME || 'admin';
const adminPassword = process.env.ADMIN_PASSWORD || 'Allin@8888';

const safeUser = (row) => ({
  ...row,
  id: Number(row.id),
  membership_plan_id: row.membership_plan_id ? Number(row.membership_plan_id) : null,
});

const asPlan = (row) => ({ ...row, id: Number(row.id), price: Number(row.price), duration_days: Number(row.duration_days) });
const currentDate = () => new Date().toISOString().slice(0, 10);
const crawlerSettings = (value = {}) => ({
  source: String(value.source || 'Minh Ngọc').trim() || 'Minh Ngọc',
  schedule: String(value.schedule || '').match(/([01]\d|2[0-3]):[0-5]\d/)?.[0] || '19:00',
  enabled: value.enabled !== false,
});

export const login = (req, res) => {
  if (!allowLoginAttempt('admin', req, res)) return;
  const { username, password } = req.body || {};
  if (username !== adminUsername || password !== adminPassword) {
    recordLoginFailure('admin', req);
    return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu quản trị.' });
  }
  clearLoginFailures('admin', req);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { username: adminUsername, expiresAt: Date.now() + 12 * 60 * 60 * 1000 });
  return res.json({ token, user: { username: adminUsername, role: 'admin' } });
};

export const requireAdmin = (req, res, next) => {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
  const session = token && sessions.get(token);
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return res.status(401).json({ error: 'Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.' });
  }
  req.admin = session;
  return next();
};

export const overview = async (_req, res, next) => {
  try {
    const [draws, users, plans, crawlRuns] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS total, TO_CHAR(MIN(draw_date), 'YYYY-MM-DD') AS first_date, TO_CHAR(MAX(draw_date), 'YYYY-MM-DD') AS latest_date FROM lottery_draws"),
      pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'active')::int AS active FROM cms_users"),
      pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status = 'active')::int AS active FROM membership_plans"),
      pool.query("SELECT source_name, TO_CHAR(from_date, 'YYYY-MM-DD') AS from_date, TO_CHAR(to_date, 'YYYY-MM-DD') AS to_date, successful_days, failed_days, finished_at FROM crawl_runs ORDER BY id DESC LIMIT 5"),
    ]);
    return res.json({ draws: draws.rows[0], users: users.rows[0], plans: plans.rows[0], crawlRuns: crawlRuns.rows });
  } catch (error) { return next(error); }
};

export const apiStatus = async (_req, res, next) => {
  try {
    const settings = await pool.query('SELECT setting_key, setting_value, updated_at FROM api_settings ORDER BY setting_key');
    const latest = await pool.query("SELECT TO_CHAR(MAX(draw_date), 'YYYY-MM-DD') AS latest_date FROM lottery_draws");
    const crawler = crawlerSettings(settings.rows.find((setting) => setting.setting_key === 'crawler')?.setting_value);
    return res.json({
      services: [
        { name: 'Public lottery API', path: '/api/lottery', status: 'active' },
        { name: 'Data scanner', path: 'Minh Ngọc → PostgreSQL', status: crawler.enabled ? 'scheduled' : 'inactive', detail: crawler.enabled ? `${crawler.schedule} mỗi ngày` : 'Đã tắt tự động quét' },
      ],
      latestDate: latest.rows[0].latest_date,
      settings: settings.rows,
    });
  } catch (error) { return next(error); }
};

export const updateApiSetting = async (req, res, next) => {
  try {
    const { settingValue } = req.body || {};
    if (!settingValue || typeof settingValue !== 'object') return res.status(400).json({ error: 'Thiết lập API chưa hợp lệ.' });
    const value = req.params.key === 'crawler' ? crawlerSettings(settingValue) : settingValue;
    const result = await pool.query(`INSERT INTO api_settings (setting_key, setting_value, updated_at) VALUES ($1, $2, NOW())
      ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW() RETURNING *`, [req.params.key, JSON.stringify(value)]);
    return res.json({ setting: result.rows[0] });
  } catch (error) { return next(error); }
};

const defaultPaymentGateways = () => ({
  vietqr: { enabled: false, bankCode: '', accountNumber: '', accountName: '', transferContent: '' },
  momo: { enabled: false, partnerCode: '', endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create' },
  zalopay: { enabled: false, appId: '', endpoint: 'https://sb-openapi.zalopay.vn/v2/create' },
  viettelpay: { enabled: false, merchantCode: '', endpoint: '' },
});

export const paymentSettings = async (_req, res, next) => {
  try {
    const result = await pool.query("SELECT setting_value, updated_at FROM api_settings WHERE setting_key = 'payment_gateways'");
    return res.json({ settings: result.rows[0]?.setting_value || defaultPaymentGateways(), updatedAt: result.rows[0]?.updated_at || null });
  } catch (error) { return next(error); }
};

export const updatePaymentSettings = async (req, res, next) => {
  try {
    const { settings } = req.body || {};
    if (!settings || typeof settings !== 'object') return res.status(400).json({ error: 'Thiết lập cổng thanh toán chưa hợp lệ.' });
    const value = defaultPaymentGateways();
    for (const key of Object.keys(value)) {
      const input = settings[key] || {};
      value[key] = Object.fromEntries(Object.keys(value[key]).map((field) => [field, field === 'enabled' ? input.enabled === true : String(input[field] || '').trim()]));
    }
    const result = await pool.query(`INSERT INTO api_settings (setting_key, setting_value, updated_at) VALUES ('payment_gateways', $1, NOW())
      ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = NOW() RETURNING updated_at`, [JSON.stringify(value)]);
    return res.json({ settings: value, updatedAt: result.rows[0].updated_at });
  } catch (error) { return next(error); }
};

export const listNotifications = async (_req, res, next) => {
  try {
    const requests = await pool.query(`SELECT r.id, r.transaction_code, r.payment_method, r.amount, r.status, r.created_at, r.updated_at,
      u.username, u.email, p.name AS plan_name
      FROM payment_requests r JOIN cms_users u ON u.id = r.member_id JOIN membership_plans p ON p.id = r.plan_id WHERE r.status <> 'draft'
      ORDER BY CASE r.status WHEN 'pending' THEN 0 ELSE 1 END, r.created_at DESC LIMIT 50`);
    return res.json({ requests: requests.rows.map((row) => ({ ...row, id: Number(row.id), amount: Number(row.amount) })), telegram: telegramSettings() });
  } catch (error) { return next(error); }
};

export const updatePaymentRequest = async (req, res, next) => {
  const status = String(req.body?.status || '');
  if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Trạng thái thanh toán không hợp lệ.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const request = await client.query('SELECT id, member_id, plan_id, status FROM payment_requests WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!request.rowCount) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Không tìm thấy yêu cầu thanh toán.' }); }
    if (request.rows[0].status !== 'pending') { await client.query('ROLLBACK'); return res.status(400).json({ error: 'Yêu cầu này đã được xử lý.' }); }
    await client.query('UPDATE payment_requests SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);
    if (status === 'approved') await client.query('UPDATE cms_users SET membership_plan_id = $1, pending_membership_plan_id = NULL, updated_at = NOW() WHERE id = $2', [request.rows[0].plan_id, request.rows[0].member_id]);
    else await client.query('UPDATE cms_users SET pending_membership_plan_id = NULL, updated_at = NOW() WHERE id = $1', [request.rows[0].member_id]);
    await client.query('COMMIT');
    return res.json({ ok: true });
  } catch (error) { await client.query('ROLLBACK'); return next(error); } finally { client.release(); }
};

export const updateTelegram = async (req, res, next) => {
  try { return res.json({ telegram: await saveTelegramSettings(req.body || {}) }); }
  catch (error) { return res.status(400).json({ error: error.message }); }
};

export const listUsers = async (_req, res, next) => {
  try {
    const result = await pool.query(`SELECT u.id, u.username, u.full_name, u.role, u.status, u.membership_plan_id, u.created_at,
      p.name AS membership_plan_name FROM cms_users u LEFT JOIN membership_plans p ON p.id = u.membership_plan_id ORDER BY u.created_at DESC`);
    return res.json({ users: result.rows.map(safeUser) });
  } catch (error) { return next(error); }
};

export const createUser = async (req, res, next) => {
  try {
    const { username, fullName = '', role = 'member', status = 'active', membershipPlanId = null } = req.body || {};
    if (!/^[a-zA-Z0-9_.-]{3,40}$/.test(username || '') || !['admin', 'member'].includes(role) || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Thông tin user chưa hợp lệ.' });
    }
    const result = await pool.query('INSERT INTO cms_users (username, full_name, role, status, membership_plan_id) VALUES ($1, $2, $3, $4, $5) RETURNING *', [username, fullName.trim() || null, role, status, membershipPlanId || null]);
    return res.status(201).json({ user: safeUser(result.rows[0]) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Tên user đã tồn tại.' });
    return next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { role, status, membershipPlanId = null } = req.body || {};
    if (!['admin', 'member'].includes(role) || !['active', 'inactive'].includes(status)) return res.status(400).json({ error: 'Dữ liệu cập nhật chưa hợp lệ.' });
    const result = await pool.query('UPDATE cms_users SET role = $1, status = $2, membership_plan_id = $3, updated_at = NOW() WHERE id = $4 RETURNING *', [role, status, membershipPlanId || null, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Không tìm thấy user.' });
    if (status === 'inactive') invalidateMemberSessions(req.params.id);
    return res.json({ user: safeUser(result.rows[0]) });
  } catch (error) { return next(error); }
};

export const deleteUser = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'User không hợp lệ.' });
    const result = await pool.query("DELETE FROM cms_users WHERE id = $1 AND role = 'member' RETURNING id, username", [id]);
    if (!result.rowCount) return res.status(400).json({ error: 'Chỉ có thể xoá tài khoản member còn tồn tại.' });
    invalidateMemberSessions(id);
    return res.json({ deleted: result.rows[0] });
  } catch (error) { return next(error); }
};

export const listPlans = async (_req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM membership_plans ORDER BY price ASC, id ASC');
    return res.json({ plans: result.rows.map(asPlan) });
  } catch (error) { return next(error); }
};

export const createPlan = async (req, res, next) => {
  try {
    const { name, price, durationDays, features = [] } = req.body || {};
    if (!name?.trim() || !Number.isInteger(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(durationDays)) || Number(durationDays) < 1) return res.status(400).json({ error: 'Thông tin gói chưa hợp lệ.' });
    const result = await pool.query('INSERT INTO membership_plans (name, price, duration_days, features) VALUES ($1, $2, $3, $4) RETURNING *', [name.trim(), Number(price), Number(durationDays), JSON.stringify(features)]);
    return res.status(201).json({ plan: asPlan(result.rows[0]) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Tên gói đã tồn tại.' });
    return next(error);
  }
};

export const updatePlan = async (req, res, next) => {
  try {
    const { name, price, durationDays, features, status } = req.body || {};
    const editingDetails = name !== undefined || price !== undefined || durationDays !== undefined || features !== undefined;
    if (editingDetails && (!name?.trim() || !Number.isInteger(Number(price)) || Number(price) < 0 || !Number.isInteger(Number(durationDays)) || Number(durationDays) < 1 || !Array.isArray(features))) return res.status(400).json({ error: 'Plan details are invalid.' });
    if (!['active', 'inactive'].includes(status)) return res.status(400).json({ error: 'Trạng thái chưa hợp lệ.' });
    const result = editingDetails
      ? await pool.query('UPDATE membership_plans SET name = $1, price = $2, duration_days = $3, features = $4, status = $5, updated_at = NOW() WHERE id = $6 RETURNING *', [name.trim(), Number(price), Number(durationDays), JSON.stringify(features), status, req.params.id])
      : await pool.query('UPDATE membership_plans SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: 'Không tìm thấy gói.' });
    return res.json({ plan: asPlan(result.rows[0]) });
  } catch (error) { return next(error); }
};

export const listResults = async (req, res, next) => {
  try {
    const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.from || '') ? req.query.from : '2005-01-01';
    const to = /^\d{4}-\d{2}-\d{2}$/.test(req.query.to || '') ? req.query.to : currentDate();
    const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
    const result = await pool.query(`SELECT TO_CHAR(d.draw_date, 'YYYY-MM-DD') AS draw_date, d.crawled_at, p.numbers AS special_prize
      FROM lottery_draws d JOIN lottery_prizes p ON p.draw_date = d.draw_date AND p.prize_code = 'db'
      WHERE d.draw_date BETWEEN $1 AND $2 ORDER BY d.draw_date DESC LIMIT $3`, [from, to, limit]);
    const count = await pool.query('SELECT COUNT(*)::int AS total FROM lottery_draws WHERE draw_date BETWEEN $1 AND $2', [from, to]);
    return res.json({ from, to, total: count.rows[0].total, results: result.rows });
  } catch (error) { return next(error); }
};

const vipSourceMatches = (formula, source) => {
  const value = String(formula || '').toLocaleLowerCase('vi-VN');
  if (source === 'bac-nho') return value.startsWith('bạc nhớ:');
  if (source === 'bong-am-duong') return value.startsWith('bóng dương gđb') || value.startsWith('bóng âm gđb');
  if (source === 'ghep-g7') return value.startsWith('ghép g7');
  if (source === 'ghep-gdb-g4-g5') return value.startsWith('gđb đuôi');
  if (source === 'priority-one') return value === 'ưu tiên 1 số';
  if (source === 'priority-two') return value === 'đề xuất ưu tiên 2 số';
  return true;
};

const filterVipPayloadBySource = (payload = {}, source) => {
  if (source === 'all') return payload;
  const byDay = (payload.byDay || []).map((day) => {
    const evidence = (day.evidence || []).map((proof) => ({
      ...proof,
      sources: (proof.sources || []).filter((formula) => vipSourceMatches(formula, source)),
    })).filter((proof) => proof.sources.length);
    const matched = evidence.map((proof) => proof.number);
    return { ...day, matched, evidence, hits: matched.length };
  });
  const matched = [...new Set(byDay.flatMap((day) => day.matched))];
  return { ...payload, numbers: matched, matched, hits: byDay.reduce((total, day) => total + day.hits, 0), byDay };
};

export const listVipResults = async (req, res, next) => {
  try {
    const from = /^\d{4}-\d{2}-\d{2}$/.test(req.query.from || '') ? req.query.from : '2026-05-01';
    const to = /^\d{4}-\d{2}-\d{2}$/.test(req.query.to || '') ? req.query.to : currentDate();
    const numberSize = String(req.query.numberSize) === '3' ? 3 : 2;
    const window = ['1', '2', '3'].includes(String(req.query.window)) ? Number(req.query.window) : 3;
    const source = ['all', 'priority-one', 'priority-two', 'bac-nho', 'bong-am-duong', 'ghep-g7', 'ghep-gdb-g4-g5'].includes(String(req.query.source)) ? String(req.query.source) : 'all';
    if (from > to) return res.status(400).json({ error: 'Ngày bắt đầu phải trước ngày kết thúc.' });
    const result = await pool.query(`SELECT target_date::text AS date, vip_mode, number_size, window_size, payload, generated_at
      FROM vip_result_history
      WHERE target_date BETWEEN $1 AND $2 AND number_size = $3 AND window_size = $4
        AND COALESCE((payload ->> 'hits')::int, 0) > 0
      ORDER BY target_date DESC, vip_mode`, [from, to, numberSize, window]);
    const grouped = new Map();
    result.rows.forEach((row) => {
      const payload = filterVipPayloadBySource(row.payload, source);
      if (!payload.hits) return;
      if (!grouped.has(row.date)) grouped.set(row.date, { date: row.date, items: [] });
      grouped.get(row.date).items.push({ vipMode: row.vip_mode, numberSize: row.number_size, window: row.window_size, generatedAt: row.generated_at, ...payload });
    });
    return res.json({ from, to, numberSize, window, source, days: [...grouped.values()] });
  } catch (error) { return next(error); }
};

export const getResearchBacktest = async (_req, res, next) => {
  try {
    return res.json({ report: await getInternalBacktest(), referenceReport: await getReferenceFormulaBacktest() });
  } catch (error) { return next(error); }
};

export const refreshResearchBacktest = async (_req, res, next) => {
  try {
    return res.json({ report: await refreshInternalBacktest() });
  } catch (error) { return next(error); }
};

export const refreshReferenceResearchBacktest = async (_req, res, next) => {
  try {
    return res.json({ report: await refreshReferenceFormulaBacktest() });
  } catch (error) { return next(error); }
};
