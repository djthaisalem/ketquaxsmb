CREATE TABLE IF NOT EXISTS internal_backtest_reports (
  report_key TEXT PRIMARY KEY,
  source_through_date DATE NOT NULL,
  payload JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
