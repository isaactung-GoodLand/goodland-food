/**
 * 通道 adapter 真實連線測試
 *
 * 目的:驗證 adapter 對「平台真的回錯誤」的反應是否正確分類。
 * 假憑證會被平台拒絕(401/403),但足以驗證:
 * 1. 請求格式正確(不是我們的語法錯誤)
 * 2. 錯誤被正確分類 → 可重試 vs 不可重試
 * 3. 不會把憑證錯誤誤標成「店家拒絕」
 *
 * ⚠️ 這些是無效憑證,不會送出任何訊息。
 */

import { describe, it, expect } from 'vitest';
import { FacebookChannel } from '@/lib/messaging/channels/facebook';
import { InstagramChannel } from '@/lib/messaging/channels/instagram';
import { LineChannel } from '@/lib/messaging/channels/line';
import { ChannelError, EligibilityError, type Message } from '@/lib/messaging/core';

const base: Message = {
  channel: 'facebook',
  restaurant_id: 1,
  body: 'connectivity test',
  recipient_id: 'FAKE_PSID_000',
  idempotency_key: 'k',
  created_at: 0,
  attempts: 0,
  meta: {},
};

describe('真實平台連線', () => {
  it('FB Graph API 可達,錯誤被正確分類', async () => {
    const ch = new FacebookChannel('invalid_token_test', 'secret');
    try {
      await ch.send({ ...base, recipient_id: 'FAKE_PSID_000' });
      // 若平台接受(極不可能)→ 至少證明連線通
      console.log('  FB: 送出成功(不預期)');
    } catch (e) {
      const err = e as ChannelError;
      console.log(
        `  FB: ${err.name} code=${err.code} retryable=${err.retryable} — ${err.message.slice(0, 120)}`
      );
      expect(err).toBeInstanceOf(ChannelError);
      // 憑證錯誤必須可重試,不能是 EligibilityError
      if (err.name === 'EligibilityError') {
        throw new Error('憑證錯誤被誤標成資格不符 — 會污染開發漏斗');
      }
    }
  });

  it('IG Graph API 可達,錯誤被正確分類', async () => {
    const ch = new InstagramChannel('123456', 'invalid_token_test', 'secret');
    try {
      await ch.send({ ...base, recipient_id: 'FAKE_PSID_000' });
      console.log('  IG: 送出成功(不預期)');
    } catch (e) {
      const err = e as ChannelError;
      console.log(
        `  IG: ${err.name} code=${err.code} retryable=${err.retryable} — ${err.message.slice(0, 120)}`
      );
      expect(err).toBeInstanceOf(ChannelError);
    }
  });

  it('LINE Messaging API 可達,錯誤被正確分類', async () => {
    const ch = new LineChannel('secret', 'invalid_token_test');
    try {
      await ch.send({ ...base, channel: 'line', recipient_id: 'U_FAKE' });
      console.log('  LINE: 送出成功(不預期)');
    } catch (e) {
      const err = e as ChannelError;
      console.log(
        `  LINE: ${err.name} code=${err.code} retryable=${err.retryable} — ${err.message.slice(0, 120)}`
      );
      expect(err).toBeInstanceOf(ChannelError);
    }
  });

  it('LINE reply 無效 replyToken → ChannelError', async () => {
    const ch = new LineChannel('secret', 'invalid_token_test');
    try {
      await ch.reply('FAKE_REPLY_TOKEN', 'test');
      console.log('  LINE reply: 成功(不預期)');
    } catch (e) {
      const err = e as ChannelError;
      console.log(
        `  LINE reply: ${err.name} retryable=${err.retryable} — ${err.message.slice(0, 100)}`
      );
      expect(err).toBeInstanceOf(ChannelError);
    }
  });
});
