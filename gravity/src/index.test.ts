import { describe, expect, it } from 'vitest'
import { cluster } from './index'
import type { EmbeddingDataset } from './types'

// Builds well-separated blobs: cluster c points mostly along axis c, with a little noise.
// Under cosine distance the blobs are near-orthogonal (far apart) while members of a blob
// are nearly parallel (close), so a correct pipeline recovers the blobs.
const makeBlobs = (clusters: number, per: number, dim: number): EmbeddingDataset => {
  const ids: string[] = []
  const embeddings: number[][] = []
  let seed = 1
  // tiny deterministic LCG, just to add a touch of noise without a dependency
  const rand = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }

  for (let c = 0; c < clusters; c++) {
    for (let p = 0; p < per; p++) {
      const vector: number[] = []
      for (let d = 0; d < dim; d++) {
        let v = (rand() - 0.5) * 0.5
        if (d === c % dim) {
          v += 10
        }
        vector.push(v)
      }
      ids.push(`c${c}_p${p}`)
      embeddings.push(vector)
    }
  }

  return { ids, embeddings, dim }
}

describe('cluster', () => {
  it('recovers well-separated blobs', () => {
    const dataset = makeBlobs(3, 20, 10)
    const result = cluster(dataset)

    expect(result.clusters.length).toBeGreaterThanOrEqual(2)
    expect(result.labels).toHaveLength(dataset.ids.length)

    // every returned id should be a known input id, and clusters + noise should partition them
    const known = new Set(dataset.ids)
    const seen = new Set<string>()
    for (const c of result.clusters) {
      for (const id of c.itemIds) {
        expect(known.has(id)).toBe(true)
        expect(seen.has(id)).toBe(false)
        seen.add(id)
      }
    }
    for (const id of result.noise) {
      expect(seen.has(id)).toBe(false)
      seen.add(id)
    }
    expect(seen.size).toBe(dataset.ids.length)
  })

  it('reports cluster geometry', () => {
    const dataset = makeBlobs(3, 20, 10)
    const result = cluster(dataset)

    for (const c of result.clusters) {
      expect(c.centroid).toHaveLength(dataset.dim)
      expect(c.assignRadius).toBeGreaterThanOrEqual(0.25)
      expect(c.assignRadius).toBeLessThanOrEqual(0.35)
    }
  })

  it('is deterministic for the same input', () => {
    const dataset = makeBlobs(3, 20, 10)
    const a = cluster(dataset)
    const b = cluster(dataset)
    expect(a.labels).toEqual(b.labels)
    expect(a.noise).toEqual(b.noise)
    expect(a.clusters.map((c) => c.itemIds)).toEqual(b.clusters.map((c) => c.itemIds))
  })

  it('rejects mismatched dimensions', () => {
    expect(() => cluster({ ids: ['a'], embeddings: [[1, 2, 3]], dim: 4 })).toThrow()
  })

  it('surfaces a clean error (not a wasm trap) for an empty dataset', () => {
    // Previously the HDBSCAN unwrap() would panic and trap; now it should come back
    // as a normal Error with a readable message.
    expect(() => cluster({ ids: [], embeddings: [], dim: 5 })).toThrow(/empty/i)
  })

  it('applies option overrides', () => {
    const dataset = makeBlobs(3, 20, 10)
    const result = cluster(dataset, { minClusterSize: 5, minSamples: 2, seed: 7, nComponents: 3 })

    expect(result.hdbscan_config.min_cluster_size).toBe(5)
    expect(result.hdbscan_config.min_samples).toBe(2)
    expect(result.umap_config.seed).toBe(7)
    expect(result.umap_config.n_components).toBe(3)
    // unspecified options keep their defaults
    expect(result.umap_config.n_neighbors).toBe(15)
  })
})
