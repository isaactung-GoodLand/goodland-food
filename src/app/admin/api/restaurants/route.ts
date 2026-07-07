import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const city = searchParams.get('city') || '';
  const uncontacted = searchParams.get('uncontacted') === 'true';
  const hasMilkTea = searchParams.get('has_milk_tea') === 'true';
  const hasPhone = searchParams.get('has_phone') === 'true';
  const hasFacebook = searchParams.get('has_facebook') === 'true';
  const hasInstagram = searchParams.get('has_instagram') === 'true';
  const hasLine = searchParams.get('has_line') === 'true';
  const hasGmaps = searchParams.get('has_gmaps') === 'true';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

  let where = 'WHERE 1=1';
  if (q) where += ` AND (name ILIKE $${1} OR address ILIKE $${1})`;
  if (city) where += ` AND city = $2`;

  // OR filters: show shops that HAVE at least one of the missing contact info
  const orConditions: string[] = [];
  if (hasPhone) orConditions.push('phone IS NOT NULL AND phone != \'\'');
  if (hasFacebook) orConditions.push('facebook IS NOT NULL AND facebook != \'\'');
  if (hasInstagram) orConditions.push('instagram IS NOT NULL AND instagram != \'\'');
  if (hasLine) orConditions.push('line IS NOT NULL AND line != \'\'');
  if (hasGmaps) orConditions.push('gmaps_url IS NOT NULL AND gmaps_url != \'\'');
  if (orConditions.length > 0) {
    where += ` AND (${orConditions.join(' OR ')})`;
  }

  if (uncontacted) {
    where += ` AND NOT EXISTS (SELECT 1 FROM contact_logs cl WHERE cl.restaurant_id = restaurants.id)`;
  }
  if (hasMilkTea) {
    where += ` AND has_hongkong_milk_tea = true`;
  }

  const values: any[] = [];
  let paramIndex = 1;
  if (q) { values.push(`%${q}%`); paramIndex++; }
  if (city) { values.push(city); paramIndex++; }

  // Count
  const countResult = await pool.query(`SELECT COUNT(*) FROM restaurants ${where}`, values);
  const total = parseInt(countResult.rows[0].count);

  // Data
  values.push(limit, offset);
  const result = await pool.query(`
    SELECT id, name, city, district, address, phone,
           facebook, instagram, line, gmaps_url,
           has_hongkong_milk_tea, rating,
           created_at,
           (SELECT notes FROM contact_logs WHERE restaurant_id = restaurants.id ORDER BY created_at DESC LIMIT 1) AS last_note
    FROM restaurants
    ${where}
    ORDER BY name ASC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `, values);

  return Response.json({ restaurants: result.rows, total, page });
}
