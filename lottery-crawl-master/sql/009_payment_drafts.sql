DO $$ BEGIN
  ALTER TABLE payment_requests DROP CONSTRAINT IF EXISTS payment_requests_status_check;
  ALTER TABLE payment_requests ADD CONSTRAINT payment_requests_status_check CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));
END $$;
