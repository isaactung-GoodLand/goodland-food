import { randomUUID } from 'crypto';
import bcrypt from 'bcryptjs';
import { pool } from '@/lib/db';

export interface AdminUser {
  id: number;
  email: string;
  password_hash: string;
  recovery_token: string | null;
  recovery_token_exp: Date | null;
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: Date;
}

// ── User queries ──────────────────────────────────────────────────────────────

export async function getAdminUserByEmail(email: string): Promise<AdminUser | null> {
  const result = await pool.query<AdminUser>(
    'SELECT * FROM admin_users WHERE email = $1',
    [email]
  );
  return result.rows[0] ?? null;
}

export async function getAdminUserById(id: number): Promise<AdminUser | null> {
  const result = await pool.query<AdminUser>(
    'SELECT * FROM admin_users WHERE id = $1',
    [id]
  );
  return result.rows[0] ?? null;
}

// ── Password ─────────────────────────────────────────────────────────────────

export async function verifyPassword(user: AdminUser, plainPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, user.password_hash);
}

export async function updatePassword(userId: number, plainPassword: string): Promise<void> {
  const hash = await bcrypt.hash(plainPassword, 12);
  await pool.query(
    'UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [hash, userId]
  );
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function createSession(userId: number): Promise<Session> {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await pool.query(
    'INSERT INTO admin_sessions (id, user_id, expires_at) VALUES ($1, $2, $3)',
    [id, userId, expiresAt]
  );
  return { id, user_id: userId, expires_at: expiresAt };
}

export async function getSession(sessionId: string): Promise<{ userId: number } | null> {
  const result = await pool.query<{ user_id: number; expires_at: Date }>(
    'SELECT user_id, expires_at FROM admin_sessions WHERE id = $1',
    [sessionId]
  );
  if (!result.rows[0]) return null;
  if (new Date(result.rows[0].expires_at) < new Date()) {
    // Expired — clean up
    await pool.query('DELETE FROM admin_sessions WHERE id = $1', [sessionId]);
    return null;
  }
  return { userId: result.rows[0].user_id };
}

export async function deleteSession(sessionId: string): Promise<void> {
  await pool.query('DELETE FROM admin_sessions WHERE id = $1', [sessionId]);
}

// ── Recovery tokens ──────────────────────────────────────────────────────────
// Token is a UUID stored in plaintext; a hash of it is stored in recovery_token.
// This lets us verify without storing the plaintext in the DB permanently.

export async function createRecoveryToken(email: string): Promise<string | null> {
  const user = await getAdminUserByEmail(email);
  if (!user) return null;

  const token = randomUUID();
  const hash = await bcrypt.hash(token, 10);
  const exp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await pool.query(
    `UPDATE admin_users
       SET recovery_token = $1, recovery_token_exp = $2, updated_at = NOW()
       WHERE id = $3`,
    [hash, exp, user.id]
  );

  return token; // Return plaintext — caller (or email) sends to user
}

export async function consumeRecoveryToken(token: string): Promise<number | null> {
  // Find any user with a non-expired token
  const users = await pool.query<AdminUser>(
    `SELECT * FROM admin_users
       WHERE recovery_token IS NOT NULL
         AND recovery_token_exp > NOW()`
  );

  for (const user of users.rows) {
    const valid = await bcrypt.compare(token, user.recovery_token!);
    if (valid) {
      // Clear token immediately (single-use)
      await pool.query(
        `UPDATE admin_users
           SET recovery_token = NULL, recovery_token_exp = NULL, updated_at = NOW()
           WHERE id = $1`,
        [user.id]
      );
      return user.id;
    }
  }
  return null;
}
