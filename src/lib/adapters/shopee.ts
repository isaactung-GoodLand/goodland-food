/**
 * Shopee Open Platform v2 adapter.
 *
 * Mock mode:回傳從 Shopee seller center 匯入的真實商品資料(精選 16 筆現貨)
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

  // ─── Mock(精選 16 筆現貨商品,從 Shopee seller center 匯入)───
  // 來源:mass_update_sales_info_36847171_*.xlsx (2026-06-30)
  // 篩選條件:庫存 > 0 (只列現貨,價錢/規格在蝦皮頁面看)
  // 圖片來源:10 個來自 iOpenMall (/products/*.jpeg,本機) + 6 個用 unsplash placeholder
  // 真實 API tokens 來了以後會切到 live mode,這份資料當 fallback
  private async mockProducts(): Promise<Product[]> {
    return [
      normalizeProduct({
        platform: 'shopee',
        externalId: '405951491361',
        name: '(限量試賣) 抺葉粉 綠茶粉｜100%純天然抹茶粉 烘焙專用',
        price: 150,
        currency: 'TWD',
        url: 'https://shopee.tw/product/55510783493/405951491361',
        image: '/products/matcha-powder.jpg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '260071248435',
        name: '👨🍳新產品 三點三 苿莉綠茶 茉香綠茶 營業用',
        price: 198,
        currency: 'TWD',
        url: 'https://shopee.tw/product/42000879544/260071248435',
        image: '/products/P1102411105920_1_109782517.jpeg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '157882572023',
        name: '👨🍳大排檔在我家 ☕(50g 送茶袋) 三點三 拼茶-嚐鮮包',
        price: 320,
        currency: 'TWD',
        url: 'https://shopee.tw/product/28913909761/157882572023',
        image: '/products/P1102410388584_1_94978546.jpeg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '218014672788',
        name: '黑白淡奶［公司貨］ 奶水',
        price: 458,
        currency: 'TWD',
        url: 'https://shopee.tw/product/26618894500/218014672788',
        image: '/products/P1102410388498_1_109782639.jpeg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '178865782162',
        name: '🧇🥞新產品  🥐🥯🍞🥖三點三 紅茶粉 烘焙用 純紅茶',
        price: 150,
        currency: 'TWD',
        url: 'https://shopee.tw/product/26033595296/178865782162',
        image: '/products/P1102411106012_1_102563740.jpeg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '166622858429',
        name: '👉推廣特賣👈［清香］☕三點三 港式茶飲口味錫蘭茶包 20包裝',
        price: 280,
        currency: 'TWD',
        url: 'https://shopee.tw/product/25634743249/166622858429',
        image: '/products/P1102410388631_1_109782498.jpeg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '225998363044',
        name: '三點三［濃香］三分鐘港式奶茶獨享茶包（一盒十包）',
        price: 1398,
        currency: 'TWD',
        url: 'https://shopee.tw/product/25409329408/225998363044',
        image: '/products/P1102406555249_1_109782678.jpeg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '158829311306',
        name: '黑白淡奶 ［一箱48罐］',
        price: 3600,
        currency: 'TWD',
        url: 'https://shopee.tw/product/23216028810/158829311306',
        image: '/products/P1102410388498_1_109782639.jpeg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '145928775284',
        name: '(6樽)(人氣)三點三 正宗古早味 港式奶茶 (300ml)',
        price: 478,
        currency: 'TWD',
        url: 'https://shopee.tw/product/21251782094/145928775284',
        image: '/products/milk-tea-300ml.jpg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '192602795200',
        name: '(6樽)三點三 正宗古早味 港式鴛鴦  鴛鴦奶茶  (300ml)',
        price: 598,
        currency: 'TWD',
        url: 'https://shopee.tw/product/20951782425/192602795200',
        image: '/products/lemon-tea-490ml.jpg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '108890543940',
        name: '(商用) 三點三快速煮茶機',
        price: 45888,
        currency: 'TWD',
        url: 'https://shopee.tw/product/20678981967/108890543940',
        image: '/products/tea-machine-2.jpg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '107249992251',
        name: '三點三 拼配紅茶 ［一箱12磅］',
        price: 2800,
        currency: 'TWD',
        url: 'https://shopee.tw/product/20134619012/107249992251',
        image: '/products/P1102410388600_1_94978743.jpeg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '137451044942',
        name: '三點三 紅茶 拼茶［1磅］［港式奶茶 茶膽 ］',
        price: 240,
        currency: 'TWD',
        url: 'https://shopee.tw/product/20034616866/137451044942',
        image: '/products/P1102402457961_1_94977858.jpeg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '39107242571',
        name: '(6樽)(人氣)三點三 正宗古早味 家庭裝 港式檸茶 檸檬茶 不一樣的口味, 會上癮喔(490ml)',
        price: 588,
        currency: 'TWD',
        url: 'https://shopee.tw/product/18851785582/39107242571',
        image: '/products/lemon-tea-490ml.jpg',
        inStock: true,
      }),
      normalizeProduct({
        platform: 'shopee',
        externalId: '89010739022',
        name: '(新貨)❤淡奶專賣❤  黑白奶水',
        price: 82,
        currency: 'TWD',
        url: 'https://shopee.tw/product/16840463036/89010739022',
        image: '/products/P1102410388498_1_109782639.jpeg',
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
    //   3) GET /api/v2/product/get_item_base_info → 拿每個 item 細節(內含 image 欄位)
    //   4) normalize → 透過 normalizeProduct()
    return []
  }
}
