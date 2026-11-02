/**
 * LINE Messaging API channel adapter
 *
 * 官方限制(查證 2026-11,developers.line.biz/en/docs/messaging-api)
 * ------------------------------------------------------------------
 * 1. Push Message **只能發給已加 OA 為好友的用戶** → 無法冷開發。
 * 2. Reply API **不計入訊息費用**(官方明列),且回覆數上限較寬鬆。
 * 3. 計價(台灣區):高用量方案 NT$1,200/月 贈 5,000 則;
 *    加購 6,001~25,000 則 NT$0.2/則。
 *    **不計費**:一對一聊天、自動回應、加入好友歡迎訊息、Reply API。
 *
 * 因此本 adapter 的定位:
 *   - send()  用於已加好友的用戶(push / multicast / narrowcast)
 *   - reply() 用於 24 小時內對用戶已發訊息的對話 → 免費
 *   - 冷開發同樣不可行,走人工加好友或付費「加好友廣告」
 */

import crypto from 'node:crypto';
import {
  ChannelError,
  EligibilityError,
  type InboundEvent,
  type Message,
} from '../core';

const API = 'https://api.line.me/v2/bot';

export interface LineResult {
  ok: boolean;
  message_id?: string;
  error?: string;
  raw?: unknown;
}

export class LineChannel {
  readonly name = 'line';
  readonly supportsColdOutreach = false;

  constructor(
    private readonly channelSecret: string,
    private readonly channelAccessToken: string,
    private readonly timeoutMs = 20000
  ) {}

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.channelAccessToken}`,
      'Content-Type': 'application/json',
    };
  }

  // ─── 送出 ────────────────────────────────────────────────

  /** Push Message —— 只能對已加好友的用戶。 */
  async send(msg: Message): Promise<LineResult> {
    const to = msg.recipient_id;
    if (!to) {
      throw new EligibilityError('無 userId:缺少收件者');
    }
    if (!this.channelAccessToken) {
      throw new ChannelError('未設定 LINE_CHANNEL_ACCESS_TOKEN', 0, true);
    }

    const res = await fetch(`${API}/message/push`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        to,
        messages: [{ type: 'text', text: msg.body }],
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw classifyLineError(res.status, data);
    }
    return { ok: true, message_id: data?.replyToken, raw: data };
  }

  /**
   * Reply API —— 用 replyToken 回覆,**不計費**。
   * 這是 LINE 上最該優先使用的路徑。
   */
  async reply(replyToken: string, text: string): Promise<LineResult> {
    const res = await fetch(`${API}/message/reply`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text }],
      }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw classifyLineError(res.status, data);
    }
    return { ok: true, raw: data };
  }

  // ─── 驗簽 ────────────────────────────────────────────────

  /** 驗證 X-Line-Signature (HMAC-SHA256 base64)。 */
  verifySignature(headers: Headers, rawBody: string): boolean {
    const sig = headers.get('x-line-signature');
    if (!sig) return false;
    if (!this.channelSecret) {
      console.warn('[messaging/line] 未設定 channel_secret,略過簽章驗證');
      return true;
    }
    const expect = crypto
      .createHmac('sha256', this.channelSecret)
      .update(rawBody, 'utf8')
      .digest('base64');
    if (sig.length !== expect.length) return false;
    return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect));
  }

  // ─── webhook 解析 ────────────────────────────────────────

  parseWebhook(rawBody: string): InboundEvent[] {
    let data: any;
    try {
      data = JSON.parse(rawBody);
    } catch (e) {
      throw new ChannelError(`webhook body 非合法 JSON: ${String(e)}`);
    }

    const events: InboundEvent[] = [];
    for (const ev of data?.events ?? []) {
      if (ev?.type !== 'message') continue;
      const text: string = ev?.message?.text ?? '';
      if (!text) continue; // 貼圖/影片等非文字訊息,先不處理
      events.push({
        channel: this.name,
        restaurant_id: null,
        sender_id: ev?.source?.userId ?? '',
        conversation_id: ev?.replyToken ?? null,
        text,
        received_at: Date.now() / 1000,
        raw: ev,
      });
    }
    return events;
  }
}

export function classifyLineError(status: number, data: any): ChannelError {
  const code = data?.code ?? 0;
  const msg = String(data?.message ?? `HTTP ${status}`);

  // 401/403 + Authentication failed → 憑證問題,可重試
  if ((status === 401 || status === 403) && /authen/i.test(msg)) {
    return new ChannelError(`憑證問題: ${msg}`, code, true);
  }
  // 403 其他情況 → 非好友或權限不足,不該重試
  if (status === 403) {
    return new EligibilityError(`對方非好友或權限不足 (code=${code}): ${msg}`, code);
  }
  // 429 → 限流,可重試
  if (status === 429) {
    return new ChannelError(`限流 (429): ${msg}`, code, true);
  }
  return new ChannelError(`LINE 錯誤 (${status}/code=${code}): ${msg}`, code, false);
}
