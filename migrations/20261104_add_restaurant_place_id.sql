-- Migration: add place_id + maps_cid columns to restaurants
-- Created: 2026-11-04
-- Purpose: Google Maps 識別碼作為店家「唯一比對鍵」。
--   用途: 每日 Maps 候選流程匯入新店家前,先用這些識別碼精確比對既有資料,
--         避免同一家店因名稱/電話/地址寫法不同而被重複匯入。
--
-- 兩個鍵的分工 (2026-11-04 實測):
--   place_id  = ChIJ...      Google 的正式 place_id,最穩定
--   maps_cid  = 0x...:0x...  Maps URL 的 `!1s` hex CID,取第二段 (真正的 CID)
--
--   CRM 現有 1,757 筆 gmaps_url:
--     含 !19sChIJ... : 1,728 筆 (98.3%)
--     含 !1s0x...    : 1,730 筆 (98.5%)
--   候選 JSON (maps_batch.py):
--     只抓得到 hex CID (100%),抓不到 ChIJ
--     → 所以比對要「雙鍵並用」:候選用 CID 命中,place_id 留給未來。
--
-- 注意: 同一店在 Google Maps 只有一個識別碼,但「同址多店名」「分店」
--   等情況仍可能共用 → 所以用**非唯一** index,比對邏輯由應用層決定。

BEGIN;

-- 1. 加欄位。TEXT 綽綽有餘。
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS place_id TEXT NULL;
ALTER TABLE restaurants
  ADD COLUMN IF NOT EXISTS maps_cid TEXT NULL;

-- 2. partial index: 只有有識別碼的店需要比對加速。
--    非唯一 → 同址多店/共用識別碼允許存在,由應用層判斷。
CREATE INDEX IF NOT EXISTS idx_restaurants_place_id
  ON restaurants (place_id)
  WHERE place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_restaurants_maps_cid
  ON restaurants (maps_cid)
  WHERE maps_cid IS NOT NULL;

-- 3. 欄位註解
COMMENT ON COLUMN restaurants.place_id IS 'Google Maps place_id (ChIJ...),唯一比對鍵,由 gmaps_url 的 !19s 參數反推';
COMMENT ON COLUMN restaurants.maps_cid IS 'Google Maps hex CID (0x...),由 gmaps_url 的 !1s 參數取第二段,作為 place_id 缺失時的比對備援';

COMMIT;

-- Rollback（保留用,別在 production 直接跑）
-- BEGIN;
--   DROP INDEX IF EXISTS idx_restaurants_place_id;
--   DROP INDEX IF EXISTS idx_restaurants_maps_cid;
--   ALTER TABLE restaurants DROP COLUMN IF EXISTS place_id;
--   ALTER TABLE restaurants DROP COLUMN IF EXISTS maps_cid;
-- COMMIT;
