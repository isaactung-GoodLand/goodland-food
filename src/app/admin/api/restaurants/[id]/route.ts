import { pool } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await pool.query('SELECT * FROM restaurants WHERE id = $1', [id]);
  if (r.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
  const logs = await pool.query(
    'SELECT * FROM contact_logs WHERE restaurant_id = $1 ORDER BY contact_date DESC',
    [id]
  );
  return Response.json({ ...r.rows[0], contact_logs: logs.rows });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const { name, phone, facebook, instagram, line, address, priority } = body;

  // 軟刪除守門:已停用的店家預設不能編輯,避免在背景誤改已下架資料
  // 若 admin 明確允許(例如:恢復前要先修地址),帶 ?allow_disabled=true
  const { searchParams } = new URL(request.url);
  const allowDisabled = searchParams.get('allow_disabled') === 'true';
  const guardClause = allowDisabled ? '' : 'AND disabled_at IS NULL';

  // priority: number (1..5) | null | undefined。
  //   - undefined: 沒帶 → 保留原值
  //   - null:      清除
  //   - 數字但不在 1..5: 視為無效,保留原值(不偷偷改)
  function normalizePriority(raw: unknown): { touch: boolean; value: number | null } {
    if (raw === undefined) return { touch: false, value: null };
    if (raw === null) return { touch: true, value: null };
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 1 || n > 5) return { touch: false, value: null };
    return { touch: true, value: Math.trunc(n) };
  }
  const { touch: touchPriority, value: priorityValue } = normalizePriority(priority);

  const res = await pool.query(
    `UPDATE restaurants SET
       name = COALESCE($1, name),
       phone = COALESCE($2, phone),
       facebook = COALESCE($3, facebook),
       instagram = COALESCE($4, instagram),
       line = COALESCE($5, line),
       address = COALESCE($6, address),
       priority = CASE WHEN $8::boolean THEN $7::smallint ELSE priority END,
       updated_at = NOW()
     WHERE id = $9 ${guardClause}
     RETURNING *`,
    [name, phone, facebook, instagram, line, address, priorityValue, touchPriority, id]
  );
  if (res.rows.length === 0) {
    // 區分 404 vs 409（已停用）
    const check = await pool.query('SELECT id, disabled_at FROM restaurants WHERE id = $1', [id]);
    if (check.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(
      { error: 'Restaurant is disabled; restore it first or pass ?allow_disabled=true' },
      { status: 409 }
    );
  }
  return Response.json(res.rows[0]);
}

/**
 * 軟刪除（disable）店家。
 * - 寫 disabled_at = NOW()
 * - 保留 contact_logs 供稽核／日後恢復
 * - 這個操作可逆：用 POST /restore 即可復原
 *
 * Body 參數（皆可選）：
 *   reason: string  - 停用原因，會存進 disabled_reason
 *   by:     string  - 執行者識別，會存進 disabled_by（預設 'admin'）
 */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let reason = '';
  let by = 'admin';
  try {
    const body = await request.json().catch(() => ({}));
    if (body && typeof body === 'object') {
      if (typeof body.reason === 'string') reason = body.reason.slice(0, 500);
      if (typeof body.by === 'string') by = body.by.slice(0, 100);
    }
  } catch {
    // 沒 body 也沒關係，用預設值
  }

  const res = await pool.query(
    `UPDATE restaurants SET
       disabled_at = NOW(),
       disabled_reason = $1,
       disabled_by = $2,
       updated_at = NOW()
     WHERE id = $3 AND disabled_at IS NULL
     RETURNING id, name, disabled_at`,
    [reason || null, by, id]
  );
  if (res.rows.length === 0) {
    // 區分：根本不存在 vs 已經被停用
    const check = await pool.query('SELECT id, disabled_at FROM restaurants WHERE id = $1', [id]);
    if (check.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(
      { error: 'Already disabled', disabled_at: check.rows[0].disabled_at },
      { status: 409 }
    );
  }
  return Response.json({ disabled: true, restaurant: res.rows[0] });
}
