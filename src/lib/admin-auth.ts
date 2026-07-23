import bcrypt from 'bcryptjs';
import { pool } from './db';

const BCRYPT_ROUNDS = 12;

export interface AdminUser {
  id: number;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

/** Verify email + plain-text password against the DB. Returns the user row on success. */
export async function verifyAdminCredentials(
  email: string,
  plainPassword: string
): Promise<AdminUser | null> {
  const result = await pool.connect();
  try {
    const { rows } = await result.query<AdminUser>(
      'SELECT id, email, password_hash, created_at, updated_at FROM admin_users WHERE email = $1',
      [email]
    );
    if (!rows[0]) return null;
    const valid = await bcrypt.compare(plainPassword, rows[0].password_hash);
    return valid ? rows[0] : null;
  } finally {
    result.release();
  }
}

/** Hash a plain-text password. Call this when setting or rotating a password. */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_ROUNDS);
}

/** Update an admin user's password by email. */
export async function updateAdminPassword(
  email: string,
  plainPassword: string
): Promise<void> {
  const hash = await hashPassword(plainPassword);
  const result = await pool.connect();
  try {
    await result.query(
      'UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE email = $2',
      [hash, email]
    );
  } finally {
    result.release();
  }
}
