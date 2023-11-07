import { isBrowser } from 'browser-or-node'
import * as wsm from '../pkg'

let initialized = false
const maybeInitialize = () => {
  if (initialized) {
    return
  }
  if (isBrowser) {
    wsm.init() // this might break on some browsers
  }
  initialized = true
}

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
export const check = (program: string): CheckResult => {
  maybeInitialize()
  return wsm.check(program)
}

export type ExecutionResult = { event: any; result: any }
export const execute = (program: string, event: any): ExecutionResult => {
  maybeInitialize()
  return wsm.execute(program, event)
}

export const formatDiagnostic = (diagnostic: CompilationDiagnostic): string => {
  maybeInitialize()
  return wsm.format_diagnostic(diagnostic)
}
