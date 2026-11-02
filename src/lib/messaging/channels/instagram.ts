/**
 * Instagram Messaging channel adapter
 *
 * 官方限制(查證 2026-11,developers.facebook.com/docs/messenger-platform/instagram)
 * ------------------------------------------------------------------------
 * 1. 需要 **IG 專業帳號**,且必須綁定一個 **Facebook Page**。
 * 2. 權限是 `instagram_manage_messages`(不是 `pages_messaging`)。
 * 3. IG 帳號端必須開啟:
 *    Instagram Settings → Messages and story replies → Message controls
 *    → Connected Tools → **Allow Access to Messages**
 * 4. 需要 PSID → **同樣無法冷開發**。
 *
 * 送出走 Messenger Platform 同一套 endpoint(用 Page token)。
 */

import crypto from 'node:crypto';
import {
  ChannelError,
  EligibilityError,
  type InboundEvent,
  type Message,
} from '../core';

const API = 'https://graph.facebook.com/v21.0';

export interface IGResult {
  ok: boolean;
  message_id?: string;
  error?: string;
  raw?: unknown;
}

export class InstagramChannel {
  readonly name = 'instagram';
  readonly supportsColdOutreach = false;

  constructor(
    private readonly igUserId: string,
    private readonly accessToken: string,
    private readonly appSecret?: string,
    private readonly timeoutMs = 20000
  ) {}

  // ─── 送出 ────────────────────────────────────────────────

  async send(msg: Message): Promise<IGResult> {
    const psid = msg.recipient_id;
    if (!psid) {
      throw new EligibilityError(
        '無 PSID:對方尚未傳訊息給 IG 帳號,不能主動發送'
      );
    }
    if (!this.accessToken) {
      throw new ChannelError('未設定 IG_ACCESS_TOKEN', 0, true);
    }

    const url = `${API}/me/messages?access_token=${encodeURIComponent(
      this.accessToken
    )}`;
    const body = {
      recipient: { id: psid },
      message: { text: msg.body },
      messaging_type: 'RESPONSE',
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw classifyIGError(res.status, data);
    }
    return { ok: true, message_id: data?.message_id, raw: data };
  }

  // ─── 驗簽 ────────────────────────────────────────────────

  /** IG 走 Messenger Platform,簽章格式與 FB 相同。 */
  verifySignature(headers: Headers, rawBody: string): boolean {
    const sig = headers.get('x-hub-signature-256');
    if (!sig) return false;
    if (!this.appSecret) {
      console.warn('[messaging/ig] 未設定 app_secret,略過簽章驗證');
      return true;
    }
    const expect =
      'sha256=' +
      crypto.createHmac('sha256', this.appSecret).update(rawBody, 'utf8').digest('hex');
    if (sig.length !== expect.length) return false;
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect));
  }

  // ─── webhook 解析 ────────────────────────────────────────

  /**
   * IG 的 webhook payload 結構與 FB 相同,
   * 但 entry.messaging[].message 會帶 is_echo 與 instagram 專屬欄位。
   */
  parseWebhook(rawBody: string): InboundEvent[] {
    let data: any;
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      throw new ChannelError(`webhook body 非合法 JSON: ${String(e)}`);
    }

    const events: InboundEvent[] = [];
    for (const entry of data?.entry ?? []) {
      for (const m of entry?.messaging ?? []) {
        if (m?.is_echo) continue;
        const sender = m?.sender?.id;
        if (!sender) continue;
        const text: string = m?.message?.text ?? '';
        events.push({
          channel: this.name,
          restaurant_id: null,
          sender_id: sender,
          conversation_id: m?.message?.mid ?? null,
          text,
          received_at: Date.now() / 1000,
          raw: m,
        });
      }
    }
    return events;
  }
}

export function classifyIGError(status: number, data: any): ChannelError {
  const err = data?.error ?? {};
  const code = err?.code ?? 0;
  const subcode = err?.error_subcode ?? 0;
  const msg = err?.message ?? `HTTP ${status}`;

  if (status === 401 || [190, 102, 200, 458].includes(code)) {
    return new ChannelError(`憑證問題 (code=${code}): ${msg}`, code, true);
  }
  if (subcode === 2018065 || code === 613) {
    return new EligibilityError(
      `收件人不符資格 (code=${code}/sub=${subcode}): ${msg}`,
      code
    );
  }
  if ([4, 17, 32, 341].includes(code) || status === 429) {
    return new ChannelError(`限流 (code=${code}): ${msg}`, code, true);
  }
  return new ChannelError(`Instagram 錯誤 (code=${code}): ${msg}`, code, false);
}
