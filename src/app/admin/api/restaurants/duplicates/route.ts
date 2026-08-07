import { pool } from '@/lib/db';

// 找出 CRM 中所有名稱相同 >1 家的店家群組
// 每組內: 列出每家的 id / name / city / district / address / verified_status
//         並標示哪個是 duplicate_of 哪個
export async function GET(request: Request) {
  try {
    const res = await pool.query(`
      WITH name_groups AS (
        SELECT
          LOWER(TRIM(name)) AS normalized_name,
          COUNT(*) FILTER (WHERE disabled_at IS NULL) AS active_count,
          COUNT(*) AS total_count
        FROM restaurants
        GROUP BY LOWER(TRIM(name))
        HAVING COUNT(*) > 1
      )
      SELECT
        r.id, r.name, r.city, r.district, r.address,
        r.verified_status, r.duplicate_of, r.disabled_at, r.created_at,
        ng.active_count, ng.total_count
      FROM restaurants r
      JOIN name_groups ng ON LOWER(TRIM(r.name)) = ng.normalized_name
      ORDER BY LOWER(TRIM(r.name)), r.disabled_at NULLS FIRST, r.id
    `);

    // 群組
    const groupMap: Record<string, any> = {};
    for (const r of res.rows) {
      const key = r.name.toLowerCase().trim();
      if (!groupMap[key]) {
        groupMap[key] = {
          name: r.name,
          active_count: r.active_count,
          total_count: r.total_count,
          restaurants: [],
        };
      }
      groupMap[key].restaurants.push({
        id: r.id,
        name: r.name,
        city: r.city,
        district: r.district,
        address: r.address,
        verified_status: r.verified_status,
        duplicate_of: r.duplicate_of,
        disabled: r.disabled_at !== null,
        created_at: r.created_at,
      });
    }

    const groups = Object.values(groupMap).sort((a, b) => b.total_count - a.total_count);

    return Response.json({
      total_groups: groups.length,
      total_duplicates: groups.reduce((sum: number, g: any) => sum + Math.max(g.total_count - 1, 0), 0),
      groups,
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
