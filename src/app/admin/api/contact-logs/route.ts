import { pool } from '@/lib/db';

export async function POST(request: Request) {
  const body = await request.json();
  const { restaurant_id, contact_type, notes, contact_date } = body;
  if (!restaurant_id || !contact_type) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const res = await pool.query(
    `INSERT INTO contact_logs (restaurant_id, contact_type, notes, contact_date)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [restaurant_id, contact_type, notes || '', contact_date || new Date().toISOString()]
  );
  return Response.json(res.rows[0], { status: 201 });
}
