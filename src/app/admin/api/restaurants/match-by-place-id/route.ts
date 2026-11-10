import { pool } from '@/lib/db';

// 用 Google Maps 識別碼精確比對 CRM 內的店家。
//
// 用途:每日 Maps 候選流程匯入新店家前,先用識別碼查一次,
//       命中就跳過(不重複匯入),沒命中才走後續的名稱/座標比對。
//
// 兩個鍵 (2026-11-04):
//   place_id = ChIJ...      Google 正式 place_id (最穩定)
//   maps_cid = 0x...        Maps URL 的 hex CID 第二段
//   候選資料目前以 maps_cid 為主 (maps_batch.py 修正後兩者都會有)。
//
// GET /admin/api/restaurants/match-by-place-id?place_id=ChIJ...
// GET /admin/api/restaurants/match-by-place-id?maps_cid=0x...
//   → { found: true, matches: [...] } 或 { found: false, matches: [] }
//
// POST /admin/api/restaurants/match-by-place-id
//   body: { place_ids: ["ChIJ...", ...], maps_cids: ["0x...", ...] }
//   → { total, hit_count, results: [{ key, found, match_count, matches }] }
//
// 注意: 同一識別碼可能對應多筆 CRM 資料(例如同一家店被重複匯入過、
//       或分店誤綁)。所以回傳 matches 陣列,由呼叫端決定如何處理多筆命中。

const PLACE_ID_RE = /^ChIJ[A-Za-z0-9_\-]{10,}$/;
const CID_RE = /^0x[0-9a-f]{16}$/;

async function findByKeys(placeIds: string[], mapsCids: string[]) {
  const res = await pool.query(
    `SELECT id, name, city, district, address, phone,
            place_id, maps_cid, gmaps_url,
            disabled_at, disabled_reason, verified_status, priority,
            has_hongkong_milk_tea, created_at
     FROM restaurants
     WHERE place_id = ANY($1::text[])
        OR maps_cid = ANY($2::text[])
     ORDER BY disabled_at NULLS FIRST, id ASC`,
    [placeIds, mapsCids]
  );
  const byPlace = new Map<string, any[]>();
  const byCid = new Map<string, any[]>();
  for (const pid of placeIds) byPlace.set(pid, []);
  for (const cid of mapsCids) byCid.set(cid, []);
  for (const r of res.rows) {
    if (byPlace.has(r.place_id)) byPlace.get(r.place_id)!.push(r);
    if (byCid.has(r.maps_cid)) byCid.get(r.maps_cid)!.push(r);
  }
  return { byPlace, byCid };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const placeId = (searchParams.get('place_id') || '').trim();
  const mapsCid = (searchParams.get('maps_cid') || '').trim();

  if (placeId && !PLACE_ID_RE.test(placeId)) {
    return Response.json(
      { error: 'Invalid place_id format. Expected ChIJ + base64url chars.' },
      { status: 400 }
    );
  }
  if (mapsCid && !CID_RE.test(mapsCid)) {
    return Response.json(
      { error: 'Invalid maps_cid format. Expected 0x + 16 hex chars.' },
      { status: 400 }
    );
  }
  if (!placeId && !mapsCid) {
    return Response.json(
      { error: 'place_id or maps_cid required' },
      { status: 400 }
    );
  }

  try {
    const { byPlace, byCid } = await findByKeys(
      placeId ? [placeId] : [],
      mapsCid ? [mapsCid] : []
    );
    const matches = [
      ...(placeId ? byPlace.get(placeId) || [] : []),
      ...(mapsCid ? byCid.get(mapsCid) || [] : []),
    ];
    // 同一筆可能兩個鍵都命中 → 去重
    const uniq = Array.from(new Map(matches.map(m => [m.id, m])).values());
    return Response.json({
      place_id: placeId || null,
      maps_cid: mapsCid || null,
      found: uniq.length > 0,
      match_count: uniq.length,
      matches: uniq,
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const placeIds: string[] = [...new Set<string>(
    (Array.isArray(body.place_ids) ? body.place_ids : [])
      .map((v: any) => String(v ?? '').trim())
      .filter((v: string) => PLACE_ID_RE.test(v))
  )];
  const mapsCids: string[] = [...new Set<string>(
    (Array.isArray(body.maps_cids) ? body.maps_cids : [])
      .map((v: any) => String(v ?? '').trim())
      .filter((v: string) => CID_RE.test(v))
  )];

  if (placeIds.length === 0 && mapsCids.length === 0) {
    return Response.json(
      { error: 'place_ids (ChIJ...) or maps_cids (0x...) required' },
      { status: 400 }
    );
  }

  try {
    const { byPlace, byCid } = await findByKeys(placeIds, mapsCids);
    const results: any[] = [];

    for (const pid of placeIds) {
      const matches = byPlace.get(pid) || [];
      results.push({
        key: pid, key_type: 'place_id',
        found: matches.length > 0, match_count: matches.length, matches,
      });
    }
    for (const cid of mapsCids) {
      const matches = byCid.get(cid) || [];
      results.push({
        key: cid, key_type: 'maps_cid',
        found: matches.length > 0, match_count: matches.length, matches,
      });
    }

    return Response.json({
      total: results.length,
      hit_count: results.filter(r => r.found).length,
      results,
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
