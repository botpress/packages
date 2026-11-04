import { Miniflare } from 'miniflare'
import pathlib from 'path'
import { describe, expect, it } from 'vitest'

const distWorkerDir = pathlib.join(__dirname, '..', 'dist', 'worker')

// Runs the built worker bundle (`pnpm build:worker`) in workerd, where WebAssembly can't be compiled from bytes.
describe('worker build', () => {
  it('clusters in workerd', async () => {
    const mf = new Miniflare({
      modulesRoot: distWorkerDir,
      modules: [
        {
          type: 'ESModule',
          path: pathlib.join(distWorkerDir, 'entry.js'),
          contents: [
            "import { cluster } from './index.js'",
            'export default {',
            '  fetch: async (request) => Response.json(cluster(await request.json(), { minClusterSize: 5 }))',
            '}'
          ].join('\n')
        },
        { type: 'ESModule', path: pathlib.join(distWorkerDir, 'index.js') },
        { type: 'CompiledWasm', path: pathlib.join(distWorkerDir, 'gravity_bg.wasm') }
      ],
      compatibilityDate: '2026-08-01'
    })

    const embeddings = Array.from({ length: 40 }, (_, i) =>
      Array.from({ length: 8 }, (_, d) => (d === i % 2 ? 10 : 0) + ((i * 7 + d) % 5) / 10)
    )
    const response = await mf.dispatchFetch('http://gravity', {
      method: 'POST',
      body: JSON.stringify({ ids: embeddings.map((_, i) => String(i)), embeddings, dim: 8 })
    })
    const result = (await response.json()) as { clusters: unknown[] }
    await mf.dispose()

    expect(response.status).toBe(200)
    expect(result.clusters.length).toBeGreaterThan(0)
  }, 30_000)
})
