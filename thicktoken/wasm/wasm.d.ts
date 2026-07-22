// The build tooling turns `.wasm` imports into a module whose default export is
// the raw bytes (default build: tsup inline-wasm esbuild plugin / vitest
// inline-wasm vite plugin) or a precompiled WebAssembly.Module (workerd build:
// esbuild copy loader + the runtime's native .wasm module support).
declare module '*.wasm' {
  const binary: Uint8Array | WebAssembly.Module
  export default binary
}

declare module '*.gz' {
  const bytes: Uint8Array
  export default bytes
}
