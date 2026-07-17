import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession, verifyPassword, updatePassword, getAdminUserById } from '@/lib/auth/db';

export async function PUT(request: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('admin_session')?.value;

  if (!sessionId) {
    return NextResponse.json({ error: '未登入' }, { status: 401 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: '連線已過期，請重新登入' }, { status: 401 });
  }

  const { old_password, new_password } = await request.json();

  if (!old_password || !new_password) {
    return NextResponse.json({ error: '請填寫所有欄位' }, { status: 400 });
  }

  if (new_password.length < 8) {
    return NextResponse.json({ error: '新密碼至少 8 個字元' }, { status: 400 });
  }

  const user = await getAdminUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: '找不到使用者' }, { status: 404 });
  }

  const valid = await verifyPassword(user, old_password);
  if (!valid) {
    return NextResponse.json({ error: '舊密碼錯誤' }, { status: 403 });
  }

  await updatePassword(session.userId, new_password);

  return NextResponse.json({ ok: true, message: '密碼已更新' });
}
