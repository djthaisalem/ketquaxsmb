CREATE TABLE IF NOT EXISTS vip_result_history (
  target_date DATE NOT NULL,
  vip_mode TEXT NOT NULL CHECK (vip_mode IN ('vip1', 'vip2')),
  number_size SMALLINT NOT NULL CHECK (number_size IN (2, 3)),
  window_size SMALLINT NOT NULL CHECK (window_size IN (1, 2, 3)),
  payload JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (target_date, vip_mode, number_size, window_size)
);

CREATE INDEX IF NOT EXISTS vip_result_history_lookup_idx
  ON vip_result_history (number_size, window_size, target_date DESC);
