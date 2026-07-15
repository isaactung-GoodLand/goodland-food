import { pool } from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json();
  const { restaurant_id, contact_type, notes, contact_date } = body;
  if (!restaurant_id || !contact_type) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // 軟刪除守門：已停用店家不接受新聯絡紀錄
  // 想繼續記錄聯絡的話，先 restore 該店家
  const statusCheck = await pool.query(
    'SELECT disabled_at FROM restaurants WHERE id = $1',
    [restaurant_id]
  );
  if (statusCheck.rows.length === 0) {
    return Response.json({ error: 'Restaurant not found' }, { status: 404 });
  }
  if (statusCheck.rows[0].disabled_at !== null) {
    return Response.json(
      { error: 'Restaurant is disabled; restore it before adding contact logs' },
      { status: 409 }
    );
  }

  const res = await pool.query(
    `INSERT INTO contact_logs (restaurant_id, contact_type, notes, contact_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [restaurant_id, contact_type, notes || '', contact_date || new Date().toISOString()]
  );
  return Response.json(res.rows[0], { status: 201 });
}
