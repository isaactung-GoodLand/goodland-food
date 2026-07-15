-- Migration: soft delete for restaurants
-- Created: 2026-07-15
-- Purpose: replace hard DELETE with soft delete (disabled_at) + restore + hard purge options
-- Compliance: 保留資料以符合《個資法》§11 留存義務

BEGIN;

-- 1. 加欄位
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS disabled_at      TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS disabled_reason  TEXT        NULL,
  ADD COLUMN IF NOT EXISTS disabled_by      TEXT        NULL,
  ADD COLUMN IF NOT EXISTS restored_at      TIMESTAMPTZ NULL;

-- 2. partial index: 加速「只找 active」查詢（這是預設 query 模式）
--    預期大多數查詢是 WHERE disabled_at IS NULL，這個 partial index 比 full index 小很多
CREATE INDEX IF NOT EXISTS idx_restaurants_active
  ON restaurants (id)
  WHERE disabled_at IS NULL;

-- 3. partial index: 加速「垃圾桶」查詢（看最近停用的店家）
CREATE INDEX IF NOT EXISTS idx_restaurants_disabled
  ON restaurants (disabled_at DESC)
  WHERE disabled_at IS NOT NULL;

-- 4. 欄位註解（給 DB 文件 / 工具用）
COMMENT ON COLUMN restaurants.disabled_at     IS '軟刪除時間；NULL = 啟用中';
COMMENT ON COLUMN restaurants.disabled_reason IS '停用原因（記錄用）';
COMMENT ON COLUMN restaurants.disabled_by     IS '執行停用的管理員識別';
COMMENT ON COLUMN restaurants.restored_at     IS '最後一次恢復的時間（稽核用）';

COMMIT;

-- Rollback（保留用，別在 production 直接跑）
-- BEGIN;
--   DROP INDEX IF EXISTS idx_restaurants_disabled;
--   DROP INDEX IF EXISTS idx_restaurants_active;
--   ALTER TABLE restaurants
--     DROP COLUMN IF EXISTS restored_at,
--     DROP COLUMN IF EXISTS disabled_by,
--     DROP COLUMN IF EXISTS disabled_reason,
--     DROP COLUMN IF EXISTS disabled_at;
-- COMMIT;
