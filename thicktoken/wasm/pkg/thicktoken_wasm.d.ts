/* tslint:disable */
/* eslint-disable */

export class WasmTokenizer {
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Token count. When `approximate` is true (default in the JS wrapper) and the
     * input is large, estimates the count by tokenizing a handful of sampled
     * windows and extrapolating by the tokens-per-char ratio — orders of magnitude
     * faster on big inputs, within a few %. Falls back to exact
     * for inputs below `APPROX_MIN_CHARS`.
     */
    count(text: string, approximate: boolean): number;
    decode(ids: Uint32Array): string;
    /**
     * Encode -> Uint32Array (no special tokens, to match tiktoken.encode).
     */
    encode(text: string): Uint32Array;
    /**
     * Construct from the embedded cl100k model.
     */
    constructor();
    /**
     * Return the substring covered by tokens [start, end) (end exclusive; like
     * Array.slice). Negative-style indexing is done on the JS side. Exact.
     */
    slice(text: string, start: number, end: number): string;
    /**
     * Encode `text` and return one decoded string per token (lossy — a token whose
     * bytes aren't valid UTF-8 on their own yields U+FFFD, matching a lenient
     * TextDecoder). This is what thicktoken's `split()` returns.
     */
    split(text: string): string[];
    /**
     * Keep `max_tokens` tokens from `text`, choosing which part via `mode`:
     * "head" (first N), "tail" (last N), or "middle" (first N/2 + last N/2, dropping
     * the middle). Exact — uses an optimistic char window so it never tokenizes the
     * whole input when N is small relative to the total.
     */
    truncate(text: string, max_tokens: number, mode: string): string;
    vocabSize(): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_wasmtokenizer_free: (a: number, b: number) => void;
    readonly wasmtokenizer_count: (a: number, b: number, c: number, d: number) => number;
    readonly wasmtokenizer_decode: (a: number, b: number, c: number, d: number) => void;
    readonly wasmtokenizer_encode: (a: number, b: number, c: number, d: number) => void;
    readonly wasmtokenizer_new: (a: number) => void;
    readonly wasmtokenizer_slice: (a: number, b: number, c: number, d: number, e: number, f: number) => void;
    readonly wasmtokenizer_split: (a: number, b: number, c: number, d: number) => void;
    readonly wasmtokenizer_truncate: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
    readonly wasmtokenizer_vocabSize: (a: number) => number;
    readonly __wbindgen_export: (a: number, b: number) => number;
    readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
    readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
