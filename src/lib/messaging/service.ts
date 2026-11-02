/**
 * 業務邏輯層 — 評分、佇列、處理回覆、CRM 回寫
 *
 * 這一層完全不知道底下是 FB 還是 LINE,也不碰 HTTP。
 * 移植自 messaging/service.py(Python,已驗證 61/61)。
 */

import {
  ChannelError,
  Copywriter,
  Stage,
  classifyReply,
  type InboundEvent,
  type Message,
  type StageValue,
} from './core';
import * as crm from './crm';

export interface ChannelAdapter {
  readonly name: string;
  send(msg: Message): Promise<unknown>;
  reply?(conversationId: string, text: string): Promise<unknown>;
}

// ─────────────────────────────────────────────────────────────
// 評分 — 決定誰今天值得聯絡
// ─────────────────────────────────────────────────────────────

export class Scorer {
  /**
   * 權重的理由:
   * - rating 高 → 店家經營穩健,付費意願高
   * - 有 FB/IG → 通路成立,能真的觸及
   * - 有電話 → 人工接手時有備援(95% 是市話)
   * - 連鎖(分店標註) → 總部採購一次談多店,優先
   * - 沒被聯絡過 → 新鮮名單
   */
  static readonly W_RATING = 30.0;
  static readonly W_SOCIAL = 25.0;
  static readonly W_PHONE = 15.0;
  static readonly W_CHAIN = 20.0;
  static readonly W_FRESH = 10.0;

  static score(r: Record<string, any>): number {
    let s = 0.0;

    const rating = r.rating;
    if (rating) {
      // 4.0 → 20, 4.5 → 25, 5.0 → 30
      s += Math.min(Scorer.W_RATING, (Number(rating) - 3.0) * 20.0);
    }
    if (r.facebook || r.instagram) s += Scorer.W_SOCIAL;
    if (r.phone) s += Scorer.W_PHONE;
    const name: string = r.name || '';
    if (name.includes('[總店]') || name.includes('[分店]')) s += Scorer.W_CHAIN;
    if (!r.contact_count) s += Scorer.W_FRESH;

    return s;
  }

  /** 推薦通道 —— 依實際可用的聯絡方式決定。 */
  static recommendChannel(r: Record<string, any>): string {
    if (r.facebook) return 'facebook';
    if (r.instagram) return 'instagram';
    if (r.phone) return 'phone';
    return 'none';
  }

  /** 給人看的理由 —— 讓業務知道為什麼這家排前面。 */
  static reason(r: Record<string, any>): string {
    const bits: string[] = [];
    if (r.rating) bits.push(`評分 ${r.rating}`);
    if (r.facebook) bits.push('有 FB');
    if (r.instagram) bits.push('有 IG');
    if (r.phone) bits.push('有電話');
    const name: string = r.name || '';
    if (name.includes('[總店]') || name.includes('[分店]')) bits.push('連鎖');
    if (!r.contact_count) bits.push('未曾聯絡');
    return bits.join('、');
  }
}

// ─────────────────────────────────────────────────────────────
// 佇列 — Outbox
//
// 用 Neon 的表當佇列,而不是記憶體 / 檔案:
// Vercel 的 serverless 每次呼叫都是新 instance,記憶體佇列會全��。
// ─────────────────────────────────────────────────────────────

export interface OutboxRow {
  id: number;
  channel: string;
  restaurant_id: number;
  body: string;
  recipient_id: string | null;
  attempts: number;
  status: string;
  last_error: string | null;
}

/** 確保 outbox 表存在(冪等)。 */
export async function ensureOutboxTable(): Promise<void> {
  const { pool } = await import('@/lib/db');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messaging_outbox (
      id            SERIAL PRIMARY KEY,
      channel       TEXT NOT NULL,
      restaurant_id INTEGER NOT NULL,
      body          TEXT NOT NULL,
      recipient_id  TEXT,
      attempts      INTEGER NOT NULL DEFAULT 0,
      status        TEXT NOT NULL DEFAULT 'queued',
      last_error    TEXT,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at       TIMESTAMPTZ
    )
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_messaging_outbox_status
       ON messaging_outbox (status, created_at)`
  );
}

export async function enqueue(
  rid: number,
  channel: string,
  body: string,
  recipientId?: string | null
): Promise<number> {
  const { pool } = await import('@/lib/db');
  const { rows } = await pool.query(
    `INSERT INTO messaging_outbox
       (channel, restaurant_id, body, recipient_id, status)
     VALUES ($1, $2, $3, $4, 'queued')
     RETURNING id`,
    [channel, rid, body, recipientId ?? null]
  );
  return rows[0].id;
}

export async function popDue(limit = 20): Promise<OutboxRow[]> {
  const { pool } = await import('@/lib/db');
  const { rows } = await pool.query(
    `UPDATE messaging_outbox SET status = 'sending'
      WHERE id IN (
        SELECT id FROM messaging_outbox
         WHERE status = 'queued'
         ORDER BY created_at
         LIMIT $1
         FOR UPDATE SKIP LOCKED
      )
      RETURNING id, channel, restaurant_id, body, recipient_id,
                attempts, status, last_error`,
    [limit]
  );
  return rows;
}

export async function markSent(id: number): Promise<void> {
  const { pool } = await import('@/lib/db');
  await pool.query(
    `UPDATE messaging_outbox
        SET status = 'sent', sent_at = NOW(), attempts = attempts + 1
      WHERE id = $1`,
    [id]
  );
}

export async function markFailed(
  id: number,
  error: string,
  retryable: boolean
): Promise<void> {
  const { pool } = await import('@/lib/db');
  await pool.query(
    `UPDATE messaging_outbox
        SET status = $2, last_error = $3, attempts = attempts + 1
      WHERE id = $1`,
    [id, retryable ? 'queued' : 'failed', error.slice(0, 500)]
  );
}

export async function outboxSize(): Promise<number> {
  const { pool } = await import('@/lib/db');
  const { rows } = await pool.query(
    `SELECT count(*)::int AS n FROM messaging_outbox WHERE status = 'queued'`
  );
  return rows[0].n;
}

// ─────────────────────────────────────────────────────────────
// 服務
// ─────────────────────────────────────────────────────────────

export class MessagingService {
  constructor(private readonly channels: Record<string, ChannelAdapter>) {}

  /**
   * 產生今日開發名單 + 話術草稿。
   * 注意:這裡 **不送出**,只產生草稿並建立 contact_logs(pending)。
   * 實際送出由 dispatch() 在人工核准批次後觸發。
   */
  async buildDailyList(limit = 20): Promise<any[]> {
    const rows = await crm.candidates(300);
    const scored = rows
      .map((r) => ({ r, score: Scorer.score(r) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const out: any[] = [];
    for (const { r, score } of scored) {
      const channel = Scorer.recommendChannel(r);
      if (channel === 'none') continue;
      const draft = Copywriter.build(r, channel);
      out.push({
        restaurant_id: r.id,
        name: r.name,
        city: r.city,
        district: r.district,
        rating: r.rating,
        score,
        channel,
        reason: Scorer.reason(r),
        draft,
        contact_url: r.facebook || r.instagram || null,
        phone: r.phone,
      });
    }
    return out;
  }

  /**
   * 把一則訊息排入佇列,同時建立 contact_logs(pending)。
   *
   * 人工核准後才呼叫 dispatch()。
   *
   * ⚠️ recipient_id 一定要一併記進 notes([facebook:PSID_xxx])——
   * 否則店家回覆時無法反查到是哪一家,CRM 狀態就永遠寫不回去。
   * 這是實際踩過的坑:E2E 測試第一版就栽在這裡。
   */
  async enqueue(
    rid: number,
    channel: string,
    body: string,
    recipientId?: string | null
  ): Promise<{ outbox_id: number; contact_log_id: number }> {
    const logId = await crm.addContactLog(
      rid,
      channel,
      `[草稿] ${body}`,
      'pending'
    );
    // 記下識別碼 → 店家回覆時能對上這家店
    if (recipientId) {
      await crm.linkSocialId(rid, recipientId, channel, logId);
    }
    const outboxId = await enqueue(rid, channel, body, recipientId);
    return { outbox_id: outboxId, contact_log_id: logId };
  }

  /**
   * 派送佇列中的訊息。
   *
   * 錯誤處理是重點:
   * - 資格不符(無 PSID / 非好友)→ 永久失敗 + log 標 rejected
   * - 憑證問題 / 限流 → 保留在佇列,log 維持 pending(不誤標!)
   */
  async dispatch(limit = 20): Promise<any[]> {
    const due = await popDue(limit);
    const results: any[] = [];

    for (const item of due) {
      const ch = this.channels[item.channel];
      if (!ch) {
        await markFailed(item.id, `未知通道 ${item.channel}`, false);
        results.push({ id: item.id, ok: false, error: `未知通道` });
        continue;
      }
      try {
        const msg: Message = {
          channel: item.channel,
          restaurant_id: item.restaurant_id,
          body: item.body,
          recipient_id: item.recipient_id,
          idempotency_key: String(item.id),
          created_at: Date.now() / 1000,
          attempts: item.attempts,
          meta: {},
        };
        await ch.send(msg);
        await markSent(item.id);

        // 送出成功 → log 轉 contacted
        const log = await crm.findOpenLog(item.restaurant_id);
        if (log) {
          await crm.updateContactStatus(log.id, Stage.CONTACTED);
        }
        results.push({ id: item.id, ok: true, restaurant_id: item.restaurant_id });
      } catch (e) {
        const err = e as ChannelError;
        const retryable = err instanceof ChannelError ? err.retryable : false;
        await markFailed(item.id, err.message || String(e), retryable);

        // ⚠️ 只有「資格不符」才標 rejected。
        // 憑證/限流問題標 rejected 會污染開發漏斗 —— 這是個實際踩過的坑。
        if (!retryable && err instanceof ChannelError && err.name === 'EligibilityError') {
          const log = await crm.findOpenLog(item.restaurant_id);
          if (log) {
            await crm.updateContactStatus(log.id, Stage.REJECTED);
            await crm.appendNote(
              log.id,
              `\n[資格不符] ${err.message.slice(0, 200)}`
            );
          }
        }
        results.push({
          id: item.id,
          ok: false,
          retryable,
          error: err.message || String(e),
        });
      }
    }
    return results;
  }

  /**
   * 收到店家回覆 → 判定狀態 → 回寫 CRM → 回覆店家。
   *
   * 這裡是「系統自動、人工接手」的接縫:
   * - converted(高意向)→ 不自動成交,標記後交人工
   * - rejected → 自動結案
   * - pending  → 看不懂,人工看
   */
  async handleInbound(ev: InboundEvent): Promise<any> {
    const ch = this.channels[ev.channel];
    if (!ch) return { ok: false, error: `未知通道 ${ev.channel}` };

    // 反查店家:先看有沒有既存的識別碼標記,
    // 找不到再看這家店有沒有正在進行的聯絡紀錄
    let rid = ev.restaurant_id ?? null;
    let logRow = null;
    if (rid == null && ev.sender_id) {
      logRow = await crm.findLogByIdent(ev.channel, ev.sender_id);
      if (logRow) {
        rid = logRow.restaurant_id;
      } else {
        const row = await crm.getBySocial(ev.channel, ev.sender_id);
        if (row) rid = row.id;
      }
    }

    if (rid == null) {
      console.warn(
        `[messaging] 收到回覆但對不上店家 sender=${ev.sender_id} text=${ev.text.slice(0, 80)}`
      );
      return {
        ok: false,
        error: '無法對應店家',
        sender_id: ev.sender_id,
        text: ev.text,
      };
    }

    const stage: StageValue = classifyReply(ev.text);

    // 找「進行中」的 log:跨通道,且排除 rejected/suspended。
    if (!logRow) {
      logRow =
        (await crm.findOpenLog(rid)) ??
        (await crm.findPendingLog(rid, ev.channel));
    }
    if (logRow) {
      await crm.updateContactStatus(logRow.id, stage);
      const ts = new Date().toISOString().slice(0, 16).replace('T', ' ');
      await crm.appendNote(
        logRow.id,
        `\n[回覆 ${ts}] ${ev.text.slice(0, 200)}`
      );
      // 記下這個識別碼(寫到剛才那筆),下次同一人回覆就能直接對上
      await crm.linkSocialId(rid, ev.sender_id, ev.channel, logRow.id);
    }

    // 自動回覆:只在 stage 非 converted 時回(高意圖要人工接手)
    let replied = false;
    if (stage !== Stage.CONVERTED && ev.conversation_id) {
      try {
        if (ch.reply) {
          await ch.reply(ev.conversation_id, '收到,謝謝!我們會盡快與您聯繫。');
        } else {
          await ch.send({
            channel: ev.channel,
            restaurant_id: rid,
            body: '收到,謝謝!我們會盡快與您聯繫。',
            recipient_id: ev.sender_id,
            idempotency_key: `auto-${Date.now()}`,
            created_at: Date.now() / 1000,
            attempts: 0,
            meta: {},
          });
        }
        replied = true;
      } catch (e) {
        console.warn(`[messaging] 自動回覆失敗 rid=${rid}: ${String(e)}`);
      }
    }

    return {
      ok: true,
      restaurant_id: rid,
      stage,
      auto_replied: replied,
      text: ev.text,
    };
  }

  async stats(): Promise<Record<string, number>> {
    const base = await crm.funnel();
    base.outbox_size = await outboxSize();
    return base;
  }
}
