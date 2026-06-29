import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ClusteringOptions, ClusteringOutput, EmbeddingDataset } from './types'

export type { Cluster, ClusteringOptions, ClusteringOutput, EmbeddingDataset, HdbscanConfig, UmapConfig } from './types'

/** The subset of WASM exports the wrapper relies on. Mirrors `rust/src/wasm/mod.rs`. */
type GravityExports = {
  memory: WebAssembly.Memory
  alloc: (len: number) => number
  dealloc: (ptr: number, len: number) => void
  run_clustering_wasm: (ptr: number, len: number) => number
  error_message_ptr: () => number
  error_message_len: () => number
  output_json_ptr: () => number
  output_json_len: () => number
}

const WASM_FILE_NAME = 'gravity.wasm'

let cachedModule: WebAssembly.Module | undefined

const resolveWasmPath = (): string => {
  // The compiled module lives at either `<pkg>/src/index.ts` (tests) or
  // `<pkg>/dist/index.js` (published), so the artifact one level up — at the package
  // root — is reachable from both. Fall back to a sibling copy just in case.
  const candidates = [join(__dirname, '..', WASM_FILE_NAME), join(__dirname, WASM_FILE_NAME)]
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }
  throw new Error(
    `Could not find ${WASM_FILE_NAME}. Build it with \`pnpm build\` (or \`pnpm build:wasm\`). Looked in: ${candidates.join(', ')}`
  )
}

const getModule = (): WebAssembly.Module => {
  if (!cachedModule) {
    cachedModule = new WebAssembly.Module(readFileSync(resolveWasmPath()))
  }
  return cachedModule
}

const readText = (memory: WebAssembly.Memory, ptr: number, len: number): string =>
  new TextDecoder().decode(new Uint8Array(memory.buffer, ptr, len))

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

  const instance = new WebAssembly.Instance(getModule(), { env: {} })
  const exports = instance.exports as GravityExports

  const input = new TextEncoder().encode(JSON.stringify({ dataset, options }))
  const inputPtr = exports.alloc(input.length)
  new Uint8Array(exports.memory.buffer, inputPtr, input.length).set(input)

  let exitCode: number
  try {
    exitCode = exports.run_clustering_wasm(inputPtr, input.length)
  } finally {
    exports.dealloc(inputPtr, input.length)
  }

  if (exitCode !== 0) {
    const message = readText(exports.memory, exports.error_message_ptr(), exports.error_message_len())
    throw new Error(message || `gravity clustering failed with exit code ${exitCode}`)
  }

  const outputJson = readText(exports.memory, exports.output_json_ptr(), exports.output_json_len())
  return JSON.parse(outputJson) as ClusteringOutput
}
