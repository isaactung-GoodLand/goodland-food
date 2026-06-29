import { describe, it, expect, vi } from 'vitest'
import {
  platformSupportsProducts,
  platformSupportsPosts,
  normalizeProduct,
  normalizePost,
  isPlatformAdapter,
  type PlatformAdapter,
  type Product,
  type SocialPost,
} from '../../src/lib/adapters/types'

describe('PlatformAdapter contract (runtime)', () => {
  it('exports isPlatformAdapter type guard', () => {
    expect(typeof isPlatformAdapter).toBe('function')
  })

  it('isPlatformAdapter returns true for valid adapter', () => {
    const a: PlatformAdapter = {
      platform: 'test',
      fetchProducts: async () => [],
      fetchPosts: async () => [],
    }
    expect(isPlatformAdapter(a)).toBe(true)
  })

  it('isPlatformAdapter returns false for invalid object', () => {
    expect(isPlatformAdapter(null)).toBe(false)
    expect(isPlatformAdapter({})).toBe(false)
    expect(isPlatformAdapter({ platform: 'x' })).toBe(false)
  })

  it('exports platformSupportsProducts helper', () => {
    expect(typeof platformSupportsProducts).toBe('function')
    expect(platformSupportsProducts('shopee')).toBe(true)
    expect(platformSupportsProducts('instagram')).toBe(false)
  })

  it('exports platformSupportsPosts helper', () => {
    expect(typeof platformSupportsPosts).toBe('function')
    expect(platformSupportsPosts('instagram')).toBe(true)
    expect(platformSupportsPosts('shopee')).toBe(false)
  })

  describe('normalizeProduct', () => {
    it('produces a Product with all required fields', () => {
      const result = normalizeProduct({
        platform: 'shopee',
        externalId: '1001',
        name: '三點三拼配茶',
        price: 380,
        currency: 'TWD',
        url: 'https://shopee.tw/x',
        image: 'https://cf.shopee.tw/file/x',
        inStock: true,
      })
      expect(result.id).toBe('shopee-1001')
      expect(result.platform).toBe('shopee')
      expect(result.name).toBe('三點三拼配茶')
      expect(result.syncedAt).toBeInstanceOf(Date)
    })

    it('defaults inStock to true when omitted', () => {
      const result = normalizeProduct({
        platform: 'native',
        externalId: '001',
        name: 'X',
        price: 100,
        currency: 'TWD',
        url: '#',
        image: '#',
      })
      expect(result.inStock).toBe(true)
    })
  })

  describe('normalizePost', () => {
    it('produces a SocialPost with all required fields', () => {
      const result = normalizePost({
        platform: 'instagram',
        externalId: 'media-1',
        caption: 'hello',
        url: 'https://instagram.com/p/abc',
        publishedAt: '2026-06-15T08:00:00Z',
      })
      expect(result.id).toBe('ig-media-1')
      expect(result.platform).toBe('instagram')
      expect(result.publishedAt).toBeInstanceOf(Date)
      expect(result.syncedAt).toBeInstanceOf(Date)
    })

    it('accepts Date for publishedAt', () => {
      const d = new Date('2026-06-15T08:00:00Z')
      const result = normalizePost({
        platform: 'instagram',
        externalId: 'm',
        caption: '',
        url: '#',
        publishedAt: d,
      })
      expect(result.publishedAt.getTime()).toBe(d.getTime())
    })
  })

  it('fetchPosts passes through since and limit', async () => {
    const since = new Date('2026-01-01')
    const limit = 5
    const spy = vi.fn(async () => [])
    const a: PlatformAdapter = {
      platform: 'test',
      fetchProducts: async () => [],
      fetchPosts: spy,
    }
    await a.fetchPosts({ since, limit })
    expect(spy).toHaveBeenCalledWith({ since, limit })
  })
})
