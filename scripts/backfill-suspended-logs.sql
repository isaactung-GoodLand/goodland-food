-- 給所有 disabled 店家 (disabled_at IS NOT NULL) 補一筆 contact_log
-- 標 status='suspended', notes=NULL (避免「有 notes → 已聯絡」規則覆蓋)
-- Idempotent: 只對還沒 suspended log 的店寫入

INSERT INTO contact_logs (restaurant_id, contact_type, status, notes, contact_date, created_at)
SELECT
  r.id,
  'other' AS contact_type,
  'suspended' AS status,
  NULL AS notes,                       -- 讓它不會被「有 notes → contacted」覆蓋
  COALESCE(r.disabled_at, NOW()) AS contact_date,
  COALESCE(r.disabled_at, NOW()) AS created_at
FROM restaurants r
WHERE r.disabled_at IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM contact_logs cl
    WHERE cl.restaurant_id = r.id AND cl.status = 'suspended'
  );

-- Also fix any existing suspended logs that have notes '店家已停用' (legacy)
UPDATE contact_logs SET notes = NULL
WHERE status = 'suspended' AND notes = '店家已停用';

SELECT 'Done. Suspended logs total: ' || COUNT(*)
FROM contact_logs WHERE status = 'suspended';
