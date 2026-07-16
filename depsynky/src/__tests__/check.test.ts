import { test, expect, describe } from 'vitest'
import { buildApp } from './utils/test-setup'
import { DepSynkyError } from '../errors'

describe('checkVersions', () => {
  test('passes when all dependencies are in sync', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '1.0.0' },
        { name: 'pkg-b', version: '2.0.0', dependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await expect(app.checkVersions({})).resolves.not.toThrow()
  })

  test('throws when a dependency is out of sync', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', dependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await expect(app.checkVersions({})).rejects.toThrow(DepSynkyError)
    await expect(app.checkVersions({})).rejects.toThrow('out of sync')
  })

  test('throws when a devDependency is out of sync', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', devDependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await expect(app.checkVersions({})).rejects.toThrow(DepSynkyError)
  })

  test('throws when a peerDependency is out of sync', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', peerDependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await expect(app.checkVersions({})).rejects.toThrow(DepSynkyError)
  })

  test('ignores out-of-sync peerDependencies when ignorePeers is true', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', peerDependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await expect(app.checkVersions({ ignorePeers: true })).resolves.not.toThrow()
  })

  test('ignores out-of-sync devDependencies when ignoreDev is true', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', devDependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await expect(app.checkVersions({ ignoreDev: true })).resolves.not.toThrow()
  })

  test('still checks dependencies when ignorePeers and ignoreDev are true', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', dependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await expect(app.checkVersions({ ignorePeers: true, ignoreDev: true })).rejects.toThrow(DepSynkyError)
  })

  test('skips local (workspace:) versions for private packages', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '1.0.0' },
        { name: 'pkg-b', version: '1.0.0', private: true, dependencies: { 'pkg-a': 'workspace:*' } }
      ]
    })

    await expect(app.checkVersions({})).resolves.not.toThrow()
  })

  test('throws for local (workspace:) versions on public packages', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '1.0.0' },
        { name: 'pkg-b', version: '1.0.0', dependencies: { 'pkg-a': 'workspace:*' } }
      ]
    })

    await expect(app.checkVersions({})).rejects.toThrow(DepSynkyError)
    await expect(app.checkVersions({})).rejects.toThrow('public and cannot depend on local package')
  })

  test('passes with custom targetVersions', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '1.0.0' },
        { name: 'pkg-b', version: '1.0.0', dependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await expect(app.checkVersions({ targetVersions: { 'pkg-a': '1.0.0' } })).resolves.not.toThrow()
  })

  test('fails with custom targetVersions that are not satisfied', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '2.0.0' },
        { name: 'pkg-b', version: '1.0.0', dependencies: { 'pkg-a': '^1.0.0' } }
      ]
    })

    await expect(app.checkVersions({ targetVersions: { 'pkg-a': '2.0.0' } })).rejects.toThrow(DepSynkyError)
  })

  test('passes when packages have no dependencies', async () => {
    const { app } = buildApp({
      packages: [
        { name: 'pkg-a', version: '1.0.0' },
        { name: 'pkg-b', version: '2.0.0' }
      ]
    })

    await expect(app.checkVersions({})).resolves.not.toThrow()
  })

  test('ignores dependencies on packages not in the monorepo', async () => {
    const { app } = buildApp({
      packages: [{ name: 'pkg-a', version: '1.0.0', dependencies: { lodash: '^4.0.0' } }]
    })

    await expect(app.checkVersions({})).resolves.not.toThrow()
  })
})
