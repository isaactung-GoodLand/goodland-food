-- Migration: create admin_users table
-- Run once against Neon DB

CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  recovery_token TEXT,
  recovery_token_exp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed existing admin user (bcrypt hash of 'myLand0933885114', cost 12)
-- Hash generated via: bcrypt.hashpw('myLand0933885114'.encode(), bcrypt.gensalt(12))
INSERT INTO admin_users (email, password_hash)
VALUES ('goodland@goodland-food.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.FRnFJ4.1I7Uv2i')
ON CONFLICT (email) DO NOTHING;
