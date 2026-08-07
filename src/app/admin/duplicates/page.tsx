'use client';

import { Suspense, useEffect, useState } from 'react';

interface DuplicateRestaurant {
  id: number;
  name: string;
  city: string | null;
  district: string | null;
  address: string | null;
  verified_status: string;
  duplicate_of: number | null;
  disabled: boolean;
  created_at: string;
}

interface DuplicateGroup {
  name: string;
  active_count: number;
  total_count: number;
  restaurants: DuplicateRestaurant[];
}

function DuplicatesPage() {
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalDuplicates, setTotalDuplicates] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [merging, setMerging] = useState<{ source: number; target: number } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const r = await fetch('/admin/api/restaurants/duplicates');
      const data = await r.json();
      if (data.error) throw new Error(data.error);
      setGroups(data.groups || []);
      setTotalGroups(data.total_groups || 0);
      setTotalDuplicates(data.total_duplicates || 0);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const mergeDuplicates = async (sourceId: number, targetId: number, sourceName: string, targetName: string) => {
    if (sourceId === targetId) return;
    if (!confirm(`把 #${sourceId}「${sourceName}」合併到 #${targetId}「${targetName}」?\n\n這會:\n• 把 #${sourceId} 的 contact_logs 轉到 #${targetId}\n• 把 hk_itinerary 對應改到 #${targetId}\n• 把 #${sourceId} 標為 duplicate + soft-delete\n\n(此動作無法復原)`)) return;
    setMerging({ source: sourceId, target: targetId });
    try {
      const r = await fetch('/admin/api/restaurants/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_id: sourceId, target_id: targetId }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Merge failed');
      alert(`✓ 合併成功!\n轉移 ${data.transferred_contact_logs} 筆 contact_log`);
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setMerging(null);
    }
  };

  const verifyRestaurant = async (id: number, status: 'verified' | 'unverified' | 'duplicate') => {
    if (!confirm(`把 #${id} 標為「${status}」?`)) return;
    try {
      const r = await fetch(`/admin/api/restaurants/${id}/verify`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!r.ok) throw new Error('Verify failed');
      await fetchData();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-800">🔗 CRM 重複偵測</h1>
            <p className="text-stone-600 mt-1">
              找出 CRM 中同名店家,手動合併成單一筆
            </p>
          </div>
          <div className="flex gap-2">
            <a
              href="/admin"
              className="px-4 py-2 bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
            >
              ← 回 CRM
            </a>
            <a
              href="/admin/hk-itinerary"
              className="px-4 py-2 bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
            >
              行程
            </a>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-300 rounded-lg p-4 mb-6 text-red-800">
            ❌ {error}
          </div>
        )}

        {loading && <div className="text-center py-8 text-stone-500">載入中...</div>}

        {!loading && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-stone-500 text-sm">重複店家群組</div>
                <div className="text-3xl font-bold text-amber-600 mt-1">{totalGroups}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-stone-500 text-sm">重複筆數</div>
                <div className="text-3xl font-bold text-red-600 mt-1">{totalDuplicates}</div>
              </div>
            </div>

            {groups.length === 0 ? (
              <div className="bg-white p-12 rounded-lg shadow text-center text-stone-500">
                ✓ CRM 中沒有重複店家
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map((g, idx) => (
                  <div key={idx} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <h2 className="text-lg font-bold text-stone-800">{g.name}</h2>
                      <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                        {g.total_count} 筆 ({g.active_count} 啟用中)
                      </span>
                    </div>
                    <div className="space-y-2">
                      {g.restaurants.map((r) => {
                        const isMerging = merging?.source === r.id;
                        // 找可合併的目標 (排除自己)
                        const mergeTargets = g.restaurants.filter(t => t.id !== r.id);
                        return (
                          <div
                            key={r.id}
                            className={`border rounded p-3 flex items-start justify-between gap-3 ${
                              r.disabled ? 'bg-stone-50 border-stone-200' : 'bg-white border-stone-300'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs text-stone-400">#{r.id}</span>
                                <span className={r.disabled ? 'line-through text-stone-400' : 'text-stone-800 font-medium'}>
                                  {r.name}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-700 rounded">
                                  {r.city || '無城市'}
                                </span>
                                {r.district && (
                                  <span className="text-xs px-2 py-0.5 bg-stone-100 text-stone-700 rounded">
                                    {r.district}
                                  </span>
                                )}
                                {r.verified_status === 'verified' && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded">
                                    ✓ 已驗證
                                  </span>
                                )}
                                {r.verified_status === 'duplicate' && (
                                  <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">
                                    重複
                                  </span>
                                )}
                                {r.disabled && (
                                  <span className="text-xs px-2 py-0.5 bg-stone-200 text-stone-600 rounded">
                                    停用
                                  </span>
                                )}
                                {r.duplicate_of && (
                                  <span className="text-xs text-stone-500">
                                    → 合併到 #{r.duplicate_of}
                                  </span>
                                )}
                              </div>
                              {r.address && (
                                <div className="text-xs text-stone-500 mt-1">📍 {r.address}</div>
                              )}
                            </div>
                            <div className="flex gap-1 flex-wrap">
                              {!r.disabled && r.verified_status !== 'verified' && (
                                <button
                                  onClick={() => verifyRestaurant(r.id, 'verified')}
                                  className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                  title="標為已驗證 (確認這家是真實的)"
                                >
                                  ✓ 標已驗證
                                </button>
                              )}
                              {r.verified_status === 'verified' && (
                                <button
                                  onClick={() => verifyRestaurant(r.id, 'unverified')}
                                  className="text-xs px-2 py-1 bg-stone-200 text-stone-700 rounded hover:bg-stone-300"
                                >
                                  取消驗證
                                </button>
                              )}
                              {mergeTargets.length > 0 && !r.disabled && (
                                <select
                                  disabled={isMerging}
                                  defaultValue=""
                                  onChange={(e) => {
                                    const targetId = parseInt(e.target.value, 10);
                                    if (targetId) {
                                      const target = g.restaurants.find(t => t.id === targetId);
                                      mergeDuplicates(r.id, targetId, r.name, target?.name || '');
                                      e.target.value = '';
                                    }
                                  }}
                                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                  <option value="">🔗 合併到...</option>
                                  {mergeTargets.map(t => (
                                    <option key={t.id} value={t.id}>
                                      #{t.id} {t.city || '?'} {t.district || ''}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="p-8 text-stone-500">載入中...</div>}>
      <DuplicatesPage />
    </Suspense>
  );
}
