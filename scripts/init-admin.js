/**
 * init-admin.js
 * 初始化管理員帳號腳本
 *
 * 用法：node scripts/init-admin.js
 *
 * 需要設定 DATABASE_URL 環境變數
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const DEFAULT_EMAIL = 'goodland@goodland-food.com';
const DEFAULT_PASSWORD = 'Goodland2026!';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ 請設定 DATABASE_URL 環境變數');
    console.error('   例如：export DATABASE_URL="postgresql://user:***@host/db"');
    process.exit(1);
  }

  console.log('🔐 產生密碼雜湊...');
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  console.log(`   雜湊: ${passwordHash.substring(0, 20)}...`);

  console.log(`\n📝 建立管理員帳號...`);
  console.log(`   Email:    ${DEFAULT_EMAIL}`);
  console.log(`   Password: ${DEFAULT_PASSWORD}`);

  try {
    const admin = await prisma.adminUser.upsert({
      where: { email: DEFAULT_EMAIL },
      update: {
        passwordHash: passwordHash,
        updatedAt: new Date(),
      },
      create: {
        email: DEFAULT_EMAIL,
        passwordHash: passwordHash,
      },
    });

    console.log(`\n✅ 管理員帳號已建立/更新`);
    console.log(`   ID:    ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
  } catch (error) {
    console.error('❌ 建立失敗：', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n✅ 初始化完成！');
}

main().catch(err => {
  console.error('❌ 初始化失敗：', err);
  process.exit(1);
});
