/**
 * Contact stats dashboard API
 *
 * 回傳 3 層級分組:
 *   regions[北中南離島] → cities[縣市] → districts[區鄉鎮]
 * 每個 node 含:
 *   - total_restaurants: 店家總數 (active only)
 *   - contacts:        { pending, contacted, rejected, converted, suspended } 計數
 *   - last_contact_at:  最新聯絡時間
 *
 * 注意: 一個店家可能有多筆 contact_logs — 這邊統計「contact_logs rows by status」,
 *       如果要「以店家最新狀態計」, 用 DISTINCT ON (restaurant_id) 在 DB 處理。
 *       現在用最直接的: COUNT(*)。
 */
import { pool } from '@/lib/db';
import { REGION_KEYS, REGIONS, CONTACT_STATUSES } from '@/lib/taiwan-regions';

export const dynamic = 'force-dynamic';

interface RegionNode {
  region_key: string;
  region_label: string;
  total_restaurants: number;
  contacts: Record<string, number>;
  last_contact_at: string | null;
  cities: Record<string, CityNode>;
}

interface CityNode {
  total_restaurants: number;
  contacts: Record<string, number>;
  last_contact_at: string | null;
  districts: Record<string, DistrictNode>;
}

interface DistrictNode {
  total_restaurants: number;
  contacts: Record<string, number>;
  last_contact_at: string | null;
}

const EMPTY_CONTACTS: Record<string, number> = {};
for (const s of CONTACT_STATUSES) EMPTY_CONTACTS[s] = 0;

export async function GET() {
  // 1. 取所有店家 (含 disabled, 因為 disabled 店家也應該算成 suspended bucket)
  const restaurantsRes = await pool.query(
    `SELECT id, city, district, disabled_at
     FROM restaurants`
  );

  // 2. 取所有 contact_logs (不只 status NOT NULL, 因為我們用「有 notes」的規則)
  const logsRes = await pool.query(
    `SELECT restaurant_id, status, contact_date, created_at, notes
     FROM contact_logs`
  );

  // build map: restaurant_id → latest log by created_at
  const latestByRestaurant = new Map<number, {
    status: string;
    contact_date: string | null;
    created_at: string;
    notes: string | null;
  }>();
  for (const r of logsRes.rows as Array<{
    restaurant_id: number;
    status: string | null;
    contact_date: string | null;
    created_at: string;
    notes: string | null;
  }>) {
    // 1 row per restaurant (already SELECT DISTINCT ON in above SQL — but for safety)
    const existing = latestByRestaurant.get(r.restaurant_id);
    if (!existing || r.created_at > existing.created_at) {
      latestByRestaurant.set(r.restaurant_id, {
        status: r.status || '',
        contact_date: r.contact_date,
        created_at: r.created_at,
        notes: r.notes,
      });
    }
  }

  // initialize region tree
  const tree: Record<string, RegionNode> = {};
  for (const key of REGION_KEYS) {
    tree[key] = {
      region_key: key,
      region_label: REGIONS[key].label,
      total_restaurants: 0,
      contacts: { ...EMPTY_CONTACTS },
      last_contact_at: null,
      cities: {},
    };
  }
  // "unknown" bucket for null/empty city or unmatched
  tree['unknown'] = {
    region_key: 'unknown',
    region_label: '未分類',
    total_restaurants: 0,
    contacts: { ...EMPTY_CONTACTS },
    last_contact_at: null,
    cities: {},
  };

  // 3. iterate restaurants — 把每家店歸到 region → city → district
  // 同時把它的「最新聯絡狀態」 increment
  for (const r of restaurantsRes.rows as Array<{ id: number; city: string | null; district: string | null; disabled_at: string | null }>) {
    // determine region
    let regionKey: string = 'unknown';
    if (r.city) {
      for (const k of REGION_KEYS) {
        const cities = REGIONS[k].cities as readonly string[];
        if (cities.includes(r.city)) {
          regionKey = k;
          break;
        }
      }
    }

    const regionNode = tree[regionKey];
    if (!regionNode) continue;

    const city = r.city || '(無縣市)';
    const district = r.district || '(無區)';

    if (!regionNode.cities[city]) {
      regionNode.cities[city] = {
        total_restaurants: 0,
        contacts: { ...EMPTY_CONTACTS },
        last_contact_at: null,
        districts: {},
      };
    }
    const cityNode = regionNode.cities[city];

    if (!cityNode.districts[district]) {
      cityNode.districts[district] = {
        total_restaurants: 0,
        contacts: { ...EMPTY_CONTACTS },
        last_contact_at: null,
      };
    }
    const districtNode = cityNode.districts[district];

    regionNode.total_restaurants++;
    cityNode.total_restaurants++;
    districtNode.total_restaurants++;

    // contact status: 規則 (priority 高 → 低)
    //   1. disabled_at IS NOT NULL → 'suspended' (店家停用了, 不論聯絡狀態)
    //   2. 最新 log 有 notes → 'contacted' (覆寫 status)
    //   3. 最新 log 有 status → 沿用
    //   4. 沒任何 log → 'pending'
    const latest = latestByRestaurant.get(r.id);
    let effectiveStatus: 'pending' | 'contacted' | 'rejected' | 'converted' | 'suspended' = 'pending';
    if (r.disabled_at) {
      effectiveStatus = 'suspended';
    } else if (latest) {
      const status = latest.status as 'contacted' | 'rejected' | 'converted' | 'suspended' | null;
      if (latest.notes && latest.notes.trim() !== '') {
        effectiveStatus = 'contacted';
      } else if (status && ['contacted', 'rejected', 'converted', 'suspended'].includes(status)) {
        effectiveStatus = status;
      } else {
        effectiveStatus = 'pending';
      }
      const ts = latest.contact_date || latest.created_at;
      if (!regionNode.last_contact_at || ts > regionNode.last_contact_at) regionNode.last_contact_at = ts;
      if (!cityNode.last_contact_at || ts > cityNode.last_contact_at) cityNode.last_contact_at = ts;
      if (!districtNode.last_contact_at || ts > districtNode.last_contact_at) districtNode.last_contact_at = ts;
    }

    regionNode.contacts[effectiveStatus]++;
    cityNode.contacts[effectiveStatus]++;
    districtNode.contacts[effectiveStatus]++;
  }

  return Response.json({
    ok: true,
    generated_at: new Date().toISOString(),
    regions: tree,
  });
}
