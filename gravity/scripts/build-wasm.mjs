// Builds the Rust crate to wasm32 and copies the artifact to the package root,
// where the TS wrapper (src/index.ts) loads it from.
import { spawnSync } from 'node:child_process'
import { copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const rustDir = join(packageRoot, 'rust')
const target = 'wasm32-unknown-unknown'
const artifact = join(rustDir, 'target', target, 'release', 'gravity.wasm')
const destination = join(packageRoot, 'gravity.wasm')

const build = spawnSync('cargo', ['build', '--lib', '--release', '--target', target], {
  cwd: rustDir,
  stdio: 'inherit'
})

if (build.error) {
  console.error('Failed to run cargo. Is the Rust toolchain installed?')
  console.error(build.error.message)
  process.exit(1)
}

if (build.status !== 0) {
  process.exit(build.status ?? 1)
}

copyFileSync(artifact, destination)
console.log(`Copied ${artifact} -> ${destination}`)
