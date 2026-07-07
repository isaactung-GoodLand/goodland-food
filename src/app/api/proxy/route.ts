import { NextResponse } from 'next/server';

const ALLOWED_TYPES = ['text/html', 'application/xhtml+xml'];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  // Basic validation
  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Only allow http/https
  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return NextResponse.json({ error: 'Only http/https allowed' }, { status: 400 });
  }

  try {
    const response = await fetch(rawUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
      },
      redirect: 'follow',
    });

    const contentType = response.headers.get('content-type') || '';
    if (!ALLOWED_TYPES.some(t => contentType.includes(t))) {
      return NextResponse.json(
        { error: `Cannot proxy non-HTML content: ${contentType}` },
        { status: 400 }
      );
    }

    let html = await response.text();

    // Rewrite all relative URLs to absolute
    const baseUrl = response.url || rawUrl;
    const base = new URL(baseUrl);

    // Set base tag for relative URLs
    html = html.replace(/<head/i, `<head<base href="${base.origin + base.pathname}">`);

    // Rewrite absolute URLs in href/src/action to go through proxy
    html = html.replace(/(href|src|action)=["']([^"']+)["']/gi, (_, attr, url) => {
      try {
        if (url.startsWith('data:') || url.startsWith('javascript:') || url.startsWith('mailto:')) {
          return `${attr}="${url}"`;
        }
        if (url.startsWith('http://') || url.startsWith('https://')) {
          const proxied = `/admin/api/proxy?url=${encodeURIComponent(url)}`;
          return `${attr}="${proxied}"`;
        }
        // Relative URL — rewrite through proxy with base
        const abs = new URL(url, base);
        const proxied = `/admin/api/proxy?url=${encodeURIComponent(abs.toString())}`;
        return `${attr}="${proxied}"`;
      } catch {
        return `${attr}="${url}"`;
      }
    });

    // Remove X-Frame-Options and Content-Security-Policy headers from response
    const newHeaders = new Headers();
    newHeaders.set('Content-Type', 'text/html; charset=utf-8');
    newHeaders.set('X-Frame-Options', 'SAMEORIGIN');
    newHeaders.set('Content-Security-Policy', "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:;");

    return new Response(html, {
      status: 200,
      headers: newHeaders,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch', detail: String(err) },
      { status: 502 }
    );
  }
}
