import { describe, it, expect, vi } from 'vitest'
import {
  AdapterRegistry,
  loadAllAdapters,
  type AdapterLoadResult,
} from '../../src/lib/adapters/registry'
import type { PlatformAdapter, Product, SocialPost } from '../../src/lib/adapters/types'

const mkAdapter = (platform: string, opts: { products?: Product[]; posts?: SocialPost[] } = {}): PlatformAdapter => ({
  platform,
  fetchProducts: async () => opts.products ?? [],
  fetchPosts: async () => opts.posts ?? [],
})

const sampleProduct = (over: Partial<Product> = {}): Product => ({
  id: 'sp-1',
  platform: 'shopee',
  externalId: '1',
  name: 'P1',
  price: 100,
  currency: 'TWD',
  url: '#',
  image: '#',
  inStock: true,
  syncedAt: new Date('2026-06-01'),
  ...over,
})

const samplePost = (over: Partial<SocialPost> = {}): SocialPost => ({
  id: 'ig-1',
  platform: 'instagram',
  externalId: '1',
  caption: 'hello',
  url: '#',
  publishedAt: new Date('2026-06-01'),
  syncedAt: new Date('2026-06-29'),
  ...over,
})

describe('AdapterRegistry', () => {
  it('starts empty', () => {
    const r = new AdapterRegistry()
    expect(r.list()).toEqual([])
  })

  it('register adds and list returns it', () => {
    const r = new AdapterRegistry()
    const a = mkAdapter('shopee')
    r.register(a)
    expect(r.list()).toHaveLength(1)
    expect(r.get('shopee')).toBe(a)
  })

  it('register refuses duplicate platform', () => {
    const r = new AdapterRegistry()
    r.register(mkAdapter('shopee'))
    expect(() => r.register(mkAdapter('shopee'))).toThrow(/already registered/)
  })

  it('get returns undefined for unknown platform', () => {
    const r = new AdapterRegistry()
    expect(r.get('momo')).toBeUndefined()
  })

  it('fetchAllProducts aggregates from registered adapters', async () => {
    const r = new AdapterRegistry()
    r.register(mkAdapter('shopee', { products: [sampleProduct({ id: 'sp-1' })] }))
    r.register(mkAdapter('momo', { products: [sampleProduct({ id: 'mo-1', platform: 'momo' })] }))
    const all = await r.fetchAllProducts()
    expect(all).toHaveLength(2)
    const ids = all.map(p => p.id).sort()
    expect(ids).toEqual(['mo-1', 'sp-1'])
  })

  it('fetchAllPosts aggregates from registered adapters', async () => {
    const r = new AdapterRegistry()
    r.register(mkAdapter('instagram', { posts: [samplePost({ id: 'ig-1' })] }))
    r.register(mkAdapter('facebook', { posts: [samplePost({ id: 'fb-1', platform: 'facebook' })] }))
    const all = await r.fetchAllPosts()
    expect(all).toHaveLength(2)
  })

  it('skips adapter that errors (does not throw)', async () => {
    const r = new AdapterRegistry()
    const errAdapter: PlatformAdapter = {
      platform: 'broken',
      fetchProducts: async () => { throw new Error('network down') },
      fetchPosts: async () => [],
    }
    r.register(errAdapter)
    r.register(mkAdapter('shopee', { products: [sampleProduct()] }))
    const all = await r.fetchAllProducts()
    expect(all).toHaveLength(1)
  })

  it('captures error in result map when adapter fails', async () => {
    const r = new AdapterRegistry()
    const errAdapter: PlatformAdapter = {
      platform: 'broken',
      fetchProducts: async () => { throw new Error('boom') },
      fetchPosts: async () => [],
    }
    r.register(errAdapter)
    const errors = await r.fetchAllProductsWithErrors()
    expect(errors.get('broken')).toContain('boom')
  })

  it('passes through options to fetchPosts', async () => {
    const r = new AdapterRegistry()
    const spy = vi.fn(async () => [])
    r.register({ platform: 'instagram', fetchProducts: async () => [], fetchPosts: spy })
    const since = new Date('2026-01-01')
    await r.fetchAllPosts({ since, limit: 3 })
    expect(spy).toHaveBeenCalledWith({ since, limit: 3 })
  })
})

describe('loadAllAdapters', () => {
  it('returns summary of enabled adapters and what was skipped', () => {
    const result = loadAllAdapters({
      env: {
        SHOPEE_ENABLED: '1',
        META_ENABLED: undefined,
      },
      shops: {
        shopee: () => mkAdapter('shopee'),
        meta: () => mkAdapter('instagram'),
      },
    })
    expect(result.enabled).toContain('shopee')
    expect(result.skipped).toContain('meta')
  })

  it('loads nothing when no flags set', () => {
    const result = loadAllAdapters({ env: {}, shops: {} })
    expect(result.adapters).toHaveLength(0)
  })

  it('does not include skipped adapters when not defaulted and not enabled', () => {
    const result = loadAllAdapters({
      env: {},
      shops: { meta: () => mkAdapter('instagram') },
    })
    expect(result.adapters.map(a => a.platform)).not.toContain('instagram')
  })

  it('defaults shopee to enabled when no env at all', () => {
    const result = loadAllAdapters({
      env: {},
      shops: { shopee: () => mkAdapter('shopee') },
    })
    expect(result.enabled).toContain('shopee')
  })
})
