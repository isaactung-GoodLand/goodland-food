import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

// GET /admin/api/auth/setup - Run once to create admin_users table and seed default account
export async function POST() {
  const client = await pool.connect();
  try {
    // Create table
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id          SERIAL PRIMARY KEY,
        email       TEXT    NOT NULL UNIQUE,
        password    TEXT    NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Seed/update default admin (bcrypt $2b$ hash of myLand0933885114, cost 12)
    await client.query(`
      INSERT INTO admin_users (email, password)
      VALUES (
        'goodland@goodland-food.com',
        '$2b$12$./mzRd9lPwl188CAQ/2rq.nIhaGVrCHghC99AxW41YKl7k/fyuoH.'
      )
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, updated_at = NOW();
    `);

    return NextResponse.json({ ok: true, message: 'admin_users table ready' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
