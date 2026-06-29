import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MetaAdapter } from '../../src/lib/adapters/meta'

describe('MetaAdapter (Instagram/Facebook)', () => {
  beforeEach(() => {
    process.env.META_ACCESS_TOKEN = 'fake-token'
    process.env.META_IG_USER_ID = 'ig-123'
    process.env.META_FB_PAGE_ID = 'fb-456'
    process.env.META_USE_MOCK = '1'
  })

  it('has correct platform identifier', () => {
    const a = new MetaAdapter({ mode: 'mock' })
    expect(a.platform).toBe('instagram')
  })

  it('fetchPosts returns normalized posts from mock', async () => {
    const a = new MetaAdapter({ mode: 'mock' })
    const posts = await a.fetchPosts()
    expect(posts.length).toBeGreaterThan(0)
    posts.forEach(p => {
      expect(['instagram', 'facebook']).toContain(p.platform)
      expect(p.id).toMatch(/^(ig|fb)-/)
      expect(p.caption).toBeDefined()
      expect(p.url).toBeTruthy()
      expect(p.publishedAt).toBeInstanceOf(Date)
    })
  })

  it('fetchPosts accepts since filter', async () => {
    const a = new MetaAdapter({ mode: 'mock' })
    const since = new Date('2025-01-01')
    const posts = await a.fetchPosts({ since, limit: 5 })
    expect(posts.length).toBeLessThanOrEqual(5)
  })

  it('fetchProducts returns empty array (Meta is not a product platform)', async () => {
    const a = new MetaAdapter({ mode: 'mock' })
    expect(await a.fetchProducts()).toEqual([])
  })

  it('live mode without META_ACCESS_TOKEN throws clear error', async () => {
    delete process.env.META_ACCESS_TOKEN
    const a = new MetaAdapter({ mode: 'live' })
    await expect(a.fetchPosts()).rejects.toThrow(/META_ACCESS_TOKEN/)
  })

  it('factory create() returns adapter instance', () => {
    const a = MetaAdapter.create({ mode: 'mock' })
    expect(a.platform).toBe('instagram')
  })
})
