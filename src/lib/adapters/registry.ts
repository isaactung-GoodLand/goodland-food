/**
 * Adapter Registry。
 *
 * 集中管理所有 platform adapters,提供「全商品聚合」「全貼文聚合」兩個關鍵操作。
 * 任一 adapter 失敗不影響其他(容錯)。
 */

import type { PlatformAdapter, Product, SocialPost, FetchPostsOptions } from './types'

export class AdapterRegistry {
  private adapters = new Map<string, PlatformAdapter>()

  register(adapter: PlatformAdapter): void {
    if (this.adapters.has(adapter.platform)) {
      throw new Error(`Adapter for platform "${adapter.platform}" already registered`)
    }
    this.adapters.set(adapter.platform, adapter)
  }

  list(): PlatformAdapter[] {
    return Array.from(this.adapters.values())
  }

  get(platform: string): PlatformAdapter | undefined {
    return this.adapters.get(platform)
  }

  async fetchAllProducts(): Promise<Product[]> {
    const results = await Promise.allSettled(
      this.list().map((a) => a.fetchProducts())
    )
    return results
      .filter((r): r is PromiseFulfilledResult<Product[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
  }

  /** 同 fetchAllProducts,但回傳每個 platform 的錯誤,給 logging/admin 用 */
  async fetchAllProductsWithErrors(): Promise<Map<string, string>> {
    const results = await Promise.allSettled(
      this.list().map((a) => a.fetchProducts().then(
        () => null,
        (e) => ({ platform: a.platform, error: String(e?.message ?? e) }),
      ))
    )
    const errors = new Map<string, string>()
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value) {
        errors.set(r.value.platform, r.value.error)
      }
    }
    return errors
  }

  async fetchAllPosts(opts?: FetchPostsOptions): Promise<SocialPost[]> {
    const results = await Promise.allSettled(
      this.list().map((a) => a.fetchPosts(opts))
    )
    return results
      .filter((r): r is PromiseFulfilledResult<SocialPost[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
  }
}

export type AdapterLoadResult = {
  adapters: PlatformAdapter[]
  enabled: string[]
  skipped: string[]
}

type LoaderShop = { create(): PlatformAdapter }

/**
 * 根據 env flags 決定載入哪些 adapter。
 *
 * Example:
 *   loadAllAdapters({
 *     env: process.env,
 *     shops: { shopee: () => new ShopeeAdapter(), meta: () => new MetaAdapter() }
 *   })
 */
export function loadAllAdapters(opts: {
  env: NodeJS.ProcessEnv
  shops: Record<string, () => PlatformAdapter>
}): AdapterLoadResult {
  const adapters: PlatformAdapter[] = []
  const enabled: string[] = []
  const skipped: string[] = []

  for (const [key, factory] of Object.entries(opts.shops)) {
    const flag = `SHOPEE_${key.toUpperCase()}_ENABLED`
    const alt = `${key.toUpperCase()}_ENABLED`
    const on =
      opts.env[flag] === '1' ||
      opts.env[alt] === '1' ||
      opts.env[`${key.toUpperCase()}`] === '1'

    // 預設:shopee 預設開,其他預設關
    const defaultOn = key === 'shopee'

    if (on || defaultOn) {
      try {
        adapters.push(factory())
        enabled.push(key)
      } catch (e) {
        skipped.push(key)
      }
    } else {
      skipped.push(key)
    }
  }

  return { adapters, enabled, skipped }
}
