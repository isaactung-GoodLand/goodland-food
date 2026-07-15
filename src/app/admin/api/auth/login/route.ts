import { NextResponse } from 'next/server';
import { getAdminUserByEmail, verifyPassword, createSession } from '@/lib/auth/db';

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: '請填寫帳號和密碼' }, { status: 400 });
  }

  const user = await getAdminUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  }

  const valid = await verifyPassword(user, password);
  if (!valid) {
    return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
  }

  const session = await createSession(user.id);

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return res;
}
