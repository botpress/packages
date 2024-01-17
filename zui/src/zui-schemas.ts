import type { ZuiTypeAny } from './zui'
import type { Options } from '@bpinternal/zod-to-json-schema'
import { zuiToJsonSchema } from './zui-to-json-schema'

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
   * Removes the $schema property
   */
  stripSchemaProps?: boolean
} & Partial<Pick<Options, 'target' | 'unionStrategy'>>

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
      if (zuiSchema.ui.layout) {
        elements.push({ type: zuiSchema.ui.layout, label: zuiSchema.ui.title, elements: [] })
        return processConfiguration(currentShape, nextScope, elements[elements.length - 1])
      }

      elements.push({ scope, label: zuiSchema.ui.title, ...zuiSchema.ui.displayAs })
    } else if (!currentShape) {
      elements.push({ scope, label: key })
    }

    if (currentShape) {
      processConfiguration(currentShape, nextScope, currentSchema)
    }
  })
}

export const getZuiSchemas = (input: ZuiTypeAny, opts: ZuiSchemaOptions = { rootScope: BASE_SCOPE }) => {
  const schema = zuiToJsonSchema(input, opts)

  let uischema: UISchema = {}

  if (input?._def?.shape) {
    uischema = {
      type: input.ui?.layout ?? 'VerticalLayout',
      elements: []
    }

    processConfiguration(input._def.shape(), opts.rootScope || BASE_SCOPE, uischema)
  }

  return { schema, uischema }
}
