# @bpinternal/gravity

Generic density-based clustering for high-dimensional embeddings, with **no native
dependencies**. The clustering engine is written in Rust, compiled to
`wasm32-unknown-unknown`, and wrapped in a small TypeScript API — so it runs anywhere
Node runs, no system libraries, and no build step at install time.

The pipeline reduces vectors to a low-dimensional space with **UMAP**, then groups them
with **HDBSCAN**. Points that don't fall into any dense region are returned as noise.

## Usage

```ts
import { cluster } from '@bpinternal/gravity'

const result = cluster({
  ids: ['a', 'b', 'c', 'd'],
  embeddings: [
    [0.1, 0.2 /* ... */],
    [0.1, 0.3 /* ... */],
    [0.9, 0.8 /* ... */],
    [0.7, 0.1 /* ... */]
  ],
  dim: 1536
})

result.clusters // [{ itemIds, centroid, assignRadius }, ...]
result.noise // ids that weren't assigned to any cluster
result.labels // raw HDBSCAN label per input point, in input order (-1 = noise)
```

`embeddings[i]` is the vector for `ids[i]`, and every vector must have exactly `dim`
components.

### Options

`cluster` takes an optional second argument to override the UMAP/HDBSCAN parameters.
Any field left unset falls back to its default.

```ts
cluster(dataset, {
  // UMAP (dimensionality reduction)
  initType: 'PCA', // 'PCA' | 'Random'           (default 'PCA')
  nNeighbors: 15, //   local neighborhood size    (default 15)
  nComponents: 5, //   reduced dimensions         (default 5)
  minDist: 0, //       packing tightness          (default 0)
  spread: 1, //        embedded scale             (default 1)
  nEpochs: 500, //     optimization epochs        (default 500)
  negativeSampleRate: 5, //                        (default 5)
  seed: 42, //         RNG seed (for determinism) (default 42)

  // HDBSCAN (density clustering)
  minClusterSize: 10, // min points per cluster   (default 10)
  minSamples: 1 //      core-distance neighbors   (default 1)
})
```

### Result shape

| Field                            | Description                                                                  |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `clusters`                       | The discovered clusters.                                                     |
| `clusters[].itemIds`             | Member ids, ordered by ascending cosine distance from the centroid.          |
| `clusters[].centroid`            | Mean of the members in the original vector space.                            |
| `clusters[].assignRadius`        | Cosine-distance radius (clamped to `[0.25, 0.35]`) for assigning new points. |
| `noise`                          | Ids not assigned to any cluster.                                             |
| `labels`                         | Raw HDBSCAN label per input point, input order. `-1` is noise.               |
| `umap_config` / `hdbscan_config` | The parameters the run used.                                                 |

The run is **deterministic**: the same dataset, in the same order, always yields the
same clusters (UMAP is seeded with a fixed seed).

## How it works

1. **UMAP** projects the raw vectors (e.g. 1536-D) into a low-dimensional space (5-D)
   using a cosine metric, preserving local structure.
2. **HDBSCAN** finds density clusters in the reduced space (euclidean metric, EOM
   cluster selection), labelling sparse points as noise.
3. Centroids and an assignment radius are computed in the **original** vector space so
   downstream code can assign new points by cosine similarity.

## Development

The engine lives in [`rust/`](./rust). The TypeScript wrapper in [`src/`](./src) loads
the compiled `gravity.wasm` and marshals data across the WASM boundary.

Building requires the Rust toolchain and the wasm target:

```bash
rustup target add wasm32-unknown-unknown
```

```bash
pnpm build        # build the wasm engine, then compile the TS wrapper
pnpm build:wasm   # just rebuild rust/ -> gravity.wasm
pnpm test         # rebuild wasm, then run the TS wrapper tests (vitest)
pnpm test:rust    # run the Rust unit tests (cargo)
pnpm check        # format + type check
```

`gravity.wasm` is a build artifact (git-ignored) and is published alongside `dist/`.
