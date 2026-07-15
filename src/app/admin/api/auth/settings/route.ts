import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getEnv } from '@/lib/env';

export async function PUT(request: Request) {
  const body = await request.json();
  const { old_password, new_password } = body;
  const { ADMIN_PASSWORD } = getEnv();

  if (old_password !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: '舊密碼錯誤' }, { status: 403 });
  }

  if (!new_password || new_password.length < 4) {
    return NextResponse.json({ error: '新密碼至少4個字元' }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: `請在 Vercel 環境變數設定 ADMIN_PASSWORD=${new_password}，重新部署後生效`
  });
}
