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

/**
 * This is a recursive schema that describes the UI of a Zod schema.
 */
export type UISchema = {
  /** Type and options are available when using "displayAs" */
  type?: string
  options?: any
  /**
   * The scope is the full path to the property defined in the JSON schema, the root node being represented by #
   * Objects doesn't have any scope, only  its child does
   * */
  scope?: string
  /** Optional label for the element */
  label?: string
  elements?: UISchema[]
}

const BASE_SCOPE = '#/properties/'

const processConfiguration = (config: Record<string, ZuiTypeAny>, currentRoot: string, currentSchema: UISchema) => {
  Object.keys(config).forEach((key) => {
    const scope = `${currentRoot}${key}`
    const nextScope = `${scope}/properties/`
    const zuiSchema = config[key]
    const currentShape = zuiSchema._def?.shape?.()
    const elements = currentSchema.elements ?? []

    if (zuiSchema.ui) {
      elements.push({ scope, label: zuiSchema.ui.title })
    } else if (!currentShape) {
      elements.push({ scope, label: key })
    }

    if (currentShape) {
      processConfiguration(currentShape, nextScope, currentSchema)
    }
  })
}

export const getZuiSchemas = (input: ZuiTypeAny | z.ZodTypeAny, opts: ZuiSchemaOptions = { rootScope: BASE_SCOPE }) => {
  const schema = zuiToJsonSchema(input, opts)

  let uischema: UISchema = {}

  if (input?._def?.shape) {
    processConfiguration(input._def.shape(), opts.rootScope || BASE_SCOPE, uischema)
  }

  return { schema, uischema }
}
