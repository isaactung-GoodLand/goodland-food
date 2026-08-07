'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface Store {
  id: number;
  plan: string;
  day: number;
  visit_order: number;
  time_slot: string | null;
  restaurant_id: number | null;
  store_name: string;
  store_address: string | null;
  google_maps_url: string | null;
  crm_url: string | null;
  notes: string | null;
  status: string;
  visited_at: string | null;
}

interface Lodging {
  id: number;
  city: string;
  type: string;
  name: string;
  address: string | null;
  price: string | null;
  rating: string | null;
  facility: string | null;
  booking_url: string | null;
  maps_url: string | null;
}

interface PlanDay {
  day: number;
  date: string;
  route: string;
  lodging: string;
  stores: [string, string][];
  note?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-200 text-gray-700',
  visited: 'bg-green-200 text-green-800',
  skipped: 'bg-yellow-200 text-yellow-800',
  closed: 'bg-red-200 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  pending: '未拜訪',
  visited: '已拜訪',
  skipped: '跳過',
  closed: '歇業',
};

export default function HkItineraryPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6">載入中...</div>}>
      <HkItineraryPage />
    </Suspense>
  );
}

function HkItineraryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = (searchParams.get('plan') || 'A') as 'A' | 'B';

  const [stores, setStores] = useState<Store[]>([]);
  const [audit, setAudit] = useState<Record<number, any>>({});
  const [lodging, setLodging] = useState<Lodging[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/admin/api/itinerary?plan=${plan}`);
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setStores(data.stores || []);
      setAudit(data.audit || {});
      setLodging(data.lodging || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  const switchPlan = (newPlan: 'A' | 'B') => {
    router.push(`/admin/hk-itinerary?plan=${newPlan}`);
  };

  const updateStore = async (id: number, fields: Partial<Store>) => {
    setSavingId(id);
    try {
      const r = await fetch('/admin/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...fields }),
      });
      if (!r.ok) throw new Error('Save failed');
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  };

  // 在 CRM 自動新增此店家 (only for not_in_crm)
  const createCrmForStore = async (store: Store) => {
    setSavingId(store.id);
    try {
      const r = await fetch('/admin/api/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: store.id,
          status: 'pending',
          auto_create_crm: true,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'CRM create failed');
      await fetchData();
      if (data.synced?.auto_created) {
        const rid = data.synced.restaurant?.id;
        if (rid) {
          window.open(`/admin?q=${encodeURIComponent(store.store_name)}`, '_blank');
        }
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingId(null);
    }
  };

  // 標記某 CRM 店家為已驗證
  const verifyCrmRestaurant = async (restaurantId: number) => {
    if (!confirm(`把 CRM #${restaurantId} 標為「已驗證」?\n(表示這個 CRM 記錄是正確的,即使行程標的城市不對也以 CRM 為準)`)) return;
    try {
      const r = await fetch(`/admin/api/restaurants/${restaurantId}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'verified' }),
      });
      if (!r.ok) {
        const data = await r.json();
        throw new Error(data.error || 'Verify failed');
      }
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      const r = await fetch('/admin/api/itinerary/seed', { method: 'POST' });
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSeeding(false);
    }
  };

  // 群組 stores by day
  const storesByDay: Record<number, Store[]> = {};
  for (const s of stores) {
    if (!storesByDay[s.day]) storesByDay[s.day] = [];
    storesByDay[s.day].push(s);
  }

  const days = Object.keys(storesByDay)
    .map((d) => Number(d))
    .sort((a, b) => a - b);

  // lodging by city
  const lodgingByCity: Record<string, Lodging[]> = {};
  for (const l of lodging) {
    if (!lodgingByCity[l.city]) lodgingByCity[l.city] = [];
    lodgingByCity[l.city].push(l);
  }

  const planName = plan === 'A' ? 'Plan A — 5 天西部版' : 'Plan B — 7 天完整版';

  return (
    <div className="min-h-screen bg-stone-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* 標題 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-emerald-900">🗺️ 港式拜訪行程</h1>
          <p className="text-sm text-stone-600 mt-1">{planName}</p>
        </div>

        {/* Plan 切換 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => switchPlan('A')}
            className={`px-4 py-2 rounded-lg font-medium ${
              plan === 'A'
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-emerald-700 border border-emerald-700'
            }`}
          >
            Plan A — 5 天
          </button>
          <button
            onClick={() => switchPlan('B')}
            className={`px-4 py-2 rounded-lg font-medium ${
              plan === 'B'
                ? 'bg-emerald-700 text-white'
                : 'bg-white text-emerald-700 border border-emerald-700'
            }`}
          >
            Plan B — 7 天
          </button>
        </div>

        {/* Seed 按鈕 (只在空資料時) */}
        {stores.length === 0 && !loading && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 mb-3">📋 資料庫沒有此 Plan 的店家資料,點擊下方匯入</p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
            >
              {seeding ? '匯入中...' : '從 JSON 匯入店家資料'}
            </button>
          </div>
        )}

        {/* 錯誤訊息 */}
        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6 text-red-800">
            ❌ {error}
          </div>
        )}

        {/* 載入中 */}
        {loading && (
          <div className="text-center py-8 text-stone-500">載入中...</div>
        )}

        {/* Days */}
        {days.map((d) => {
          const dayStores = [...storesByDay[d]].sort((a, b) => {
            // 跳過的排到最後面 (按 visit_order 維持原序)
            const aSkipped = a.status === 'skipped' ? 1 : 0;
            const bSkipped = b.status === 'skipped' ? 1 : 0;
            if (aSkipped !== bSkipped) return aSkipped - bSkipped;
            return a.visit_order - b.visit_order;
          });
          const lodgingCity = dayStores[0]?.store_address || '';
          return (
            <div key={d} className="bg-white rounded-lg shadow-sm border border-stone-200 mb-4 p-4">
              <div className="mb-3 pb-3 border-b border-stone-200">
                <h2 className="text-lg font-bold text-emerald-900">Day {d}</h2>
              </div>

              {/* 店家清單 */}
              <div className="space-y-2">
                {dayStores.map((s, idx) => (
                  <div
                    key={s.id}
                    className="flex flex-col md:flex-row md:items-center gap-2 p-3 bg-stone-50 rounded"
                  >
                    <span className="text-stone-500 font-mono text-sm w-6">
                      {idx + 1}.
                    </span>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {s.google_maps_url && (
                          <a
                            href={s.google_maps_url}
                            target="_blank"
                            rel="noreferrer"
                            className={`font-medium underline ${
                              audit[s.id]?.not_in_crm
                                ? 'text-red-700'
                                : audit[s.id]?.city_mismatch
                                ? 'text-amber-700'
                                : 'text-blue-700'
                            }`}
                            title={
                              audit[s.id]?.not_in_crm
                                ? `⚠️ CRM 找不到「${s.store_name}」`
                                : audit[s.id]?.city_mismatch
                                ? `⚠️ 行程標 ${s.store_address},但 CRM 在 ${audit[s.id]?.crm_city}`
                                : `✓ CRM 對應到 #${audit[s.id]?.restaurant_id}`
                            }
                          >
                            {s.store_name}
                          </a>
                        )}
                        {audit[s.id]?.city_mismatch && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                            行程:{s.store_address} | CRM:{audit[s.id]?.crm_city}
                          </span>
                        )}
                        {audit[s.id]?.city_mismatch && audit[s.id]?.restaurant_id && (
                          <button
                            onClick={() => verifyCrmRestaurant(audit[s.id]!.restaurant_id!)}
                            className="text-xs px-2 py-0.5 bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                            disabled={savingId === s.id}
                            title={`把 CRM #${audit[s.id]?.restaurant_id} 標為已驗證 (確認行程記的城市有誤,CRM 是對的)`}
                          >
                            ✓ 標 CRM 已驗證
                          </button>
                        )}
                        {audit[s.id]?.not_in_crm && (
                          <button
                            onClick={() => createCrmForStore(s)}
                            className="text-xs px-2 py-0.5 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            disabled={savingId === s.id}
                            title={`在 CRM 新增「${s.store_name}」@${s.store_address}`}
                          >
                            + 新增到 CRM
                          </button>
                        )}
                        {s.crm_url && (
                          <a
                            href={s.crm_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-gray-500 underline"
                          >
                            CRM
                          </a>
                        )}
                        {savingId === s.id && (
                          <span className="text-xs text-stone-400">儲存中...</span>
                        )}
                      </div>
                      <input
                        type="text"
                        defaultValue={s.notes || ''}
                        placeholder="備註 (例: 老闆忙,有興趣但下次再約)"
                        onBlur={(e) => {
                          if (e.target.value !== (s.notes || '')) {
                            updateStore(s.id, { notes: e.target.value });
                          }
                        }}
                        className="mt-1 w-full text-sm border border-stone-200 rounded px-2 py-1 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex gap-1 flex-wrap">
                      {(['pending', 'visited', 'skipped', 'closed'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => updateStore(s.id, { status: st })}
                          className={`px-2 py-1 text-xs rounded font-medium ${
                            s.status === st
                              ? STATUS_COLORS[st]
                              : 'bg-stone-100 text-stone-400 hover:bg-stone-200'
                          }`}
                          title={STATUS_LABELS[st]}
                        >
                          {STATUS_LABELS[st]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* 住宿 / 車宿 對照表 */}
        {lodging.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-stone-200 mt-6 p-4">
            <h2 className="text-lg font-bold text-emerald-900 mb-3">🏨 住宿 + 🚐 車宿</h2>
            {Object.entries(lodgingByCity).map(([city, items]) => (
              <div key={city} className="mb-4">
                <h3 className="font-bold text-sm text-stone-700 mb-2">📍 {city}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {items.map((l) => (
                    <div
                      key={l.id}
                      className={`p-3 rounded border ${
                        l.type === 'hotel' ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
                      }`}
                    >
                      <div className="font-medium text-sm">
                        {l.type === 'hotel' ? '🏨 ' : '🚐 '}
                        {l.maps_url ? (
                          <a href={l.maps_url} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                            {l.name}
                          </a>
                        ) : l.booking_url ? (
                          <a href={l.booking_url} target="_blank" rel="noreferrer" className="text-blue-700 underline">
                            {l.name}
                          </a>
                        ) : (
                          l.name
                        )}
                      </div>
                      <div className="text-xs text-stone-600 mt-1">
                        {l.address}
                      </div>
                      <div className="text-xs mt-1">
                        <span className="font-medium">{l.price}</span>
                        {l.rating && <span className="ml-2">⭐ {l.rating}</span>}
                      </div>
                      {l.facility && (
                        <div className="text-xs text-stone-500 mt-1">{l.facility}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
