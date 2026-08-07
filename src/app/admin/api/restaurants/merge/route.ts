import { pool } from '@/lib/db';

// 合併兩個 CRM 店家
// 用法: 假設我們想把 source (id=A) 合併進 target (id=B)
//   1. 將 source 的 contact_logs 全部轉到 target (避免資料遺失)
//   2. 將 source 標為 duplicate,duplicate_of = target.id
//   3. source 軟刪 (disabled_at = NOW()) 因為重複店家應該不再顯示
// target 保留
export async function POST(request: Request) {
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const sourceId = parseInt(body.source_id, 10);
  const targetId = parseInt(body.target_id, 10);

  if (!sourceId || !targetId || sourceId === targetId) {
    return Response.json({ error: 'source_id and target_id required and must differ' }, { status: 400 });
  }

  try {
    const checkRes = await pool.query(
      `SELECT id, name, city, district, address FROM restaurants WHERE id = ANY($1::int[])`,
      [[sourceId, targetId]]
    );
    if (checkRes.rows.length !== 2) {
      return Response.json({ error: 'One or both restaurants not found' }, { status: 404 });
    }
    const source = checkRes.rows.find(r => r.id === sourceId);
    const target = checkRes.rows.find(r => r.id === targetId);

    // 用 transaction 保證 atomic
    await pool.query('BEGIN');
    try {
      // 1. 移轉 contact_logs
      const transferRes = await pool.query(
        `UPDATE contact_logs SET restaurant_id = $1 WHERE restaurant_id = $2 RETURNING id`,
        [targetId, sourceId]
      );
      const transferredLogs = transferRes.rowCount || 0;

      // 2. 移轉 hk_itinerary_stores 對應
      const itRes = await pool.query(
        `UPDATE hk_itinerary_stores
         SET store_address = $1, store_name = $2
         WHERE id IN (
           SELECT id FROM hk_itinerary_stores WHERE store_name = $3
         )`,
        [target.city, target.name, source.name]
      );

      // 3. source 標為 duplicate + 軟刪
      await pool.query(
        `UPDATE restaurants SET verified_status = 'duplicate', duplicate_of = $1, disabled_at = NOW() WHERE id = $2`,
        [targetId, sourceId]
      );

      // 4. 若 target 沒地址但 source 有,copy
      if (!target.address && source.address) {
        await pool.query(
          `UPDATE restaurants SET address = $1 WHERE id = $2`,
          [source.address, targetId]
        );
      }

      await pool.query('COMMIT');
      return Response.json({
        success: true,
        merged: { source_id: sourceId, target_id: targetId, source_name: source.name, target_name: target.name },
        transferred_contact_logs: transferredLogs,
      });
    } catch (e) {
      await pool.query('ROLLBACK');
      throw e;
    }
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
