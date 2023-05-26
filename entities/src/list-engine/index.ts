import * as wasm from './wasm'
import * as node from './node'

export * as wasm from './wasm'
export * as node from './node'
export * from './typings'

export type ListEntityEngine = typeof wasm | typeof node
