// 台灣北中南區域分類 — 用於 dashboard 分組
// 北部 = 北北基宜桃竹, 中部 = 苗中彰投雲, 南部 = 嘉南高屏, 東部離島 = 花東澎金馬
//
// 注: "city" 欄位值在 DB 裡是中文縣市名 (例如 "台北市"), 直接用 string match。

export const REGIONS = {
  north: {
    label: '北部',
    cities: ['台北市', '新北市', '基隆市', '宜蘭縣', '桃園市', '新竹市', '新竹縣'],
  },
  central: {
    label: '中部',
    cities: ['苗栗縣', '台中市', '彰化縣', '南投縣', '雲林縣'],
  },
  south: {
    label: '南部',
    cities: ['嘉義市', '嘉義縣', '台南市', '高雄市', '屏東縣'],
  },
  east_islands: {
    label: '東部 / 離島',
    cities: ['花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣'],
  },
} as const;

export type RegionKey = keyof typeof REGIONS;

export const REGION_KEYS: RegionKey[] = ['north', 'central', 'south', 'east_islands'];

export function getRegionForCity(city: string | null | undefined): RegionKey | 'unknown' {
  if (!city) return 'unknown';
  for (const key of Object.keys(REGIONS) as RegionKey[]) {
    const cities = REGIONS[key].cities as readonly string[];
    if (cities.includes(city)) return key;
  }
  return 'unknown';
}

export const CONTACT_STATUSES = ['pending', 'contacted', 'rejected', 'converted', 'suspended'] as const;
export const CONTACT_STATUS_LABELS: Record<typeof CONTACT_STATUSES[number], string> = {
  pending: '未聯絡',
  contacted: '已聯絡',
  rejected: '被拒',
  converted: '轉合作',
  suspended: '暫停追蹤',
};
export const CONTACT_STATUS_COLORS: Record<typeof CONTACT_STATUSES[number], string> = {
  pending: '#9ca3af',
  contacted: '#3b82f6',
  rejected: '#ef4444',
  converted: '#10b981',
  suspended: '#f59e0b',
};
