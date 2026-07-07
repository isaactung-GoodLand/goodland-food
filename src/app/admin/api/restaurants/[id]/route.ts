import { pool } from '@/lib/db';

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
