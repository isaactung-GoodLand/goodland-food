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

  // Token sent via side-channel (email in production).
  // For self-hosted admin: operator fetches token from Neon console, then shares
  // the reset URL manually with the owner.
  return NextResponse.json({
    message: '如果帳號存在，重設連結已產生。請查看管理員提供的郵件或即時通訊。',
  });
}
