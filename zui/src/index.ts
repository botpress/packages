import * as z from './zod'
import { UIComponentDefinitions } from './ui/types'
export type { BaseType, UIComponentDefinitions, ZuiComponentMap, AsBaseType, ZuiReactComponent } from './ui/types'
export { ZuiForm, type ZuiFormProps } from './ui'

export { jsonSchemaToZui } from './transforms/json-schema-to-zui'
export { zuiToJsonSchema } from './transforms/zui-to-json-schema'

export interface ComponentDefinitions {}

export type GlobalComponentDefinitions = ComponentDefinitions extends {
  components: infer TComponentMap extends UIComponentDefinitions
}
  ? TComponentMap
  : any

export { z }
export default z
