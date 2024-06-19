import { zuiKey } from "../../../ui/constants"
import { ZuiExtensionObject } from "../../../ui/types"

export type JsonSchema7BooleanType = {
  type: 'boolean'
  [zuiKey]?: ZuiExtensionObject
}

export function parseBooleanDef(): JsonSchema7BooleanType {
  return {
    type: 'boolean',
  }
}
