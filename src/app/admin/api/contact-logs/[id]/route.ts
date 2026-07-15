import { pool } from '@/lib/db';

/**
 * 編輯單一聯絡紀錄（目前只支援改 notes）。
 * - 軟刪除守門：已停用店家的聯絡紀錄不允許編輯（避免背景誤改）
 *   想改的話先 restore 店家
 * - 編輯後 updated_at = NOW() 留 audit（schema 若有該欄位的話；目前沒，註解保留）
 */
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const { notes } = body ?? {};

  if (typeof notes !== 'string') {
    return Response.json({ error: 'notes must be a string' }, { status: 400 });
  }
  if (notes.length > 2000) {
    return Response.json({ error: 'notes too long (max 2000 chars)' }, { status: 400 });
  }

  // 先查 contact_log 確認存在 + 對應 restaurant 是否停用
  const logCheck = await pool.query(
    `SELECT cl.id, r.disabled_at
       FROM contact_logs cl
       JOIN restaurants r ON r.id = cl.restaurant_id
      WHERE cl.id = $1`,
    [id]
  );
  if (logCheck.rows.length === 0) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (logCheck.rows[0].disabled_at !== null) {
    return Response.json(
      { error: 'Restaurant is disabled; restore it before editing contact logs' },
      { status: 409 }
    );
  }

  const res = await pool.query(
    `UPDATE contact_logs SET notes = $1 WHERE id = $2 RETURNING *`,
    [notes, id]
  );
  return Response.json(res.rows[0]);
}

/**
 * 刪除單一聯絡紀錄（hard delete）。
 * - 不可逆
 * - 軟刪除守門同上：已停用店家的紀錄不允許刪除
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const logCheck = await pool.query(
    `SELECT cl.id, r.disabled_at
       FROM contact_logs cl
       JOIN restaurants r ON r.id = cl.restaurant_id
      WHERE cl.id = $1`,
    [id]
  );
  if (logCheck.rows.length === 0) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (logCheck.rows[0].disabled_at !== null) {
    return Response.json(
      { error: 'Restaurant is disabled; restore it before deleting contact logs' },
      { status: 409 }
    );
  }

  const res = await pool.query(
    `DELETE FROM contact_logs WHERE id = $1 RETURNING id`,
    [id]
  );
  if (res.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ deleted: true, id: res.rows[0].id });
}
