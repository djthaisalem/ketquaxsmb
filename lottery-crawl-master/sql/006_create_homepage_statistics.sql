CREATE TABLE IF NOT EXISTS homepage_statistics (
  statistic_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
