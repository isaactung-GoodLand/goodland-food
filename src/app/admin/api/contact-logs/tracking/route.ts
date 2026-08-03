import { pool } from '@/lib/db';

/**
 * GET /admin/api/contact-logs/tracking?days=N
 *
 * Returns one row per restaurant that has at least one contact log,
 * showing the *latest* log (status, notes, contact_type, contact_date)
 * and the restaurant's basic info (name, city, district, priority).
 *
 * Query params:
 *   days (optional): restrict to restaurants whose last contact_date
 *                    is N days ago OR OLDER — i.e. "hasn't been contacted
 *                    in N days or more". 7, 30, 60, 180, 365.
 *                    If omitted, no time filter — returns all tracked
 *                    restaurants.
 *                    The page UI labels it as 「N 天以上沒聯絡」.
 *
 * Restaurants that are soft-deleted (disabled_at IS NOT NULL) are
 * excluded by default — they're not currently actionable.
 *
 * Implementation: Postgres DISTINCT ON (restaurant_id) gives us
 * one-row-per-restaurant without a window function / sub-select.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get('days');
  const days = daysParam && /^\d+$/.test(daysParam) ? parseInt(daysParam, 10) : null;

  // 1) Inner DISTINCT ON to pick the latest log per restaurant
  // 2) Filter by latest contact_date in outer WHERE
  //    Semantics: 「N 天以上沒聯絡」 → contact_date <= today - N days
  // 3) ORDER BY latest_contact_date ASC for the UI (most stale on top)
  const sql = `
    WITH latest_logs AS (
      SELECT DISTINCT ON (cl.restaurant_id)
        cl.restaurant_id,
        cl.id              AS latest_log_id,
        cl.contact_type    AS latest_contact_type,
        cl.notes           AS latest_notes,
        cl.contact_date    AS latest_contact_date,
        cl.status          AS latest_status,
        cl.created_at      AS latest_created_at
      FROM contact_logs cl
      ORDER BY cl.restaurant_id, cl.contact_date DESC, cl.id DESC
    )
    SELECT
      ll.restaurant_id,
      r.name              AS restaurant_name,
      r.city              AS restaurant_city,
      r.district          AS restaurant_district,
      r.priority          AS restaurant_priority,
      r.phone             AS restaurant_phone,
      ll.latest_log_id,
      ll.latest_contact_type,
      ll.latest_notes,
      ll.latest_contact_date,
      ll.latest_status,
      ll.latest_created_at,
      (SELECT COUNT(*)::int FROM contact_logs cl2 WHERE cl2.restaurant_id = r.id) AS total_logs
    FROM latest_logs ll
    JOIN restaurants r ON r.id = ll.restaurant_id
    WHERE r.disabled_at IS NULL
      ${days !== null ? 'AND ll.latest_contact_date <= CURRENT_DATE - $1::int * INTERVAL \'1 day\'' : ''}
    ORDER BY ll.latest_contact_date ASC
  `;

  const params = days !== null ? [days] : [];

  try {
    const res = await pool.query(sql, params);
    return Response.json({ tracking: res.rows, count: res.rows.length, days });
  } catch (err) {
    return Response.json(
      { error: 'tracking query failed', detail: String(err) },
      { status: 500 }
    );
  }
}
