/**
 * Facebook Messenger Platform channel adapter
 *
 * 官方限制
 * --------
 * 1. 送出需要 **PSID** —— 使用者必須先傳訊息給粉專,才有 PSID。
 *    → **無法冷開發陌生店家**。
 * 2. 回覆限 **24 小時** 窗口(店家主動傳訊後開始計)。
 * 3. 正式對外需 App Review + `pages_messaging` 權限。
 *
 * 移植自 messaging/channels/facebook.py,保留其錯誤分類邏輯:
 * - 憑證類錯誤(190/102/200/458)→ retryable=True
 *   (補好 token 後就能送,不該永久失敗 —— 這點很重要,
 *    否則會把「沒設定憑證」誤標成「店家拒絕」污染開發漏斗)
 * - 無 PSID(2018065)/ 視窗已過(613)→ EligibilityError(不該重試)
 * - 限流(4/17/32/341)→ retryable=True
 */

import crypto from 'node:crypto';
import {
  ChannelError,
  EligibilityError,
  type InboundEvent,
  type Message,
} from '../core';

const API = 'https://graph.facebook.com/v21.0';

export interface FBResult {
  ok: boolean;
  message_id?: string;
  error?: string;
  raw?: unknown;
}

export class FacebookChannel {
  readonly name = 'facebook';
  readonly supportsColdOutreach = false;

  constructor(
    private readonly pageAccessToken: string,
    private readonly appSecret?: string,
    private readonly timeoutMs = 20000
  ) {}

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...(this.pageAccessToken
        ? { Authorization: `Bearer ${this.pageAccessToken}` }
        : {}),
    };
  }

  // ─── 送出 ────────────────────────────────────────────────

  async send(msg: Message): Promise<FBResult> {
    const psid = msg.recipient_id;
    if (!psid) {
      throw new EligibilityError(
        '無 PSID:對方尚未傳訊息給粉專,不能主動發送'
      );
    }
    if (!this.pageAccessToken) {
      throw new ChannelError('未設定 FB_PAGE_ACCESS_TOKEN', 0, true);
    }

    const url = `${API}/me/messages?access_token=${encodeURIComponent(
      this.pageAccessToken
    )}`;
    const body = {
      recipient: { id: psid },
      message: { text: msg.body },
      messaging_type: 'RESPONSE',
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw classifyFBError(res.status, data);
    }
    return {
      ok: true,
      message_id: data?.message_id,
      raw: data,
    };
  }

  // ─── 驗簽 ────────────────────────────────────────────────

  /**
   * 驗證 X-Hub-Signature-256。
   * 未設定 app_secret 時略過(開發模式),但會記警告。
   */
  verifySignature(headers: Headers, rawBody: string): boolean {
    const sig =
      headers.get('x-hub-signature-256') ??
      headers.get('X-Hub-Signature-256');
    if (!sig) return false;
    if (!this.appSecret) {
      console.warn('[messaging/fb] 未設定 app_secret,略過簽章驗證');
      return true;
    }
    const expect =
      'sha256=' +
      crypto.createHmac('sha256', this.appSecret).update(rawBody, 'utf8').digest('hex');
    // 長度相同才比較,避免 timingSafeEqual 拋錯
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
    for (const entry of data?.entry ?? []) {
      for (const m of entry?.messaging ?? []) {
        if (m?.is_echo) continue; // 自己送出的訊息,不要當成回覆
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

/**
 * Meta 錯誤 → 分類成可重試 / 不可重試。
 *
 * 這是整個服務最容易出錯的地方 —— 分錯會污染 CRM 開發漏斗。
 */
export function classifyFBError(status: number, data: any): ChannelError {
  const err = data?.error ?? {};
  const code = err?.code ?? 0;
  const subcode = err?.error_subcode ?? 0;
  const msg = err?.message ?? `HTTP ${status}`;

  // 憑證類 → 可重試(補好 token 後就能送)
  if (status === 401 || [190, 102, 200, 458].includes(code)) {
    return new ChannelError(`憑證問題 (code=${code}): ${msg}`, code, true);
  }
  // 無 PSID / 視窗已過 → 資格不符,不該重試
  if (subcode === 2018065 || code === 613) {
    return new EligibilityError(
      `收件人不符資格 (code=${code}/sub=${subcode}): ${msg}`,
      code
    );
  }
  // 限流 → 可重試
  if ([4, 17, 32, 341].includes(code) || status === 429) {
    return new ChannelError(`限流 (code=${code}): ${msg}`, code, true);
  }
  return new ChannelError(`Facebook 錯誤 (code=${code}): ${msg}`, code, false);
}
