import { pool } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// Seed 端點: 從 .hk_itinerary_data.json 讀資料,塞進 DB (idempotent)
export async function POST() {
  try {
    const dataPath = path.join(process.cwd(), '.hk_itinerary_data.json');
    if (!fs.existsSync(dataPath)) {
      return Response.json(
        { error: 'data file not found: ' + dataPath },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(raw);

    let storeCount = 0;
    let lodgingCount = 0;

    // Seed stores
    for (const [planKey, plan] of Object.entries(data.plans) as [string, any][]) {
      let visitOrder = 0;
      for (const day of plan.days) {
        for (const [storeName, city] of day.stores as [string, string][]) {
          visitOrder++;
          const googleMapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(storeName)}`;
          const crmUrl = `/admin/restaurants?q=${encodeURIComponent(storeName)}`;

          const res = await pool.query(
            `INSERT INTO hk_itinerary_stores
              (plan, day, visit_order, store_name, store_address, google_maps_url, crm_url, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
             ON CONFLICT (plan, day, visit_order) DO NOTHING
             RETURNING id`,
            [planKey, day.day, visitOrder, storeName, `${city}`, googleMapsUrl, crmUrl]
          );
          if (res.rowCount && res.rowCount > 0) storeCount++;
        }
      }
    }

    // Seed lodging
    for (const [idx, lodg] of (data.lodging as any[]).entries()) {
      const res = await pool.query(
        `INSERT INTO hk_lodging_options
          (city, type, name, address, price, rating, facility, booking_url, maps_url, display_order, enabled)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, TRUE)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [
          lodg.city,
          lodg.type,
          lodg.name,
          lodg.address || '',
          lodg.price || '',
          lodg.rating || '',
          lodg.facility || '',
          lodg.booking_url || '',
          lodg.maps_url || '',
          idx,
        ]
      );
      if (res.rowCount && res.rowCount > 0) lodgingCount++;
    }

    return Response.json({
      success: true,
      stores_inserted: storeCount,
      lodging_inserted: lodgingCount,
    });
  } catch (e: any) {
    return Response.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
