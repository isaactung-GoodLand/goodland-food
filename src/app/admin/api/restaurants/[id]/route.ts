import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

  const res = await pool.query(
    `SELECT r.*, 
            COALESCE(json_agg(
              json_build_object('id', cl.id, 'contact_date', cl.contact_date, 'contact_type', cl.contact_type, 'notes', cl.notes, 'created_at', cl.created_at)
              ORDER BY cl.contact_date DESC
            ) FILTER (WHERE cl.id IS NOT NULL), '[]') as contact_logs
     FROM restaurants r
     LEFT JOIN contact_logs cl ON cl.restaurant_id = r.id
     WHERE r.id = $1
     GROUP BY r.id`,
    [id]
  );

  if (res.rows.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(res.rows[0]);
}
