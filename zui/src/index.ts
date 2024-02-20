import { UIComponentDefinitions } from './ui/types'
export type { BaseType, UIComponentDefinitions, SchemaResolversMap, ZuiComponentMap, AsBaseType } from './ui/types'
export {
  type ZuiFormProps,
  ZuiForm,
  schemaToUISchema,
  transformZuiComponentsToRenderers,
  defaultUISchemaResolvers,
} from './ui'
export type { Zui, ZuiType, Infer, ZuiExtension, ZuiRawShape, ZuiTypeAny } from './zui'
export type {
  JsonSchema7Type as JsonSchema7,
  JsonSchema7ObjectType as JsonSchema7Object,
} from '@bpinternal/zod-to-json-schema'

export { zui } from './zui'
export { getZuiSchemas } from './zui-schemas'
export { jsonSchemaToZui } from './json-schema-to-zui'
export { ZodError as ZuiError } from 'zod'

export interface ComponentDefinitions {}

export type GlobalComponentDefinitions = ComponentDefinitions extends {
  components: infer TComponentMap extends UIComponentDefinitions
}
  ? TComponentMap
  : any
