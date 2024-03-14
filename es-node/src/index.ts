import * as utils from './utils'
import * as esbuild from 'esbuild'

const ARGV_OFFSET = 2

const main = async () => {
  if (process.argv.length < ARGV_OFFSET + 1) {
    throw new Error('No entrypoint specified')
  }

  const entrypointArgs = process.argv[ARGV_OFFSET + 0]

  const splitIdx = process.argv.indexOf('--')

  let esbuildArgs: string[] = []
  let scriptArgs: string[] = []

  if (splitIdx !== -1) {
    esbuildArgs = process.argv.slice(ARGV_OFFSET + 1, splitIdx)
    scriptArgs = process.argv.slice(splitIdx + 1)
    process.argv.splice(0, splitIdx + 1)
  } else {
    esbuildArgs = process.argv.slice(ARGV_OFFSET + 1)
    scriptArgs = []
    process.argv.splice(0, process.argv.length)
  }

  if (esbuildArgs.length > 0) {
    // TODO: pass esbuild args to esbuild
    console.log('Ignoring esbuild args: ' + esbuildArgs.join(' '))
  }

  const cwd = utils.path.cwd()
  const entrypoint = utils.path.absoluteFrom(cwd, entrypointArgs)
  const { outputFiles } = await esbuild.build({
    entryPoints: [entrypoint],
    logOverride: { 'equals-negative-zero': 'silent' },
    platform: 'node',
    target: 'es2020',
    minify: true,
    bundle: true,
    sourcemap: false,
    absWorkingDir: cwd,
    logLevel: 'silent',
    keepNames: true,
    write: false
  })

  const artifact = outputFiles[0]
  if (!artifact) {
    throw new Error('No artifact produced')
  }

  console.log(`Calling script with args: ${process.argv.join(' ')}`)
  utils.require.requireJsCode(artifact.text)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
