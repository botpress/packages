import _ from 'lodash'
import esbuild from 'esbuild'
import pathlib from 'path'

const rootDir = __dirname

const srcDir = pathlib.join(rootDir, 'src')
const srcEntryPoint = pathlib.join(srcDir, 'index.ts')

const indexJsFileName = 'index.js'

const distDir = pathlib.join(rootDir, 'dist')
const distNodeDir = pathlib.join(distDir, 'node')
const distWebDir = pathlib.join(distDir, 'web')

const buildNodeJs = async () => {
  await esbuild.build({
    entryPoints: [srcEntryPoint],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: pathlib.join(distNodeDir, indexJsFileName),
    sourcemap: false,
    loader: {
      '.wasm': 'binary'
    }
  })
}

const buildWeb = async () => {
  await esbuild.build({
    entryPoints: [srcEntryPoint],
    bundle: true,
    platform: 'browser',
    format: 'esm',
    outfile: pathlib.join(distWebDir, indexJsFileName),
    sourcemap: false,
    loader: {
      '.wasm': 'binary'
    }
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
