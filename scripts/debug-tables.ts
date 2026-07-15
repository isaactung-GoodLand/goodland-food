import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const result = await sql`SELECT current_database() as db, current_schema() as schema`;
  console.log('DB/Schema:', JSON.stringify(result));

  const tables = await sql`SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`;
  console.log('Public tables:', JSON.stringify(tables, null, 2));
}

main().catch(console.error);
