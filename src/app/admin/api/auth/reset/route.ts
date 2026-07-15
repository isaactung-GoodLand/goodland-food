import { NextResponse } from 'next/server';
import { useRecoveryToken, updatePassword } from '@/lib/auth/db';

export async function POST(request: Request) {
  const { token, new_password } = await request.json();

  if (!token || !new_password) {
    return NextResponse.json({ error: '請提供 token 和新密碼' }, { status: 400 });
  }

  if (new_password.length < 8) {
    return NextResponse.json({ error: '新密碼至少 8 個字元' }, { status: 400 });
  }

  const userId = await useRecoveryToken(token);
  if (!userId) {
    return NextResponse.json({ error: '連結無效或已過期，請重新申請' }, { status: 400 });
  }

  await updatePassword(userId, new_password);

  return NextResponse.json({ ok: true, message: '密碼已重設，請使用新密碼登入' });
}
