/**
 * Generates the merges-only vocab assets embedded by each package entry:
 *
 *   cl100k_merges.json.gz — full cl100k (100,000 merges) — exact OpenAI counts
 *   cl50k_merges.json.gz  — first 50,000 cl100k merges  — `thicktoken/lite`
 *   cl25k_merges.json.gz  — first 25,000 cl100k merges  — `thicktoken/micro`
 *
 * BPE merge lists are prefix-closed: the first N merges only ever reference
 * tokens produced by earlier merges (or the 256 base bytes), so a truncated
 * list is itself a valid, smaller tokenizer. Truncation trades count fidelity
 * for size/init speed: vs full cl100k, cl50k overcounts ~+3-4% and cl25k
 * ~+8-9% on prose/code — always in the SAFE direction for budget enforcement
 * (never undercounts), but do not use truncated variants for billing math.
 *
 * Special tokens are renumbered to sit right after the truncated merge range
 * (the encoder assigns ids positionally), keeping ids internally consistent.
 *
 * Usage: node wasm/scripts/gen-assets.mjs
 * (reads the committed full asset; to start from a fresh upstream
 *  tokenizer.json, see wasm/README.md)
 */
import { gunzipSync, gzipSync } from 'node:zlib'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets')
const full = JSON.parse(gunzipSync(readFileSync(join(assetsDir, 'cl100k_merges.json.gz'))).toString())

for (const [name, limit] of [
  ['cl50k_merges.json.gz', 50_000],
  ['cl25k_merges.json.gz', 25_000],
]) {
  const merges = full.merges.slice(0, limit)
  // renumber specials to follow the merge range: base 256 + merges, then specials
  let nextId = 256 + merges.length
  const added_tokens = [...full.added_tokens]
    .sort((a, b) => a.id - b.id)
    .map((t) => ({ ...t, id: nextId++ }))
  const asset = { merges, added_tokens, pre_tokenizer: full.pre_tokenizer }
  const gz = gzipSync(Buffer.from(JSON.stringify(asset)), { level: 9 })
  writeFileSync(join(assetsDir, name), gz)
  console.log(`${name}: ${merges.length} merges, ${(gz.length / 1024).toFixed(0)}KB gz`)
}
