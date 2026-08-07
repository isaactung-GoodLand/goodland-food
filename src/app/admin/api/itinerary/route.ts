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

    // Audit: 對每個店家找 CRM restaurant_id + city mismatch
    // 一次 SQL JOIN 撈全部,避免 N+1
    const auditRes = await pool.query(`
      SELECT
        s.id AS store_id,
        s.store_name AS hk_name,
        s.store_address AS hk_city,
        r.id AS restaurant_id,
        r.name AS crm_name,
        r.city AS crm_city
      FROM hk_itinerary_stores s
      LEFT JOIN restaurants r
        ON LOWER(TRIM(r.name)) = LOWER(TRIM(s.store_name))
        AND r.disabled_at IS NULL
      ${plan ? 'WHERE s.plan = $1' : ''}
    `, plan ? [plan] : []);

    const auditMap: Record<number, {
      restaurant_id: number | null;
      crm_name: string | null;
      crm_city: string | null;
      city_mismatch: boolean;
      not_in_crm: boolean;
    }> = {};
    for (const row of auditRes.rows) {
      const notInCrm = row.restaurant_id === null;
      const cityMismatch = !notInCrm && row.crm_city && row.hk_city &&
        !row.crm_city.includes(row.hk_city) && !row.hk_city.includes(row.crm_city.replace(/[縣市]/g, ''));
      auditMap[row.store_id] = {
        restaurant_id: row.restaurant_id,
        crm_name: row.crm_name,
        crm_city: row.crm_city,
        city_mismatch: !!cityMismatch,
        not_in_crm: notInCrm
      };
    }

    return Response.json({
      stores: storesRes.rows,
      lodging: lodgingRes.rows,
      audit: auditMap,
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

// 確保 CRM 沒有此店家時自動新增
export async function POST(request: Request) {
  const body = await request.json();
  const { id, status, notes, auto_create_crm } = body;
  const AUTO_CREATE = auto_create_crm === true;

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

    const updated = res.rows[0];

    // 確保 CRM 有對應店家 (visited 時自動 sync + AUTO_CREATE 時強制新增)
    let syncedContactLogId: number | null = null;
    let matchedRestaurant: { id: number; name: string } | null = null;
    let autoCreated = false;

    // 1. 找 CRM restaurant_id
    const exactMatch = await pool.query(
      `SELECT id, name, city FROM restaurants
       WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
         AND disabled_at IS NULL
       LIMIT 1`,
      [updated.store_name]
    );

    let matchRes = exactMatch;

    if (matchRes.rows.length === 0) {
      // Fuzzy: 用店名前 4 字 + store_address 縣市模糊比對
      const matchKey = updated.store_name.replace(/[港式飲茶餐廳店樓館坊軒]/g, '').slice(0, 4) || updated.store_name.slice(0, 4);
      const addressPrefix = (updated.store_address || '').slice(0, 2);

      matchRes = await pool.query(
        `SELECT id, name, city FROM restaurants
         WHERE LOWER(TRIM(name)) LIKE LOWER($1)
           AND disabled_at IS NULL
           AND ($2 = '' OR LOWER(city) LIKE LOWER($2) OR LOWER(city) LIKE LOWER($3))
         ORDER BY id
         LIMIT 1`,
        [`%${matchKey}%`, `%${addressPrefix}%`, `%${addressPrefix.replace(/[縣市]/g, '')}%`]
      );
    }

    // 2. 處理 AUTO_CREATE (找不到就新增)
    if (matchRes.rows.length === 0 && AUTO_CREATE) {
      const newCrmRes = await pool.query(
        `INSERT INTO restaurants (name, city, has_hongkong_milk_tea, priority)
         VALUES ($1, $2, $3, 1)
         RETURNING id, name, city`,
        [updated.store_name, updated.store_address || null, true]
      );
      const newR = newCrmRes.rows[0];
      matchRes = { rows: [newR] } as any;
      autoCreated = true;
    }

    // 3. 若 status=visited 且有對應店家 → 寫 contact_log
    if (cleanStatus === 'visited' && matchRes.rows.length > 0) {
      const r = matchRes.rows[0];
      matchedRestaurant = { id: r.id, name: r.name };

      const notesPrefix = autoCreated ? '(auto-created CRM) ' : '';
      const notesText = updated.notes
        ? `[hk-itinerary ${updated.plan} D${updated.day}] ${notesPrefix}${updated.notes}`
        : `[hk-itinerary ${updated.plan} D${updated.day}] ${notesPrefix}已拜訪`;

      const contactLogRes = await pool.query(
        `INSERT INTO contact_logs (restaurant_id, contact_type, notes, contact_date, status)
         VALUES ($1, $2, $3, NOW(), $4)
         RETURNING id`,
        [r.id, 'walkin', notesText, 'contacted']
      );
      syncedContactLogId = contactLogRes.rows[0]?.id ?? null;
    }

    return Response.json({
      ...updated,
      synced: {
        contact_log_id: syncedContactLogId,
        restaurant: matchedRestaurant,
        auto_created: autoCreated,
      },
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
