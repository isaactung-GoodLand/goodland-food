import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromCookie } from '@/lib/auth/session';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public admin routes (no auth required)
  if (
    pathname === '/admin/login' ||
    pathname === '/admin/forgot' ||
    pathname === '/admin/reset' ||
    pathname.startsWith('/admin/api/auth/recover') ||
    pathname.startsWith('/admin/api/auth/reset') ||
    pathname.startsWith('/admin/api/auth/forgot')
  ) {
    return NextResponse.next();
  }

  // Protect /admin routes (non-public)
  if (pathname.startsWith('/admin')) {
    const sessionId = request.cookies.get('admin_session')?.value;

    if (!sessionId) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    const session = await getSessionFromCookie(sessionId);
    if (!session) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('reason', 'expired');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
