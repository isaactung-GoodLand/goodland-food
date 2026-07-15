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

    // Seed default admin (bcrypt hash of myLand0933885114, cost 12)
    await client.query(`
      INSERT INTO admin_users (email, password)
      VALUES (
        'goodland@goodland-food.com',
        '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.bYoCjEX6J.nLTO'
      )
      ON CONFLICT (email) DO NOTHING;
    `);

    return NextResponse.json({ ok: true, message: 'admin_users table ready' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    client.release();
  }
}
