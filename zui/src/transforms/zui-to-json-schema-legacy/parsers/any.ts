import { zuiKey } from '../../../ui/constants'
import { ZuiExtensionObject } from '../../../ui/types'
import { ZodAnyDef } from '../../../z'

export type JsonSchema7AnyType = {
  type: 'any'
  [zuiKey]?: ZuiExtensionObject
}

export function parseAnyDef(def: ZodAnyDef): JsonSchema7AnyType {
  return {
    type: 'any',
    ...(def[zuiKey] ? { [zuiKey]: def[zuiKey] } : {}),
  }
}
