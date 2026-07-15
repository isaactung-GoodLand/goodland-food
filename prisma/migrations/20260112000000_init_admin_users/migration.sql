CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  recovery_token TEXT,
  recovery_token_exp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX admin_users_email_idx ON admin_users(email);
CREATE UNIQUE INDEX admin_users_recovery_token_idx ON admin_users(recovery_token) WHERE recovery_token IS NOT NULL;
