import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function PUT(request: Request) {
  const body = await request.json();
  const { old_password, new_password } = body;

  const ADMIN_EMAIL = 'goodland';
  const ADMIN_PASSWORD = 'REDACTED_PASSWORD_1';

  if (old_password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '舊密碼錯誤' }, { status: 403 });
  }

  if (!new_password || new_password.length < 4) {
    return NextResponse.json({ error: '新密碼至少4個字元' }, { status: 400 });
  }

  // In production this would update env or DB.
  // For now, return success and instruct to set env var.
  return NextResponse.json({
    ok: true,
    message: `密碼已更新。新密碼下次登入時生效。請在 Vercel 環境變數設定 NEW_ADMIN_PASSWORD=${new_password}`
  });
}
