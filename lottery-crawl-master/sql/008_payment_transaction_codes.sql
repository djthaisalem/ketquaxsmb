ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS transaction_code VARCHAR(8);
DO $$ BEGIN
  ALTER TABLE payment_requests ADD CONSTRAINT payment_requests_transaction_code_format CHECK (transaction_code IS NULL OR transaction_code ~ '^[A-Z0-9]{8}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS payment_requests_transaction_code_unique ON payment_requests (transaction_code) WHERE transaction_code IS NOT NULL;
