import { extendApi, OpenApiZodAny } from '@anatine/zod-openapi'
import { generateClient, generateOpenapi, generateServer } from './generator'
import { addOperation } from './operation'
import { ApiError, ComponentType, createState, getRef, Metadata, Operation, Parameter, State } from './state'
import { exportStateAsTypescript } from './generators/ts-state'
export { Operation, Parameter } from './state'

export const schema = extendApi
export type OpenApi<
  SchemaName extends string = string,
  DefaultParameterName extends string = string,
  SectionName extends string = string,
  SchemaSectionName extends SectionName = SectionName
> = ReturnType<typeof createOpapiFromState<SchemaName, DefaultParameterName, SectionName, SchemaSectionName>>

export type OpenApiProps<
  SchemaName extends string,
  DefaultParameterName extends string,
  SectionName extends string,
  SchemaSectionName extends SectionName
> = {
  metadata: Metadata
  // adds default parameters to all operations
  defaultParameters?: Record<DefaultParameterName, Parameter>
  // adds the openapi schemas
  schemas?: Record<SchemaName, { schema: OpenApiZodAny; section: SchemaSectionName }>
  // adds the openapi tags
  sections?: Record<SectionName, { title: string; description: string }>
  // add the openapi errors
  errors?: readonly ApiError[]
}

export type CodePostProcessor = (code: string) => Promise<string> | string

export type OpenApiPostProcessors = {
  apiCode: CodePostProcessor
}

const asReadonly = <T extends Record<string, any>>(obj: T): Readonly<T> => obj

type AsConst<T> = { readonly [P in keyof T]: AsConst<T[P]> }

const createOpapiFromState = <
  SchemaName extends string,
  DefaultParameterName extends string,
  SectionName extends string,
  SchemaSectionName extends SectionName
>(
  state: State<SchemaName, DefaultParameterName, SectionName, SchemaSectionName>
) => {
  return asReadonly({
    state,
    getModelRef: (name: SchemaName): OpenApiZodAny => getRef(state, ComponentType.SCHEMAS, name),
    addOperation: <Path extends string>(operationProps: Operation<DefaultParameterName, SectionName, Path>) =>
      addOperation(state, operationProps),
    exportClient: (dir = '.', openapiGeneratorEndpoint: string, postProcessors?: OpenApiPostProcessors) =>
      generateClient(state, dir, openapiGeneratorEndpoint, postProcessors),
    exportServer: (dir = '.', useExpressTypes: boolean) => generateServer(state, dir, useExpressTypes),
    exportOpenapi: (dir = '.') => generateOpenapi(state, dir),
    exportState: (dir = '.') => exportStateAsTypescript(state, dir)
  })
}

export function OpenApi<
  SchemaName extends string,
  DefaultParameterName extends string,
  SectionName extends string,
  SchemaSectionName extends SectionName
>(props: OpenApiProps<SchemaName, DefaultParameterName, SectionName, SchemaSectionName>) {
  const state = createState(props)
  return createOpapiFromState(state)
}

export namespace OpenApi {
  export const fromState = <
    SchemaName extends string,
    DefaultParameterName extends string,
    SectionName extends string,
    SchemaSectionName extends SectionName
  >(
    state: AsConst<State<SchemaName, DefaultParameterName, SectionName, SchemaSectionName>>
  ) => createOpapiFromState(state as State<SchemaName, DefaultParameterName, SectionName, SchemaSectionName>)
}

export type SchemaOf<O extends OpenApi<any, any, any, any>> = O extends OpenApi<
  infer Skema,
  infer _Param,
  infer _Sexion,
  infer _SkemaSexion
>
  ? Skema
  : never

export type ParameterOf<O extends OpenApi<any, any, any, any>> = O extends OpenApi<
  infer _Skema,
  infer Param,
  infer _Sexion,
  infer _SkemaSexion
>
  ? Param
  : never

export type SectionOf<O extends OpenApi<any, any, any, any>> = O extends OpenApi<
  infer _Skema,
  infer _Param,
  infer Sexion,
  infer _SkemaSexion
>
  ? Sexion
  : never
