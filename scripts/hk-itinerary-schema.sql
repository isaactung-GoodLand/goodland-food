-- HK Itinerary Plan — 拜訪規劃
-- 用於儲存兩個 plan (A 5 天 / B 7 天) 的店家清單 + 每天的拜訪狀態
-- Idempotent

CREATE TABLE IF NOT EXISTS hk_itinerary_stores (
  id           SERIAL PRIMARY KEY,
  plan         TEXT NOT NULL,                  -- 'A' or 'B'
  day          INT NOT NULL,                   -- 1-7
  visit_order  INT NOT NULL,                   -- 該日第幾個店家
  time_slot    TEXT,                           -- 預計時間 e.g. "14:00-15:00"
  restaurant_id INT REFERENCES restaurants(id), -- 連結到 restaurants (optional)
  store_name   TEXT NOT NULL,                  -- 店名
  store_address TEXT,                          -- 地址
  google_maps_url TEXT,                        -- Google Maps link
  crm_url      TEXT,                           -- CRM link (auto-generated)
  notes        TEXT,                           -- 拜訪備註
  status       TEXT DEFAULT 'pending',         -- 'pending' / 'visited' / 'skipped' / 'closed'
  visited_at   TIMESTAMPTZ,                    -- 實際拜訪時間
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plan, day, visit_order)
);

CREATE INDEX IF NOT EXISTS idx_hk_itinerary_plan_day ON hk_itinerary_stores(plan, day);
CREATE INDEX IF NOT EXISTS idx_hk_itinerary_status ON hk_itinerary_stores(status);
CREATE INDEX IF NOT EXISTS idx_hk_itinerary_restaurant ON hk_itinerary_stores(restaurant_id);

-- Lodging options (住宿/車宿推薦 — 共用)
CREATE TABLE IF NOT EXISTS hk_lodging_options (
  id           SERIAL PRIMARY KEY,
  city         TEXT NOT NULL,                  -- 過夜城市 e.g. '嘉義市', '宜蘭'
  type         TEXT NOT NULL,                  -- 'hotel' or 'car_spot'
  name         TEXT NOT NULL,
  address      TEXT,
  price        TEXT,                           -- 顯示用 (text, 可含「略超」)
  rating       TEXT,                           -- e.g. '4.5'
  facility     TEXT,                           -- e.g. '水:✅ 電:✅ 淋浴:✅'
  booking_url  TEXT,
  maps_url     TEXT,
  display_order INT DEFAULT 0,
  enabled      BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hk_lodging_city ON hk_lodging_options(city);
CREATE INDEX IF NOT EXISTS idx_hk_lodging_type ON hk_lodging_options(type);

SELECT 'hk_itinerary schema created' AS result;
