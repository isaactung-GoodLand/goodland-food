import { NextRequest } from 'next/server';
import { pool } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr, 10);
  if (!id) return Response.json({ error: 'Invalid id' }, { status: 400 });

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const status = body.status;
  if (!['verified', 'unverified', 'duplicate'].includes(status)) {
    return Response.json({ error: 'Invalid status. Must be verified | unverified | duplicate' }, { status: 400 });
  }

  try {
    const res = await pool.query(
      `UPDATE restaurants SET verified_status = $1 WHERE id = $2 RETURNING id, name, verified_status, duplicate_of`,
      [status, id]
    );
    if (res.rows.length === 0) {
      return Response.json({ error: 'Restaurant not found' }, { status: 404 });
    }
    return Response.json({ restaurant: res.rows[0] });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
