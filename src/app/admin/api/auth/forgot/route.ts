import { NextResponse } from 'next/server';
import { createRecoveryToken } from '@/lib/auth/db';

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ error: '請提供 email' }, { status: 400 });
  }

  const token = await createRecoveryToken(email);

  // Always return success to avoid email enumeration
  if (!token) {
    return NextResponse.json({
      message: '如果帳號存在，重設連結已產生。'
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const recoveryUrl = `${appUrl}/admin/reset?token=${encodeURIComponent(token)}`;

  // Log to server console (no email service configured)
  console.log(`\n🔑 密碼重設連結（1 小時內有效）:`);
  console.log(`   ${recoveryUrl}\n`);

  return NextResponse.json({
    message: '如果帳號存在，重設連結已產生。請查看管理員提供的郵件或即時通訊。',
  });
}
