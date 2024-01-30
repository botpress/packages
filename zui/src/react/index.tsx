import { type FC } from 'react'
import { z } from 'zod'
import { BaseType, UIExtension } from '../uiextensions'
import { ExtensionDefinitions } from '../zui'

export type ZUIReactComponent<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIExtension = ExtensionDefinitions,
> = FC<{
  type: Type
  id: ID
  params: z.infer<UI[Type][ID]['schema']>
}>

type AsBaseType<T> = T extends BaseType ? T : never

export type ZUIReactComponentLibrary<UI extends UIExtension = ExtensionDefinitions> = {
  [Type in keyof UI]: {
    [ID in keyof UI[Type]]: ZUIReactComponent<AsBaseType<Type>, ID, UI>
  }
}

export const NotImplementedComponent: ZUIReactComponent<any, any> = ({ type, id }) => {
  return (
    <div>
      <p>
        {type} {id} not implemented
      </p>
    </div>
  )
}

// TODO: implement
export const ZUIForm: FC<{ components: ZUIReactComponentLibrary; schema: any }> = ({ schema }) => {
  return <form>return null</form>
}
