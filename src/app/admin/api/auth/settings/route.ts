import { NextResponse } from 'next/server';
import { verifyAdminCredentials, updateAdminPassword } from '@/lib/admin-auth';

export async function PUT(request: Request) {
  const body = await request.json();
  const { email, old_password, new_password } = body;

  if (!email || !old_password || !new_password) {
    return NextResponse.json({ error: '缺少必要欄位' }, { status: 400 });
  }
  if (new_password.length < 4) {
    return NextResponse.json({ error: '新密碼至少4個字元' }, { status: 400 });
  }

  // Verify old password
  const user = await verifyAdminCredentials(email, old_password);
  if (!user) {
    return NextResponse.json({ error: '舊密碼錯誤' }, { status: 403 });
  }

  // Update to new password in DB
  await updateAdminPassword(email, new_password);

  return NextResponse.json({ ok: true, message: '密碼已更新' });
}
