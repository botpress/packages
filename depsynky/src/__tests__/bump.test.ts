import { test, expect, describe } from 'vitest'
import { buildApp, readPkgJson } from './utils/test-setup'
import { DepSynkyError } from '../errors'

describe('bumpVersion', () => {
  test('bumps a package version with patch', async () => {
    const { app, fs } = buildApp(
      {
        packages: [
          { name: 'pkg-a', version: '1.0.0' },
          { name: 'pkg-b', version: '1.0.0' }
        ]
      },
      async () => 'patch'
    )

    await app.bumpVersion({ pkgName: 'pkg-a', sync: false })

    const pkgA = await readPkgJson(fs, 'pkg-a')
    expect(pkgA.version).toBe('1.0.1')
  })

  test('bumps a package version with minor', async () => {
    const { app, fs } = buildApp(
      {
        packages: [{ name: 'pkg-a', version: '1.0.0' }]
      },
      async () => 'minor'
    )

    await app.bumpVersion({ pkgName: 'pkg-a', sync: false })

    const pkgA = await readPkgJson(fs, 'pkg-a')
    expect(pkgA.version).toBe('1.1.0')
  })

  test('bumps a package version with major', async () => {
    const { app, fs } = buildApp(
      {
        packages: [{ name: 'pkg-a', version: '1.0.0' }]
      },
      async () => 'major'
    )

    await app.bumpVersion({ pkgName: 'pkg-a', sync: false })

    const pkgA = await readPkgJson(fs, 'pkg-a')
    expect(pkgA.version).toBe('2.0.0')
  })

  test('skips bump when "none" is selected', async () => {
    const { app, fs } = buildApp(
      {
        packages: [{ name: 'pkg-a', version: '1.0.0' }]
      },
      async () => 'none'
    )

    await app.bumpVersion({ pkgName: 'pkg-a', sync: false })

    const pkgA = await readPkgJson(fs, 'pkg-a')
    expect(pkgA.version).toBe('1.0.0')
  })

  test('skips private packages during bump', async () => {
    const { app, fs } = buildApp(
      {
        packages: [
          { name: 'pkg-a', version: '1.0.0' },
          { name: 'pkg-b', version: '1.0.0', private: true, dependencies: { 'pkg-a': '^1.0.0' } }
        ]
      },
      async () => 'patch' // only one prompt because pkg-b is private and skipped
    )

    await app.bumpVersion({ pkgName: 'pkg-a', sync: false })

    const pkgA = await readPkgJson(fs, 'pkg-a')
    expect(pkgA.version).toBe('1.0.1')

    const pkgB = await readPkgJson(fs, 'pkg-b')
    expect(pkgB.version).toBe('1.0.0') // not bumped
  })

  test('bumps dependents recursively', async () => {
    const { app, fs } = buildApp(
      {
        packages: [
          { name: 'pkg-a', version: '1.0.0' },
          { name: 'pkg-b', version: '1.0.0', dependencies: { 'pkg-a': '^1.0.0' } },
          { name: 'pkg-c', version: '1.0.0', dependencies: { 'pkg-b': '^1.0.0' } }
        ]
      },
      async ({ pkgName }) => {
        if (pkgName === 'pkg-a') return 'patch'
        if (pkgName === 'pkg-b') return 'minor'
        if (pkgName === 'pkg-c') return 'patch'
        return 'none'
      }
    )

    await app.bumpVersion({ pkgName: 'pkg-a', sync: false })

    const pkgA = await readPkgJson(fs, 'pkg-a')
    expect(pkgA.version).toBe('1.0.1')

    const pkgB = await readPkgJson(fs, 'pkg-b')
    expect(pkgB.version).toBe('1.1.0')

    const pkgC = await readPkgJson(fs, 'pkg-c')
    expect(pkgC.version).toBe('1.0.1')
  })

  test('calls syncVersions when sync is true', async () => {
    const { app, fs } = buildApp(
      {
        packages: [
          { name: 'pkg-a', version: '1.0.0' },
          { name: 'pkg-b', version: '1.0.0', dependencies: { 'pkg-a': '^1.0.0' } }
        ]
      },
      async ({ pkgName }) => (pkgName === 'pkg-a' ? 'patch' : 'none')
    )

    await app.bumpVersion({ pkgName: 'pkg-a', sync: true })

    const pkgA = await readPkgJson(fs, 'pkg-a')
    expect(pkgA.version).toBe('1.0.1')

    // NOTE: syncVersions is called but not awaited inside bumpVersion,
    // so we allow a microtask tick for the fire-and-forget sync to complete
    await new Promise((r) => setTimeout(r, 10))

    const pkgB = await readPkgJson(fs, 'pkg-b')
    expect(pkgB.dependencies?.['pkg-a']).toBe('^1.0.1')
  })

  test('throws when package is not found', async () => {
    const { app } = buildApp({
      packages: [{ name: 'pkg-a', version: '1.0.0' }]
    })

    await expect(app.bumpVersion({ pkgName: 'nonexistent', sync: false })).rejects.toThrow(DepSynkyError)
  })

  test('does not sync when sync is false', async () => {
    const { app, fs } = buildApp(
      {
        packages: [
          { name: 'pkg-a', version: '1.0.0' },
          { name: 'pkg-b', version: '1.0.0', dependencies: { 'pkg-a': '^1.0.0' } }
        ]
      },
      async ({ pkgName }) => (pkgName === 'pkg-a' ? 'major' : 'none')
    )

    await app.bumpVersion({ pkgName: 'pkg-a', sync: false })

    const pkgB = await readPkgJson(fs, 'pkg-b')
    // dependency should NOT be updated because sync is false
    expect(pkgB.dependencies?.['pkg-a']).toBe('^1.0.0')
  })
})
