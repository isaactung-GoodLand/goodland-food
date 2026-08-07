import { pool } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const plan = searchParams.get('plan');

  try {
    const storesRes = plan
      ? await pool.query(
          'SELECT * FROM hk_itinerary_stores WHERE plan = $1 ORDER BY day, visit_order',
          [plan]
        )
      : await pool.query('SELECT * FROM hk_itinerary_stores ORDER BY plan, day, visit_order');

    const lodgingRes = await pool.query(
      'SELECT * FROM hk_lodging_options WHERE enabled = TRUE ORDER BY city, type, display_order, id'
    );

    return Response.json({
      stores: storesRes.rows,
      lodging: lodgingRes.rows,
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// 更新單筆店家狀態/備註
export async function POST(request: Request) {
  const body = await request.json();
  const { id, status, notes } = body;

  if (!id) {
    return Response.json({ error: 'Missing id' }, { status: 400 });
  }

  const ALLOWED_STATUS = new Set(['pending', 'visited', 'skipped', 'closed']);
  const cleanStatus =
    typeof status === 'string' && ALLOWED_STATUS.has(status) ? status : null;

  try {
    const visitedAt =
      cleanStatus === 'visited' ? new Date().toISOString() : null;

    const res = await pool.query(
      `UPDATE hk_itinerary_stores
       SET status = COALESCE($1, status),
           notes = COALESCE($2, notes),
           visited_at = CASE WHEN $1 = 'visited' THEN $3
                             WHEN $1 IS NOT NULL AND $1 != 'visited' THEN NULL
                             ELSE visited_at END,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [cleanStatus, notes ?? null, visitedAt, id]
    );

    if (res.rows.length === 0) {
      return Response.json({ error: 'Store not found' }, { status: 404 });
    }

    return Response.json(res.rows[0]);
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
