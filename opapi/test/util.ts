import { basename } from 'path'
import { createProgram } from 'typescript'

export function validateTypescriptFile(filename: string) {
  const program = createProgram([filename], {})
  const diags = program.getSyntacticDiagnostics()

  if (diags.length) {
    diags.forEach((diag) => {
      throw new Error(`Error while parsing ${basename(diag.file.fileName)}: ${diag.messageText}`)
    })
  }
}
