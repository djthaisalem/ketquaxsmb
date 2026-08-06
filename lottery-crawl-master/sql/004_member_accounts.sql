ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS pending_membership_plan_id BIGINT REFERENCES membership_plans(id) ON DELETE SET NULL;
ALTER TABLE cms_users ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS cms_users_email_unique
  ON cms_users (LOWER(email))
  WHERE email IS NOT NULL;
