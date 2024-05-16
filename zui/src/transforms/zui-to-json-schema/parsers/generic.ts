import { ZodGenericDef } from '../../../z'

export function parseGenericDef(def: ZodGenericDef): { $ref: string } {
  return {
    $ref: def.name,
  }
}
