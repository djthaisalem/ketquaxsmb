import { config } from 'dotenv';
import pg from 'pg';

config();

if (!process.env.DATABASE_URL) {
  throw new Error('Thiếu DATABASE_URL trong file .env.');
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export default pool;
