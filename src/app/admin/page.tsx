'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

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
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Restaurant>>({});
  const [saving, setSaving] = useState(false);
  const [activeIframe, setActiveIframe] = useState<string | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [iframeError, setIframeError] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [hoveredLog, setHoveredLog] = useState<{ log: ContactLog; x: number; y: number } | null>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const [rightTopHeight, setRightTopHeight] = useState(360);
  const iframeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isResizing = useRef(false);

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
    setEditForm(r);
    setContactLogs(r.contact_logs || []);
    setActiveIframe(null);
    setIframeUrl(null);
    setShowHistory(false);
    const res = await fetch(`/admin/api/restaurants/${r.id}`);
    const data = await res.json();
    setContactLogs(data.contact_logs || []);
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setSaving(true);
    const res = await fetch(`/admin/api/restaurants/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const updated = await res.json();
      setSelected(updated);
      setEditForm(updated);
      setEditing(false);
      fetchRestaurants();
    }
    setSaving(false);
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

  const openUrl = (url: string) => {
    if (iframeTimerRef.current) clearTimeout(iframeTimerRef.current);
    setIframeUrl(url);
    setActiveIframe(url);
    setIframeError(false);
    iframeTimerRef.current = setTimeout(() => {
      setIframeError(true);
    }, 3000);
  };

  const contactUrl = (r: Restaurant, type: string): string | null => {
    switch (type) {
      case 'phone': return r.phone ? `tel:${r.phone.replace(/\s|-|\./g, '')}` : null;
      case 'facebook': return r.facebook ? (r.facebook.startsWith('http') ? r.facebook : `https://facebook.com/${r.facebook}`) : null;
      case 'instagram': return r.instagram ? (r.instagram.startsWith('http') ? r.instagram : `https://instagram.com/${r.instagram.replace('@','')}`) : null;
      case 'line': return r.line ? (r.line.startsWith('http') ? r.line : `https://line.me/ti/p/~${r.line}`) : null;
      default: return null;
    }
  };

  const getLastLog = (r: Restaurant): ContactLog | null => {
    if (!r.contact_logs || r.contact_logs.length === 0) return null;
    return r.contact_logs.sort((a, b) => new Date(b.contact_date).getTime() - new Date(a.contact_date).getTime())[0];
  };

  const typeLabel: Record<string, string> = { phone: '📞 電話', facebook: '💬 Facebook', instagram: '📸 Instagram', line: '💚 LINE', walkin: '🚶 親訪', other: '📝 其他' };
  const typeColor: Record<string, string> = { phone: 'bg-blue-100 text-blue-800', facebook: 'bg-indigo-100 text-indigo-800', instagram: 'bg-pink-100 text-pink-800', line: 'bg-green-100 text-green-800', walkin: 'bg-amber-100 text-amber-800', other: 'bg-gray-100 text-gray-800' };

  // Resizer drag
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const vh = window.innerHeight;
      setRightTopHeight(Math.max(200, Math.min(vh - 80, e.clientY - 56)));
    };
    const onMouseUp = () => { isResizing.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* LEFT PANEL - 220px fixed */}
      <div className="w-[220px] border-r border-gray-200 flex flex-col bg-white shrink-0">
        <div className="p-3 border-b border-gray-200 space-y-2">
          <h1 className="text-sm font-bold text-gray-800">🍜 港式餐廳 CRM</h1>
          <input
            type="text" placeholder="🔍 搜尋..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <select value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(1); }}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">所有縣市</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="text-xs text-gray-400">{total} 間</div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-400 text-xs">載入中...</div>
          ) : restaurants.length === 0 ? (
            <div className="p-3 text-center text-gray-400 text-xs">無結果</div>
          ) : (
            restaurants.map(r => {
              const lastLog = getLastLog(r);
              return (
                <div key={r.id}
                  onClick={() => selectRestaurant(r)}
                  className={`px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition relative ${selected?.id === r.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}`}
                >
                  {/* Indicators */}
                  <span className="absolute top-2 right-2 flex gap-0.5">
                    {lastLog && <span title={`最後記錄: ${lastLog.notes || typeLabel[lastLog.contact_type] || ''}`} className="text-red-500 font-bold text-xs">*</span>}
                    {r.has_hongkong_milk_tea && <span className="text-green-500 font-bold text-xs">*</span>}
                  </span>
                  <div className="font-medium text-xs text-gray-800 truncate pr-10">{r.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.city}</div>
                  {/* Hover tooltip for last log */}
                  {lastLog && (
                    <div className="absolute left-full top-0 ml-2 z-50 hidden group-hover:block pointer-events-none">
                      <div className="bg-gray-800 text-white text-xs rounded px-2 py-1.5 whitespace-nowrap">
                        <div>{lastLog.notes || typeLabel[lastLog.contact_type]}</div>
                        <div className="text-gray-400 text-[10px]">{new Date(lastLog.contact_date).toLocaleString('zh-TW')}</div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
        <div className="p-2 border-t border-gray-200 flex items-center justify-between bg-white">
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page <= 1}
            className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">‹</button>
          <span className="text-xs text-gray-500">{page}</span>
          <button onClick={() => setPage(p => p+1)} disabled={page * 20 >= total}
            className="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">›</button>
        </div>
      </div>

      {/* RIGHT PANEL */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TOP SECTION: Info + Log (resizable) */}
          <div style={{ height: rightTopHeight }} className="flex flex-col shrink-0 border-b border-gray-300">
            {/* Restaurant info + action buttons */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-800 truncate">{selected.name}</h2>
                    {!editing ? (
                      <button onClick={() => setEditing(true)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 shrink-0">
                        ✏️
                      </button>
                    ) : (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={saveEdit} disabled={saving}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50">
                          {saving ? '...' : '💾'}
                        </button>
                        <button onClick={() => { setEditing(false); setEditForm(selected); }}
                          className="px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded-lg hover:bg-gray-300">
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                  {editing ? (
                    <div className="mt-2 grid grid-cols-2 gap-2 max-w-lg">
                      <input value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="電話" className="px-2 py-1 border rounded text-sm" />
                      <input value={editForm.facebook || ''} onChange={e => setEditForm(p => ({ ...p, facebook: e.target.value }))} placeholder="Facebook" className="px-2 py-1 border rounded text-sm" />
                      <input value={editForm.instagram || ''} onChange={e => setEditForm(p => ({ ...p, instagram: e.target.value }))} placeholder="Instagram" className="px-2 py-1 border rounded text-sm" />
                      <input value={editForm.line || ''} onChange={e => setEditForm(p => ({ ...p, line: e.target.value }))} placeholder="LINE" className="px-2 py-1 border rounded text-sm" />
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">{selected.address}</p>
                  )}
                </div>
                {/* Contact action buttons - open in iframe */}
                <div className="flex gap-1.5 flex-wrap shrink-0">
                  {selected.phone && (
                    <button onClick={() => openUrl(`tel:${selected.phone!.replace(/\s|-|\./g, '')}`)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                      📞 {selected.phone}
                    </button>
                  )}
                  {selected.facebook && (
                    <button onClick={() => openUrl(contactUrl(selected, 'facebook')!)}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">
                      💬 FB
                    </button>
                  )}
                  {selected.instagram && (
                    <button onClick={() => openUrl(contactUrl(selected, 'instagram')!)}
                      className="px-3 py-1.5 bg-pink-600 text-white text-xs rounded-lg hover:bg-pink-700">
                      📸 IG
                    </button>
                  )}
                  {selected.line && (
                    <button onClick={() => openUrl(contactUrl(selected, 'line')!)}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                      💚 LINE
                    </button>
                  )}
                  {selected.gmaps_url && (
                    <button onClick={() => openUrl(selected.gmaps_url)}
                      className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700">
                      📍 地圖
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Log - horizontal layout */}
            <div className="flex-1 overflow-hidden bg-white">
              <div className="h-full flex">
                {/* Log entry form - left side */}
                <div className="w-[200px] shrink-0 p-3 border-r border-gray-200 flex flex-col gap-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">📋 新增紀錄</div>
                  <select value={newType} onChange={e => setNewType(e.target.value)}
                    className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
                    <option value="phone">📞 電話</option>
                    <option value="facebook">💬 Facebook</option>
                    <option value="instagram">📸 Instagram</option>
                    <option value="line">💚 LINE</option>
                    <option value="walkin">🚶 親訪</option>
                    <option value="other">📝 其他</option>
                  </select>
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)}
                    placeholder="備註..."
                    rows={3}
                    className="px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none" />
                  <button onClick={addContactLog} disabled={addingNote}
                    className="py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
                    {addingNote ? '...' : '儲存'}
                  </button>
                </div>

                {/* Log list - right side, horizontal scroll */}
                <div className="flex-1 overflow-x-auto overflow-y-auto p-3">
                  <div className="flex gap-2 h-full items-start">
                    {contactLogs.length === 0 ? (
                      <div className="text-xs text-gray-400 flex items-center h-full">尚無紀錄</div>
                    ) : (
                      contactLogs.map((log, idx) => (
                        <div key={log.id}
                          onMouseEnter={e => {
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setHoveredLog({ log, x: rect.left, y: rect.bottom + 4 });
                          }}
                          onMouseLeave={() => setHoveredLog(null)}
                          className={`shrink-0 w-[120px] p-2 rounded-lg border cursor-default text-xs ${idx === 0 ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}
                        >
                          <div className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${typeColor[log.contact_type] || 'bg-gray-100'}`}>
                            {typeLabel[log.contact_type] || log.contact_type}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-1">
                            {new Date(log.contact_date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                          </div>
                          {log.notes && <div className="text-[10px] text-gray-600 mt-1 truncate">{log.notes}</div>}
                          {/* History icon for older logs */}
                          {idx > 0 && (
                            <div className="absolute top-1 right-1 text-gray-300">⏱</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Resizer handle */}
            <div ref={resizerRef}
              onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none'; }}
              className="h-2 bg-gray-100 border-t border-gray-200 cursor-row-resize hover:bg-blue-100 transition text-center"
            >
              <div className="text-gray-300 text-xs">⋮</div>
            </div>
          </div>

          {/* BOTTOM SECTION: iframe for all external links */}
          <div className="flex-1 overflow-hidden bg-gray-100">
            {iframeUrl ? (
              <div className="h-full relative">
                <div className="absolute top-0 left-0 right-0 bg-gray-800 text-white text-xs px-3 py-1.5 flex items-center justify-between z-10">
                  <span className="truncate max-w-xs">{iframeUrl}</span>
                  <button onClick={() => { setIframeUrl(null); setActiveIframe(null); setIframeError(false); }}
                    className="ml-2 text-gray-400 hover:text-white shrink-0">✕ 關閉</button>
                </div>
                {!iframeError ? (
                  <iframe
                    src={iframeUrl}
                    className="w-full h-full border-0 pt-8"
                    title="content"
                    onLoad={() => { if (iframeTimerRef.current) { clearTimeout(iframeTimerRef.current); setIframeError(false); } }}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm pt-8">
                    <div className="text-4xl mb-3">🚫</div>
                    <div className="mb-2">此網站不允許嵌入顯示</div>
                    <div className="text-xs text-gray-400 mb-4">{iframeUrl}</div>
                    <a href={iframeUrl} target="_blank" rel="noreferrer"
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">
                      ↗ 在新視窗開啟
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                點選上方按鈕在此顯示
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <div className="text-5xl mb-3">🍜</div>
            <div className="text-sm">選擇左側店家</div>
          </div>
        </div>
      )}

      {/* Hover tooltip for last log on left list items */}
      {hoveredLog && (
        <div
          className="fixed z-[9999] bg-gray-800 text-white text-xs rounded-lg px-3 py-2.5 max-w-xs shadow-xl pointer-events-none"
          style={{ left: Math.min(hoveredLog.x, window.innerWidth - 280), top: hoveredLog.y }}
        >
          <div className="font-medium mb-1">{typeLabel[hoveredLog.log.contact_type] || hoveredLog.log.contact_type}</div>
          {hoveredLog.log.notes && <div className="text-gray-200 mb-1">{hoveredLog.log.notes}</div>}
          <div className="text-gray-400 text-[10px]">{new Date(hoveredLog.log.contact_date).toLocaleString('zh-TW')}</div>
        </div>
      )}
    </div>
  );
}
