import { pool } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const city = searchParams.get('city') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 20;
  const offset = (page - 1) * limit;

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

  const countRes = await pool.query(`SELECT COUNT(*) FROM restaurants ${where}`, params);
  const total = parseInt(countRes.rows[0].count);

  const res = await pool.query(
    `SELECT * FROM restaurants ${where} ORDER BY name LIMIT ${limit} OFFSET ${offset}`,
    params
  );

  return Response.json({ restaurants: res.rows, total, page, pages: Math.ceil(total / limit) });
}
