import type { FC } from 'react'
import type { z } from 'zod'
import type { BaseType, ContainerType, GlobalExtensionDefinition, UIExtension, containerTypes } from '../uiextensions'

export type ZUIFieldComponent<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIExtension = GlobalExtensionDefinition,
> = FC<{
  type: Type
  id: ID
  params: z.infer<UI[Type][ID]['schema']>
}>

export type ZUIContainerComponent<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIExtension = GlobalExtensionDefinition,
> = FC<{
  type: Type
  id: ID
  params: z.infer<UI[Type][ID]['schema']>
  children: React.ReactNode | React.ReactNode[] | null
}>

export type AsBaseType<T> = T extends BaseType ? T : never

export type ZUIComponent<
  Type extends BaseType,
  ID extends keyof UI[Type],
  UI extends UIExtension = GlobalExtensionDefinition,
> = Type extends ContainerType
  ? ZUIContainerComponent<AsBaseType<Type>, ID, UI>
  : ZUIFieldComponent<AsBaseType<Type>, ID, UI>

export type ZUIComponentLibrary<UI extends UIExtension = GlobalExtensionDefinition> = {
  [Type in keyof UI]: {
    [ID in keyof UI[Type]]: ZUIComponent<AsBaseType<Type>, ID, UI>
  } & {
    default?: ZUIComponent<AsBaseType<Type>, 'default', UI>
  }
}
