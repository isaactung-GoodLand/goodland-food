/**
 * LINE Messaging API webhook 端點
 *
 * 路由:POST /api/webhook/line
 *
 * - GET  → LINE Console 的 webhook 驗證(回 echo 即可)
 * - POST → 收單,驗簽,解析,交給 service 處理
 *
 * 環境變數:
 *   LINE_CHANNEL_SECRET        ← LINE Console → Messaging API → Channel secret
 *   LINE_CHANNEL_ACCESS_TOKEN  ← LINE Console → Messaging API → Channel access token
 */

import { LineChannel } from '@/lib/messaging/channels/line';
import { MessagingService } from '@/lib/messaging/service';
import { ensureOutboxTable } from '@/lib/messaging/service';
import type { InboundEvent } from '@/lib/messaging/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getService(): MessagingService {
  const secret = process.env.LINE_CHANNEL_SECRET ?? '';
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';
  const ch = new LineChannel(secret, token);
  return new MessagingService({ line: ch });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  // LINE Console 驗證:只要回 echo 就行
  const echo = url.searchParams.get('echo');
  if (echo) {
    return new Response(echo, { status: 200 });
  }
  return new Response('ok', { status: 200 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const secret = process.env.LINE_CHANNEL_SECRET ?? '';
  if (!secret) {
    console.error('[messaging/line] 未設定 LINE_CHANNEL_SECRET,拒絕收單');
    return Response.json({ error: 'server not configured' }, { status: 503 });
  }

  const ch = new LineChannel(secret, process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '');

  // ── 驗簽 ────────────────────────────────────────────────
  if (!ch.verifySignature(request.headers, rawBody)) {
    console.warn('[messaging/line] 簽章驗證失敗');
    return Response.json({ error: 'invalid signature' }, { status: 401 });
  }

  // ── 解析 ────────────────────────────────────────────────
  let events: InboundEvent[];
  try {
    events = ch.parseWebhook(rawBody);
  } catch (e) {
    console.error(`[messaging/line] 解析失敗: ${String(e)}`);
    return Response.json({ error: 'bad payload' }, { status: 400 });
  }

  if (events.length === 0) {
    return Response.json({ ok: true, processed: 0 });
  }

  await ensureOutboxTable();
  const svc = getService();

  const results: unknown[] = [];
  for (const ev of events) {
    try {
      results.push(await svc.handleInbound(ev));
    } catch (e) {
      console.error(`[messaging/line] 處理失敗: ${String(e)}`);
      results.push({ ok: false, error: String(e) });
    }
  }

  return Response.json({ ok: true, processed: events.length, results });
}
