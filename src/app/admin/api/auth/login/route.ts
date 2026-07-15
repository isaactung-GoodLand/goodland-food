import { NextResponse } from 'next/server';
import { verifyAdminCredentials } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const user = await verifyAdminCredentials(email, password);
  if (!user) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', Buffer.from(`${email}:${password}`).toString('base64'), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
