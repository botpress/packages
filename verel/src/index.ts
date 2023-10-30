import * as wsm from '../pkg'

export type CompilationDiagnosticLabel = {
  message: string
  primary: boolean
  span: [number, number]
}

export type CompilationDiagnosticNote = {
  message: string
  note_type: string
}

export type CompilationDiagnostic = {
  message: string
  code: number
  severity: string
  labels: CompilationDiagnosticLabel[]
  notes: CompilationDiagnosticNote[]
}
export type CheckResult = { warnings: CompilationDiagnostic[]; errors: CompilationDiagnostic[] }
export const check = (program: string): CheckResult => wsm.check(program)

export type ExecutionResult = { event: any; result: any }
export const execute = (program: string, event: any): ExecutionResult => wsm.execute(program, event)

export const formatDiagnostic = (diagnostic: CompilationDiagnostic): string => wsm.format_diagnostic(diagnostic)
