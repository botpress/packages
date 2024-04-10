import { generateErrors } from '../generators/errors'
import { ApiError } from '../state'
import fs from 'fs/promises'

export const exportErrors = (errors: ApiError[]) => async (outFile: string) => {
  const errorFile: string = generateErrors(errors ?? [])
  await fs.writeFile(outFile, errorFile)
}
