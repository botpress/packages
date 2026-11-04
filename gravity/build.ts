import * as childProcess from 'child_process'
import esbuild from 'esbuild'
import fs from 'fs'
import _ from 'lodash'
import pathlib from 'path'

type WasmPackProps = {
  outdir: string
  target: 'nodejs' | 'web'
}
const wasmPack = ({ outdir, target }: WasmPackProps) => {
  return childProcess.spawnSync(
    'pnpm',
    ['wasm-pack', 'build', '--verbose', '--out-dir', outdir, '--target', target, '--release', '--no-pack'],
    {
      stdio: 'inherit'
    }
  )
}

const getBinChunks = (wasmBinPath: string): string[] => {
  const wasmBin: Buffer = fs.readFileSync(wasmBinPath)
  const wasmB64 = wasmBin.toString('base64')
  const wasmB64Chunked = _.chunk(wasmB64, 100).map((chunk) => chunk.join(''))
  return wasmB64Chunked
}

const replaceInFile = (filePath: string, searchValue: string, replaceValue: string) => {
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  if (!fileContent.includes(searchValue)) {
    const maxLen = 10
    const searchValueSummary = searchValue.length > maxLen ? `${searchValue.slice(0, maxLen)}...` : searchValue
    throw new Error(`File ${filePath} does not contain the search value: "${searchValueSummary}"`)
  }

  const newFileContent = fileContent.replace(searchValue, replaceValue)
  fs.writeFileSync(filePath, newFileContent)
}

const rootDir = __dirname

const srcDir = pathlib.join(rootDir, 'src')
const srcEntryPoint = pathlib.join(srcDir, 'index.ts')

const pkgDir = pathlib.join(rootDir, 'pkg')
const pkgNodeDir = pathlib.join(pkgDir, 'node')
const pkgWebDir = pathlib.join(pkgDir, 'web')
const pkgWorkerDir = pathlib.join(pkgDir, 'worker')
const wasmFileName = 'gravity_bg.wasm'
const gitIgnoreFileName = '.gitignore'
const indexJsFileName = 'index.js'
const typeDeclarationFileName = 'gravity.d.ts'

const distDir = pathlib.join(rootDir, 'dist')
const distNodeDir = pathlib.join(distDir, 'node')
const distWebDir = pathlib.join(distDir, 'web')
const distWorkerDir = pathlib.join(distDir, 'worker')

const buildNodeJs = async () => {
  wasmPack({ outdir: pkgNodeDir, target: 'nodejs' })
  fs.mkdirSync(pkgNodeDir, { recursive: true })
  fs.rmSync(pathlib.join(pkgNodeDir, gitIgnoreFileName), { force: true })

  const wasmB64Chunked = getBinChunks(pathlib.join(pkgNodeDir, wasmFileName))

  // wasm-pack's nodejs target reads the binary from disk; inline it as base64 so the
  // esbuild bundle is self-contained and has no loose .wasm to resolve at runtime.
  const currentCode = [
    'const wasmPath = `${__dirname}/gravity_bg.wasm`;',
    "const wasmBytes = require('fs').readFileSync(wasmPath);"
  ].join('\n')

  const newCode = [
    'const bin = [',
    ...wasmB64Chunked.map((chunk) => `  "${chunk}",`),
    "].join('')",
    '',
    'const wasmBytes = Buffer.from(bin, "base64")'
  ].join('\n')

  replaceInFile(pathlib.join(pkgNodeDir, 'gravity.js'), currentCode, newCode)

  const entryPointContent = "module.exports = require('./gravity.js')"

  fs.writeFileSync(pathlib.join(pkgNodeDir, indexJsFileName), entryPointContent)

  await esbuild.build({
    entryPoints: [srcEntryPoint],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: pathlib.join(distNodeDir, indexJsFileName),
    sourcemap: false
  })
}

const buildWeb = async () => {
  wasmPack({ outdir: pkgWebDir, target: 'web' })

  const wasmB64Chunked = getBinChunks(pathlib.join(pkgWebDir, wasmFileName))
  const entryPointContent = [
    "import { initSync } from './gravity.js'",
    '',
    'const bin = [',
    ...wasmB64Chunked.map((chunk) => `  "${chunk}",`),
    "].join('')",
    '',
    'const wasmBin = Uint8Array.from(atob(bin), c => c.charCodeAt(0))',
    '',
    'export const init = () => {',
    '  initSync(wasmBin)',
    '}',
    '',
    "export * from './gravity.js'"
  ].join('\n')

  fs.mkdirSync(pkgWebDir, { recursive: true })
  fs.rmSync(pathlib.join(pkgWebDir, gitIgnoreFileName), { force: true })
  fs.writeFileSync(pathlib.join(pkgWebDir, indexJsFileName), entryPointContent)

  fs.appendFileSync(pathlib.join(pkgWebDir, typeDeclarationFileName), ['', 'export function init(): void;'].join('\n'))

  await esbuild.build({
    entryPoints: [srcEntryPoint],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: pathlib.join(distWebDir, indexJsFileName),
    sourcemap: false
  })
}

const buildWorker = async () => {
  wasmPack({ outdir: pkgWorkerDir, target: 'web' })

  // Workers cannot compile WebAssembly from bytes at runtime; their bundlers (wrangler, the
  // Cloudflare Vite plugin) compile an imported .wasm file ahead of time and hand it over as a
  // WebAssembly.Module, so the binary ships next to the bundle and is instantiated on import.
  const entryPointContent = [
    "import { initSync } from './gravity.js'",
    `import wasmModule from './${wasmFileName}'`,
    '',
    'initSync({ module: wasmModule })',
    '',
    '// instantiated above, on import',
    'export const init = () => {}',
    '',
    "export * from './gravity.js'"
  ].join('\n')

  fs.mkdirSync(pkgWorkerDir, { recursive: true })
  fs.rmSync(pathlib.join(pkgWorkerDir, gitIgnoreFileName), { force: true })
  fs.writeFileSync(pathlib.join(pkgWorkerDir, indexJsFileName), entryPointContent)

  await esbuild.build({
    entryPoints: [srcEntryPoint],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: pathlib.join(distWorkerDir, indexJsFileName),
    external: ['*.wasm'],
    plugins: [
      // src/index.ts imports '../pkg', which resolves to the web glue
      {
        name: 'worker-pkg',
        setup: (build) => {
          build.onResolve({ filter: /^\.\.\/pkg$/ }, () => ({ path: pathlib.join(pkgWorkerDir, indexJsFileName) }))
        }
      }
    ],
    sourcemap: false
  })

  fs.copyFileSync(pathlib.join(pkgWorkerDir, wasmFileName), pathlib.join(distWorkerDir, wasmFileName))
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
  if (target === 'worker') {
    await buildWorker()
    return
  }
  throw new Error(`Unsupported target: ${target}`)
}

void main(process.argv.slice(2))
  .then(() => {
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
