import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ShopeeAdapter } from '../../src/lib/adapters/shopee'

describe('ShopeeAdapter', () => {
  beforeEach(() => {
    process.env.SHOPEE_PARTNER_ID = 'test-partner'
    process.env.SHOPEE_PARTNER_KEY = 'test-key'
    process.env.SHOPEE_SHOP_ID = '12345'
    process.env.SHOPEE_USE_MOCK = '1' // 預設用 mock,真實 API token 來了改成 '0'
  })

  it('has correct platform identifier', () => {
    const a = new ShopeeAdapter()
    expect(a.platform).toBe('shopee')
  })

  it('fetchProducts returns normalized products from mock', async () => {
    const a = new ShopeeAdapter({ mode: 'mock' })
    const products = await a.fetchProducts()
    expect(products.length).toBeGreaterThan(0)
    products.forEach(p => {
      expect(p.platform).toBe('shopee')
      expect(p.id).toMatch(/^shopee-/)
      expect(p.name).toBeTruthy()
      expect(typeof p.price).toBe('number')
      expect(p.syncedAt).toBeInstanceOf(Date)
    })
  })

  it('fetchPosts returns empty array (Shopee is not a social platform)', async () => {
    const a = new ShopeeAdapter({ mode: 'mock' })
    expect(await a.fetchPosts()).toEqual([])
  })

  it('mock mode works without env tokens set', async () => {
    delete process.env.SHOPEE_PARTNER_ID
    delete process.env.SHOPEE_PARTNER_KEY
    const a = new ShopeeAdapter({ mode: 'mock' })
    const products = await a.fetchProducts()
    expect(products.length).toBeGreaterThan(0)
  })

  it('live mode without required tokens throws clear error', async () => {
    delete process.env.SHOPEE_PARTNER_ID
    delete process.env.SHOPEE_PARTNER_KEY
    const a = new ShopeeAdapter({ mode: 'live' })
    await expect(a.fetchProducts()).rejects.toThrow(/SHOPEE_(PARTNER_ID|PARTNER_KEY|SHOP_ID)/)
  })

  it('factory create() returns adapter instance', () => {
    const a = ShopeeAdapter.create({ mode: 'mock' })
    expect(a.platform).toBe('shopee')
  })
})
