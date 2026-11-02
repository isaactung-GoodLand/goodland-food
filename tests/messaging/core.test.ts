/**
 * 訊息服務單元測試
 *
 * 對應 Python 版 messaging/tests.py 的 29 個測試,
 * 確保 TS 移植版的行為一致 —— 特別是:
 * - 意圖判定的保守原則(看不懂 → pending)
 * - 拒絕優先於意圖
 * - 錯誤分類(憑證可重試 vs 資格不符不可重試)
 * - 簽章驗證
 */

import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import {
  Stage,
  classifyReply,
  Copywriter,
  isValidStage,
  ChannelError,
  EligibilityError,
  type Message,
} from '@/lib/messaging/core';
import { FacebookChannel, classifyFBError } from '@/lib/messaging/channels/facebook';
import { InstagramChannel, classifyIGError } from '@/lib/messaging/channels/instagram';
import { LineChannel, classifyLineError } from '@/lib/messaging/channels/line';
import { Scorer } from '@/lib/messaging/service';

// ─────────────────────────────────────────────────────────────
// 意圖判定
// ─────────────────────────────────────────────────────────────

describe('classifyReply', () => {
  it('高意圖關鍵字 → converted', () => {
    expect(classifyReply('請問多少錢?')).toBe(Stage.CONVERTED);
    expect(classifyReply('想了解價格')).toBe(Stage.CONVERTED);
    expect(classifyReply('可以寄嗎?')).toBe(Stage.CONVERTED);
    expect(classifyReply('想試喝看看')).toBe(Stage.CONVERTED);
    expect(classifyReply('有貨嗎')).toBe(Stage.CONVERTED);
  });

  it('明確拒絕 → rejected', () => {
    expect(classifyReply('不用了,謝謝')).toBe(Stage.REJECTED);
    expect(classifyReply('目前不需要')).toBe(Stage.REJECTED);
    expect(classifyReply('已有供應商')).toBe(Stage.REJECTED);
  });

  it('拒絕優先於意圖', () => {
    // 同時有拒絕與高意圖 → 拒絕勝出
    expect(classifyReply('不用了,謝謝。請問價格多少?')).toBe(Stage.REJECTED);
  });

  it('看不懂 → pending(保守原則,不要自動判死)', () => {
    expect(classifyReply('嗯嗯')).toBe(Stage.PENDING);
    expect(classifyReply('')).toBe(Stage.PENDING);
    expect(classifyReply('哈囉')).toBe(Stage.PENDING);
  });
});

describe('isValidStage', () => {
  it('接受既有 5 個值', () => {
    for (const s of ['pending', 'contacted', 'rejected', 'converted', 'suspended']) {
      expect(isValidStage(s)).toBe(true);
    }
  });

  it('拒絕其他值', () => {
    expect(isValidStage('unknown')).toBe(false);
    expect(isValidStage('')).toBe(false);
    expect(isValidStage(null)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────
// 話術
// ─────────────────────────────────────────────────────────────

describe('Copywriter', () => {
  const r = {
    name: '老陳港式茶餐廳 [總店]',
    city: '台中',
    district: '西區',
    rating: 4.5,
  };

  it('移除分店標註', () => {
    const body = Copywriter.build(r, 'facebook');
    expect(body).not.toContain('[總店]');
    expect(body).toContain('老陳港式茶餐廳');
  });

  it('含 hook 與 CTA', () => {
    const body = Copywriter.build(r, 'facebook');
    expect(body).toContain('客人有沒有問過');
    expect(body).toContain('甘田食品');
    expect(body).toContain('100g');
  });

  it('含地區', () => {
    const body = Copywriter.build(r, 'facebook');
    expect(body).toContain('台中');
  });

  it('依通道長度限制截斷', () => {
    const long = { ...r, name: 'x'.repeat(300) };
    const fb = Copywriter.build(long, 'facebook');
    const line = Copywriter.build(long, 'line');
    expect(fb.length).toBeLessThanOrEqual(500);
    expect(line.length).toBeLessThanOrEqual(1000);
  });
});

// ─────────────────────────────────────────────────────────────
// 評分
// ─────────────────────────────────────────────────────────────

describe('Scorer', () => {
  it('評分高 → 分數高', () => {
    const hi = Scorer.score({ rating: 4.8, facebook: 'x', phone: 'y', name: 'A' });
    const lo = Scorer.score({ rating: 3.5, name: 'B' });
    expect(hi).toBeGreaterThan(lo);
  });

  it('有 FB/IG 加分', () => {
    const withSocial = Scorer.score({ rating: 4, facebook: 'x', name: 'A' });
    const without = Scorer.score({ rating: 4, name: 'A' });
    expect(withSocial).toBeGreaterThan(without);
  });

  it('連鎖加分', () => {
    const chain = Scorer.score({ rating: 4, name: 'A [總店]' });
    const solo = Scorer.score({ rating: 4, name: 'A' });
    expect(chain).toBeGreaterThan(solo);
  });

  it('未曾聯絡加分', () => {
    const fresh = Scorer.score({ rating: 4, name: 'A', contact_count: 0 });
    const touched = Scorer.score({ rating: 4, name: 'A', contact_count: 3 });
    expect(fresh).toBeGreaterThan(touched);
  });

  it('推薦通道依可用聯絡方式', () => {
    expect(Scorer.recommendChannel({ facebook: 'f', instagram: 'i' })).toBe('facebook');
    expect(Scorer.recommendChannel({ instagram: 'i' })).toBe('instagram');
    expect(Scorer.recommendChannel({ phone: 'p' })).toBe('phone');
    expect(Scorer.recommendChannel({})).toBe('none');
  });
});

// ─────────────────────────────────────────────────────────────
// 錯誤分類 — 這是最容易出錯的地方
// ─────────────────────────────────────────────────────────────

describe('classifyFBError', () => {
  it('憑證錯誤 → 可重試(不能標成店家拒絕!)', () => {
    const e = classifyFBError(401, { error: { code: 190, message: 'Invalid OAuth access token' } });
    expect(e).toBeInstanceOf(ChannelError);
    expect(e.retryable).toBe(true);
    expect(e).not.toBeInstanceOf(EligibilityError);
  });

  it('無 PSID → 資格不符,不可重試', () => {
    const e = classifyFBError(400, {
      error: { code: 100, error_subcode: 2018065, message: 'no PSID' },
    });
    expect(e).toBeInstanceOf(EligibilityError);
    expect(e.retryable).toBe(false);
  });

  it('24hr 窗口外 → 資格不符', () => {
    const e = classifyFBError(400, { error: { code: 613, message: 'window closed' } });
    expect(e).toBeInstanceOf(EligibilityError);
  });

  it('限流 → 可重試', () => {
    const e = classifyFBError(429, { error: { code: 4, message: 'rate limit' } });
    expect(e.retryable).toBe(true);
  });
});

describe('classifyIGError', () => {
  it('憑證錯誤 → 可重試', () => {
    const e = classifyIGError(401, { error: { code: 190, message: 'Invalid OAuth access token' } });
    expect(e.retryable).toBe(true);
  });

  it('無 PSID → 資格不符', () => {
    const e = classifyIGError(400, {
      error: { code: 100, error_subcode: 2018065, message: 'no PSID' },
    });
    expect(e).toBeInstanceOf(EligibilityError);
  });
});

describe('classifyLineError', () => {
  it('Authentication failed → 憑證問題,可重試', () => {
    const e = classifyLineError(401, { message: 'Authentication failed' });
    expect(e.retryable).toBe(true);
    expect(e).not.toBeInstanceOf(EligibilityError);
  });

  it('403 非好友 → 資格不符', () => {
    const e = classifyLineError(403, { message: 'User is not a friend' });
    expect(e).toBeInstanceOf(EligibilityError);
  });

  it('429 → 可重試', () => {
    expect(classifyLineError(429, { message: 'rate' }).retryable).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// 簽章驗證
// ─────────────────────────────────────────────────────────────

describe('簽章驗證', () => {
  const secret = 'test-secret';

  it('FB 正確簽章通過', () => {
    const ch = new FacebookChannel('token', secret);
    const body = '{"entry":[]}';
    const sig =
      'sha256=' + crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
    const headers = new Headers({ 'x-hub-signature-256': sig });
    expect(ch.verifySignature(headers, body)).toBe(true);
  });

  it('FB 錯誤簽章拒絕', () => {
    const ch = new FacebookChannel('token', secret);
    const headers = new Headers({ 'x-hub-signature-256': 'sha256=wrong' });
    expect(ch.verifySignature(headers, '{}')).toBe(false);
  });

  it('FB 缺簽章拒絕', () => {
    const ch = new FacebookChannel('token', secret);
    expect(ch.verifySignature(new Headers(), '{}')).toBe(false);
  });

  it('LINE 正確簽章通過', () => {
    const ch = new LineChannel(secret, 'token');
    const body = '{"events":[]}';
    const sig = crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64');
    const headers = new Headers({ 'x-line-signature': sig });
    expect(ch.verifySignature(headers, body)).toBe(true);
  });

  it('LINE 錯誤簽章拒絕', () => {
    const ch = new LineChannel(secret, 'token');
    const headers = new Headers({ 'x-line-signature': 'bogus' });
    expect(ch.verifySignature(headers, '{}')).toBe(false);
  });

  it('IG 簽章與 FB 同格式', () => {
    const ch = new InstagramChannel('ig', 'token', secret);
    const body = '{"entry":[]}';
    const sig =
      'sha256=' + crypto.createHmac('sha256', secret).update(body, 'utf8').digest('hex');
    const headers = new Headers({ 'x-hub-signature-256': sig });
    expect(ch.verifySignature(headers, body)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// webhook 解析
// ─────────────────────────────────────────────────────────────

describe('webhook 解析', () => {
  it('FB 解析訊息並跳過 echo', () => {
    const ch = new FacebookChannel('t', 's');
    const body = JSON.stringify({
      entry: [
        {
          messaging: [
            { sender: { id: 'PSID_1' }, message: { mid: 'm1', text: '請問多少錢' } },
            { sender: { id: 'PSID_2' }, message: { mid: 'm2', text: 'echo' }, is_echo: true },
          ],
        },
      ],
    });
    const evs = ch.parseWebhook(body);
    expect(evs).toHaveLength(1);
    expect(evs[0].sender_id).toBe('PSID_1');
    expect(evs[0].text).toBe('請問多少錢');
  });

  it('LINE 解析訊息', () => {
    const ch = new LineChannel('s', 't');
    const body = JSON.stringify({
      events: [
        {
          type: 'message',
          replyToken: 'rt1',
          source: { userId: 'U123' },
          message: { type: 'text', text: '你好' },
        },
      ],
    });
    const evs = ch.parseWebhook(body);
    expect(evs).toHaveLength(1);
    expect(evs[0].sender_id).toBe('U123');
    expect(evs[0].conversation_id).toBe('rt1');
  });

  it('LINE 非文字訊息略過', () => {
    const ch = new LineChannel('s', 't');
    const body = JSON.stringify({
      events: [{ type: 'message', source: { userId: 'U1' }, message: { type: 'image' } }],
    });
    expect(ch.parseWebhook(body)).toHaveLength(0);
  });

  it('非 JSON → ChannelError', () => {
    const ch = new LineChannel('s', 't');
    expect(() => ch.parseWebhook('not json')).toThrow(ChannelError);
  });
});

// ─────────────────────────────────────────────────────────────
// 送出前檢查
// ─────────────────────────────────────────────────────────────

describe('送出前資格檢查', () => {
  const base: Message = {
    channel: 'facebook',
    restaurant_id: 1,
    body: 'test',
    idempotency_key: 'k',
    created_at: 0,
    attempts: 0,
    meta: {},
  };

  it('無 PSID → EligibilityError(不該重試)', async () => {
    const ch = new FacebookChannel('token', 'secret');
    await expect(ch.send({ ...base, recipient_id: null })).rejects.toThrow(
      EligibilityError
    );
  });

  it('無 token → 可重試的 ChannelError', async () => {
    const ch = new FacebookChannel('', 'secret');
    await expect(ch.send({ ...base, recipient_id: 'PSID_1' })).rejects.toThrow(
      ChannelError
    );
  });
});
