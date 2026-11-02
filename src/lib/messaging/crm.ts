/**
 * CRM 存取層 — Neon Postgres 直連
 *
 * 移植自 messaging/crm.py(已驗證的 Python 版本)。
 *
 * 原則
 * ----
 * - 只 UPDATE / INSERT,**絕不 DELETE**
 * - 停用 / 重複 / 不賣 → UPDATE disabled_at + disabled_reason
 * - 一律用參數化查詢($1, $2),不要字串拼接
 *   (SQL 裡的 % 會被 psycopg2 當佔位符,Neon 這邊用 $n)
 *
 * ⚠️ 重要(2026-11-01 實測發現並修正)
 * ----------------------------------------
 * 絕對不能用 `restaurants.line` 欄位存 PSID / LINE userId。
 * 實測該欄位存的是「店家的 LINE 官方帳號連結」
 * (如 https://lin.ee/XylpE9o),是業務資料,覆寫會造成資料損毀。
 * 改用 contact_logs.notes 的 [fb:PSID_123] / [line:U456] 格式。
 */

import { pool } from '@/lib/db';

export type SocialChannel = 'facebook' | 'instagram' | 'line';

export const SOCIAL_TYPES: SocialChannel[] = ['facebook', 'instagram', 'line'];

export interface RestaurantLite {
  id: number;
  name: string;
  city: string | null;
  district: string | null;
  address: string | null;
  phone: string | null;
  facebook: string | null;
  instagram: string | null;
  line: string | null;
  rating: number | null;
  gmaps_url: string | null;
  has_hongkong_milk_tea: boolean | null;
  verified_status: string | null;
  disabled_at: string | null;
}

export interface ContactLogRow {
  id: number;
  restaurant_id: number;
  contact_type: string;
  notes: string | null;
  status: string;
  contact_date: string | null;
}

// ─────────────────────────────────────────────────────────────
// 店家
// ─────────────────────────────────────────────────────────────

export async function getRestaurant(rid: number): Promise<RestaurantLite | null> {
  const { rows } = await pool.query(
    `SELECT id, name, city, district, address, phone, facebook,
            instagram, line, rating, gmaps_url, has_hongkong_milk_tea,
            verified_status, disabled_at
       FROM restaurants WHERE id = $1`,
    [rid]
  );
  return rows[0] ?? null;
}

/**
 * 用識別碼在 contact_logs.notes 找對應紀錄。
 *
 * 格式:[fb:PSID_123] / [line:U456] —— 靠 LIKE 精確比對
 * (前後加 [] 避免 PSID_1 誤中 PSID_12)。
 */
export async function findLogByIdent(
  channel: string,
  ident: string
): Promise<ContactLogRow | null> {
  if (!ident) return null;
  const { rows } = await pool.query(
    `SELECT id, restaurant_id, contact_type, status, notes, contact_date
       FROM contact_logs
      WHERE notes LIKE $1
      ORDER BY id DESC
      LIMIT 1`,
    [`%[${channel}:${ident}]%`]
  );
  return rows[0] ?? null;
}

/**
 * 用 PSID / LINE userId 反查店家(透過 contact_logs.notes)。
 *
 * ⚠️ 不碰 restaurants.line —— 見檔頭說明。
 */
export async function getBySocial(
  channel: string,
  ident: string
): Promise<(RestaurantLite & { contact_log_id: number }) | null> {
  if (!ident) return null;
  const { rows } = await pool.query(
    `SELECT r.id, r.name, r.city, r.district, r.phone,
            r.facebook, r.instagram, r.line, r.rating,
            cl.id AS contact_log_id
       FROM restaurants r
       JOIN contact_logs cl ON cl.restaurant_id = r.id
      WHERE cl.notes LIKE $1
        AND r.disabled_at IS NULL
      ORDER BY cl.id DESC
      LIMIT 1`,
    [`%[${channel}:${ident}]%`]
  );
  return rows[0] ?? null;
}

/**
 * 開發候選:已確認賣港式奶茶 + 仍啟用 + 有 FB 或 IG。
 *
 * 這是「值得聯絡」的大池子;實際每日份額由評分模型決定。
 */
export async function candidates(limit = 200): Promise<any[]> {
  const { rows } = await pool.query(
    `SELECT r.id, r.name, r.city, r.district, r.phone, r.facebook,
            r.instagram, r.line, r.rating, r.gmaps_url,
            r.has_hongkong_milk_tea, r.verified_status,
            (SELECT count(*) FROM contact_logs cl
              WHERE cl.restaurant_id = r.id) AS contact_count,
            (SELECT max(cl.contact_date) FROM contact_logs cl
              WHERE cl.restaurant_id = r.id) AS last_contact
       FROM restaurants r
      WHERE r.disabled_at IS NULL
        AND r.has_hongkong_milk_tea IS TRUE
        AND (r.facebook IS NOT NULL OR r.instagram IS NOT NULL)
        AND NOT EXISTS (
              SELECT 1 FROM contact_logs cl
               WHERE cl.restaurant_id = r.id
                 AND cl.contact_type = ANY($1)
                 AND cl.status IN ('contacted', 'converted', 'rejected')
            )
      ORDER BY r.rating DESC NULLS LAST, r.id
      LIMIT $2`,
    [SOCIAL_TYPES, limit]
  );
  return rows;
}

// ─────────────────────────────────────────────────────────────
// 聯絡紀錄
// ─────────────────────────────────────────────────────────────

/**
 * 新增一筆 contact_logs。
 * status 對齊既有 5 值:pending / contacted / rejected / converted / suspended
 */
export async function addContactLog(
  rid: number,
  contactType: string,
  notes: string,
  status = 'pending',
  contactDate?: string | null
): Promise<number> {
  const valid = ['pending', 'contacted', 'rejected', 'converted', 'suspended'];
  const st = valid.includes(status) ? status : 'pending';

  const { rows } = await pool.query(
    `INSERT INTO contact_logs
        (restaurant_id, contact_type, notes, contact_date, status)
     VALUES ($1, $2, $3, COALESCE($4, NOW()), $5)
     RETURNING id`,
    [rid, contactType, notes || '', contactDate ?? null, st]
  );
  return rows[0].id;
}

export async function updateContactStatus(
  logId: number,
  status: string
): Promise<number> {
  if (!['pending', 'contacted', 'rejected', 'converted', 'suspended'].includes(status)) {
    throw new Error(`非法 status: ${status}`);
  }
  const res = await pool.query(
    'UPDATE contact_logs SET status = $1 WHERE id = $2',
    [status, logId]
  );
  return res.rowCount ?? 0;
}

/** 找該店家最近一筆 pending/contacted 的紀錄(指定通道)。 */
export async function findPendingLog(
  rid: number,
  contactType: string
): Promise<ContactLogRow | null> {
  const { rows } = await pool.query(
    `SELECT id, restaurant_id, contact_type, notes, status, contact_date
       FROM contact_logs
      WHERE restaurant_id = $1
        AND contact_type = $2
        AND status IN ('pending', 'contacted')
      ORDER BY contact_date DESC NULLS LAST, id DESC
      LIMIT 1`,
    [rid, contactType]
  );
  return rows[0] ?? null;
}

/**
 * 找該店家最近一筆「進行中」的社群紀錄。
 *
 * 為什麼不能用 status IN ('pending','contacted'):
 * 回覆處理時,我們正要把它從 pending 改成 converted。
 * 若用「即將被改變的狀態」當查詢條件,第二次回覆就會找不到
 * 目標 → 狀態遺失、notes 追加不到。
 * 改成:找出任何非 rejected/suspended 的紀錄,取最近一筆。
 */
export async function findOpenLog(
  rid: number,
  socialTypes: string[] = SOCIAL_TYPES
): Promise<ContactLogRow | null> {
  const { rows } = await pool.query(
    `SELECT id, restaurant_id, contact_type, notes, status, contact_date
       FROM contact_logs
      WHERE restaurant_id = $1
        AND contact_type = ANY($2)
        AND status NOT IN ('rejected', 'suspended')
      ORDER BY contact_date DESC NULLS LAST, id DESC
      LIMIT 1`,
    [rid, socialTypes]
  );
  return rows[0] ?? null;
}

/**
 * 把 PSID / LINE userId 記進聯絡紀錄的 notes,供日後反查。
 *
 * ⚠️ 絕對不能寫 restaurants.line —— 該欄位存的是店家的 LINE
 * 官方帳號連結(業務資料),覆寫會造成資料損毀。
 *
 * 格式:[fb:PSID_123] —— 用方括號包住,避免 LIKE 前綴誤中。
 *
 * logId:指定要寫到哪一筆。沒給時才自己找:
 * - 只寫到「同一通道 + 進行中」的那一筆
 * - 若寫到所有進行中的紀錄,反查會抓錯紀錄,回寫就寫錯地方
 */
export async function linkSocialId(
  rid: number,
  ident: string,
  channel: string,
  logId?: number | null
): Promise<void> {
  if (!ident) return;
  const tag = `[${channel}:${ident}]`;

  if (logId != null) {
    await pool.query(
      `UPDATE contact_logs SET notes = notes || $1
        WHERE id = $2 AND notes NOT LIKE $3`,
      [`\n${tag}`, logId, `%${tag}%`]
    );
    return;
  }

  // 同一通道、進行中、且還沒記過這個識別碼
  const { rows } = await pool.query(
    `SELECT id FROM contact_logs
      WHERE restaurant_id = $1
        AND contact_type = $2
        AND status NOT IN ('rejected', 'suspended')
        AND notes NOT LIKE $3
      ORDER BY id DESC
      LIMIT 1`,
    [rid, channel, `%${tag}%`]
  );
  if (rows[0]) {
    await pool.query(
      `UPDATE contact_logs SET notes = notes || $1
        WHERE id = $2 AND notes NOT LIKE $3`,
      [`\n${tag}`, rows[0].id, `%${tag}%`]
    );
  }
}

/** 追加回覆內容到指定紀錄的 notes。 */
export async function appendNote(logId: number, text: string): Promise<void> {
  await pool.query(
    'UPDATE contact_logs SET notes = notes || $1 WHERE id = $2',
    [text, logId]
  );
}

// ─────────────────────────────────────────────────────────────
// 漏斗統計
// ─────────────────────────────────────────────────────────────

export async function funnel(): Promise<Record<string, number>> {
  const { rows } = await pool.query(
    `SELECT
       (SELECT count(*) FROM restaurants WHERE disabled_at IS NULL) AS active,
       (SELECT count(*) FROM restaurants
         WHERE disabled_at IS NULL AND has_hongkong_milk_tea IS TRUE) AS milk_tea,
       (SELECT count(*) FROM contact_logs WHERE status = 'pending') AS pending,
       (SELECT count(*) FROM contact_logs WHERE status = 'contacted') AS contacted,
       (SELECT count(*) FROM contact_logs WHERE status = 'converted') AS converted,
       (SELECT count(*) FROM contact_logs WHERE status = 'rejected') AS rejected`
  );
  const r = rows[0];
  return {
    active: Number(r.active),
    milk_tea: Number(r.milk_tea),
    pending: Number(r.pending),
    contacted: Number(r.contacted),
    converted: Number(r.converted),
    rejected: Number(r.rejected),
  };
}
