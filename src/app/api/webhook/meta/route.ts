/**
 * Meta(Messenger Platform)webhook 端點 — 同時服務 FB Messenger 與 IG
 *
 * 路由:POST /api/webhook/meta
 *
 * Meta 的 webhook 設定只有一個 Callback URL,FB 與 IG 的訊息都送同一個
 * endpoint。辨識方式:payload 的 entry[].id 對應哪個 Page。
 * 這裡的處理是:兩個通道都嘗試解析,依 event 內容決定歸屬。
 *
 * 環境變數:
 *   FB_APP_SECRET         ← Meta App Dashboard → App secret
 *   FB_VERIFY_TOKEN       ← 自己設定,Meta 設定 webhook 時填同一組
 *   FB_PAGE_ACCESS_TOKEN  ← Graph API /{page-id}?fields=access_token
 *   IG_USER_ID            ← IG 專業帳號數字 ID
 *   IG_ACCESS_TOKEN       ← 通常與 Page token 相同
 */

import { FacebookChannel } from '@/lib/messaging/channels/facebook';
import { InstagramChannel } from '@/lib/messaging/channels/instagram';
import { MessagingService, ensureOutboxTable } from '@/lib/messaging/service';
import type { InboundEvent } from '@/lib/messaging/core';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 判斷一個 entry 屬於 FB 還是 IG。
 *
 * Meta 的 IG 訊息在 entry[].messaging[] 裡沒有明確標記,
 * 但 IG 的 thread 會出現在 conversations?platform=instagram。
 * 實務上最可靠的方式是:查 entry.id 對應哪個 Page。
 * 這裡採用保守策略 —— 兩個都解析,靠 senders 差異去重。
 */
function detectChannel(entry: any, igUserId: string | undefined): string {
  // entry.id 對應 Page;若我們知道 IG 綁的 Page,可用來判斷
  if (igUserId && entry?.id === igUserId) return 'instagram';
  return 'facebook';
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  const expected = process.env.FB_VERIFY_TOKEN;
  if (mode === 'subscribe' && token && token === expected) {
    return new Response(challenge ?? '', { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  const appSecret = process.env.FB_APP_SECRET ?? '';
  if (!appSecret) {
    console.error('[messaging/meta] 未設定 FB_APP_SECRET,拒絕收單');
    return Response.json({ error: 'server not configured' }, { status: 503 });
  }

  const pageToken = process.env.FB_PAGE_ACCESS_TOKEN ?? '';
  const igUserId = process.env.IG_USER_ID;
  const igToken = process.env.IG_ACCESS_TOKEN ?? '';

  const fb = new FacebookChannel(pageToken, appSecret);
  const ig = igUserId ? new InstagramChannel(igUserId, igToken, appSecret) : null;

  // ── 驗簽 ────────────────────────────────────────────────
  if (!fb.verifySignature(request.headers, rawBody)) {
    console.warn('[messaging/meta] 簽章驗證失敗');
    return Response.json({ error: 'invalid signature' }, { status: 401 });
  }

  let data: any;
  try {
    data = JSON.parse(rawBody);
  } catch (e) {
    console.error(`[messaging/meta] 解析失敗: ${String(e)}`);
    return Response.json({ error: 'bad payload' }, { status: 400 });
  }

  await ensureOutboxTable();

  const svc = new MessagingService({
    facebook: fb,
    ...(ig ? { instagram: ig } : {}),
  });

  const results: unknown[] = [];
  let processed = 0;

  for (const entry of data?.entry ?? []) {
    const channel = detectChannel(entry, igUserId);
    const adapter = channel === 'instagram' ? ig : fb;
    if (!adapter) continue;

    let events: InboundEvent[];
    try {
      events = adapter.parseWebhook(rawBody);
    } catch (e) {
      console.error(`[messaging/meta] 解析失敗: ${String(e)}`);
      continue;
    }

    for (const ev of events) {
      try {
        results.push(await svc.handleInbound(ev));
        processed++;
      } catch (e) {
        console.error(`[messaging/meta] 處理失敗: ${String(e)}`);
        results.push({ ok: false, error: String(e) });
      }
    }
  }

  return Response.json({ ok: true, processed, results });
}
