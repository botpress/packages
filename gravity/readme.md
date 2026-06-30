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

The engine lives in [`rssrc/`](./rssrc) and is exposed across the WASM boundary with
`wasm-bindgen`. `wasm-pack` compiles it to `node` and `web` targets, the wasm binary is
base64-inlined into the generated glue, and [`build.ts`](./build.ts) bundles the
TypeScript wrapper in [`src/`](./src) around it with esbuild. This matches the shape of
the other Rust packages in this repo (`entities`, `verel`).

Building requires the Rust toolchain (the wasm target is added automatically by
`wasm-pack`):

```bash
pnpm build        # wasm-pack (node + web) + esbuild bundles + type declarations
pnpm build:node   # just the Node target
pnpm build:web    # just the browser target
pnpm test         # run the Rust tests, then build the node target and run the wrapper tests
pnpm test:rust    # just the Rust unit tests (cargo)
pnpm test:unit    # just the TS wrapper tests (vitest)
pnpm check        # format + type check
```

The build emits `dist/node` (CommonJS), `dist/web` (ESM), and `dist/types`; the wasm is
inlined into the bundles, so there is no separate `.wasm` file to ship.

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this
organization are meant to be used by the [Botpress](https://github.com/botpress/botpress)
team internally and are not meant for our community. Since the packages are catered to our
own use-cases, they might have less stable APIs, receive breaking changes without much
warning, have minimal documentation and lack community-focused support. However, these
packages were still left intentionally public for an important reason : We Love
Open-Source. Therefore, if you wish to install or fork this package feel absolutely free to
do it. We strongly recommend that you tag your versions properly.

The Botpress Engineering team.
