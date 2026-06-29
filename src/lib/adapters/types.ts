/**
 * 平台資料統一抽象層。
 * 新增平台 = 寫一個 adapter 實作這個介面就好。
 */

export type Platform =
  | 'shopee'
  | 'momo'
  | 'pchome'
  | 'yahoo'
  | 'native'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'threads'
  | 'line'

export type Product = {
  id: string
  platform: Extract<Platform, 'shopee' | 'momo' | 'pchome' | 'yahoo' | 'native'>
  externalId: string
  name: string
  price: number
  currency: string
  url: string
  image: string
  inStock?: boolean
  syncedAt: Date
}

export type SocialPost = {
  id: string
  platform: Extract<Platform, 'instagram' | 'facebook' | 'tiktok' | 'threads' | 'line' | 'native'>
  externalId: string
  caption: string
  image?: string
  videoUrl?: string
  url: string
  publishedAt: Date
  syncedAt: Date
}

export type PressItem = {
  id: string
  title: string
  publisher: string
  url: string
  publishedAt: Date
}

export type FetchPostsOptions = {
  since?: Date
  limit?: number
}

export interface PlatformAdapter {
  readonly platform: string
  fetchProducts(): Promise<Product[]>
  fetchPosts(opts?: FetchPostsOptions): Promise<SocialPost[]>
}

// ─── 平台能力查詢 ───
const PRODUCT_PLATFORMS: ReadonlySet<string> = new Set(['shopee', 'momo', 'pchome', 'yahoo', 'native'])
const POST_PLATFORMS: ReadonlySet<string> = new Set(['instagram', 'facebook', 'tiktok', 'threads', 'line', 'native'])

export function platformSupportsProducts(platform: string): boolean {
  return PRODUCT_PLATFORMS.has(platform)
}

export function platformSupportsPosts(platform: string): boolean {
  return POST_PLATFORMS.has(platform)
}

// ─── 平台前綴(用於合成主鍵 id)───
const ID_PREFIX: Record<string, string> = {
  shopee: 'shopee',
  momo: 'momo',
  pchome: 'pchome',
  yahoo: 'yahoo',
  native: 'native',
  instagram: 'ig',
  facebook: 'fb',
  tiktok: 'tiktok',
  threads: 'threads',
  line: 'line',
}

// ─── Normalizers(給 adapters 用,確保輸出一致)───
type ProductInput = Omit<Product, 'id' | 'syncedAt'> & { syncedAt?: Date }
type PostInput = Omit<SocialPost, 'id' | 'syncedAt' | 'publishedAt'> & {
  publishedAt: Date | string
  syncedAt?: Date
}

export function normalizeProduct(input: ProductInput): Product {
  const prefix = ID_PREFIX[input.platform] ?? input.platform
  return {
    ...input,
    id: `${prefix}-${input.externalId}`,
    inStock: input.inStock ?? true,
    syncedAt: input.syncedAt ?? new Date(),
  }
}

export function normalizePost(input: PostInput): SocialPost {
  const prefix = ID_PREFIX[input.platform] ?? input.platform
  return {
    ...input,
    publishedAt: input.publishedAt instanceof Date ? input.publishedAt : new Date(input.publishedAt),
    id: `${prefix}-${input.externalId}`,
    syncedAt: input.syncedAt ?? new Date(),
  }
}

// ─── Type guard(runtime 驗證)───
export function isPlatformAdapter(x: unknown): x is PlatformAdapter {
  if (x === null || typeof x !== 'object') return false
  const obj = x as Record<string, unknown>
  return (
    typeof obj.platform === 'string' &&
    typeof obj.fetchProducts === 'function' &&
    typeof obj.fetchPosts === 'function'
  )
}
