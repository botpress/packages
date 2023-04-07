import { extendApi, OpenApiZodAny } from '@anatine/zod-openapi'
import { generateClient, generateOpenapi, generateServer } from './generator'
import { addOperation } from './operation'
import { ApiError, ComponentType, createState, getRef, Metadata, Operation, Parameter } from './state'
export { Operation, Parameter } from './state'

export const schema = extendApi
export type OpenApi<
  SchemaName extends string = string,
  DefaultParameterName extends string = string,
  SectionName extends string = string,
  SchemaSectionName extends SectionName = SectionName
> = ReturnType<typeof OpenApi<SchemaName, DefaultParameterName, SectionName, SchemaSectionName>>

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

export function OpenApi<
  SchemaName extends string,
  DefaultParameterName extends string,
  SectionName extends string,
  SchemaSectionName extends SectionName
>(props: OpenApiProps<SchemaName, DefaultParameterName, SectionName, SchemaSectionName>) {
  const state = createState(props)
  return {
    getModelRef: (name: SchemaName): OpenApiZodAny => getRef(state, ComponentType.SCHEMAS, name),
    addOperation: <Path extends string>(operationProps: Operation<DefaultParameterName, SectionName, Path>) =>
      addOperation(state, operationProps),
    exportClient: (dir = '.', openapiGeneratorEndpoint: string, postProcessors?: OpenApiPostProcessors) =>
      generateClient(state, dir, openapiGeneratorEndpoint, postProcessors),
    exportServer: (dir = '.', useExpressTypes: boolean) => generateServer(state, dir, useExpressTypes),
    exportOpenapi: (dir = '.') => generateOpenapi(state, dir),
  }
}

export type SchemaOf<O extends OpenApi<any, any, any>> = O extends OpenApi<infer Skema, infer _Param, infer _Sexion>
  ? Skema
  : never
export type ParameterOf<O extends OpenApi<any, any, any>> = O extends OpenApi<infer _Skema, infer Param, infer _Sexion>
  ? Param
  : never
export type SectionOf<O extends OpenApi<any, any, any>> = O extends OpenApi<infer _Skema, infer _Param, infer Sexion>
  ? Sexion
  : never

// type tests

type MyApi = OpenApi<'schema1' | 'schema2', 'param1' | 'param2', 'section1' | 'section2'>
type ExtendsMyApi<_T extends MyApi> = true
type _test_base_api_extends_my_api = ExtendsMyApi<OpenApi>
