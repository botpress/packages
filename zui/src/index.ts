import { jsonSchemaToZui } from './transforms/json-schema-to-zui'
import { zuiToJsonSchema } from './transforms/zui-to-json-schema'
import { objectToZui } from './transforms/object-to-zui'
import {
  toTypescript,
  UntitledDeclarationError,
  TypescriptGenerationOptions,
} from './transforms/zui-to-typescript-next'
import { toTypescriptZuiString } from './transforms/zui-to-zui-string'

export * from './ui'
export * from './z'

export const transforms = {
  jsonSchemaToZui,
  zuiToJsonSchema,
  objectToZui,
  toTypescript,
  toTypescriptExpression: toTypescriptZuiString,
}

export { UntitledDeclarationError, type TypescriptGenerationOptions }
