import * as tsc from 'typescript'

const host: tsc.FormatDiagnosticsHost = {
  getCurrentDirectory: () => process.cwd(),
  getCanonicalFileName: (path) => path,
  getNewLine: () => '\n',
}

const DEFAULT_OPTIONS: tsc.CompilerOptions = {
  resolveJsonModule: true,
  strict: true,
  esModuleInterop: true,
}

export function validateTypescriptFile(filename: string, opts: tsc.CompilerOptions = {}): void {
  const options = { ...DEFAULT_OPTIONS, ...opts }
  const program = tsc.createProgram([filename], options)
  const diags = program.getSyntacticDiagnostics() // TODO: run all diagnostics

  const [diag] = diags
  if (diag) {
    const message = tsc.formatDiagnostic(diag, host)
    throw new Error(`Error while parsing ${filename}:\n${message}`)
  }
}

export function getTypescriptErrors(filename: string, opts: tsc.CompilerOptions = {}): string[] {
  const options = { ...DEFAULT_OPTIONS, ...opts }
  const program = tsc.createProgram([filename], options)
  const diagnostics = tsc.getPreEmitDiagnostics(program)

  return diagnostics.map((diag) => tsc.formatDiagnostic(diag, host))
}
