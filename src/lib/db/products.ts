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
function demoSeed(): Product[] {
  return [
    {
      id: 'native-three-thirty-blend',
      platform: 'native',
      externalId: 'three-thirty-blend',
      name: '三點三拼配茶',
      price: 380,
      currency: 'TWD',
      url: 'https://gantianfoodtechnology.easy.co/products/three-thirty',
      image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80',
      inStock: true,
      syncedAt: new Date('2026-06-15'),
    },
    {
      id: 'native-evaporated-milk',
      platform: 'native',
      externalId: 'evaporated-milk',
      name: '立陶宛港式淡奶',
      price: 240,
      currency: 'TWD',
      url: 'https://gantianfoodtechnology.easy.co/products/evaporated-milk',
      image: 'https://images.unsplash.com/photo-1568051243859-1a4e7c4b3a17?w=800&q=80',
      inStock: true,
      syncedAt: new Date('2026-06-15'),
    },
    {
      id: 'native-tea-machine',
      platform: 'native',
      externalId: 'tea-machine',
      name: '快速煮茶機 (商用版)',
      price: 28800,
      currency: 'TWD',
      url: 'https://gantianfoodtechnology.easy.co/products/tea-machine',
      image: 'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=800&q=80',
      inStock: true,
      syncedAt: new Date('2026-06-15'),
    },
    {
      id: 'native-condensed-milk',
      platform: 'native',
      externalId: 'condensed-milk',
      name: '港式煉奶',
      price: 180,
      currency: 'TWD',
      url: 'https://gantianfoodtechnology.easy.co/products/condensed-milk',
      image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80',
      inStock: false,
      syncedAt: new Date('2026-06-10'),
    },
  ]
}
