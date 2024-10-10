import { jsonSchemaToZui } from './transforms/json-schema-to-zui'
import { zuiToJsonSchema } from './transforms/zui-to-json-schema'
import { objectToZui } from './transforms/object-to-zui'
import { toTypescript, TypescriptGenerationOptions } from './transforms/zui-to-typescript-type'
import { toTypescriptSchema } from './transforms/zui-to-typescript-schema'
import * as transformErrors from './transforms/common/errors'

export * from './ui'
export * from './z'

export const transforms = {
  errors: transformErrors,
  jsonSchemaToZui,
  zuiToJsonSchema,
  objectToZui,
  toTypescript,
  toTypescriptSchema,
}

export { type TypescriptGenerationOptions }
