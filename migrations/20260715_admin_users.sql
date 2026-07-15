-- Migration: admin_users table for DB-backed authentication
-- Created: 2026-07-15
-- Purpose: replace env-var auth with DB-stored credentials; enables password rotation without redeploy

BEGIN;

CREATE TABLE IF NOT EXISTS admin_users (
  id          SERIAL PRIMARY KEY,
  email       TEXT    NOT NULL UNIQUE,
  password    TEXT    NOT NULL,   -- bcrypt hash
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed the default admin account (password: myLand0933885114)
-- bcrypt cost 12 hash; replace via /admin/api/auth/settings after first login
INSERT INTO admin_users (email, password)
VALUES (
  'goodland@goodland-food.com',
  -- plain: myLand0933885114
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.bYoCjEX6J.nLTO'
)
ON CONFLICT (email) DO NOTHING;

-- Allow future password-only updates without touching email or id
CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);

COMMIT;
