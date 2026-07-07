import { NextResponse } from 'next/server';

const ADMIN_EMAIL = 'goodland';
const ADMIN_PASSWORD = 'REDACTED_PASSWORD_2';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
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
  return NextResponse.json({ error: '帳號或密碼錯誤' }, { status: 401 });
}
