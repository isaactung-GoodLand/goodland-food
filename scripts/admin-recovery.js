/**
 * admin-recovery.js
 * 產生密碼復原連結
 *
 * 用法：node scripts/admin-recovery.js <email> <newPassword>
 *
 * 範例：node scripts/admin-recovery.js goodland@goodland-food.com NewPassword123!
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

const ADMIN_RECOVERY_SECRET = process.env.ADMIN_RECOVERY_SECRET || 'default-secret-change-me';

function generateRecoveryToken() {
  const payload = `${Date.now()}-${Math.random()}`;
  return crypto
    .createHmac('sha256', ADMIN_RECOVERY_SECRET)
    .update(payload)
    .digest('hex');
}

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('用法：node scripts/admin-recovery.js <email> <newPassword>');
    console.error('範例：node scripts/admin-recovery.js goodland@goodland-food.com NewPassword123!');
    process.exit(1);
  }

  const recoveryToken = generateRecoveryToken();
  const recoveryTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1小時後過期

  console.log('🔐 更新密碼並產生復原連結...');

  const admin = await prisma.adminUser.update({
    where: { email },
    data: {
      passwordHash: await require('bcryptjs').hash(newPassword, 12),
      recoveryToken: recoveryToken,
      recoveryTokenExp: recoveryTokenExp,
    },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const recoveryUrl = `${appUrl}/admin/reset?token=${encodeURIComponent(recoveryToken)}`;

  console.log(`\n✅ 復原連結已產生（1 小時內有效）`);
  console.log(`   Email:         ${email}`);
  console.log(`   新密碼:        ${newPassword}`);
  console.log(`   連結:          ${recoveryUrl}`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ 錯誤：', err.message);
  process.exit(1);
});
