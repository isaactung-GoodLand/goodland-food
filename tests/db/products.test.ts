import { describe, it, expect } from 'vitest'
import { InMemoryProductRepo } from '../../src/lib/db/products'
import { normalizeProduct } from '../../src/lib/adapters/types'
import type { Product } from '../../src/lib/adapters/types'

const sampleProduct = (over: Partial<Product> = {}): Product =>
  normalizeProduct({
    platform: 'native',
    externalId: '001',
    name: '三點三拼配茶',
    price: 380,
    currency: 'TWD',
    url: 'https://example.com/p1',
    image: 'https://images.unsplash.com/photo-1',
    ...over,
  })

describe('InMemoryProductRepo', () => {
  it('starts empty', async () => {
    const repo = new InMemoryProductRepo()
    expect(await repo.listAll()).toEqual([])
  })

  it('upserts a product and reads it back by id', async () => {
    const repo = new InMemoryProductRepo()
    const p = sampleProduct()
    await repo.upsert(p)
    const got = await repo.getById(p.id)
    expect(got?.name).toBe('三點三拼配茶')
    expect(got?.price).toBe(380)
  })

  it('upsert overwrites existing product with same id', async () => {
    const repo = new InMemoryProductRepo()
    const p = sampleProduct()
    await repo.upsert(p)
    await repo.upsert({ ...p, price: 420, name: '三點三拼配茶 v2' })
    const all = await repo.listAll()
    expect(all).toHaveLength(1)
    expect(all[0].price).toBe(420)
    expect(all[0].name).toBe('三點三拼配茶 v2')
  })

  it('listAll returns all products', async () => {
    const repo = new InMemoryProductRepo()
    await repo.upsert(sampleProduct({ externalId: '001' }))
    await repo.upsert(sampleProduct({ externalId: '002' }))
    await repo.upsert(sampleProduct({ externalId: '003' }))
    const all = await repo.listAll()
    expect(all).toHaveLength(3)
  })

  it('getById returns null for unknown id', async () => {
    const repo = new InMemoryProductRepo()
    expect(await repo.getById('nope')).toBeNull()
  })

  it('listAll can be seeded with initial products', async () => {
    const seed = [sampleProduct({ externalId: 's1' }), sampleProduct({ externalId: 's2' })]
    const repo = new InMemoryProductRepo(seed)
    expect(await repo.listAll()).toHaveLength(2)
  })
})
