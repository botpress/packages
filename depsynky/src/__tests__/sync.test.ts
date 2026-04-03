import { test, expect, describe } from 'vitest'
import { buildApp } from './utils/test-setup'

describe('syncVersions', () => {
  test('updates dependencies to match target versions', async () => {
    const { app, pkg } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', dependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await app.syncVersions({})

    const pkgB = await pkg.read('pkg-b')
    expect(pkgB.dependencies?.['pkg-a']).toBe('^2.0.0')
  })

  test('updates devDependencies to match target versions', async () => {
    const { app, pkg } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', devDependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await app.syncVersions({})

    const pkgB = await pkg.read('pkg-b')
    expect(pkgB.devDependencies?.['pkg-a']).toBe('^2.0.0')
  })

  test('updates peerDependencies to match target versions', async () => {
    const { app, pkg } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', peerDependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await app.syncVersions({})

    const pkgB = await pkg.read('pkg-b')
    expect(pkgB.peerDependencies?.['pkg-a']).toBe('^2.0.0')
  })

  test('skips peerDependencies when ignorePeers is true', async () => {
    const { app, pkg } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', peerDependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await app.syncVersions({ ignorePeers: true })

    const pkgB = await pkg.read('pkg-b')
    expect(pkgB.peerDependencies?.['pkg-a']).toBe('^1.0.0')
  })

  test('skips devDependencies when ignoreDev is true', async () => {
    const { app, pkg } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', devDependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await app.syncVersions({ ignoreDev: true })

    const pkgB = await pkg.read('pkg-b')
    expect(pkgB.devDependencies?.['pkg-a']).toBe('^1.0.0')
  })

  test('preserves workspace: references for private packages', async () => {
    const { app, pkg } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', private: true, dependencies: { 'pkg-a': 'workspace:*' } }
      ]
    })

    await app.syncVersions({})

    const pkgB = await pkg.read('pkg-b')
    expect(pkgB.dependencies?.['pkg-a']).toBe('workspace:*')
  })

  test('uses custom targetVersions when provided', async () => {
    const { app, pkg } = buildApp({
      packages: [
        { name: 'pkg-a', version: '1.0.0' },
        { name: 'pkg-b', version: '1.0.0', dependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await app.syncVersions({ targetVersions: { 'pkg-a': '1.5.0' } })

    const pkgB = await pkg.read('pkg-b')
    expect(pkgB.dependencies?.['pkg-a']).toBe('^1.5.0')
  })

  test('preserves tilde ranges when syncing', async () => {
    const { app, pkg } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', dependencies: { 'pkg-a': '~1.0.0' } }
      ]
    })

    await app.syncVersions({})

    const pkgB = await pkg.read('pkg-b')
    expect(pkgB.dependencies?.['pkg-a']).toBe('~2.0.0')
  })

  test('does not modify packages with no matching dependencies', async () => {
    const { app, pkg } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', dependencies: { lodash: '^4.0.0' } }
      ]
    })

    await app.syncVersions({})

    const pkgB = await pkg.read('pkg-b')
    expect(pkgB.dependencies?.['lodash']).toBe('^4.0.0')
  })

  test('syncs multiple packages at once', async () => {
    const { app, pkg } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '3.0.0' },
        { name: 'pkg-c', version: '1.0.0', dependencies: { 'pkg-a': '^1.0.0', 'pkg-b': '^1.0.0' } }
      ]
    })

    await app.syncVersions({})

    const pkgC = await pkg.read('pkg-c')
    expect(pkgC.dependencies?.['pkg-a']).toBe('^2.0.0')
    expect(pkgC.dependencies?.['pkg-b']).toBe('^3.0.0')
  })

  test('does not touch packages that are already in sync', async () => {
    const { app, pkg } = buildApp({
      packages: [
        { name: 'pkg-a', version: '1.0.0' },
        { name: 'pkg-b', version: '1.0.0', dependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await app.syncVersions({})

    const pkgB = await pkg.read('pkg-b')
    expect(pkgB.dependencies?.['pkg-a']).toBe('^1.0.0')
  })
})
