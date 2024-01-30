import { type FC } from 'react'
import { z } from 'zod'
import { BaseType, UIExtension } from '../uiextensions'
import { ExtensionDefinitions } from '../zui'
import { defaultExtensions } from '../uiextensions/defaults'

type ZUIReactComponent<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIExtension = ExtensionDefinitions,
> = FC<{
  type: Type
  id: ID
  params: z.infer<UI[Type][ID]['schema']>
}>

const TextBox: ZUIReactComponent<'string', 'textbox', typeof defaultExtensions> = ({ params }) => {
  return <input {...params} />
}

const NumberSlider: ZUIReactComponent<'number', 'slider', typeof defaultExtensions> = ({ params }) => {
  return <input {...params} />
}

type AsBaseType<T> = T extends BaseType ? T : never

type ZUIExtensionComponents<UI extends UIExtension = ExtensionDefinitions> = {
  [Type in keyof UI]: {
    [ID in keyof UI[Type]]: ZUIReactComponent<AsBaseType<Type>, ID, UI>
  }
}

const defaultExtensionComponents: ZUIExtensionComponents<typeof defaultExtensions> = {
  string: {
    textbox: TextBox,
  },
  number: {
    slider: () => null,
    numberinput: () => null,
  },
  boolean: {
    checkbox: () => null,
  },
  array: {},
  object: {},
}

export { defaultExtensionComponents }
