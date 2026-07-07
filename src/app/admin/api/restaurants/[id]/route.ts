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
  const { name, phone, facebook, instagram, line, address } = body;
  const res = await pool.query(
    `UPDATE restaurants SET
       name = COALESCE($1, name),
       phone = COALESCE($2, phone),
       facebook = COALESCE($3, facebook),
       instagram = COALESCE($4, instagram),
       line = COALESCE($5, line),
       address = COALESCE($6, address),
       updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [name, phone, facebook, instagram, line, address, id]
  );
  if (res.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(res.rows[0]);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await pool.query('DELETE FROM contact_logs WHERE restaurant_id = $1', [id]);
  const res = await pool.query('DELETE FROM restaurants WHERE id = $1 RETURNING id', [id]);
  if (res.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ deleted: true });
}
