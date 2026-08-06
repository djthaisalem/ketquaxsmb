CREATE TABLE IF NOT EXISTS lottery_draws (
  draw_date DATE PRIMARY KEY,
  source_url TEXT NOT NULL,
  crawled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lottery_prizes (
  draw_date DATE NOT NULL REFERENCES lottery_draws(draw_date) ON DELETE CASCADE,
  prize_code TEXT NOT NULL CHECK (prize_code IN ('db', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7')),
  numbers TEXT[] NOT NULL,
  PRIMARY KEY (draw_date, prize_code)
);

CREATE TABLE IF NOT EXISTS crawl_runs (
  id BIGSERIAL PRIMARY KEY,
  source_name TEXT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  successful_days INTEGER NOT NULL DEFAULT 0,
  failed_days INTEGER NOT NULL DEFAULT 0,
  errors JSONB NOT NULL DEFAULT '[]'::jsonb
);
