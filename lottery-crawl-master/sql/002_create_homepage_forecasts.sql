CREATE TABLE IF NOT EXISTS homepage_forecasts (
  target_date DATE NOT NULL,
  category TEXT NOT NULL,
  numbers JSONB NOT NULL,
  formula TEXT NOT NULL,
  rate NUMERIC(5,2) NOT NULL,
  wins INTEGER NOT NULL,
  signals INTEGER NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (target_date, category)
);
