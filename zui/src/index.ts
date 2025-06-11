import { jsonSchemaToZui as fromJsonSchemaLegacy } from './transforms/json-schema-to-zui'
import { zuiToJsonSchema as toJsonSchemaLegacy } from './transforms/zui-to-json-schema'
import { objectToZui as fromObject } from './transforms/object-to-zui'
import { toTypescriptType, TypescriptGenerationOptions } from './transforms/zui-to-typescript-type'
import { toTypescriptSchema } from './transforms/zui-to-typescript-schema'
import { toJsonSchema } from './transforms/zui-to-json-schema-next'
import { fromJsonSchema } from './transforms/json-schema-to-zui-next'
import * as transformErrors from './transforms/common/errors'

export * from './z'

export const transforms = {
  errors: transformErrors,

  fromJsonSchemaLegacy,
  fromJsonSchema,
  fromObject,

  toJsonSchemaLegacy,
  toJsonSchema,
  toTypescriptType,
  toTypescriptSchema,
}

export { type TypescriptGenerationOptions }
