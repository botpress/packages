import type { ZuiTypeAny } from './zui'
import type { Options } from '@bpinternal/zod-to-json-schema'
import { zuiToJsonSchema } from './json-schema/zui-to-json-schema'
import { z } from 'zod'

export type ZuiSchemaOptions = {
  /**
   * The scope is the full path to the property defined in the JSON schema, the root node being represented by #
   * Objects doesn't have any scope, only  its child does
   * @default "#/properties/"
   * */
  rootScope?: string
  /**
   * Removes the "x-zui" property from the generated schema
   */
  stripZuiProps?: boolean
  /**
   * Sets the $schema path. If set to false, it will remove the $schema property from the schema
   */
  $schemaUrl?: string | false
  target?: 'jsonSchema7' | 'openApi3'
} & Partial<Pick<Options, 'unionStrategy' | 'discriminator'>>

const BASE_SCOPE = '#/properties/'

const processConfiguration = (config: Record<string, ZuiTypeAny>, currentRoot: string) => {
  Object.keys(config).forEach((key) => {
    const scope = `${currentRoot}${key}`
    const nextScope = `${scope}/properties/`
    const zuiSchema = config[key]
    const currentShape = zuiSchema?._def?.shape?.()
    const elements = []

    if (!currentShape) {
      elements.push({ scope, label: key })
    }

    if (currentShape) {
      processConfiguration(currentShape, nextScope)
    }
  })
}

export const getZuiSchemas = (input: ZuiTypeAny | z.ZodTypeAny, opts: ZuiSchemaOptions = { rootScope: BASE_SCOPE }) => {
  const schema = zuiToJsonSchema(input, opts)

  if (input?._def?.shape) {
    processConfiguration(input._def.shape(), opts.rootScope || BASE_SCOPE)
  }

  return { schema }
}
