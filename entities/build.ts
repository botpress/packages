import _ from 'lodash'
import esbuild from 'esbuild'
import fs from 'fs'
import pathlib from 'path'

const rootDir = __dirname
const srcDir = pathlib.join(rootDir, 'src')
const srcEntryPoint = pathlib.join(srcDir, 'index.ts')
const pkgDir = pathlib.join(rootDir, 'pkg')
const distDir = pathlib.join(rootDir, 'dist')

const buildNodeJs = async () => {
  const nodeDir = pathlib.join(pkgDir, 'node')
  const gitIgnore = pathlib.join(nodeDir, '.gitignore')
  const entryPoint = pathlib.join(nodeDir, 'index.js')
  const wasmFileName = 'entities_bg.wasm'
  const wasmSrc = pathlib.join(nodeDir, wasmFileName)
  const wasmDest = pathlib.join(distDir, 'node', 'entities_bg.wasm')
  const distEntryPoint = pathlib.join(distDir, 'node', 'index.js')

  const entryPointContent = "module.exports = require('./entities.js')"

  fs.mkdirSync(nodeDir, { recursive: true })
  fs.rmSync(gitIgnore, { force: true })
  fs.writeFileSync(entryPoint, entryPointContent)
  fs.cpSync(wasmSrc, wasmDest) // this is a hack, but it works

  await esbuild.build({
    entryPoints: [srcEntryPoint],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: distEntryPoint,
    sourcemap: false
  })
}

const buildWeb = async () => {
  const webDir = pathlib.join(pkgDir, 'web')
  const gitIgnore = pathlib.join(webDir, '.gitignore')
  const entryPoint = pathlib.join(webDir, 'index.js')
  const wasm = pathlib.join(webDir, 'entities_bg.wasm')
  const distEntryPoint = pathlib.join(distDir, 'web', 'index.js')

  const wasmBin: Buffer = fs.readFileSync(wasm)
  const wasmB64 = wasmBin.toString('base64')
  const wasmB64Chunked = _.chunk(wasmB64, 100)
  const entryPointContent = [
    "import { initSync } from './entities.js'",
    '',
    'const bin = [',
    ...wasmB64Chunked.map((chunk) => `  "${chunk.join('')}",`),
    "].join('')",
    '',
    'const wasmBin = Uint8Array.from(atob(bin), c => c.charCodeAt(0))',
    '',
    'initSync(wasmBin)',
    '',
    "export * from './entities.js'"
  ].join('\n')

  fs.mkdirSync(webDir, { recursive: true })
  fs.rmSync(gitIgnore, { force: true })
  fs.writeFileSync(entryPoint, entryPointContent)

  await esbuild.build({
    entryPoints: [srcEntryPoint],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: distEntryPoint,
    sourcemap: false
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
