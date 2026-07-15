/**
 * init-admin.ts
 * 一鍵初始化 admin_users table + 預設管理員帳號
 *
 * 用法：
 *   npx tsx src/scripts/init-admin.ts
 *
 * 需要設定 DATABASE_URL 環境變數（可使用 .env.local 或直接 export）
 */

import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

const DEFAULT_EMAIL = 'goodland@goodland-food.com';
const DEFAULT_PASSWORD = 'goodland2026';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌  請設定 DATABASE_URL 環境變數');
    console.error('   例如：export DATABASE_URL="postgresql://user:pass@host/db"');
    process.exit(1);
  }

  const sql = neon(databaseUrl);

  console.log('🔧  建立 admin_users table...');
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      recovery_token TEXT,
      recovery_token_exp TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('   ✅ admin_users table 已就緒');

  console.log('🔧  建立 admin_sessions table...');
  await sql`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      id          TEXT PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
      expires_at  TIMESTAMPTZ NOT NULL,
      created_at  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions (user_id)`;
  console.log('   ✅ admin_sessions table 已就緒');

  // 產生 bcrypt hash
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  console.log(`\n🔐  產生預設帳號...`);
  console.log(`    Email:    ${DEFAULT_EMAIL}`);
  console.log(`    Password: ${DEFAULT_PASSWORD}`);

  await sql`
    INSERT INTO admin_users (email, password_hash)
    VALUES (${DEFAULT_EMAIL}, ${passwordHash})
    ON CONFLICT (email) DO UPDATE
      SET password_hash = EXCLUDED.password_hash,
          updated_at = NOW()
  `;
  console.log('   ✅ 預設管理員帳號已寫入資料庫');

  // 驗證
  const [row] = await sql`SELECT id, email FROM admin_users WHERE email = ${DEFAULT_EMAIL}`;
  if (row) {
    console.log(`\n✅  初始化完成！共 ${1} 位管理員`);
  } else {
    console.error('❌  初始化後找不到管理員，請檢查資料庫');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌  初始化失敗：', err);
  process.exit(1);
});
