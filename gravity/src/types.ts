/**
 * A set of high-dimensional vectors to cluster, each tagged with a stable id.
 *
 * This is the input to {@link cluster}. `embeddings[i]` is the vector for `ids[i]`,
 * and every vector must have exactly `dim` components.
 */
export type EmbeddingDataset = {
  /** Stable identifiers, one per embedding, returned back grouped by cluster. */
  ids: string[]
  /** Row-major vectors; `embeddings[i]` corresponds to `ids[i]`. */
  embeddings: number[][]
  /** Dimensionality of each embedding. */
  dim: number
}

/**
 * Optional overrides for the clustering parameters. Any field left unset falls back to
 * its default (shown below). Passed as the second argument to {@link cluster}.
 */
export type ClusteringOptions = {
  // --- UMAP (dimensionality reduction) ---
  /** Initialization strategy for the low-dimensional embedding. Default: `'PCA'`. */
  initType?: 'PCA' | 'Random'
  /** Size of the local neighborhood used to learn structure. Default: `15`. */
  nNeighbors?: number
  /** Number of dimensions to reduce to before density clustering. Default: `5`. */
  nComponents?: number
  /** How tightly points are packed in the embedding; lower = tighter. Default: `0`. */
  minDist?: number
  /** The effective scale of embedded points. Default: `1`. */
  spread?: number
  /** Number of optimization epochs. Default: `500`. */
  nEpochs?: number
  /** Negative samples drawn per positive sample during optimization. Default: `5`. */
  negativeSampleRate?: number
  /** Seed for UMAP's stochastic steps; fix it for reproducible runs. Default: `42`. */
  seed?: number

  // --- HDBSCAN (density clustering) ---
  /** Minimum number of points for a group to count as a cluster. Default: `10`. */
  minClusterSize?: number
  /** Number of neighbors used in core-distance estimation. Default: `1`. */
  minSamples?: number
}

/** UMAP dimensionality-reduction configuration used to produce the embedding. */
export type UmapConfig = {
  init_type: 'PCA' | 'Random'
  n_neighbors: number
  n_components: number
  min_dist: number
  spread: number
  n_epochs: number
  negative_sample_rate: number
  seed: number
}

/** HDBSCAN density-clustering configuration. */
export type HdbscanConfig = {
  min_cluster_size: number
  min_samples: number
}

/** A single discovered cluster. */
export type Cluster = {
  /** Ids of the cluster members, ordered by ascending distance from the centroid. */
  itemIds: string[]
  /** Mean of the cluster members in the original (un-reduced) vector space. */
  centroid: number[]
  /**
   * A cosine-distance radius around the centroid, clamped to [0.25, 0.35], suitable
   * for assigning new points to this cluster by similarity.
   */
  assignRadius: number
}

/** The full result of a clustering run. */
export type ClusteringOutput = {
  /** Echo of the input dataset (ids and dimensionality; embeddings are not echoed). */
  dataset: {
    ids: string[]
    dim: number
  }
  umap_config: UmapConfig
  hdbscan_config: HdbscanConfig
  /**
   * Raw HDBSCAN label per input point, in input order. `-1` means noise; any other
   * value is an internal cluster label.
   */
  labels: number[]
  /** The discovered clusters. */
  clusters: Cluster[]
  /** Ids of points that were not assigned to any cluster. */
  noise: string[]
}
