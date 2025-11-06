import path from 'path'
import Module from 'module'
import fs from 'node:fs'
import * as tsc from 'typescript'

const host: tsc.FormatDiagnosticsHost = {
  getCurrentDirectory: () => process.cwd(),
  getCanonicalFileName: (path) => path,
  getNewLine: () => '\n',
}

const ROOT_DIR = path.join(__dirname, '..')
const DEFAULT_OPTIONS: tsc.CompilerOptions = {
  resolveJsonModule: true,
  strict: true,
  esModuleInterop: true,
  baseUrl: ROOT_DIR,
  noEmit: true,
}

export function validateTypescriptFile(filename: string, opts: tsc.CompilerOptions = {}): void {
  const options = { ...DEFAULT_OPTIONS, ...opts }
  const program = tsc.createProgram([filename], options)
  const diags = program.getSyntacticDiagnostics() // TODO: run all diagnostics

  const [diag] = diags
  if (diag) {
    const message = tsc.formatDiagnostic(diag, host)
    throw new Error(`Error while parsing ${path.basename(diag.file.fileName)}:\n${message}`)
  }
}

export function getTypescriptErrors(filename: string, opts: tsc.CompilerOptions = {}): string[] {
  const options = { ...DEFAULT_OPTIONS, ...opts }
  const program = tsc.createProgram([filename], options)
  const diagnostics = tsc.getPreEmitDiagnostics(program)

  return diagnostics.map((diag) => tsc.formatDiagnostic(diag, host))
}

export function requireTsFile(filename: string) {
  const content = fs.readFileSync(filename).toString()
  const { outputText } = tsc.transpileModule(content, {
    compilerOptions: DEFAULT_OPTIONS,
    fileName: filename,
  });
  return requireJsCode(outputText)
}

export function requireJsCode(code: string) {
  const filedir = 'tmp'
  const filename = `${Date.now()}.js`

  const fileid = path.join(filedir, filename)

  const m = new Module(fileid)
  m.filename = filename

  /** @ts-ignore */
  m._compile(code, filename)
  return m.exports
}


