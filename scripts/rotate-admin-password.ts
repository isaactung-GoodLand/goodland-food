/**
 * rotate-admin-password.ts
 *
 * One-shot script to rotate the admin password in the DB.
 * Usage:
 *   NEW_PASSWORD='<set me>' npx tsx scripts/rotate-admin-password.ts [email]
 *
 * Default email: isaactung@goodland-food.com (matches the prod admin user —
 * the seed in migrations/20260716_admin_users.sql was superseded by a later
 * migration that renamed/inserted the actual admin).
 *
 * Reads DATABASE_URL from .env.local — so run from the repo root, NOT from Vercel.
 * This script MUST NOT be deployed or bundled.
 *
 * NOTE: src/lib/admin-auth.ts is largely dead code — the actual login + session
 * flow lives in src/lib/auth/db.ts. This script uses admin-auth for historical
 * reasons; keep it in sync with the prod admin_users schema (column name
 * `password_hash`, not `password`).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { updateAdminPassword } from '../src/lib/admin-auth';

async function main() {
  const newPassword = process.env.NEW_PASSWORD;
  const email = process.argv[2] || 'isaactung@goodland-food.com';

  if (!newPassword) {
    console.error('ERROR: NEW_PASSWORD env var is required');
    console.error('Usage: NEW_PASSWORD=<password> npx tsx scripts/rotate-admin-password.ts [email]');
    process.exit(1);
  }

  if (newPassword.length < 8) {
    console.error('ERROR: NEW_PASSWORD must be at least 8 characters');
    process.exit(1);
  }

  console.log(`[rotate] target email: ${email}`);
  console.log(`[rotate] new password length: ${newPassword.length} chars`);

  await updateAdminPassword(email, newPassword);

  console.log('[rotate] done. password updated in admin_users table.');
  console.log('[rotate] verify with:');
  console.log(`  curl -X POST https://goodland-food.vercel.app/admin/api/auth/login \\`);
  console.log(`    -H 'Content-Type: application/json' \\`);
  console.log(`    -d '{"email":"${email}","password":"<your new password>"}'`);
}

main().catch((err) => {
  console.error('[rotate] failed:', err);
  process.exit(1);
});