import { ZodGenericDef } from '../../../z'

export function parseGenericDef(def: ZodGenericDef): { $ref: string } {
  return {
    $ref: `@zui/generic/${def.name}`,
  }
}
