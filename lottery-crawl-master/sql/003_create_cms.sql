CREATE TABLE IF NOT EXISTS membership_plans (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  membership_plan_id BIGINT REFERENCES membership_plans(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_settings (
  setting_key TEXT PRIMARY KEY,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO membership_plans (name, price, duration_days, features)
VALUES
  ('Miễn phí', 0, 3650, '["Tra cứu kết quả", "Thống kê cơ bản"]'::jsonb),
  ('VIP tháng', 199000, 30, '["Chiến lược 2 số", "Chiến lược 3 số", "Tối ưu winrate VIP"]'::jsonb),
  ('VIP năm', 1499000, 365, '["Toàn bộ tính năng VIP", "Ưu tiên hỗ trợ"]'::jsonb)
ON CONFLICT (name) DO NOTHING;

INSERT INTO cms_users (username, full_name, role)
VALUES ('admin', 'Quản trị viên', 'admin')
ON CONFLICT (username) DO NOTHING;

INSERT INTO api_settings (setting_key, setting_value)
VALUES
  ('crawler', '{"source":"Minh Ngọc","schedule":"19:00 mỗi ngày","enabled":true}'::jsonb),
  ('public_api', '{"base_path":"/api/lottery","enabled":true}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
