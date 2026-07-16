import { isBrowser } from 'browser-or-node'
import * as wsm from '../pkg'
import type { ClusteringOptions, ClusteringOutput, EmbeddingDataset } from './types'

export type { Cluster, ClusteringOptions, ClusteringOutput, EmbeddingDataset, HdbscanConfig, UmapConfig } from './types'

let initialized = false
const maybeInitialize = () => {
  if (initialized) {
    return
  }
  if (isBrowser) {
    wsm.init() // browsers need the wasm instantiated before first use
  }
  initialized = true
}

const validateDataset = (dataset: EmbeddingDataset): void => {
  const { ids, embeddings, dim } = dataset
  if (ids.length !== embeddings.length) {
    throw new Error(`ids (${ids.length}) and embeddings (${embeddings.length}) must have the same length`)
  }
  for (let i = 0; i < embeddings.length; i++) {
    if (embeddings[i].length !== dim) {
      throw new Error(`embeddings[${i}] has ${embeddings[i].length} dimensions, expected ${dim}`)
    }
  }
}

/**
 * Clusters a set of high-dimensional embeddings.
 *
 * The pipeline reduces the vectors to a low-dimensional space with UMAP, then groups
 * them with HDBSCAN. Points that fall outside any dense region are returned as noise.
 *
 * The run is deterministic: the same dataset (in the same order) always produces the
 * same clusters.
 *
 * @param dataset - the ids, vectors, and dimensionality to cluster
 * @param options - optional overrides for the UMAP/HDBSCAN parameters
 * @returns the discovered clusters, the unclustered (noise) ids, and run metadata
 */
export const cluster = (dataset: EmbeddingDataset, options: ClusteringOptions = {}): ClusteringOutput => {
  validateDataset(dataset)
  maybeInitialize()
  return wsm.cluster(dataset, options) as ClusteringOutput
}
