'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

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
  has_notes?: boolean;
  last_note?: string;
  last_contact_date?: string;
  contact_logs?: any[];
  priority?: number | null;
  // 軟刪除欄位
  disabled_at?: string | null;
  disabled_reason?: string | null;
  disabled_by?: string | null;
  restored_at?: string | null;
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
  const [uncontactedOnly, setUncontactedOnly] = useState(false);
  const [hasMilkTeaOnly, setHasMilkTeaOnly] = useState(false);
  const [includeDisabled, setIncludeDisabled] = useState(false);
  const [onlyDisabled, setOnlyDisabled] = useState(false);
  // sort: 'name' (預設 A→Z) | 'priority' (1 在前, NULL 最後)
  const [sort, setSort] = useState<'name' | 'priority'>('name');
  const [filters, setFilters] = useState({ phone: true, facebook: true, instagram: true, line: true, gmaps: true });
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
  const [hoveredLog, setHoveredLog] = useState<{ log: ContactLog; x: number; y: number } | null>(null);
  const [editingLogId, setEditingLogId] = useState<number | null>(null);
  const [editingNote, setEditingNote] = useState('');
  const [savingLog, setSavingLog] = useState(false);
  const resizerRef = useRef<HTMLDivElement>(null);
  const [rightTopHeight, setRightTopHeight] = useState('20vh');
  const [leftPanelWidth, setLeftPanelWidth] = useState(220);
  const leftResizerRef = useRef<HTMLDivElement>(null);
  const isLeftResizing = useRef(false);
  const isResizing = useRef(false);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (cityFilter) params.set('city', cityFilter);
    if (uncontactedOnly) params.set('uncontacted', 'true');
    if (hasMilkTeaOnly) params.set('has_milk_tea', 'true');
    if (!filters.phone) params.set('has_phone', 'true');
    if (!filters.facebook) params.set('has_facebook', 'true');
    if (!filters.instagram) params.set('has_instagram', 'true');
    if (!filters.line) params.set('has_line', 'true');
    if (!filters.gmaps) params.set('has_gmaps', 'true');
    if (includeDisabled) params.set('include_disabled', 'true');
    if (onlyDisabled) params.set('only_disabled', 'true');
    if (sort === 'priority') params.set('sort', 'priority');
    params.set('page', String(page));
    const res = await fetch(`/admin/api/restaurants?${params}`);
    const data = await res.json();
    setRestaurants(data.restaurants);
    setTotal(data.total);
    setLoading(false);
  }, [search, cityFilter, uncontactedOnly, hasMilkTeaOnly, filters, page, includeDisabled, onlyDisabled, sort]);

  useEffect(() => { fetchRestaurants(); }, [fetchRestaurants]);

  useEffect(() => {
    const cs = [...new Set(restaurants.map(r => r.city).filter(Boolean))].sort();
    setCities(cs);
  }, [restaurants]);

  const selectRestaurant = async (r: Restaurant) => {
    setSelected(r);
    setEditForm(r);
    setContactLogs(r.contact_logs || []);
    setEditing(false);
    const res = await fetch(`/admin/api/restaurants/${r.id}`);
    const data = await res.json();
    setContactLogs(data.contact_logs || []);
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

  const handleDelete = async () => {
    if (!selected) return;
    const reason = prompt(`停用「${selected.name}」的原因（可留空）：`) ?? '';
    if (reason === null) return; // 使用者按取消
    if (!confirm(`確定要停用「${selected.name}」嗎？此操作可在「垃圾桶」中復原。`)) return;
    const res = await fetch(`/admin/api/restaurants/${selected.id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason, by: 'admin' }),
    });
    if (res.ok) {
      setSelected(null);
      fetchRestaurants();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(`停用失敗：${data.error || res.statusText}`);
    }
  };

  const handleRestore = async () => {
    if (!selected) return;
    if (!confirm(`確定要恢復「${selected.name}」嗎？`)) return;
    const res = await fetch(`/admin/api/restaurants/${selected.id}/restore`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      // 重新抓取詳細資料
      const detail = await fetch(`/admin/api/restaurants/${selected.id}`).then(r => r.json());
      setSelected(detail);
      setEditForm(detail);
      fetchRestaurants();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(`恢復失敗：${data.error || res.statusText}`);
    }
  };

  const handlePurge = async () => {
    if (!selected) return;
    const typed = prompt(
      `⚠️ 永久刪除「${selected.name}」將無法復原，聯絡紀錄也會一併刪除。\n\n請輸入 PURGE 確認：`
    );
    if (typed !== 'PURGE') {
      if (typed !== null) alert('輸入不正確，已取消。');
      return;
    }
    const res = await fetch(`/admin/api/restaurants/${selected.id}/purge`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirm: 'PURGE' }),
    });
    if (res.ok) {
      setSelected(null);
      fetchRestaurants();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(`永久刪除失敗：${data.error || res.statusText}`);
    }
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

  const startEditLog = (log: ContactLog) => {
    setEditingLogId(log.id);
    setEditingNote(log.notes || '');
  };

  const cancelEditLog = () => {
    setEditingLogId(null);
    setEditingNote('');
  };

  const saveEditLog = async () => {
    if (editingLogId == null) return;
    setSavingLog(true);
    const res = await fetch(`/admin/api/contact-logs/${editingLogId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: editingNote }),
    });
    if (res.ok) {
      const updated = await res.json();
      setContactLogs(prev => prev.map(l => (l.id === updated.id ? updated : l)));
      cancelEditLog();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(`編輯失敗：${data.error || res.statusText}`);
    }
    setSavingLog(false);
  };

  const deleteLog = async (log: ContactLog) => {
    if (!confirm(`確定刪除這筆紀錄？\n類型：${typeLabel[log.contact_type] || log.contact_type}\n備註：${log.notes || '(無)'}\n\n此操作無法復原。`)) return;
    const res = await fetch(`/admin/api/contact-logs/${log.id}`, { method: 'DELETE' });
    if (res.ok) {
      setContactLogs(prev => prev.filter(l => l.id !== log.id));
      if (editingLogId === log.id) cancelEditLog();
    } else {
      const data = await res.json().catch(() => ({}));
      alert(`刪除失敗：${data.error || res.statusText}`);
    }
  };

  const openWindow = (url: string, name?: string) => {
    window.open(url, name || 'crm_popup', 'width=900,height=700,left=100,top=100,noopener,noreferrer');
  };

  // Convert Google Maps URL to embed URL
  const getMapsEmbedUrl = (gmapsUrl: string): string => {
    if (!gmapsUrl) return '';
    try {
      // If it's already an embed URL, return as-is
      if (gmapsUrl.includes('output=embed')) return gmapsUrl;
      // Extract place ID or coordinates from Google Maps URL
      const url = new URL(gmapsUrl);
      const query = encodeURIComponent(selected?.address || selected?.name || '');
      // Use embed API format
      if (query) return `https://www.google.com/maps?q=${query}&output=embed&t=&z=16&hl=zh-TW`;
      return gmapsUrl;
    } catch {
      return gmapsUrl;
    }
  };

  const getLastLog = (r: Restaurant): ContactLog | null => {
    if (!r.contact_logs || r.contact_logs.length === 0) return null;
    return r.contact_logs.sort((a, b) => new Date(b.contact_date).getTime() - new Date(a.contact_date).getTime())[0];
  };

  const typeLabel: Record<string, string> = { phone: '📞 電話', facebook: '💬 Facebook', instagram: '📸 Instagram', line: '💚 LINE', walkin: '🚶 親訪', other: '📝 其他' };
  const typeColor: Record<string, string> = { phone: 'bg-blue-100 text-blue-800', facebook: 'bg-indigo-100 text-indigo-800', instagram: 'bg-pink-100 text-pink-800', line: 'bg-green-100 text-green-800', walkin: 'bg-amber-100 text-amber-800', other: 'bg-gray-100 text-gray-800' };

  // 數字徽章 ①②③④⑤⑥⑦⑧⑨⑩ → 11+ 退回 [N] 風格避免 Unicode 缺字
  const circledNum = (n: number): string => {
    if (n >= 1 && n <= 10) return String.fromCodePoint(0x245F + n); // ①..⑩
    return `[${n}]`;
  };

  // Resizer drag
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      setRightTopHeight(`${e.clientY - 56}px`);
    };
    const onMouseUp = () => { isResizing.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, []);

  // Left panel resizer drag
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isLeftResizing.current) return;
      setLeftPanelWidth(Math.max(120, Math.min(500, e.clientX)));
    };
    const onMouseUp = () => { isLeftResizing.current = false; document.body.style.cursor = ''; document.body.style.userSelect = ''; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ height: '100vh', overflow: 'hidden' }}>
      {/* LEFT PANEL - resizable width */}
      <div style={{ width: leftPanelWidth }} className="border-r border-gray-200 flex flex-col bg-white shrink-0 relative">
        <div className="p-3 border-b border-gray-200 space-y-2">
          <h1 className="text-sm font-bold text-gray-800 flex items-center justify-between">
            <span>🍜 CRM</span>
            <Link href="/admin/settings" className="text-xs text-gray-400 hover:text-gray-700" title="設定">⚙</Link>
          </h1>
          <div className="relative">
            <button onClick={() => { const inp = document.getElementById('search-input') as HTMLInputElement; inp?.classList.toggle('hidden'); inp?.focus(); }}
              className="w-full flex items-center justify-center gap-1 px-2 py-1.5 border border-gray-300 rounded text-xs text-gray-500 hover:bg-gray-50">
              🔍 <span className="text-gray-400 text-[10px]">搜尋</span>
            </button>
            <input id="search-input" type="text" placeholder="店名/地址..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              onBlur={e => { if (!e.target.value) e.target.classList.add('hidden'); }}
              className="hidden absolute top-full left-0 right-0 mt-1 px-2 py-1.5 border border-gray-300 rounded text-xs bg-white z-10 outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select value={cityFilter} onChange={e => { setCityFilter(e.target.value); setPage(1); }}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500">
            <option value="">所有縣市</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer"><input type="checkbox" checked={filters.phone} onChange={e => { setFilters(f => ({ ...f, phone: e.target.checked })); setPage(1); }} className="w-3 h-3 rounded accent-blue-500" />📞</label>
            <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer"><input type="checkbox" checked={filters.facebook} onChange={e => { setFilters(f => ({ ...f, facebook: e.target.checked })); setPage(1); }} className="w-3 h-3 rounded accent-indigo-500" />💬</label>
            <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer"><input type="checkbox" checked={filters.instagram} onChange={e => { setFilters(f => ({ ...f, instagram: e.target.checked })); setPage(1); }} className="w-3 h-3 rounded accent-pink-500" />📸</label>
            <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer"><input type="checkbox" checked={filters.line} onChange={e => { setFilters(f => ({ ...f, line: e.target.checked })); setPage(1); }} className="w-3 h-3 rounded accent-green-500" />💚</label>
            <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer"><input type="checkbox" checked={filters.gmaps} onChange={e => { setFilters(f => ({ ...f, gmaps: e.target.checked })); setPage(1); }} className="w-3 h-3 rounded accent-gray-500" />📍</label>
            <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer"><input type="checkbox" checked={uncontactedOnly} onChange={e => { setUncontactedOnly(e.target.checked); setPage(1); }} className="w-3 h-3 rounded accent-red-500" />❌</label>
            <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer"><input type="checkbox" checked={hasMilkTeaOnly} onChange={e => { setHasMilkTeaOnly(e.target.checked); setPage(1); }} className="w-3 h-3 rounded accent-green-500" />🧋</label>
            <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer" title="包含已停用的店家"><input type="checkbox" checked={includeDisabled} onChange={e => { setIncludeDisabled(e.target.checked); if (e.target.checked) setOnlyDisabled(false); setPage(1); }} className="w-3 h-3 rounded accent-gray-400" />🪦 含已停用</label>
            <label className="flex items-center gap-1 text-xs text-red-600 cursor-pointer font-medium" title="只看已停用的店家（垃圾桶）"><input type="checkbox" checked={onlyDisabled} onChange={e => { setOnlyDisabled(e.target.checked); if (e.target.checked) setIncludeDisabled(false); setPage(1); }} className="w-3 h-3 rounded accent-red-500" />🗑 垃圾桶</label>
          </div>
          <div className="text-xs text-gray-400 flex items-center justify-between gap-2">
            <span>{total} 間</span>
            <button
              onClick={() => { setSort(s => s === 'name' ? 'priority' : 'name'); setPage(1); }}
              title={sort === 'name' ? '切換成 priority 排序' : '切換成店名排序'}
              className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${
                sort === 'priority'
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'
              }`}
            >
              排序: {sort === 'name' ? '店名' : 'priority'}
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-3 text-center text-gray-400 text-xs">載入中...</div>
          ) : restaurants.length === 0 ? (
            <div className="p-3 text-center text-gray-400 text-xs">無結果</div>
          ) : (
            restaurants.map(r => {
              const lastLog = getLastLog(r);
              const isDisabled = r.disabled_at != null;
              return (
                <div key={r.id}
                  onClick={() => selectRestaurant(r)}
                  className={`px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-blue-50 transition relative group ${selected?.id === r.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''} ${isDisabled ? 'opacity-60 bg-gray-50' : ''}`}
                >
                  {/* Indicators */}
                  <span className="absolute top-2 right-2 flex gap-0.5">
                    {r.has_notes && <span title={r.last_note || '有備註'} className="w-2 h-2 rounded-full bg-red-500 shrink-0" />}
                    {r.has_hongkong_milk_tea && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
                  </span>
                  <div className="font-medium text-xs text-gray-800 truncate pr-10 flex items-center gap-1.5">
                    {/* 優先度徽章:1-5 顯示圈數字,NULL 不顯示(避免干擾掃讀) */}
                    {typeof r.priority === 'number' && r.priority >= 1 && r.priority <= 5 && (
                      <span
                        className={`shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold leading-none ${
                          r.priority <= 2
                            ? 'bg-red-100 text-red-700'
                            : r.priority <= 3
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-500'
                        }`}
                        title={`優先度 ${r.priority} (1=最高)`}
                      >
                        {circledNum(r.priority)}
                      </span>
                    )}
                    <span className="truncate">{r.name}</span>
                    {isDisabled && (
                      <span className="shrink-0 px-1 py-0.5 rounded text-[9px] font-medium bg-gray-200 text-gray-600" title={r.disabled_reason ? `停用原因：${r.disabled_reason}` : '已停用'}>
                        已停用
                      </span>
                    )}
                    {/* 聯絡資訊 icons：有資料才顯示，順序：地址 / 電話 / FB / IG / LINE */}
                    <span className="shrink-0 inline-flex items-center gap-0.5 ml-auto text-[10px] leading-none">
                      {r.address && (
                        <span title={`地址：${r.address}`} aria-label="有地址"
                          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-red-500 text-white font-bold text-[9px]">📍</span>
                      )}
                      {r.phone && (
                        <span title={`電話：${r.phone}`} aria-label="有電話"
                          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-blue-500 text-white">📞</span>
                      )}
                      {r.facebook && (
                        <span title={`Facebook：${r.facebook}`} aria-label="有 Facebook"
                          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-indigo-600 text-white font-bold italic">f</span>
                      )}
                      {r.instagram && (
                        <span title={`Instagram：${r.instagram}`} aria-label="有 Instagram"
                          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gradient-to-br from-pink-500 via-red-500 to-yellow-500 text-white font-bold">i</span>
                      )}
                      {r.line && (
                        <span title={`LINE：${r.line}`} aria-label="有 LINE"
                          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-green-500 text-white font-bold">L</span>
                      )}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{r.city}</div>
                  {/* Hover tooltip */}
                  {r.last_note && (
                    <div className="absolute left-full top-0 ml-2 z-50 hidden group-hover:block pointer-events-none">
                      <div className="bg-gray-800 text-white text-xs rounded px-2 py-1.5 whitespace-nowrap">
                        <div>{r.last_note}</div>
                        <div className="text-gray-400 text-[10px]">{r.last_contact_date ? new Date(r.last_contact_date).toLocaleString('zh-TW') : ''}</div>
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

      {/* LEFT RESIZER HANDLE */}
      <div
        ref={leftResizerRef}
        onMouseDown={() => { isLeftResizing.current = true; document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none'; }}
        className="w-1.5 bg-gray-100 hover:bg-blue-100 cursor-col-resize shrink-0 transition"
      />

      {/* RIGHT PANEL */}
      {selected ? (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* TOP SECTION: Info + Log (resizable) */}
          <div style={{ height: rightTopHeight }} className="flex flex-col shrink-0 border-b border-gray-300">

            {/* Restaurant info + action buttons */}
            <div className="p-4 border-b border-gray-200 bg-white">
              {/* 停用資訊列（只在已停用時顯示） */}
              {selected.disabled_at && (
                <div className="mb-3 p-2 bg-gray-100 border border-gray-300 rounded text-xs text-gray-700 flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">🪦</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-800">此店家已停用</div>
                    <div className="text-gray-500 mt-0.5">
                      停用時間：{new Date(selected.disabled_at).toLocaleString('zh-TW')}
                      {selected.disabled_by && ` · 執行：${selected.disabled_by}`}
                      {selected.disabled_reason && ` · 原因：${selected.disabled_reason}`}
                    </div>
                    {selected.restored_at && (
                      <div className="text-gray-500 mt-0.5">
                        最後恢復：{new Date(selected.restored_at).toLocaleString('zh-TW')}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-gray-800 truncate">{selected.name}</h2>
                    {!editing ? (
                      <button onClick={() => setEditing(true)}
                        disabled={!!selected.disabled_at}
                        className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                        title={selected.disabled_at ? '已停用，請先恢復' : '編輯'}>
                        ✏️
                      </button>
                    ) : (
                      <div className="flex gap-1 shrink-0">
                        <button onClick={saveEdit} disabled={saving}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50">
                          {saving ? '...' : '💾'}
                        </button>
                        <button onClick={() => { setEditing(false); setEditForm(selected); }}
                          className="px-3 py-1 bg-gray-400 text-white text-xs rounded-lg hover:bg-gray-500">✖</button>
                      </div>
                    )}
                    {/* 停用/啟用 + 永久刪除按鈕（已停用店家優先顯示恢復） */}
                    {selected.disabled_at ? (
                      <>
                        <button onClick={handleRestore}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 shrink-0">
                          ♻️ 啟用
                        </button>
                        <button onClick={handlePurge}
                          className="px-3 py-1 bg-red-700 text-white text-xs rounded-lg hover:bg-red-800 shrink-0">
                          ⚠ 永久刪除
                        </button>
                      </>
                    ) : (
                      <button onClick={handleDelete}
                        className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 shrink-0"
                        title="停用（可在垃圾桶復原）">
                        🗑 停用
                      </button>
                    )}
                  </div>
                  {!editing && (
                    <div className="mt-1 text-sm text-gray-700 break-all leading-relaxed">{selected.address}</div>
                  )}
                  {editing && (
                    <div className="mt-2 grid grid-cols-2 gap-2 max-w-lg">
                      <input value={editForm.phone || ''} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} placeholder="電話" className="px-2 py-1 border rounded text-sm" />
                      <input value={editForm.facebook || ''} onChange={e => setEditForm(p => ({ ...p, facebook: e.target.value }))} placeholder="Facebook" className="px-2 py-1 border rounded text-sm" />
                      <input value={editForm.instagram || ''} onChange={e => setEditForm(p => ({ ...p, instagram: e.target.value }))} placeholder="Instagram" className="px-2 py-1 border rounded text-sm" />
                      <input value={editForm.line || ''} onChange={e => setEditForm(p => ({ ...p, line: e.target.value }))} placeholder="LINE" className="px-2 py-1 border rounded text-sm" />
                      {/* priority 編輯:select 比 input 更明確邊界,且用「清除」按鈕送 null */}
                      <div className="col-span-2 flex items-center gap-2">
                        <select
                          value={editForm.priority ?? ''}
                          onChange={e => {
                            const v = e.target.value;
                            setEditForm(p => ({ ...p, priority: v === '' ? null : Number(v) }));
                          }}
                          className="px-2 py-1 border rounded text-sm flex-1"
                        >
                          <option value="">未設定 priority</option>
                          <option value="1">① 最高 (1)</option>
                          <option value="2">② (2)</option>
                          <option value="3">③ (3)</option>
                          <option value="4">④ (4)</option>
                          <option value="5">⑤ 最低 (5)</option>
                        </select>
                        {editForm.priority != null && (
                          <button
                            type="button"
                            onClick={() => setEditForm(p => ({ ...p, priority: null }))}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 border border-gray-300 rounded"
                            title="清除 priority"
                          >
                            清除
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                {/* Contact action buttons - window.open */}
                <div className="flex gap-1.5 flex-wrap shrink-0">
                  {selected.phone && (
                    <button onClick={() => openWindow(`tel:${selected.phone.replace(/\s|-|\./g, '')}`)}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
                      📞 {selected.phone}
                    </button>
                  )}
                  {selected.facebook && (
                    <button onClick={() => openWindow(selected.facebook?.startsWith('http') ? selected.facebook : `https://facebook.com/${selected.facebook}`)}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700">
                      💬 FB
                    </button>
                  )}
                  {selected.instagram && (
                    <button onClick={() => openWindow(selected.instagram?.startsWith('http') ? selected.instagram : `https://instagram.com/${selected.instagram.replace('@','')}`)}
                      className="px-3 py-1.5 bg-pink-600 text-white text-xs rounded-lg hover:bg-pink-700">
                      📸 IG
                    </button>
                  )}
                  {selected.line && (
                    <button onClick={() => openWindow(`https://line.me/ti/p/~${selected.line}`)}
                      className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700">
                      💚 LINE
                    </button>
                  )}
                  {selected.gmaps_url && (
                    <button onClick={() => openWindow(selected.gmaps_url)}
                      className="px-3 py-1.5 bg-gray-600 text-white text-xs rounded-lg hover:bg-gray-700">
                      📍 地圖
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Contact Log - form LEFT, records RIGHT */}
            <div className="flex-1 overflow-hidden bg-white">
              <div className="h-full flex">
                {/* Log entry form - left, horizontal layout */}
                <div className="w-[280px] shrink-0 p-3 border-r border-gray-200 flex flex-col gap-2">
                  <div className="text-xs font-semibold text-gray-600 mb-1">📋 新增紀錄</div>
                  {/* Type + Note + Save all in ONE horizontal row */}
                  <div className="flex items-center gap-1.5">
                    <select value={newType} onChange={e => setNewType(e.target.value)}
                      className="px-1.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 shrink-0">
                      <option value="phone">📞</option>
                      <option value="facebook">💬</option>
                      <option value="instagram">📸</option>
                      <option value="line">💚</option>
                      <option value="walkin">🚶</option>
                      <option value="other">📝</option>
                    </select>
                    <input value={newNote} onChange={e => setNewNote(e.target.value)}
                      placeholder="備註..."
                      className="flex-1 px-1.5 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-0" />
                    <button onClick={addContactLog} disabled={addingNote}
                      className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 shrink-0">
                      {addingNote ? '...' : '儲存'}
                    </button>
                  </div>
                </div>

                {/* Log list - right side, horizontal scroll, narrower cards */}
                <div className="flex-1 overflow-x-auto overflow-y-auto p-3">
                  <div className="flex gap-1.5 h-full items-start">
                    {contactLogs.length === 0 ? (
                      <div className="text-xs text-gray-400 flex items-center h-full">尚無紀錄</div>
                    ) : (
                      contactLogs.map((log, idx) => {
                        const isEditing = editingLogId === log.id;
                        const canModify = !selected?.disabled_at;
                        return (
                          <div key={log.id}
                            onMouseEnter={e => {
                              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                              setHoveredLog({ log, x: rect.left, y: rect.bottom + 4 });
                            }}
                            onMouseLeave={() => setHoveredLog(null)}
                            className={`relative group/log shrink-0 w-[140px] p-1.5 rounded-lg border text-xs ${idx === 0 ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}
                          >
                            {/* hover 工具列：✏️ 編輯 + × 刪除（disabled 店家時隱藏） */}
                            {canModify && !isEditing && (
                              <div className="absolute -top-1 -right-1 hidden group-hover/log:flex gap-0.5 z-10">
                                <button
                                  onClick={e => { e.stopPropagation(); startEditLog(log); }}
                                  className="w-5 h-5 rounded-full bg-white border border-gray-300 shadow text-[10px] hover:bg-blue-100"
                                  title="編輯備註"
                                >✏️</button>
                                <button
                                  onClick={e => { e.stopPropagation(); deleteLog(log); }}
                                  className="w-5 h-5 rounded-full bg-white border border-gray-300 shadow text-[10px] hover:bg-red-100"
                                  title="刪除這筆紀錄"
                                >×</button>
                              </div>
                            )}
                            <div className={`inline-block px-1 py-0.5 rounded text-[9px] font-medium ${typeColor[log.contact_type] || 'bg-gray-100'}`}>
                              {typeLabel[log.contact_type] || log.contact_type}
                            </div>
                            <div className="text-[9px] text-gray-400 mt-0.5">
                              {new Date(log.contact_date).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' })}
                            </div>
                            {isEditing ? (
                              <div className="mt-1">
                                <textarea
                                  value={editingNote}
                                  onChange={e => setEditingNote(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) saveEditLog();
                                    if (e.key === 'Escape') cancelEditLog();
                                  }}
                                  autoFocus
                                  rows={2}
                                  maxLength={2000}
                                  className="w-full text-[10px] p-1 border border-blue-400 rounded outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                />
                                <div className="flex gap-1 mt-1">
                                  <button onClick={saveEditLog} disabled={savingLog}
                                    className="flex-1 px-1 py-0.5 bg-blue-600 text-white text-[9px] rounded hover:bg-blue-700 disabled:opacity-50">
                                    {savingLog ? '...' : '儲存'}
                                  </button>
                                  <button onClick={cancelEditLog}
                                    className="flex-1 px-1 py-0.5 bg-gray-300 text-gray-700 text-[9px] rounded hover:bg-gray-400">
                                    取消
                                  </button>
                                </div>
                                <div className="text-[8px] text-gray-400 mt-0.5">⌘/Ctrl+Enter 儲存 · Esc 取消</div>
                              </div>
                            ) : (
                              log.notes && <div className="text-[9px] text-gray-600 mt-0.5 break-words line-clamp-2">{log.notes}</div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Resizer handle */}
            <div ref={resizerRef}
              onMouseDown={() => { isResizing.current = true; document.body.style.cursor = 'row-resize'; document.body.style.userSelect = 'none'; }}
              className="h-2 bg-gray-100 border-t border-gray-200 cursor-row-resize hover:bg-blue-100 transition text-center flex items-center justify-center">
              <div className="text-gray-400 text-xs">⋮</div>
            </div>
          </div>

          {/* BOTTOM SECTION: Google Maps iframe */}
          <div className="flex-1 overflow-hidden bg-gray-100">
            {selected.gmaps_url ? (
              <div className="h-full relative">
                <iframe
                  src={getMapsEmbedUrl(selected.gmaps_url)}
                  className="w-full h-full border-0"
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`${selected.name} - 地圖`}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                此店家無地圖資訊
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

      {/* Hover tooltip for contact log history */}
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
