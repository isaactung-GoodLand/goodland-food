-- Migration: add priority column to restaurants
-- Created: 2026-07-17
-- Purpose: 業務手動設定優先度,1 = 最高,5 = 最低。NULL = 未設定(排在最後)。
--   UI 顯示:左側列表店名左邊的數字徽章 (① ② ③ ④ ⑤)。
--   列表排序:可在「店名 A→Z」與「priority ↑ (NULL 最後)」之間切換。

BEGIN;

-- 1. 加欄位。SMALLINT 範圍足夠,CHECK 限制 1..5(業務只看 5 級)。
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS priority SMALLINT NULL
  CHECK (priority IS NULL OR priority BETWEEN 1 AND 5);

-- 2. partial index: 只有設了 priority 的店需要排序加速(預期佔少數)
--    NULLS LAST 是常見業務語意:沒排過的店家自然沉底
CREATE INDEX IF NOT EXISTS idx_restaurants_priority
  ON restaurants (priority ASC NULLS LAST)
  WHERE priority IS NOT NULL;

-- 3. 欄位註解
COMMENT ON COLUMN restaurants.priority IS '業務優先度 (1=最高,NULL=未設定,排序 NULLS LAST)';

COMMIT;

-- Rollback（保留用,別在 production 直接跑）
-- BEGIN;
--   DROP INDEX IF EXISTS idx_restaurants_priority;
--   ALTER TABLE restaurants DROP COLUMN IF EXISTS priority;
-- COMMIT;