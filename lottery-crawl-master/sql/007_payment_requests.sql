CREATE TABLE IF NOT EXISTS payment_requests (
  id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES cms_users(id) ON DELETE CASCADE,
  plan_id BIGINT NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('vietqr', 'momo', 'zalopay', 'viettelpay')),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_requests_status_created_idx ON payment_requests (status, created_at DESC);
