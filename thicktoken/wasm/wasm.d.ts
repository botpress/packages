// The build tooling (tsup inline-wasm esbuild plugin / vitest inline-wasm vite plugin)
// turns `.wasm` imports into a module whose default export is the raw bytes.
declare module '*.wasm' {
  const bytes: Uint8Array
  export default bytes
}

declare module '*.gz' {
  const bytes: Uint8Array
  export default bytes
}
