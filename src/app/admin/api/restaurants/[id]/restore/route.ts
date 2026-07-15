import { pool } from '@/lib/db';

/**
 * 恢復已停用的店家。
 * - 清掉 disabled_at
 * - 寫 restored_at = NOW() 留稽核
 * - contact_logs 自動重新可見
 */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await pool.query(
    `UPDATE restaurants SET
       disabled_at = NULL,
       disabled_reason = NULL,
       disabled_by = NULL,
       restored_at = NOW(),
       updated_at = NOW()
     WHERE id = $1 AND disabled_at IS NOT NULL
     RETURNING id, name, restored_at`,
    [id]
  );
  if (res.rows.length === 0) {
    const check = await pool.query('SELECT id, disabled_at FROM restaurants WHERE id = $1', [id]);
    if (check.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ error: 'Not disabled; nothing to restore' }, { status: 409 });
  }
  return Response.json({ restored: true, restaurant: res.rows[0] });
}
