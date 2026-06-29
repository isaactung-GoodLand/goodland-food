/**
 * Meta Graph API adapter (Instagram Business + Facebook Page).
 *
 * Mock mode:回傳 2 篇 demo 貼文(IG + FB 各一)
 * Live mode:待 tokens 來時填入真實呼叫。
 *
 * Tokens(從 .env):
 *   META_ACCESS_TOKEN (long-lived user token)
 *   META_IG_USER_ID, META_FB_PAGE_ID
 *   META_USE_MOCK=1 → mock
 *   META_USE_MOCK=0 → live
 */

import { normalizePost, type PlatformAdapter, type Product, type SocialPost, type FetchPostsOptions } from './types'

type Mode = 'mock' | 'live'

export class MetaAdapter implements PlatformAdapter {
  // 「平台」對外仍叫 instagram(parent platform),雖然會包含 FB 貼文
  readonly platform = 'instagram' as const
  private mode: Mode

  constructor(opts: { mode?: Mode } = {}) {
    this.mode = opts.mode ?? (process.env.META_USE_MOCK === '1' ? 'mock' : 'live')
  }

  static create(opts?: { mode?: Mode }) {
    return new MetaAdapter(opts)
  }

  async fetchProducts(): Promise<Product[]> {
    // Meta 不是商品平台,空陣列
    return []
  }

  async fetchPosts(opts: FetchPostsOptions = {}): Promise<SocialPost[]> {
    if (this.mode === 'mock') return this.mockPosts(opts)
    return this.livePosts(opts)
  }

  // ─── Mock(1 篇 IG + 1 篇 FB)───
  private async mockPosts(opts: FetchPostsOptions): Promise<SocialPost[]> {
    const all: SocialPost[] = [
      normalizePost({
        platform: 'instagram',
        externalId: 'demo-ig-001',
        caption: '🍵 新品上市:三點三拼配茶 6 入組。\n在家也能沖出好喝奶茶 ☕\n.\n#港式奶茶 #三點三 #甘田',
        image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80',
        url: 'https://www.instagram.com/p/demo-ig-001',
        publishedAt: '2026-06-12T08:00:00Z',
      }),
      normalizePost({
        platform: 'facebook',
        externalId: 'demo-fb-001',
        caption: '媒體報導:甘田 Goodland 獲選經濟部 2026 新創事業獎 🎉\n全文: https://example.com/news/01',
        image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800&q=80',
        url: 'https://www.facebook.com/goodland-food/posts/001',
        publishedAt: '2026-06-05T03:30:00Z',
      }),
    ]

    return all
      .filter(p => (opts.since ? p.publishedAt >= opts.since : true))
      .slice(0, opts.limit ?? all.length)
  }

  // ─── Live(待接)───
  private async livePosts(_opts: FetchPostsOptions): Promise<SocialPost[]> {
    const token = process.env.META_ACCESS_TOKEN
    if (!token) {
      throw new Error(
        '[MetaAdapter] live mode 需要 META_ACCESS_TOKEN。' +
          '若還沒有,設 META_USE_MOCK=1 走 mock 模式。'
      )
    }
    // TODO:
    //   IG: GET graph.facebook.com/v18.0/{ig-user-id}/media?fields=id,caption,media_url,permalink,timestamp
    //   FB: GET graph.facebook.com/v18.0/{fb-page-id}/posts?fields=id,message,full_picture,permalink_url,created_time
    return []
  }
}
