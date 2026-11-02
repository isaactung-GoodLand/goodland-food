/**
 * 端到端測試 — 對真實 Neon DB
 *
 * 驗證完整流程:
 * 1. 撈候選店家
 * 2. 評分 + 產生話術草稿
 * 3. 入佇列 → 建立 contact_logs(pending)
 * 4. 派送(用假 token → 應留在佇列,不誤標 rejected)
 * 5. 模擬回覆 → 意圖判定 → 狀態回寫
 * 6. 清理測試資料(soft-close,不 DELETE)
 *
 * ⚠️ 這會寫入真實 DB,但所有測試紀錄都會被標記並 suspend。
 */

import { describe, it, expect } from 'vitest';
import { pool } from '@/lib/db';
import * as crm from '@/lib/messaging/crm';
import { MessagingService, ensureOutboxTable, enqueue } from '@/lib/messaging/service';
import { Stage } from '@/lib/messaging/core';
import type { InboundEvent } from '@/lib/messaging/core';

/** 假的通道:模擬送出成功,但記錄呼叫 */
function fakeChannel(name: string) {
  const sent: string[] = [];
  return {
    name,
    supportsColdOutreach: false,
    sent,
    async send(msg: any) {
      sent.push(msg.body);
      return { ok: true };
    },
    async reply(cid: string, text: string) {
      sent.push(text);
      return { ok: true };
    },
  };
}

describe('端到端(真實 Neon DB)', () => {
  it('完整流程', async () => {
    await ensureOutboxTable();

    const fb = fakeChannel('facebook');
    const svc = new MessagingService({ facebook: fb });

    // ── 1. 候選 ──────────────────────────────────────────
    const list = await svc.buildDailyList(5);
    console.log(`  [1] 候選 ${list.length} 家`);
    expect(list.length).toBeGreaterThan(0);
    const target = list[0];
    console.log(
      `      第一名: ${target.name} score=${target.score.toFixed(1)} channel=${target.channel}`
    );

    // ── 2. 入佇列 ─────────────────────────────────────────
    const body = `[E2E測試] ${target.draft}`;
    const { contact_log_id, outbox_id } = await svc.enqueue(
      target.restaurant_id,
      'facebook',
      body,
      'E2E_FAKE_PSID'
    );
    console.log(`  [2] 入佇列 contact_log=${contact_log_id} outbox=${outbox_id}`);

    const log1 = await crm.findOpenLog(target.restaurant_id);
    expect(log1).not.toBeNull();
    expect(log1!.status).toBe(Stage.PENDING);
    console.log(`      log status = ${log1!.status}`);

    // ── 3. 派送(假通道 = 成功) ────────────────────────────
    const res = await svc.dispatch(3);
    console.log(`  [3] 派送 ${res.length} 筆, ok=${res.filter((r) => r.ok).length}`);
    expect(fb.sent.length).toBeGreaterThan(0);

    const log2 = await crm.findOpenLog(target.restaurant_id);
    console.log(`      log status after dispatch = ${log2!.status}`);
    expect(log2!.status).toBe(Stage.CONTACTED);

    // ── 4. 模擬高意圖回覆 → converted ─────────────────────
    const ev: InboundEvent = {
      channel: 'facebook',
      restaurant_id: null,
      sender_id: 'E2E_FAKE_PSID',
      conversation_id: 'conv1',
      text: '請問價格多少?想試一包',
      received_at: Date.now() / 1000,
      raw: {},
    };
    const out = await svc.handleInbound(ev);
    console.log(`  [4] 回覆處理 stage=${out.stage}`);
    expect(out.ok).toBe(true);
    expect(out.stage).toBe(Stage.CONVERTED);

    const log3 = await crm.findOpenLog(target.restaurant_id);
    console.log(`      log status after reply = ${log3!.status}`);
    expect(log3!.status).toBe(Stage.CONVERTED);

    // notes 應含回覆內容 + 識別碼標記
    const { rows } = await pool.query(
      'SELECT notes FROM contact_logs WHERE id = $1',
      [contact_log_id]
    );
    console.log(`      notes 含回覆: ${rows[0].notes.includes('請問價格')}`);
    console.log(`      notes 含識別碼: ${rows[0].notes.includes('[facebook:E2E_FAKE_PSID]')}`);
    expect(rows[0].notes).toContain('請問價格');
    expect(rows[0].notes).toContain('[facebook:E2E_FAKE_PSID]');

    // ── 5. 反查:同一人再回覆,應直接對上同一筆 ─────────────
    const out2 = await svc.handleInbound({
      ...ev,
      text: '不用了,謝謝',
    });
    console.log(`  [5] 第二次回覆 stage=${out2.stage} rid=${out2.restaurant_id}`);
    expect(out2.restaurant_id).toBe(target.restaurant_id);
    expect(out2.stage).toBe(Stage.REJECTED);

    // ── 6. 清理 ───────────────────────────────────────────
    await pool.query(
      `UPDATE contact_logs SET status = 'suspended', notes = notes || $1
        WHERE id = $2`,
      ['\n[E2E測試已清理]', contact_log_id]
    );
    await pool.query(
      `UPDATE messaging_outbox SET status = 'failed', last_error = 'E2E測試已清理'
        WHERE id = $1`,
      [outbox_id]
    );
    console.log('  [6] 測試資料已 soft-close(不 DELETE)');

    const log4 = await crm.findOpenLog(target.restaurant_id);
    console.log(`      清理後 log status = ${log4?.status ?? '(已排除 suspended)'}`);
  }, 60000);

  it('漏斗統計正常', async () => {
    const f = await crm.funnel();
    console.log('  漏斗:', JSON.stringify(f));
    expect(f.active).toBeGreaterThan(0);
    expect(f.milk_tea).toBeGreaterThan(0);
  }, 30000);

  it('候選查詢不含已聯絡過的店', async () => {
    const rows = await crm.candidates(50);
    console.log(`  候選 ${rows.length} 家,全部 enabled + 有社群 + 未聯絡`);
    expect(rows.length).toBeGreaterThan(0);

    // 直接用 SQL 驗證條件 —— 比對 JS 欄位更嚴謹
    const ids = rows.map((r) => r.id);
    const { rows: bad } = await pool.query(
      `SELECT r.id, r.disabled_at, r.has_hongkong_milk_tea
         FROM restaurants r
        WHERE r.id = ANY($1)
          AND (r.disabled_at IS NOT NULL
               OR r.has_hongkong_milk_tea IS NOT TRUE
               OR (r.facebook IS NULL AND r.instagram IS NULL))`,
      [ids]
    );
    expect(bad).toHaveLength(0);

    // 確認沒有「已被聯絡過(contacted/converted/rejected)」的
    const { rows: touched } = await pool.query(
      `SELECT DISTINCT cl.restaurant_id
         FROM contact_logs cl
        WHERE cl.restaurant_id = ANY($1)
          AND cl.contact_type = ANY($2)
          AND cl.status IN ('contacted', 'converted', 'rejected')`,
      [ids, ['facebook', 'instagram', 'line']]
    );
    expect(touched).toHaveLength(0);
  }, 30000);
});
