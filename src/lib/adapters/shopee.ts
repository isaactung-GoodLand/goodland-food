/**
 * Shopee Open Platform v2 adapter.
 *
 * Mock mode:回傳 2 個範例商品(today,當 demo 跟測試用)
 * Live mode:待 tokens 來時填入真實呼叫。
 *
 * Tokens(從 .env 來):
 *   SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, SHOPEE_SHOP_ID
 *   SHOPEE_USE_MOCK=1 → 用 mock,忽略 tokens
 *   SHOPEE_USE_MOCK=0 → 用 live,沒 tokens 噴 error
 */

import { normalizeProduct, type PlatformAdapter, type Product } from './types'

type Mode = 'mock' | 'live'

export class ShopeeAdapter implements PlatformAdapter {
  readonly platform = 'shopee' as const
  private mode: Mode

  constructor(opts: { mode?: Mode } = {}) {
    this.mode = opts.mode ?? (process.env.SHOPEE_USE_MOCK === '1' ? 'mock' : 'live')
  }

  static create(opts?: { mode?: Mode }) {
    return new ShopeeAdapter(opts)
  }

  async fetchProducts(): Promise<Product[]> {
    if (this.mode === 'mock') return this.mockProducts()
    return this.liveProducts()
  }

  // Shopee 不是社交平台,沒 posts
  async fetchPosts() {
    return []
  }

  // ─── Mock(2 個 demo 商品)───
  private async mockProducts(): Promise<Product[]> {
    return [
      normalizeProduct({
        platform: 'shopee',
        externalId: 'demo-001',
        name: '【官方旗艦】三點三拼配茶 6入組',
        price: 1580,
        currency: 'TWD',
        url: 'https://shopee.tw/goodland-food/001',
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: 'demo-002',
        name: '【免運】立陶宛港式淡奶 2 罐組',
        price: 420,
        currency: 'TWD',
        url: 'https://shopee.tw/goodland-food/002',
        image: 'https://images.unsplash.com/photo-1568051243859-1a4e7c4b3a17?w=800&q=80',
        inStock: true,
      }),
    ]
  }

  // ─── Live(tokens 來了再開)───
  private async liveProducts(): Promise<Product[]> {
    const partnerId = process.env.SHOPEE_PARTNER_ID
    const partnerKey = process.env.SHOPEE_PARTNER_KEY
    const shopId = process.env.SHOPEE_SHOP_ID
    if (!partnerId || !partnerKey || !shopId) {
      throw new Error(
        '[ShopeeAdapter] live mode 需要 SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, SHOPEE_SHOP_ID。' +
          '若沒有 tokens,設 SHOPEE_USE_MOCK=1 走 mock 模式。'
      )
    }
    // TODO: 之後接 Shopee Open Platform v2
    //   1) POST /api/v2/auth/token/get → access_token + shop_id
    //   2) GET /api/v2/product/get_list → 拿 item_id 列表
    //   3) GET /api/v2/product/get_item_base_info → 拿每個 item 細節
    //   4) normalize → 透過 normalizeProduct()
    return []
  }
}
