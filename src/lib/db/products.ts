/**
 * 商品資料存取層。
 *
 * 設計:從「所有已啟用的 product adapter」聚合 → 統一格式 → 上層 UI 只看 Product。
 * 之後新增平台 = 寫 adapter,這層不動。
 */

import type { Product } from '@/lib/adapters/types'
import { AdapterRegistry } from '@/lib/adapters/registry'
import { ShopeeAdapter } from '@/lib/adapters/shopee'
import { MetaAdapter } from '@/lib/adapters/meta'

export interface ProductRepository {
  listAll(): Promise<Product[]>
  getById(id: string): Promise<Product | null>
  upsert(p: Product): Promise<void>
}

// ─── Adapter-based 真實 repository ───
// 從所有已啟用 adapter 抓商品,fallback 到 demo seed
export class AdapterProductRepo implements ProductRepository {
  private cache: Product[] | null = null
  private cacheAt = 0
  private ttlMs: number

  constructor(opts: { ttlMs?: number } = {}) {
    this.ttlMs = opts.ttlMs ?? 60_000 // 1 分鐘 cache
  }

  private buildRegistry(): AdapterRegistry {
    const reg = new AdapterRegistry()
    const useMock =
      process.env.USE_MOCK_ADAPTERS === '1' || !process.env.SHOPEE_USE_MOCK && !process.env.META_USE_MOCK
        ? 'mock'
        : undefined

    if (process.env.SHOPEE_ENABLED === undefined || process.env.SHOPEE_ENABLED === '1') {
      try {
        reg.register(
          new ShopeeAdapter({
            mode: process.env.SHOPEE_USE_MOCK === '1' || useMock === 'mock' ? 'mock' : 'live',
          })
        )
      } catch {}
    }
    if (process.env.META_ENABLED === '1') {
      try {
        reg.register(
          new MetaAdapter({
            mode: process.env.META_USE_MOCK === '1' || useMock === 'mock' ? 'mock' : 'live',
          })
        )
      } catch {}
    }
    return reg
  }

  async listAll(): Promise<Product[]> {
    const now = Date.now()
    if (this.cache && now - this.cacheAt < this.ttlMs) return this.cache

    const reg = this.buildRegistry()
    let all: Product[] = []
    try {
      all = await reg.fetchAllProducts()
    } catch {
      all = []
    }
    // 沒抓到 → 用 demo seed
    if (all.length === 0) all = demoSeed()
    this.cache = all
    this.cacheAt = now
    return all
  }

  async getById(id: string): Promise<Product | null> {
    const all = await this.listAll()
    return all.find(p => p.id === id) ?? null
  }

  async upsert(_p: Product): Promise<void> {
    // Adapter-based repo 是唯讀(no local DB yet)
    // TODO: 之後接 Neon/Postgres,改成真的寫回 DB
    throw new Error('AdapterProductRepo is read-only until Postgres is wired')
  }
}

// ─── In-memory(已被 AdapterProductRepo 取代,但留著給 unit test)───
export class InMemoryProductRepo implements ProductRepository {
  private store: Map<string, Product>
  constructor(seed: Product[] = []) {
    this.store = new Map(seed.map(p => [p.id, p]))
  }
  async listAll() { return Array.from(this.store.values()) }
  async getById(id: string) { return this.store.get(id) ?? null }
  async upsert(p: Product) { this.store.set(p.id, p) }
}

// ─── Factory ───
export function getProductRepo(): ProductRepository {
  if (process.env.INMEMORY === '1') {
    return new InMemoryProductRepo(demoSeed())
  }
  return new AdapterProductRepo()
}

// ─── Demo seed(沒真實 adapter 時的 fallback)───
// 所有通路 URL 靜態寫死,不依賴 adapter
const SHOPEE = 'https://shopee.tw/isaactung'
const COUPANG = 'https://shop.tw.coupang.com/goodlandfood'
const LINE_SHOP = 'https://oashop.line.me/shops/@149fugdf'
const IOPEN = 'https://mall.iopenmall.tw/011024/index.php'
const MAISHIP = 'https://myship.7-11.com.tw/general/detail/GM2401039179265'

// ─── 真實商品資料（從酷澎/蝦皮/iOpenMall 驗證）─────────────────────────────
// 圖片用 placeholder；淡奶/茶包/茶機圖片後續換成實際產品照
const IMG_BLEND = 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80'
const IMG_MILK  = 'https://images.unsplash.com/photo-1568051243859-1a4e7c4b3a17?w=800&q=80'
const IMG_TEA_BAG = 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&q=80'
const IMG_MACHINE = 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&q=80'
const IMG_GREEN_TEA = 'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800&q=80'

function demoSeed(): Product[] {
  return [
    // ── 三點三拼配紅茶 1磅 ──
    {
      id: 'shopee-blend-1lb', platform: 'shopee', externalId: 'blend-1lb',
      name: '三點三拼配紅茶 1磅（茶膽）',
      price: 380, currency: 'TWD',
      url: SHOPEE, image: IMG_BLEND,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'coupang-blend-1lb', platform: 'coupang', externalId: 'blend-1lb',
      name: '三點三拼配紅茶 1磅（茶膽）',
      price: 380, currency: 'TWD',
      url: COUPANG, image: IMG_BLEND,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'line-blend-1lb', platform: 'line', externalId: 'blend-1lb',
      name: '三點三拼配紅茶 1磅（茶膽）',
      price: 380, currency: 'TWD',
      url: LINE_SHOP, image: IMG_BLEND,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'iopenmall-blend-1lb', platform: 'iopenmall', externalId: 'blend-1lb',
      name: '三點三拼配紅茶 1磅（茶膽）',
      price: 380, currency: 'TWD',
      url: IOPEN, image: IMG_BLEND,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'maiship-blend-1lb', platform: 'maiship', externalId: 'blend-1lb',
      name: '三點三拼配紅茶 1磅（茶膽）',
      price: 380, currency: 'TWD',
      url: MAISHIP, image: IMG_BLEND,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },

    // ── 三點三拼配紅茶 12磅/箱 ──
    {
      id: 'coupang-blend-12lb', platform: 'coupang', externalId: 'blend-12lb',
      name: '三點三拼配紅茶 12磅/箱（茶膽）',
      price: 2800, currency: 'TWD',
      url: COUPANG, image: IMG_BLEND,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'iopenmall-blend-12lb', platform: 'iopenmall', externalId: 'blend-12lb',
      name: '甘田3+號拼配紅茶 一箱12磅（錫蘭紅茶）',
      price: 2800, currency: 'TWD',
      url: IOPEN, image: IMG_BLEND,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },

    // ── 黑白全脂淡奶 1罐 ──
    {
      id: 'shopee-milk-1', platform: 'shopee', externalId: 'milk-1',
      name: '黑白 BLACK & WHITE 全脂淡奶 1罐',
      price: 82, currency: 'TWD',
      url: SHOPEE, image: IMG_MILK,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'coupang-milk-1', platform: 'coupang', externalId: 'milk-1',
      name: '黑白 BLACK & WHITE 全脂淡奶 1罐',
      price: 82, currency: 'TWD',
      url: COUPANG, image: IMG_MILK,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'line-milk-1', platform: 'line', externalId: 'milk-1',
      name: '黑白 BLACK & WHITE 全脂淡奶 1罐',
      price: 82, currency: 'TWD',
      url: LINE_SHOP, image: IMG_MILK,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'iopenmall-milk-1', platform: 'iopenmall', externalId: 'milk-1',
      name: '黑白 BLACK & WHITE 全脂淡奶 1罐',
      price: 82, currency: 'TWD',
      url: IOPEN, image: IMG_MILK,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },

    // ── 黑白全脂淡奶 48罐/箱 ──
    {
      id: 'shopee-milk-48', platform: 'shopee', externalId: 'milk-48',
      name: '黑白淡奶 一箱48罐（立陶宛進口）',
      price: 3600, currency: 'TWD',
      url: SHOPEE, image: IMG_MILK,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'coupang-milk-48', platform: 'coupang', externalId: 'milk-48',
      name: '黑白淡奶 一箱48罐（立陶宛進口）',
      price: 3600, currency: 'TWD',
      url: COUPANG, image: IMG_MILK,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },

    // ── 三點三茉莉綠茶茶包 400g ──
    {
      id: 'coupang-jasmine-green', platform: 'coupang', externalId: 'jasmine-green',
      name: '三點三茉莉綠茶營業用茶包 400g（大份量）',
      price: 198, currency: 'TWD',
      url: COUPANG, image: IMG_GREEN_TEA,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'iopenmall-jasmine-green', platform: 'iopenmall', externalId: 'jasmine-green',
      name: '三點三茉莉綠茶 400g（茉香綠茶/營業用）',
      price: 198, currency: 'TWD',
      url: IOPEN, image: IMG_GREEN_TEA,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },

    // ── 三點三港式奶茶獨享茶包 10包/盒（濃香） ──
    {
      id: 'shopee-milk-tea-bag', platform: 'shopee', externalId: 'milk-tea-bag',
      name: '三點三港式奶茶獨享茶包 10包/盒（濃香）',
      price: 288, currency: 'TWD',
      url: SHOPEE, image: IMG_TEA_BAG,
      inStock: false, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'coupang-milk-tea-bag', platform: 'coupang', externalId: 'milk-tea-bag',
      name: '三點三港式奶茶獨享茶包 10包/盒（濃香）',
      price: 288, currency: 'TWD',
      url: COUPANG, image: IMG_TEA_BAG,
      inStock: false, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'iopenmall-milk-tea-bag', platform: 'iopenmall', externalId: 'milk-tea-bag',
      name: '三點三港式奶茶獨享茶包 10包/盒（濃香）',
      price: 288, currency: 'TWD',
      url: IOPEN, image: IMG_TEA_BAG,
      inStock: false, syncedAt: new Date('2026-06-28'),
    },

    // ── 三點三錫蘭茶包 20包/盒（清香） ──
    {
      id: 'shopee-ceylon-bag', platform: 'shopee', externalId: 'ceylon-bag',
      name: '三點三錫蘭茶包 20包/盒（清香）',
      price: 280, currency: 'TWD',
      url: SHOPEE, image: IMG_TEA_BAG,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'coupang-ceylon-bag', platform: 'coupang', externalId: 'ceylon-bag',
      name: '三點三港式茶飲口味錫蘭茶包 20包/盒（清香）',
      price: 280, currency: 'TWD',
      url: COUPANG, image: IMG_TEA_BAG,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'iopenmall-ceylon-bag', platform: 'iopenmall', externalId: 'ceylon-bag',
      name: '三點三錫蘭茶包 20包/盒（清香）',
      price: 280, currency: 'TWD',
      url: IOPEN, image: IMG_TEA_BAG,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },

    // ── 三點三快速煮茶機 220V ──
    {
      id: 'shopee-tea-machine', platform: 'shopee', externalId: 'tea-machine',
      name: '三點三快速煮茶機 220V 2600W（濃茶萃取設備）',
      price: 45888, currency: 'TWD',
      url: SHOPEE, image: IMG_MACHINE,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'coupang-tea-machine', platform: 'coupang', externalId: 'tea-machine',
      name: '三點三快速煮茶機 220V 2600W（濃茶萃取設備）',
      price: 45888, currency: 'TWD',
      url: COUPANG, image: IMG_MACHINE,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'iopenmall-tea-machine', platform: 'iopenmall', externalId: 'tea-machine',
      name: '三點三快速煮茶機 220V 2600W（濃茶萃取設備）',
      price: 45888, currency: 'TWD',
      url: IOPEN, image: IMG_MACHINE,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },

    // ── 三點三手工茶袋（濾袋） ──
    {
      id: 'shopee-tea-filter', platform: 'shopee', externalId: 'tea-filter',
      name: '三點三手工茶袋 港式奶茶濾袋（棉料材質/煮茶機適用）',
      price: 148, currency: 'TWD',
      url: SHOPEE, image: IMG_TEA_BAG,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
    {
      id: 'coupang-tea-filter', platform: 'coupang', externalId: 'tea-filter',
      name: '三點三手工茶袋 港式奶茶濾袋（棉料材質/煮茶機適用）',
      price: 148, currency: 'TWD',
      url: COUPANG, image: IMG_TEA_BAG,
      inStock: true, syncedAt: new Date('2026-06-28'),
    },
  ]
}
