'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';

// ====== Inline 編輯「最新聯絡備註」======
// 自動儲存: blur 或 1.2 秒 debounce
// 顯示狀態: idle | saving | saved | error
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

function InlineNoteEditor({
  logId,
  initialValue,
  onSaved,
}: {
  logId: number;
  initialValue: string;
  onSaved: () => void;
}) {
  const [value, setValue] = useState(initialValue);
  const [saved, setSaved] = useState(initialValue);
  const [state, setState] = useState<SaveState>('idle');
  const [errMsg, setErrMsg] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef(initialValue);

  // 換店家時 reset
  useEffect(() => {
    setValue(initialValue);
    setSaved(initialValue);
    lastSavedRef.current = initialValue;
    setState('idle');
    setErrMsg('');
  }, [logId]);

  const save = useCallback(async (text: string) => {
    if (text === lastSavedRef.current) return;
    setState('saving');
    setErrMsg('');
    try {
      const r = await fetch(`/admin/api/contact-logs/${logId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: text }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j?.error || `HTTP ${r.status}`);
      }
      lastSavedRef.current = text;
      setSaved(text);
      setState('saved');
      onSaved();
      // 1.5s 後收回 saved 標籤
      setTimeout(() => {
        setState(s => (s === 'saved' ? 'idle' : s));
      }, 1500);
    } catch (e: any) {
      setErrMsg(e?.message || '儲存失敗');
      setState('error');
    }
  }, [logId, onSaved]);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setValue(next);
    // debounce 自動儲存
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => save(next), 1200);
  };

  const onBlur = () => {
    // blur 時若有 pending 立即存
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (value !== lastSavedRef.current) save(value);
  };

  // Clean up on unmount
  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const dirty = value !== saved && value !== lastSavedRef.current;
  const statusText =
    state === 'saving' ? '💾 儲存中…'
    : state === 'saved' ? '✅ 已儲存'
    : state === 'error' ? `❌ ${errMsg || '失敗'}`
    : dirty ? '有未儲存修改（離開此框自動存）'
    : '';
  const statusColor =
    state === 'error' ? 'text-red-600'
    : state === 'saved' ? 'text-green-600'
    : state === 'saving' ? 'text-blue-600'
    : 'text-gray-400';

  return (
    <div className="mt-1">
      <textarea
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        rows={4}
        className={`w-full text-sm text-gray-800 bg-white border rounded-lg p-2 resize-y focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors ${
          state === 'error' ? 'border-red-300' : 'border-blue-200'
        }`}
        placeholder="輸入備註（會自動儲存）…"
        maxLength={2000}
      />
      <div className={`mt-1 text-[10px] ${statusColor}`}>
        {statusText}
      </div>
    </div>
  );
}

interface TrackingRow {
  restaurant_id: number;
  restaurant_name: string;
  restaurant_city: string;
  restaurant_district: string;
  restaurant_priority: number | null;
  restaurant_phone: string;
  latest_log_id: number;
  latest_contact_type: string;
  latest_notes: string;
  latest_contact_date: string;
  latest_status: string | null;
  latest_created_at: string;
  total_logs: number;
}

const STATUS_LABEL: Record<string, { label: string; bg: string; ring: string }> = {
  pending:    { label: '待聯絡',         bg: 'bg-gray-100 text-gray-700',   ring: 'ring-gray-300' },
  contacted: { label: '已聯絡-待回覆',  bg: 'bg-blue-100 text-blue-800',   ring: 'ring-blue-300' },
  rejected:  { label: '已拒絕',         bg: 'bg-red-100 text-red-800',     ring: 'ring-red-300' },
  converted: { label: '已成交 🎉',      bg: 'bg-green-100 text-green-800', ring: 'ring-green-300' },
  suspended: { label: '已暫停',         bg: 'bg-yellow-100 text-yellow-800', ring: 'ring-yellow-300' },
};

const TYPE_LABEL: Record<string, string> = {
  phone: '📞 電話',
  facebook: '💬 Facebook',
  instagram: '📸 Instagram',
  line: '💚 LINE',
  walkin: '🚶 親訪',
  other: '📝 其他',
};

const DAY_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: '所有' },
  { value: '7', label: '> 7 天' },
  { value: '30', label: '> 30 天' },
  { value: '60', label: '> 60 天' },
  { value: '180', label: '> 180 天' },
  { value: '365', label: '> 365 天' },
];

function formatRelative(iso: string): string {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - target;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 週前`;
  if (days < 365) return `${Math.floor(days / 30)} 個月前`;
  return `${Math.floor(days / 365)} 年前`;
}

function statusBadge(status: string | null) {
  if (!status) {
    return <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-400 ring-1 ring-gray-200">未分類</span>;
  }
  const s = STATUS_LABEL[status] ?? { label: status, bg: 'bg-gray-100 text-gray-700', ring: 'ring-gray-300' };
  return <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${s.bg} ring-1 ${s.ring}`}>{s.label}</span>;
}

export default function TrackingPage() {
  const [days, setDays] = useState<string>('7');
  const [rows, setRows] = useState<TrackingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // sortOrder: 'asc' = 舊→新（最久沒聯絡的排最上，最適合追蹤場景）
  //           'desc' = 新→舊（最近聯絡的排最上）
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // 根據 sortOrder 對 rows 排序（created_at 越舊 = 時間越小）
  const sortedRows = [...rows].sort((a, b) => {
    const ta = new Date(a.latest_contact_date).getTime();
    const tb = new Date(b.latest_contact_date).getTime();
    return sortOrder === 'asc' ? ta - tb : tb - ta;
  });

  const fetchTracking = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = days === ''
        ? '/admin/api/contact-logs/tracking'
        : `/admin/api/contact-logs/tracking?days=${days}`;
      const r = await fetch(url, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setRows(data.tracking || []);
      // keep selection if it's still in the new list
      setSelectedId(prev => (prev && data.tracking?.some((row: TrackingRow) => row.restaurant_id === prev) ? prev : null));
    } catch (e: any) {
      setError(e?.message || 'fetch failed');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchTracking(); }, [fetchTracking]);

  const selected = rows.find(r => r.restaurant_id === selectedId) ?? null;

  // ===== 鍵盤導航: ↑↓ 切換 =====
  const liRefs = useRef<(HTMLLIElement | null)[]>([]);
  // reset refs when rows length changes
  useEffect(() => { liRefs.current = liRefs.current.slice(0, sortedRows.length); }, [sortedRows.length]);
  // re-derive refs into sortedRows.length each render
  if (liRefs.current.length > sortedRows.length) liRefs.current.length = sortedRows.length;

  const moveSelection = useCallback((dir: -1 | 1) => {
    if (sortedRows.length === 0) return;
    const idx = sortedRows.findIndex(r => r.restaurant_id === selectedId);
    let next: number;
    if (idx === -1) {
      next = dir === 1 ? 0 : sortedRows.length - 1;
    } else {
      next = (idx + dir + sortedRows.length) % sortedRows.length;
    }
    const target = sortedRows[next];
    setSelectedId(target.restaurant_id);
    // focus the corresponding <li> via microtask so React reconciliation completes
    queueMicrotask(() => {
      const node = liRefs.current[next];
      node?.focus();
      node?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  }, [sortedRows, selectedId]);

  const handleListKeyDown = useCallback((e: React.KeyboardEvent<HTMLUListElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSelection(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveSelection(-1); }
  }, [moveSelection]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link href="/admin" className="text-2xl">🍜</Link>
          <h1 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <span>📋 追蹤名單</span>
            <span className="text-xs font-normal text-gray-500">last contact per restaurant</span>
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/admin" className="text-xs text-blue-600 hover:underline">← 回到 CRM</Link>
          </div>
        </div>
      </header>

      {/* Filter bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <label className="text-sm text-gray-700 font-medium">顯示:</label>
        <select
          value={days}
          onChange={e => setDays(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {DAY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="text-xs text-gray-500">
          {days === '' ? '所有聯絡過的店家（不限時間）' : '店家「最近一次聯絡」距離現在已超過這個天數'}
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          <label className="text-sm text-gray-700 font-medium">排序:</label>
          <select
            value={sortOrder}
            onChange={e => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="暢/反序：'舊→新' 把最久沒聯絡的排最上（新到者眼見為要追蹤者）；'新→舊' 把最近聯絡的排最上"
          >
            <option value="asc">舊→新（久未聯絡）</option>
            <option value="desc">新→舊（最近聯絡）</option>
          </select>
        </div>
        <button
          onClick={fetchTracking}
          disabled={loading}
          className="ml-auto px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '載入中…' : '🔄 重新整理'}
        </button>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: list */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-600 flex items-center justify-between">
            <span>追蹤店家 ({rows.length})</span>
          </div>
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50">❌ {error}</div>
          )}
          {!loading && rows.length === 0 && !error && (
            <div className="p-8 text-center text-sm text-gray-400">
              {days === '' ? '還沒有任何聯絡紀錄。' : '這個範圍內沒有店家。'}
            </div>
          )}
          <ul
            className="divide-y divide-gray-100 max-h-[70vh] overflow-y-auto outline-none"
            tabIndex={0}
            onKeyDown={handleListKeyDown}
            aria-label="追蹤店家列表，使用方向鍵切換"
          >
            {sortedRows.map((row, i) => (
              <li
                key={row.restaurant_id}
                ref={el => { liRefs.current[i] = el; }}
                tabIndex={-1}
                onClick={() => setSelectedId(row.restaurant_id)}
                className={`p-3 cursor-pointer hover:bg-blue-50 transition ${selectedId === row.restaurant_id ? 'bg-blue-50' : ''} focus:outline-none focus:bg-blue-50 focus:ring-2 focus:ring-inset focus:ring-blue-300`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-gray-800 truncate flex-1">{row.restaurant_name}</span>
                  {statusBadge(row.latest_status)}
                </div>
                <div className="text-[11px] text-gray-500 flex items-center gap-2 flex-wrap">
                  <span>{row.restaurant_city} {row.restaurant_district}</span>
                  <span>·</span>
                  <span>{TYPE_LABEL[row.latest_contact_type] || row.latest_contact_type}</span>
                  <span>·</span>
                  <span>{formatRelative(row.latest_contact_date)}</span>
                </div>
                {row.latest_notes && (
                  <div className="text-xs text-gray-600 mt-1 line-clamp-1">
                    {row.latest_notes}
                  </div>
                )}
                <div className="text-[10px] text-gray-400 mt-1">
                  總計 {row.total_logs} 次聯絡
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: detail */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          <div className="px-4 py-2 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-600">
            店家詳情
          </div>
          {!selected ? (
            <div className="p-8 text-center text-sm text-gray-400">
              ← 從左側選擇一家店查看聯絡歷程
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold text-gray-800">{selected.restaurant_name}</h2>
                  {statusBadge(selected.latest_status)}
                </div>
                <div className="text-xs text-gray-500">
                  {selected.restaurant_city} {selected.restaurant_district}
                  {selected.restaurant_phone && <> · 📞 {selected.restaurant_phone}</>}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <div className="text-xs font-semibold text-gray-600 mb-2">最近聯絡</div>
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">
                    {new Date(selected.latest_contact_date).toLocaleString('zh-TW')}
                  </div>
                  <div className="text-xs text-gray-700 mb-1">
                    {TYPE_LABEL[selected.latest_contact_type] || selected.latest_contact_type}
                  </div>
                  <div className="text-[10px] text-gray-500 mb-1 font-medium">備註（點下方輸入框直接編輯）</div>
                  <InlineNoteEditor
                    key={selected.latest_log_id}
                    logId={selected.latest_log_id}
                    initialValue={selected.latest_notes ?? ''}
                    onSaved={() => { /* 不需要重 fetch，state 已同步 */ }}
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3">
                <Link
                  href={`/admin?restaurant_id=${selected.restaurant_id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  在 CRM 中開啟 ↗
                </Link>
                <div className="text-xs text-gray-500 mt-2">
                  跳到 CRM 並自動開啟這家店（帶 restaurant_id query param）
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
