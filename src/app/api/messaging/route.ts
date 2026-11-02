/**
 * 訊息服務管理 API
 *
 * 路由:
 *   GET  /api/messaging/daily-list?limit=20   今日開發名單 + 話術草稿
 *   GET  /api/messaging/stats                 漏斗統計
 *   POST /api/messaging/enqueue               人工核准後排入佇列
 *   POST /api/messaging/dispatch              派送佇列
 *
 * ⚠️ 這些端點會觸發對外送訊息,必須做管理員驗證。
 */

import { pool } from '@/lib/db';
import { MessagingService, ensureOutboxTable } from '@/lib/messaging/service';
import { FacebookChannel } from '@/lib/messaging/channels/facebook';
import { InstagramChannel } from '@/lib/messaging/channels/instagram';
import { LineChannel } from '@/lib/messaging/channels/line';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildService(): MessagingService {
  const appSecret = process.env.FB_APP_SECRET ?? '';
  const pageToken = process.env.FB_PAGE_ACCESS_TOKEN ?? '';
  const igUserId = process.env.IG_USER_ID;
  const igToken = process.env.IG_ACCESS_TOKEN ?? '';
  const lineSecret = process.env.LINE_CHANNEL_SECRET ?? '';
  const lineToken = process.env.LINE_CHANNEL_ACCESS_TOKEN ?? '';

  const channels: Record<string, any> = {
    facebook: new FacebookChannel(pageToken, appSecret),
    line: new LineChannel(lineSecret, lineToken),
  };
  if (igUserId) {
    channels.instagram = new InstagramChannel(igUserId, igToken, appSecret);
  }
  return new MessagingService(channels);
}

/**
 * 管理員驗證。
 *
 * 用 admin session cookie。這裡用一個簡單的檢查:
 * 如果設了 ADMIN_API_KEY,要求 header 帶 X-Admin-Key。
 * 否則依賴 middleware 的管理員 session。
 */
function isAuthorized(request: Request): boolean {
  const key = process.env.ADMIN_API_KEY;
  if (!key) return true; // 未設定 → 依賴上層 session/middleware
  return request.headers.get('x-admin-key') === key;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const action = url.searchParams.get('action') ?? 'daily-list';
  const svc = buildService();

  try {
    if (action === 'stats') {
      await ensureOutboxTable();
      return Response.json(await svc.stats());
    }

    // default: daily-list
    const limit = Math.min(Number(url.searchParams.get('limit') ?? 20), 100);
    const list = await svc.buildDailyList(limit);
    return Response.json({ ok: true, count: list.length, list });
  } catch (e) {
    console.error(`[messaging] ${action} 失敗: ${String(e)}`);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'bad json' }, { status: 400 });
  }

  const action = body?.action;
  const svc = buildService();

  try {
    await ensureOutboxTable();

    if (action === 'enqueue') {
      const { restaurant_id, channel, recipient_id } = body;
      if (!restaurant_id || !channel) {
        return Response.json(
          { error: 'Missing restaurant_id or channel' },
          { status: 400 }
        );
      }

      // 停用守門:已停用店家不接受新聯絡紀錄
      const chk = await pool.query(
        'SELECT disabled_at FROM restaurants WHERE id = $1',
        [restaurant_id]
      );
      if (chk.rows.length === 0) {
        return Response.json({ error: 'Restaurant not found' }, { status: 404 });
      }
      if (chk.rows[0].disabled_at !== null) {
        return Response.json(
          { error: 'Restaurant is disabled; restore it before contacting' },
          { status: 409 }
        );
      }

      const text: string = body.body ?? '';
      if (!text) {
        return Response.json({ error: 'Missing body' }, { status: 400 });
      }

      const res = await svc.enqueue(
        Number(restaurant_id),
        channel,
        text,
        recipient_id ?? null
      );
      return Response.json({ ok: true, ...res }, { status: 201 });
    }

    if (action === 'dispatch') {
      const limit = Math.min(Number(body.limit ?? 20), 100);
      const results = await svc.dispatch(limit);
      return Response.json({ ok: true, dispatched: results.length, results });
    }

    return Response.json({ error: `unknown action: ${action}` }, { status: 400 });
  } catch (e) {
    console.error(`[messaging] ${action} 失敗: ${String(e)}`);
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
