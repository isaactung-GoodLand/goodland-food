/**
 * Goodland 訊息通道服務 — 共用底層 (TypeScript)
 *
 * 設計目標
 * --------
 * 把 FB Messenger / IG / LINE 抽象成同一組介面,
 * 上層(選店、話術、排程、回寫 CRM)不需要知道底下是哪個平台。
 *
 * 移植自 messaging/core.py(已驗證 61/61 測試通過的 Python 版本)。
 *
 * 重要限制(官方)
 * --------------
 * - FB Messenger Platform:送出需要 PSID(先傳訊息給粉專的人才有),
 *   回覆限 24 小時。→ 不可主動冷開發。
 * - IG Messaging:同樣需要 PSID(IG 專業帳號必須綁 FB Page)。
 * - LINE Messaging API:Push Message 只能發給已加 OA 為好友的用戶。
 *   → 同樣不可冷開發。
 *
 * 因此「主動出擊」一律走人工(Browser 自動化產生草稿),
 * API 通道只負責「店家先開口之後」的收發與回寫。
 */

// ─────────────────────────────────────────────────────────────
// 狀態機 — 對齊 CRM contact_logs.status 既有 5 個值
// ─────────────────────────────────────────────────────────────

export const Stage = {
  PENDING: 'pending', // 已排入佇列,尚未送出
  CONTACTED: 'contacted', // 已送出/已聯絡,等待回覆
  CONVERTED: 'converted', // 店家回覆且有高意向 → 人工接手
  REJECTED: 'rejected', // 明確拒絕
  SUSPENDED: 'suspended', // 暫停,不再聯絡
} as const;

export type StageValue = (typeof Stage)[keyof typeof Stage];

export const ALL_STAGES: readonly string[] = Object.values(Stage);

export function isValidStage(v: unknown): v is StageValue {
  return typeof v === 'string' && (ALL_STAGES as string[]).includes(v);
}

// ─────────────────────────────────────────────────────────────
// 訊息模型
// ─────────────────────────────────────────────────────────────

export interface Message {
  channel: string; // "facebook" | "instagram" | "line"
  restaurant_id: number;
  body: string;
  recipient_id?: string | null; // FB/IG: PSID / LINE: userId
  page_id?: string | null; // FB/IG: 我方粉專 ID
  access_token?: string | null; // FB/IG: Page token
  idempotency_key: string;
  created_at: number;
  attempts: number;
  meta: Record<string, unknown>;
}

export interface InboundEvent {
  channel: string;
  restaurant_id?: number | null; // 對應到 CRM 的店家(若能對上)
  sender_id: string; // PSID / LINE userId
  conversation_id?: string | null;
  text: string;
  received_at: number;
  raw: Record<string, unknown>;
}

// ─────────────────────────────────────────────────────────────
// 錯誤型別
// ─────────────────────────────────────────────────────────────

export class ChannelError extends Error {
  code: number;
  retryable: boolean;

  constructor(message: string, code = 0, retryable = false) {
    super(message);
    this.name = 'ChannelError';
    this.code = code;
    this.retryable = retryable;
  }
}

/**
 * 收件人不符合資格(未加好友 / 無 PSID / 視窗已過)。
 * 這不是程式錯誤,而是「這個人目前不能發」——不該重試。
 */
export class EligibilityError extends ChannelError {
  constructor(message: string, code = 0) {
    super(message, code, false);
    this.name = 'EligibilityError';
  }
}

// ─────────────────────────────────────────────────────────────
// 意圖判定 — 決定是否升級給人工
// ─────────────────────────────────────────────────────────────

/** 高意圖關鍵字:出現即判定為「值得人工接手」 */
export const HIGH_INTENT_KW = [
  '多少錢', '價格', '報價', '費用', '怎麼買', '哪裡買', '訂購', '下單',
  '有貨', '寄', 'sample', '樣品', '試喝', '免費試', '試煮',
  '配合', '加盟', '經銷', '代理', '批發', '量', '杯', '公斤', 'kg',
  '可以寄', '要如何', '怎麼做', '介紹', 'detail', '請問',
];

/** 明確拒絕 */
export const REJECT_KW = [
  '不用了', '不需要', '沒興趣', '謝謝不用', '已有', '目前不需要',
  '已採購', '已有供應商', '不用謝', '不必了', '不考慮',
];

/**
 * 把店家回覆分成 pending / converted / rejected。
 *
 * 保守原則:看不懂 → pending(人工看),不要自動判死。
 */
export function classifyReply(text: string): StageValue {
  const t = (text || '').toLowerCase();

  // 拒絕優先於意圖(「不用了,謝謝」不該被判成 converted)
  if (REJECT_KW.some((k) => t.includes(k))) return Stage.REJECTED;
  if (HIGH_INTENT_KW.some((k) => t.includes(k))) return Stage.CONVERTED;
  return Stage.PENDING;
}

// ─────────────────────────────────────────────────────────────
// 話術生成 — 依店家特徵產個人化開頭
// ─────────────────────────────────────────────────────────────

export const CHANNEL_LIMIT: Record<string, number> = {
  facebook: 500,
  instagram: 500,
  line: 1000,
};

export class Copywriter {
  /** 核心 hook(使用者原話) */
  static readonly HOOK = '客人有沒有問過「可以不加糖嗎?」';
  static readonly CTA = '100g 免費試煮,寄到你店裡';

  /**
   * 產生一則私訊文案。
   *
   * restaurant: { name, city, district, rating, ... }
   */
  static build(
    restaurant: Record<string, any>,
    channel: string,
    opener?: string | null
  ): string {
    const name = restaurant.name || '老闆';
    // 移除分店標註 [總店] / [分店] 與常見綴字
    const clean = name
      .replace(/[\[\(（【][^\]\)）】]{1,8}[\]\)）】]/g, '')
      .trim();
    const loc = [restaurant.city, restaurant.district].filter(Boolean).join(' ');
    const hook = opener || Copywriter.HOOK;

    const lines = [
      `${clean}${opener ? '' : '的老闆'}你好,`,
      loc ? `${loc}的朋友你好,看到你們店的評價很不錯。` : '',
      hook,
      '我們是甘田食品,專做港式餐廳的茶葉。',
      '煮 5 分鐘就出香、8 分鐘清甜、15 分鐘蜜韻,煮過頭也不會苦。',
      '同樣克數比你現在用的多出 2-3 杯,毛利率直接拉。',
      `${Copywriter.CTA},要不要試一包?`,
    ];

    let body = lines.filter(Boolean).join('\n').trim();
    const limit = CHANNEL_LIMIT[channel] ?? 500;
    if (body.length > limit) body = body.slice(0, limit - 1) + '…';
    return body;
  }
}
