import { extendApi, OpenApiZodAny } from '@anatine/zod-openapi'
import {
  generateClient,
  generateErrorsFile,
  generateOpenapi,
  generateServer,
  generateTypesBySection,
} from './generator'
import { addOperation } from './operation'
import { ApiError, ComponentType, createState, getRef, Metadata, Operation, Options, Parameter, State } from './state'
import { exportStateAsTypescript, ExportStateAsTypescriptOptions } from './generators/ts-state'
import { generateIntegrationHandler } from './integration-generator'
export { Operation, Parameter } from './state'

type ExtendApi = typeof extendApi
type AnatineSchemaObject = NonNullable<Parameters<ExtendApi>[1]>

export const schema: <T extends OpenApiZodAny>(schema: T, schemaObject?: AnatineSchemaObject & { $ref?: string }) => T =
  extendApi

export type OpenApi<
  SchemaName extends string = string,
  DefaultParameterName extends string = string,
  SectionName extends string = string,
> = ReturnType<typeof createOpapiFromState<SchemaName, DefaultParameterName, SectionName>>

// TODO: ensure type inference comes from field 'sections' not 'schemas'
export type OpenApiProps<SchemaName extends string, DefaultParameterName extends string, SectionName extends string> = {
  metadata: Metadata
  // adds default parameters to all operations
  defaultParameters?: Record<DefaultParameterName, Parameter<'zod-schema'>>
  // adds the openapi schemas
  schemas?: Record<SchemaName, { schema: OpenApiZodAny; section: SectionName }>
  // adds the openapi tags
  sections?: Record<SectionName, { title: string; description: string }>
  // add the openapi errors
  errors?: readonly ApiError[]
}

export type CodePostProcessor = (code: string) => Promise<string> | string

export type OpenApiPostProcessors = {
  apiCode: CodePostProcessor
}

const createOpapiFromState = <
  SchemaName extends string,
  DefaultParameterName extends string,
  SectionName extends string,
>(
  state: State<SchemaName, DefaultParameterName, SectionName>,
) => {
  return {
    getModelRef: (name: SchemaName): OpenApiZodAny => getRef(state, ComponentType.SCHEMAS, name),
    addOperation: <Path extends string>(
      operationProps: Operation<DefaultParameterName, SectionName, Path, 'zod-schema'>,
    ) => addOperation(state, operationProps),
    exportClient: (dir = '.', openapiGeneratorEndpoint: string, postProcessors?: OpenApiPostProcessors) =>
      generateClient(state, dir, openapiGeneratorEndpoint, postProcessors),
    exportTypesBySection: (dir = '.') => generateTypesBySection(state, dir),
    exportServer: (dir = '.', useExpressTypes: boolean) => generateServer(state, dir, useExpressTypes),
    exportOpenapi: (dir = '.') => generateOpenapi(state, dir),
    exportState: (dir = '.', opts?: ExportStateAsTypescriptOptions) => exportStateAsTypescript(state, dir, opts),
    exportErrors: (dir = '.') => generateErrorsFile(state.errors ?? [], dir),
    exportIntegrationHandler: (dir = '.') => generateIntegrationHandler(state, dir),
  }
}

export function OpenApi<SchemaName extends string, DefaultParameterName extends string, SectionName extends string>(
  props: OpenApiProps<SchemaName, DefaultParameterName, SectionName>,
  opts: Partial<Options> = {},
) {
  const state = createState(props, opts)
  return createOpapiFromState(state)
}

export namespace OpenApi {
  export const fromState = <SchemaName extends string, DefaultParameterName extends string, SectionName extends string>(
    state: State<SchemaName, DefaultParameterName, SectionName>,
  ) => createOpapiFromState(state as State<SchemaName, DefaultParameterName, SectionName>)
}

export type SchemaOf<O extends OpenApi<any, any, any>> =
  O extends OpenApi<infer Skema, infer _Param, infer _Sexion> ? Skema : never

export type ParameterOf<O extends OpenApi<any, any, any>> =
  O extends OpenApi<infer _Skema, infer Param, infer _Sexion> ? Param : never

export type SectionOf<O extends OpenApi<any, any, any>> =
  O extends OpenApi<infer _Skema, infer _Param, infer Sexion> ? Sexion : never
