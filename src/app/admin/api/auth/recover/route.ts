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

  // In production this would send an email.
  // For admin recovery: display the token directly so the owner can set a new password.
  return NextResponse.json({
    message: '如果帳號存在，重設連結已產生。',
    // For development/admin: include the token directly
    // Remove this line in production and send via email instead
    recovery_token: token,
  });
}
