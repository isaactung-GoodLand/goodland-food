-- Migration: create admin_sessions table
-- Run against Neon DB after 20260716_admin_users.sql
-- Created: 2026-07-16

BEGIN;

CREATE TABLE IF NOT EXISTS admin_sessions (
  id          TEXT PRIMARY KEY,          -- UUID session token (stored in cookie)
  user_id     INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Fast lookup by session id (index on the primary key column is automatic for TEXT PRIMARY KEY)
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions (expires_at)
  WHERE expires_at > NOW();  -- partial index: only active sessions

COMMENT ON TABLE admin_sessions IS 'Login sessions; id is stored in httpOnly cookie';

COMMIT;

-- Rollback
-- BEGIN;
--   DROP TABLE IF EXISTS admin_sessions;
-- COMMIT;
