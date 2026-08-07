import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const city = searchParams.get('city') || '';
  const district = searchParams.get('district') || '';
  const uncontacted = searchParams.get('uncontacted') === 'true';
  const hasMilkTea = searchParams.get('has_milk_tea') === 'true';
  const hasPhone = searchParams.get('has_phone') === 'true';
  const hasFacebook = searchParams.get('has_facebook') === 'true';
  const hasInstagram = searchParams.get('has_instagram') === 'true';
  const hasLine = searchParams.get('has_line') === 'true';
  const hasGmaps = searchParams.get('has_gmaps') === 'true';
  const newSince = searchParams.get('new_since') || '';
  // 聯絡狀態 dashboard 跳過來帶的 status (pending/contacted/rejected/converted/suspended)
  const status = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1');
  // 軟刪除過濾：
  //   - 預設只顯示啟用中的店家（disabled_at IS NULL）
  //   - include_disabled=true：啟用 + 停用 全部顯示
  //   - only_disabled=true：只顯示停用中的店家（垃圾桶 view）
  const includeDisabled = searchParams.get('include_disabled') === 'true';
  const onlyDisabled = searchParams.get('only_disabled') === 'true';
  // sort 切換:'name' (預設, A→Z) | 'priority' (1 在前, NULL 最後)
  const sort = searchParams.get('sort') === 'priority' ? 'priority' : 'name';
  const limit = 20;
  const offset = (page - 1) * limit;

  // build where + values in lock-step
  const whereParts: string[] = ['WHERE 1=1'];
  const values: any[] = [];
  let paramIndex = 1;

  if (q) {
    whereParts.push(`(name ILIKE $${paramIndex} OR address ILIKE $${paramIndex})`);
    values.push(`%${q}%`);
    paramIndex++;
  }
  if (city) {
    whereParts.push(`city = $${paramIndex}`);
    values.push(city);
    paramIndex++;
  }
  if (district) {
    whereParts.push(`district = $${paramIndex}`);
    values.push(district);
    paramIndex++;
  }

  // 過濾器: 選 contact status 自動 include disabled 店家
  // (因為 disabled_at 不為 null 的店家可能是 suspended)
  const forceIncludeDisabled = !!status;
  if (onlyDisabled) {
    whereParts.push(`disabled_at IS NOT NULL`);
  } else if (!includeDisabled && !forceIncludeDisabled) {
    whereParts.push(`disabled_at IS NULL`);
  }

  // OR filters: show shops that HAVE at least one of the missing contact info
  // 例外: 當有 q search 時, 放寬 filter (user 找特定店時,聯絡資料不該是阻擋條件)
  const orConditions: string[] = [];
  if (hasPhone && !q) orConditions.push(`phone IS NOT NULL AND phone != ''`);
  if (hasFacebook && !q) orConditions.push(`facebook IS NOT NULL AND facebook != ''`);
  if (hasInstagram && !q) orConditions.push(`instagram IS NOT NULL AND instagram != ''`);
  if (hasLine && !q) orConditions.push(`line IS NOT NULL AND line != ''`);
  if (hasGmaps && !q) orConditions.push(`gmaps_url IS NOT NULL AND gmaps_url != ''`);
  if (orConditions.length > 0) {
    whereParts.push(`(${orConditions.join(' OR ')})`);
  }

  if (uncontacted) {
    whereParts.push(`NOT EXISTS (SELECT 1 FROM contact_logs cl WHERE cl.restaurant_id = restaurants.id)`);
  }
  if (hasMilkTea) {
    whereParts.push(`has_hongkong_milk_tea = true`);
  }
  if (status) {
    // 過濾「最新一筆」 contact_logs 的 effective status:
    //   有 notes → 'contacted' (不論原 status)
    //   否則照原 status
    //   沒任何 logs → 'pending'
    // 注意: 用 COALESCE 把 NULL subquery 包起來, 沒 logs 的店會 satisfy 'pending' filter
    whereParts.push(`COALESCE((
      SELECT CASE
        WHEN cl.notes IS NOT NULL AND cl.notes != '' THEN 'contacted'
        ELSE COALESCE(cl.status, 'pending')
      END
      FROM contact_logs cl
      WHERE cl.restaurant_id = restaurants.id
      ORDER BY cl.created_at DESC LIMIT 1
    ), 'pending') = $${paramIndex}`);
    values.push(status);
    paramIndex++;
  }

  // whereParts 第一個是 'WHERE 1=1', 其餘是條件. 拼成最終 SQL fragment.
  const whereClause = whereParts.length > 1
    ? `${whereParts[0]} AND ${whereParts.slice(1).join(' AND ')}`
    : whereParts[0];

  // Count
  const countResult = await pool.query(`SELECT COUNT(*) FROM restaurants ${whereClause}`, values);
  const total = parseInt(countResult.rows[0].count);

  // Data
  values.push(limit, offset);
  // 排序:priority 模式 NULLS LAST,然後用 id ASC tie-breaker 避免分頁跳動
  const orderBy = sort === 'priority'
    ? 'priority ASC NULLS LAST, id ASC'
    : 'name ASC';
  const result = await pool.query(`
    SELECT id, name, city, district, address, phone,
           facebook, instagram, line, gmaps_url,
           has_hongkong_milk_tea, rating,
           priority,
           created_at,
           disabled_at, disabled_reason, disabled_by, restored_at,
           (SELECT notes FROM contact_logs WHERE restaurant_id = restaurants.id ORDER BY created_at DESC LIMIT 1) AS last_note
    FROM restaurants
    ${whereClause}
    ORDER BY ${orderBy}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, values);

  return Response.json({ restaurants: result.rows, total, page });
}
