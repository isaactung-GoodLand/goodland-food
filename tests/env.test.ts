import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('getEnv', () => {
  beforeEach(() => {
    vi.resetModules()
    delete process.env.DATABASE_URL
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    delete process.env.NEXT_PUBLIC_SITE_URL
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('throws when DATABASE_URL is missing', async () => {
    const { getEnv } = await import('../src/lib/env')
    expect(() => getEnv()).toThrow(/DATABASE_URL/)
  })

  it('throws when UPSTASH_REDIS_REST_TOKEN is missing', async () => {
    process.env.DATABASE_URL = 'postgresql://x/y'
    process.env.UPSTASH_REDIS_REST_URL = 'https://x.io'
    const { getEnv } = await import('../src/lib/env')
    expect(() => getEnv()).toThrow(/UPSTASH_REDIS_REST_TOKEN/)
  })

  it('parses DATABASE_URL when all required present', async () => {
    process.env.DATABASE_URL = 'postgresql://user:***@host/db'
    process.env.UPSTASH_REDIS_REST_URL = 'https://x.upstash.io'
    process.env.UPSTASH_REDIS_REST_TOKEN = '***'
    const { getEnv } = await import('../src/lib/env')
    const env = getEnv()
    expect(env.DATABASE_URL).toBe('postgresql://user:***@host/db')
    expect(env.UPSTASH_REDIS_REST_TOKEN).toBe('***')
  })

  it('uses default site url when NEXT_PUBLIC_SITE_URL not set', async () => {
    process.env.DATABASE_URL = 'postgresql://x/y'
    process.env.UPSTASH_REDIS_REST_URL = 'https://x.io'
    process.env.UPSTASH_REDIS_REST_TOKEN='***'
    const { getEnv } = await import('../src/lib/env')
    const env = getEnv()
    expect(env.NEXT_PUBLIC_SITE_URL).toBe('http://localhost:3000')
  })

  it('caches parsed env on subsequent calls', async () => {
    process.env.DATABASE_URL = 'postgresql://x/y'
    process.env.UPSTASH_REDIS_REST_URL = 'https://x.io'
    process.env.UPSTASH_REDIS_REST_TOKEN='***'
    const { getEnv } = await import('../src/lib/env')
    const a = getEnv()
    process.env.DATABASE_URL = 'postgresql://DIFFERENT/y'
    const b = getEnv()
    expect(b).toBe(a) // 同一個物件 reference
  })
})
