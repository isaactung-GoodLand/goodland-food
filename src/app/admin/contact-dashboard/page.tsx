'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS, CONTACT_STATUS_COLORS } from '@/lib/taiwan-regions';

interface StatsContacts {
  pending: number;
  contacted: number;
  rejected: number;
  converted: number;
  suspended: number;
}

interface DistrictNode {
  total_restaurants: number;
  contacts: StatsContacts;
  last_contact_at: string | null;
}

interface CityNode {
  total_restaurants: number;
  contacts: StatsContacts;
  last_contact_at: string | null;
  districts: Record<string, DistrictNode>;
}

interface RegionNode {
  region_key: string;
  region_label: string;
  total_restaurants: number;
  contacts: StatsContacts;
  last_contact_at: string | null;
  cities: Record<string, CityNode>;
}

interface StatsResponse {
  ok: boolean;
  generated_at: string;
  regions: Record<string, RegionNode>;
  error?: string;
}

type StatusKey = typeof CONTACT_STATUSES[number];

function piePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  const innerStart = polarToCartesian(cx, cy, r * 0.55, endAngle);
  const innerEnd = polarToCartesian(cx, cy, r * 0.55, startAngle);
  return [
    `M ${start.x} ${start.y}`,
    `A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${r * 0.55} ${r * 0.55} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ');
}

function polarToCartesian(cx: number, cy: number, r: number, angleDegrees: number) {
  const a = ((angleDegrees - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

function PieChart({ data, total, onSelect }: { data: Record<StatusKey, number>; total: number; onSelect?: (s: StatusKey) => void }) {
  const [selected, setSelected] = useState<StatusKey | null>(null);

  if (total === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        暫無資料
      </div>
    );
  }

  let cumulative = 0;
  const slices = CONTACT_STATUSES.map((s) => {
    const count = data[s] || 0;
    const pct = (count / total) * 100;
    const slice = { status: s, count, pct, start: cumulative, end: cumulative + pct };
    cumulative += pct;
    return slice;
  }).filter((s) => s.count > 0);

  const cx = 60;
  const cy = 60;
  const r = 44;
  const strokeWidth = 22;
  const circumference = 2 * Math.PI * r;

  // Calculate a small gap between segments for readability (in % of total)
  const gap = slices.length > 1 ? 0.5 : 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="120" height="120" viewBox="0 0 120 120" className="overflow-visible">
        {/* Donut style for all slices — draw each as stroke-dasharray circle */}
        {slices.map((slice, i) => {
          const pct = slice.end - slice.start;
          const usablePct = Math.max(0, pct - gap);
          const dashLength = (usablePct / 100) * circumference;
          const dashGap = circumference - dashLength;
          const offset = -((slice.start + gap / 2) / 100) * circumference;
          return (
            <circle
              key={slice.status}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={CONTACT_STATUS_COLORS[slice.status]}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${dashGap}`}
              strokeDashoffset={offset}
              transform={`rotate(-90 ${cx} ${cy})`}
              opacity={selected && selected !== slice.status ? 0.35 : 1}
              onClick={() => {
                setSelected(selected === slice.status ? null : slice.status);
                onSelect?.(slice.status);
              }}
              className="cursor-pointer transition-opacity hover:opacity-80"
            />
          );
        })}
        {/* Center label: total count */}
        <text x={cx} y={cy + 4} textAnchor="middle" className="text-[14px] font-semibold fill-gray-700">
          {total}
        </text>
        <text x={cx} y={cy - 12} textAnchor="middle" className="text-[10px] fill-gray-400">
          總數
        </text>
      </svg>
      <div className="text-xs text-gray-600 w-full">
        {CONTACT_STATUSES.map((s) => {
          const count = data[s] || 0;
          if (count === 0) return null;
          return (
            <div key={s} className="flex items-center gap-1.5 py-0.5">
              <span
                className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: CONTACT_STATUS_COLORS[s] }}
              />
              <span className="flex-1">{CONTACT_STATUS_LABELS[s]}</span>
              <span className="font-mono text-gray-500">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ContactDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters (連動)
  const [statusFilter, setStatusFilter] = useState<StatusKey | ''>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('');

  useEffect(() => {
    fetch('/admin/api/contact-stats', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setStats(data);
        else setError(data.error || 'API 錯誤');
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  // collect city options (from all regions)
  const allCityOptions = useMemo(() => {
    if (!stats) return [];
    const opts: Array<{ regionKey: string; regionLabel: string; city: string; total: number }> = [];
    for (const region of Object.values(stats.regions)) {
      for (const [cityName, city] of Object.entries(region.cities)) {
        opts.push({
          regionKey: region.region_key,
          regionLabel: region.region_label,
          city: cityName,
          total: city.total_restaurants,
        });
      }
    }
    return opts.sort((a, b) => a.city.localeCompare(b.city, 'zh-Hant-TW'));
  }, [stats]);

  // available districts for selected city
  const districtOptions = useMemo(() => {
    if (!stats || !cityFilter) return [];
    for (const region of Object.values(stats.regions)) {
      const city = region.cities[cityFilter];
      if (city) {
        return Object.entries(city.districts).map(([d, info]) => ({
          district: d,
          total: info.total_restaurants,
        })).sort((a, b) => a.district.localeCompare(b.district, 'zh-Hant-TW'));
      }
    }
    return [];
  }, [stats, cityFilter]);

  // 對應的 regionKey for selected city
  const selectedRegionKey = useMemo(() => {
    if (!stats || !cityFilter) return null;
    for (const region of Object.values(stats.regions)) {
      if (region.cities[cityFilter]) return region.region_key;
    }
    return null;
  }, [stats, cityFilter]);

  function jumpToAdmin() {
    const params = new URLSearchParams();
    params.set('page_size', '500');
    if (statusFilter) params.set('status', statusFilter);
    if (cityFilter) params.set('city', cityFilter);
    if (districtFilter) params.set('district', districtFilter);
    router.push(`/admin?${params.toString()}`);
  }

  function scrollToRegion(key: string) {
    const el = document.getElementById(`region-${key}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-ink-500">載入中…</div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <div className="text-red-600">{error || 'API 錯誤'}</div>
      </div>
    );
  }

  const regions = Object.values(stats.regions);
  // display: 跳過 unknown 如果空
  const visibleRegions = regions.filter((r) => r.total_restaurants > 0);
  const unknownRegion = regions.find((r) => r.region_key === 'unknown');

  return (
    <div className="min-h-screen bg-cream-50 p-6 pb-24">
      <div className="max-w-7xl mx-auto">
        {/* header */}
        <div className="flex items-baseline justify-between mb-6">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-ink-800">聯絡狀態</h1>
          <div className="text-xs text-ink-500">總店家 {visibleRegions.reduce((s, r) => s + r.total_restaurants, 0)} 間 · 更新於 {new Date(stats.generated_at).toLocaleString('zh-TW')}</div>
        </div>

        {/* Top: 4 pie charts (北/中/南/東部離島), 含不明 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {visibleRegions.map((region) => (
            <button
              key={region.region_key}
              onClick={() => scrollToRegion(region.region_key)}
              className="bg-white rounded-lg p-4 border border-ink-100 hover:border-forest-700 transition-colors text-left"
            >
              <div className="font-serif text-base font-medium text-ink-800 mb-3">{region.region_label}</div>
              <PieChart data={region.contacts} total={region.total_restaurants} />
              <div className="text-xs text-ink-500 mt-2 text-center font-mono">{region.total_restaurants} 間</div>
            </button>
          ))}
          {unknownRegion && unknownRegion.total_restaurants > 0 && (
            <button
              key="unknown"
              onClick={() => scrollToRegion('unknown')}
              className="bg-white rounded-lg p-4 border border-dashed border-gray-300 hover:border-gray-500 transition-colors text-left"
            >
              <div className="font-serif text-base font-medium text-ink-800 mb-3">{unknownRegion.region_label}</div>
              <PieChart data={unknownRegion.contacts} total={unknownRegion.total_restaurants} />
              <div className="text-xs text-ink-500 mt-2 text-center font-mono">{unknownRegion.total_restaurants} 間</div>
            </button>
          )}
        </div>

        {/* 篩選器 (顯示 / 取消 用兩個 select 連動) */}
        <div className="bg-white rounded-lg p-5 border border-ink-100 mb-8">
          <h2 className="font-serif text-lg font-medium text-ink-800 mb-4">篩選條件</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs text-ink-500 uppercase tracking-wider mb-1.5">聯絡狀態</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusKey | '')}
                className="w-full px-3 py-2 rounded border border-ink-200 bg-white text-sm"
              >
                <option value="">— 所有 —</option>
                {CONTACT_STATUSES.map((s) => (
                  <option key={s} value={s}>{CONTACT_STATUS_LABELS[s]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink-500 uppercase tracking-wider mb-1.5">縣市</label>
              <select
                value={cityFilter}
                onChange={(e) => {
                  setCityFilter(e.target.value);
                  setDistrictFilter('');
                }}
                className="w-full px-3 py-2 rounded border border-ink-200 bg-white text-sm"
              >
                <option value="">— 所有縣市 —</option>
                {allCityOptions.map((o) => (
                  <option key={`${o.regionKey}-${o.city}`} value={o.city}>
                    {o.city} ({o.total})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-ink-500 uppercase tracking-wider mb-1.5">
                區鄉鎮 {districtFilter && cityFilter === '' && <span className="text-red-500">*</span>}
              </label>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                disabled={!cityFilter}
                className="w-full px-3 py-2 rounded border border-ink-200 bg-white text-sm disabled:bg-gray-50 disabled:text-gray-400"
              >
                <option value="">{cityFilter ? '— 所有區 —' : '先選縣市'}</option>
                {districtOptions.map((o) => (
                  <option key={o.district} value={o.district}>
                    {o.district} ({o.total})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={jumpToAdmin}
                disabled={!cityFilter && !statusFilter && !districtFilter}
                className="w-full px-4 py-2 rounded bg-forest-700 text-cream-50 text-sm font-medium hover:bg-forest-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                跳到店家列表
              </button>
            </div>
          </div>
        </div>

        {/* Detailed sections per region */}
        {visibleRegions.map((region) => (
          <section
            key={region.region_key}
            id={`region-${region.region_key}`}
            className="mb-12 scroll-mt-6"
          >
            <h2 className="font-serif text-2xl font-semibold text-ink-800 mb-4">
              {region.region_label}
              <span className="ml-3 text-sm font-sans font-normal text-ink-500">{region.total_restaurants} 間</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(region.cities)
                .sort(([a], [b]) => a.localeCompare(b, 'zh-Hant-TW'))
                .map(([cityName, city]) => (
                  <div key={cityName} className="bg-white rounded-lg p-4 border border-ink-100">
                    <div className="flex items-baseline justify-between mb-3">
                      <h3 className="font-medium text-ink-800">{cityName}</h3>
                      <span className="text-xs text-ink-500 font-mono">{city.total_restaurants} 間</span>
                    </div>
                    <PieChart data={city.contacts} total={city.total_restaurants} />
                    <div className="mt-3 pt-3 border-t border-ink-100 space-y-1">
                      {Object.entries(city.districts)
                        .sort(([a], [b]) => a.localeCompare(b, 'zh-Hant-TW'))
                        .map(([districtName, district]) => (
                          <button
                            key={districtName}
                            onClick={() => {
                              setCityFilter(cityName);
                              setDistrictFilter(districtName);
                              setStatusFilter(statusFilter);
                            }}
                            className="w-full flex items-center justify-between px-2 py-1 text-xs hover:bg-cream-100 rounded transition-colors"
                          >
                            <span className="text-ink-700">{districtName}</span>
                            <span className="font-mono text-ink-500">{district.total_restaurants}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </section>
        ))}

        {/* 未分類 */}
        {unknownRegion && unknownRegion.total_restaurants > 0 && (
          <section key="unknown" id="region-unknown" className="mb-12 scroll-mt-6">
            <h2 className="font-serif text-2xl font-semibold text-ink-800 mb-4">
              未分類
              <span className="ml-3 text-sm font-sans font-normal text-ink-500">{unknownRegion.total_restaurants} 間</span>
            </h2>
            <div className="bg-white rounded-lg p-4 border border-dashed border-gray-300">
              <PieChart data={unknownRegion.contacts} total={unknownRegion.total_restaurants} />
              <p className="text-xs text-gray-500 mt-3">這些店家 city 或 district 為空,或被歸為「未分類」。建議補上 city/district 資料以便歸入北中南。</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
