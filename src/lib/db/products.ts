/**
 * 商品資料存取層。
 *
 * 目前實作:InMemoryProductRepo(這台 server 沒有 Postgres 時使用)
 * 未來實作:NeonProductRepo(等你給 DATABASE_URL 就可切換)
 *
 * 介面 ProductRepository 是不變的,UI 層只跟介面打交道。
 */

import type { Product } from '@/lib/adapters/types'

export interface ProductRepository {
  listAll(): Promise<Product[]>
  getById(id: string): Promise<Product | null>
  upsert(p: Product): Promise<void>
}

// ─── In-memory 實作(開發 + 示範用)───
export class InMemoryProductRepo implements ProductRepository {
  private store: Map<string, Product>

  constructor(seed: Product[] = []) {
    this.store = new Map(seed.map(p => [p.id, p]))
  }

  async listAll(): Promise<Product[]> {
    return Array.from(this.store.values())
  }

  async getById(id: string): Promise<Product | null> {
    return this.store.get(id) ?? null
  }

  async upsert(p: Product): Promise<void> {
    this.store.set(p.id, p)
  }
}

// ─── 預設 repository 選擇器 ───
// 開發/示範模式:有 DATABASE_URL 但又不想動真 DB,可用 INMEMORY=1 強制 in-memory
export function getProductRepo(): ProductRepository {
  if (process.env.INMEMORY === '1' || !process.env.DATABASE_URL) {
    return new InMemoryProductRepo(getSeedProducts())
  }
  // 未來:return new NeonProductRepo(process.env.DATABASE_URL)
  return new InMemoryProductRepo(getSeedProducts())
}

// ─── 預設展示資料(等真實資料接入後會被覆蓋)───
function getSeedProducts(): Product[] {
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
