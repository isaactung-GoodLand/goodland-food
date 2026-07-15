import { pool } from '@/lib/db';

/**
 * 永久刪除店家（hard delete）。
 * - 這是 **不可逆** 操作
 * - 連同 contact_logs 一起刪
 * - 個資法 §11 提醒：交易憑證應保留；呼叫端需確認合規後再呼叫
 *
 * 預期使用情境：
 *   - 客戶明確要求刪除個資（且不是交易對象）
 *   - 重複資料清理
 *   - 測試資料
 *
 * Body 參數：
 *   confirm: 'PURGE'  - 必填，避免誤刪
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    // 沒 body 視同未確認
  }
  if (body.confirm !== 'PURGE') {
    return Response.json(
      { error: 'Hard delete requires confirm="PURGE" in body' },
      { status: 400 }
    );
  }

  // 先確認存在
  const check = await pool.query('SELECT id, name FROM restaurants WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  await pool.query('DELETE FROM contact_logs WHERE restaurant_id = $1', [id]);
  const res = await pool.query('DELETE FROM restaurants WHERE id = $1 RETURNING id, name', [id]);
  return Response.json({ purged: true, restaurant: res.rows[0] });
}
