-- Migration: add status column to contact_logs
-- Created: 2026-08-03
-- Purpose: 支援店家聯絡狀態追蹤（在「📋 追蹤名單」頁使用）。
--   1. 歷史紀錄保持 NULL（舊資料的回溯標記；UI 顯示為「未分類」）。
--   2. 未來 INSERT 預設帶 'contacted'（已聯絡-待回覆）—— 業務員最常用的初態。
--   3. CHECK 限制只允許 5 個固定值。
--   4. Partial index 加速追蹤頁的「以最新 status 過濾」查詢。

BEGIN;

-- 1. 新增 status 欄位（nullable，不破壞既有資料）
ALTER TABLE contact_logs
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) NULL;

-- 2. 預設值：未來新 INSERT 自動帶 'contacted'
ALTER TABLE contact_logs
  ALTER COLUMN status SET DEFAULT 'contacted';

-- 3. CHECK 約束：限定 5 個值
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_contact_logs_status'
  ) THEN
    ALTER TABLE contact_logs
      ADD CONSTRAINT chk_contact_logs_status
      CHECK (status IS NULL OR status IN ('pending', 'contacted', 'rejected', 'converted', 'suspended'));
  END IF;
END $$;

-- 4. Partial index：只 index 有填 status 的（NULL 的不在 index 內）
CREATE INDEX IF NOT EXISTS idx_contact_logs_status
  ON contact_logs (status)
  WHERE status IS NOT NULL;

-- 5. 欄位註解
COMMENT ON COLUMN contact_logs.status IS
  '聯絡追蹤狀態 (pending=待聯絡, contacted=已聯絡-待回覆, rejected=已拒絕, converted=已成交, suspended=已暫停). NULL = 舊資料未分類';

COMMIT;
