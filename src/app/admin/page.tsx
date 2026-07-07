'use client';

import { useState, useEffect, useCallback } from 'react';

interface Restaurant {
  id: number;
  name: string;
  city: string;
  district: string;
  address: string;
  phone: string;
  facebook: string;
  instagram: string;
  line: string;
  rating: number | null;
  gmaps_url: string;
  has_hongkong_milk_tea: boolean;
  contact_logs?: any[];
}

interface ContactLog {
  id: number;
  contact_date: string;
  contact_type: string;
  notes: string;
  created_at: string;
}

export default function AdminCRM() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<string[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newType, setNewType] = useState('phone');
  const [addingNote, setAddingNote] = useState(false);
  const [contactLogs, setContactLogs] = useState<ContactLog[]>([]);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (cityFilter) params.set('city', cityFilter);
    params.set('page', String(page));
    const res = await fetch(`/admin/api/restaurants?${params}`);
    const data = await res.json();
    setRestaurants(data.restaurants);
    setTotal(data.total);
    setLoading(false);
  }, [search, cityFilter, page]);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  useEffect(() => {
    const cs = [...new Set(restaurants.map(r => r.city).filter(Boolean))].sort();
    setCities(cs);
  }, [restaurants]);

  const selectRestaurant = async (r: Restaurant) => {
    setSelected(r);
    setContactLogs(r.contact_logs || []);
    const res = await fetch(`/admin/api/restaurants/${r.id}`);
    const data = await res.json();
    setContactLogs(data.contact_logs || []);
  };

  const addContactLog = async () => {
    if (!selected) return;
    setAddingNote(true);
    const res = await fetch('/admin/api/contact-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restaurant_id: selected.id, contact_type: newType, notes: newNote }),
    });
    if (res.ok) {
      const log = await res.json();
      setContactLogs(prev => [log, ...prev]);
      setNewNote('');
    }
    setAddingNote(false);
  };

  const contactUrl = (r: Restaurant, type: string) => {
    switch (type) {
      case 'phone': return r.phone ? `tel:${r.phone.replace(/\s|-|\./g, '')}` : null;
      case 'facebook': return r.facebook ? (r.facebook.startsWith('http') ? r.facebook : `https://facebook.com/${r.facebook}`) : null;
      case 'instagram': return r.instagram ? (r.instagram.startsWith('http') ? r.instagram : `https://instagram.com/${r.instagram.replace('@','')}`) : null;
      case 'line': return r.line ? (r.line.startsWith('http') ? r.line : `https://line.me/ti/p/~${r.line}`) : null;
      default: return null;
    }
  };

  const typeLabel: Record<string, string> = { phone: '📞 電話', facebook: '💬 Facebook', instagram: '📸 Instagram', line: '💚 LINE', walkin: '🚶 親訪', other: '📝 其他' };
  const typeColor: Record<string, string> = { phone: 'bg-blue-100 text-blue-800', facebook: 'bg-indigo-100 text-indigo-800', instagram: 'bg-pink-100 text-pink-800', line: 'bg-green-100 text-green-800', walkin: 'bg-amber-100 text-amber-800', other: 'bg-gray-100 text-gray-800' };

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ height: '100vh' }}>
      {/* LEFT PANEL - Restaurant List */}
      <div className="w-[420px] border-r border-gray-200 flex flex-col bg-white">
        <div className="p-4 border-b border-gray-200 space-y-3">
          <h1 className="text-lg font-bold text-gray-800">🍜 港式餐廳 CRM</h1>
          <input
            type="text" placeholder="🔍 搜尋店名、地址或電話..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">所有縣市</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="text-xs text-gray-500">{total} 間店家</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-400">載入中...</div>
          ) : restaurants.length === 0 ? (
            <div className="p-4 text-center text-gray-400">沒有找到店家</div>
          ) : (
            restaurants.map(r => (
              <div key={r.id}
                onClick={() => selectRestaurant(r)}
                className={`p-3 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition ${selected?.id === r.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}>
                <div className="font-medium text-sm text-gray-800 truncate">{r.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{r.city} {r.district}</div>
                {r.phone && <div className="text-xs text-gray-400 mt-0.5">📞 {r.phone}</div>}
                <div className="flex gap-1 mt-1 flex-wrap">
                  {r.facebook && <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">FB</span>}
                  {r.instagram && <span className="text-xs bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded">IG</span>}
                  {r.has_hongkong_milk_tea && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">🍵</span>}
                </div>
              </div>
            ))
          )}
        </div>
        {/* Pagination */}
        <div className="p-3 border-t border-gray-200 flex items-center justify-between bg-white">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">上一頁</button>
          <span className="text-sm text-gray-600">第 {page} 頁</span>
          <button onClick={() => setPage(p => p+1)} disabled={page * 20 >= total}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">下一頁</button>
        </div>
      </div>

      {/* RIGHT PANEL - Detail + Contact */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-5 border-b border-gray-200 bg-white">
            <h2 className="text-xl font-bold text-gray-800">{selected.name}</h2>
            <p className="text-sm text-gray-500 mt-1">{selected.address}</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {selected.phone && (
                <a href={contactUrl(selected, 'phone')!} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
                  📞 {selected.phone}
                </a>
              )}
              {selected.facebook && (
                <a href={contactUrl(selected, 'facebook')!} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition">
                  💬 Facebook
                </a>
              )}
              {selected.instagram && (
                <a href={contactUrl(selected, 'instagram')!} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-pink-600 text-white text-sm rounded-lg hover:bg-pink-700 transition">
                  📸 Instagram
                </a>
              )}
              {selected.line && (
                <a href={contactUrl(selected, 'line')!} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">
                  💚 LINE
                </a>
              )}
              {selected.gmaps_url && (
                <a href={selected.gmaps_url} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition">
                  📍 地圖
                </a>
              )}
            </div>
          </div>

          {/* Contact Log + Iframe area */}
          <div className="flex-1 overflow-hidden flex">
            {/* Contact Logs */}
            <div className="w-[340px] border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-700 text-sm mb-3">📋 聯絡紀錄</h3>
                {/* Add new log */}
                <div className="space-y-2">
                  <select value={newType} onChange={e => setNewType(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="phone">📞 電話</option>
                    <option value="facebook">💬 Facebook</option>
                    <option value="instagram">📸 Instagram</option>
                    <option value="line">💚 LINE</option>
                    <option value="walkin">🚶 親訪</option>
                    <option value="other">📝 其他</option>
                  </select>
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                    placeholder="備註... (optional)"
                    rows={2}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
                  <button onClick={addContactLog} disabled={addingNote}
                    className="w-full py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 transition">
                    {addingNote ? '儲存中...' : '新增紀錄'}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {contactLogs.length === 0 ? (
                  <div className="text-sm text-gray-400 text-center py-4">尚無聯絡紀錄</div>
                ) : (
                  contactLogs.map(log => (
                    <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${typeColor[log.contact_type] || 'bg-gray-100'}`}>
                          {typeLabel[log.contact_type] || log.contact_type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(log.contact_date).toLocaleDateString('zh-TW')}
                        </span>
                      </div>
                      {log.notes && <p className="text-sm text-gray-700 mt-1">{log.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Contact WebView */}
            <div className="flex-1 flex flex-col bg-gray-100">
              <div className="p-2 border-b border-gray-200 bg-white text-xs text-gray-500">
                聯絡視窗 — 點上方按鈕開啟
              </div>
              <div className="flex-1 p-3">
                {selected.phone ? (
                  <div className="h-full bg-white rounded-lg overflow-hidden">
                    <iframe
                      src={contactUrl(selected, 'phone')!}
                      className="w-full h-full border-0"
                      title="Phone"
                    />
                  </div>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                    此店家無電話號碼
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-5xl mb-4">🍜</div>
            <div>從左側選擇一家店家</div>
          </div>
        </div>
      )}
    </div>
  );
}
