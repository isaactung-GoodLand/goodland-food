import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const city = searchParams.get('city') || '';
  const uncontacted = searchParams.get('uncontacted') === 'true';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  // OR conditions for contact fields
  const noPhone = searchParams.get('no_phone') === 'true';
  const noFb = searchParams.get('no_facebook') === 'true';
  const noIg = searchParams.get('no_instagram') === 'true';
  const noLine = searchParams.get('no_line') === 'true';
  const noGmaps = searchParams.get('no_gmaps') === 'true';

  let where = 'WHERE 1=1';
  const params: any[] = [];
  let p = 1;

  if (q) {
    where += ` AND (name ILIKE $${p} OR address ILIKE $${p} OR phone ILIKE $${p})`;
    params.push(`%${q}%`);
    p++;
  }
  if (city) {
    where += ` AND city = $${p}`;
    params.push(city);
    p++;
  }
  if (uncontacted) {
    where += ` AND NOT EXISTS (SELECT 1 FROM contact_logs cl WHERE cl.restaurant_id = restaurants.id)`;
  }
  if (searchParams.get('has_milk_tea') === 'true') {
    where += ` AND has_hongkong_milk_tea = true`;
  }

  // OR: exclude shops that have NONE of the selected contact types
  const anyNoFilter = noPhone || noFb || noIg || noLine || noGmaps;
  if (anyNoFilter) {
    const ors: string[] = [];
    if (noPhone) ors.push(`(phone IS NOT NULL AND phone != '')`);
    if (noFb) ors.push(`(facebook IS NOT NULL AND facebook != '')`);
    if (noIg) ors.push(`(instagram IS NOT NULL AND instagram != '')`);
    if (noLine) ors.push(`(line IS NOT NULL AND line != '')`);
    if (noGmaps) ors.push(`(gmaps_url IS NOT NULL AND gmaps_url != '')`);
    if (ors.length > 0) {
      where += ` AND (${ors.join(' OR ')})`;
    }
  }

  const countRes = await pool.query(`SELECT COUNT(*) FROM restaurants ${where}`, params);
  const total = parseInt(countRes.rows[0].count);

  const res = await pool.query(
    `SELECT r.*,
       EXISTS (SELECT 1 FROM contact_logs cl WHERE cl.restaurant_id = r.id AND cl.notes IS NOT NULL AND cl.notes != '') AS has_notes,
       (SELECT cl.notes FROM contact_logs cl WHERE cl.restaurant_id = r.id ORDER BY cl.contact_date DESC LIMIT 1) AS last_note,
       (SELECT cl.contact_date FROM contact_logs cl WHERE cl.restaurant_id = r.id ORDER BY cl.contact_date DESC LIMIT 1) AS last_contact_date
     FROM restaurants r
     ${where}
     ORDER BY r.name
     LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return Response.json({ restaurants: res.rows, total, page, pages: Math.ceil(total / limit) });
}
