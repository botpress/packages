import { test, expect, describe } from 'vitest'
import { buildApp } from './utils/test-setup'

describe('listVersions', () => {
  test('returns versions of all public packages', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '1.0.0' },
        { name: 'pkg-b', version: '2.0.0' },
        { name: 'pkg-c', version: '3.0.0' }
      ]
    })

    const result = await app.listVersions()

    expect(result).toEqual({
      'pkg-a': '1.0.0',
      'pkg-b': '2.0.0',
      'pkg-c': '3.0.0'
    })
  })

  test('excludes private packages', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '1.0.0' },
        { name: 'pkg-private', version: '0.0.1', private: true },
        { name: 'pkg-b', version: '2.0.0' }
      ]
    })

    const result = await app.listVersions()

    expect(result).toEqual({
      'pkg-a': '1.0.0',
      'pkg-b': '2.0.0'
    })
    expect(result).not.toHaveProperty('pkg-private')
  })

  test('returns empty object when all packages are private', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '1.0.0', private: true },
        { name: 'pkg-b', version: '2.0.0', private: true }
      ]
    })

    const result = await app.listVersions()

    expect(result).toEqual({})
  })

  test('returns empty object when no packages exist', async () => {
    const { app } = buildApp({ packages: [] })

    const result = await app.listVersions()

    expect(result).toEqual({})
  })

  test('handles scoped package names', async () => {
    const { app } = buildApp({
      packages: [
        { name: '@scope/pkg-a', version: '1.0.0' },
        { name: '@scope/pkg-b', version: '2.5.0' }
      ]
    })

    const result = await app.listVersions()

    expect(result).toEqual({
      '@scope/pkg-a': '1.0.0',
      '@scope/pkg-b': '2.5.0'
    })
  })
})
