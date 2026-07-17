import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { deleteSession } from '@/lib/auth/db';

export async function POST() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('admin_session')?.value;

  if (sessionId) {
    await deleteSession(sessionId);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_session', '', { path: '/', maxAge: 0 });
  return res;
}
