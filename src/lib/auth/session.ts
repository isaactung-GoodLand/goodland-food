import { pool } from '@/lib/db';

/**
 * Lightweight session lookup for middleware (Edge-runtime safe).
 * Does NOT import bcryptjs or Node.js crypto — those are server-only.
 */
export async function getSessionFromCookie(sessionId: string): Promise<{ userId: number } | null> {
  if (!sessionId) return null;

  try {
    const result = await pool.query<{ user_id: number; expires_at: Date }>(
      'SELECT user_id, expires_at FROM admin_sessions WHERE id = $1',
      [sessionId]
    );
    if (!result.rows[0]) return null;
    if (new Date(result.rows[0].expires_at) < new Date()) {
      await pool.query('DELETE FROM admin_sessions WHERE id = $1', [sessionId]);
      return null;
    }
    return { userId: result.rows[0].user_id };
  } catch {
    // DB unavailable — fail open in middleware to avoid blocking all requests
    // The actual API routes will enforce auth
    return null;
  }
}
