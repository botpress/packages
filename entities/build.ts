import _ from 'lodash'
import esbuild from 'esbuild'
import fs from 'fs'
import pathlib from 'path'
import { dependencies } from './package.json'

const external = Object.keys(dependencies)

const rootDir = __dirname

const srcDir = pathlib.join(rootDir, 'src')
const entryPoint = pathlib.join(srcDir, 'index.ts')

const pkgDir = pathlib.join(rootDir, 'pkg')
const nodeDir = pathlib.join(pkgDir, 'node')
const webDir = pathlib.join(pkgDir, 'web')
const nodeEntryPoint = pathlib.join(nodeDir, 'index.js')
const nodeWasm = pathlib.join(nodeDir, 'entities_bg.wasm')
const webEntryPoint = pathlib.join(webDir, 'index.js')
const webWasm = pathlib.join(webDir, 'entities_bg.wasm')

const distDir = pathlib.join(rootDir, 'dist')
const distNodeEntryPoint = pathlib.join(distDir, 'index.cjs')
const distNodeWasm = pathlib.join(distDir, 'entities_bg.wasm')
const distWebEntryPoint = pathlib.join(distDir, 'index.mjs')

const buildNodeJs = async () => {
  const entryPointContent = "module.exports = require('./entities.js')"
  fs.writeFileSync(nodeEntryPoint, entryPointContent)
  fs.copyFileSync(nodeWasm, distNodeWasm) // this is a hack to make it work with esbuild
  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external,
    outfile: distNodeEntryPoint,
    sourcemap: true
  })
}

const buildWeb = async () => {
  const wasmBin: Buffer = fs.readFileSync(webWasm)
  const wasmB64 = wasmBin.toString('base64')
  const wasmB64Chunked = _.chunk(wasmB64, 100)
  const entryPointContent = [
    "import { initSync } from './entities.js'",
    '',
    'const bin = [',
    ...wasmB64Chunked.map((chunk) => `  "${chunk}",`),
    "].join('')",
    '',
    'const wasmBin = Uint8Array.from(atob(bin), c => c.charCodeAt(0))',
    '',
    'initSync(wasmBin)',
    '',
    "export * from './entities.js'"
  ].join('\n')
  fs.writeFileSync(webEntryPoint, entryPointContent)

  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    external: external,
    outfile: distWebEntryPoint,
    sourcemap: true
  })
}

const main = async (argv: string[]) => {
  const [target] = argv
  if (target === 'nodejs') {
    await buildNodeJs()
    return
  }
  if (target === 'web') {
    await buildWeb()
    return
  }
  throw new Error(`Unsuported target: ${target}`)
}

void main(process.argv.slice(2))
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
