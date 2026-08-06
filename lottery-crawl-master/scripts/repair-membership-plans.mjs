import pool from '../src/db.mjs';

const plans = [
  ['Gói Tháng', 199000, 30, ['Dự đoán mỗi ngày', '3 cặp số/ngày', 'Thống kê cơ bản']],
  ['Gói Quý', 499000, 90, ['Dự đoán mỗi ngày', '5 cặp số/ngày', 'Thống kê nâng cao', 'Hỗ trợ ưu tiên', 'Báo cáo tuần']],
  ['Gói Năm', 1499000, 365, ['Tất cả tính năng Quý', '10 cặp số/ngày', 'AI dự đoán riêng', 'Hỗ trợ VIP 24/7', 'Báo cáo tháng và năm']],
];

try {
  for (const [index, [name, price, durationDays, features]] of plans.entries()) {
    await pool.query("UPDATE membership_plans SET name = $1, price = $2, duration_days = $3, features = $4, status = 'active', updated_at = NOW() WHERE id = $5", [name, price, durationDays, JSON.stringify(features), index + 1]);
  }
  console.log('Membership plans repaired.');
} finally {
  await pool.end();
}
