import { readFile } from 'node:fs/promises';
import { config } from 'dotenv';
import pg from 'pg';

config();
if (!process.env.DATABASE_URL) {
  throw new Error('Thiếu DATABASE_URL trong file .env.');
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(await readFile(new URL('../sql/001_create_lottery_results.sql', import.meta.url), 'utf8'));
  await client.query(await readFile(new URL('../sql/002_create_homepage_forecasts.sql', import.meta.url), 'utf8'));
  await client.query(await readFile(new URL('../sql/003_create_cms.sql', import.meta.url), 'utf8'));
  await client.query(await readFile(new URL('../sql/004_member_accounts.sql', import.meta.url), 'utf8'));
  await client.query(await readFile(new URL('../sql/005_vip_strategy_snapshots.sql', import.meta.url), 'utf8'));
  await client.query(await readFile(new URL('../sql/006_create_homepage_statistics.sql', import.meta.url), 'utf8'));
  await client.query(await readFile(new URL('../sql/007_payment_requests.sql', import.meta.url), 'utf8'));
  await client.query(await readFile(new URL('../sql/008_payment_transaction_codes.sql', import.meta.url), 'utf8'));
  await client.query(await readFile(new URL('../sql/009_payment_drafts.sql', import.meta.url), 'utf8'));
  await client.query(await readFile(new URL('../sql/010_vip_result_history.sql', import.meta.url), 'utf8'));
  await client.query(await readFile(new URL('../sql/011_internal_backtests.sql', import.meta.url), 'utf8'));
  console.log('Đã tạo schema PostgreSQL.');
} finally {
  await client.end();
}
