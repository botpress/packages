import { extendApi, OpenApiZodAny } from '@anatine/zod-openapi'
import {
  generateClientWithOpenapiGenerator,
  generateClientWithOpapi,
  generateErrorsFile,
  generateOpenapi,
  generateServer,
  generateTypesBySection,
} from './generator'
import { addOperation } from './operation'
import {
  ApiError,
  ComponentType,
  createState,
  getRef,
  Metadata,
  Operation,
  Options,
  Parameter,
  State,
  Security,
} from './state'
import { exportStateAsTypescript, ExportStateAsTypescriptOptions } from './generators/ts-state'
import { generateHandler } from './handler-generator'
export { Operation, Parameter } from './state'

type AnatineSchemaObject = NonNullable<Parameters<typeof extendApi>[1]>

export const schema = <T extends OpenApiZodAny>(
  schema: T,
  schemaObject?: AnatineSchemaObject & { $ref?: string },
): T => {
  const This = (schema as any).constructor
  const copy = new This(schema._def) as T
  return extendApi(copy, schemaObject)
}

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
  // add security schemes
  security?: Security[]
}

export type CodePostProcessor = (code: string) => Promise<string> | string

export type OpenApiPostProcessors = {
  apiCode: CodePostProcessor
}

export type GenerateClientProps = (
  | {
      generator: 'openapi-generator'
      endpoint: string
      postProcessors?: OpenApiPostProcessors
    }
  | {
      generator: 'opapi'
    }
) &
  ExportStateOptions

type ExportStateOptions = Partial<{
  ignoreDefaultParameters: boolean
  ignoreSecurity: boolean
}>

const applyExportOptions = <SchemaName extends string, DefaultParameterName extends string, SectionName extends string>(
  state: State<SchemaName, DefaultParameterName, SectionName>,
  options?: ExportStateOptions,
) => {
  if (options?.ignoreDefaultParameters && state.defaultParameters) {
    const defaultParametersName = Object.keys(state.defaultParameters)
    for (const operationId of Object.keys(state.operations)) {
      if (!state.operations[operationId]?.parameters) {
        continue
      }
      state.operations[operationId].parameters = Object.fromEntries(
        Object.entries(state.operations[operationId].parameters).filter(
          ([parameterName]) => !defaultParametersName.includes(parameterName),
        ),
      )
    }
  }
  if (options?.ignoreSecurity) {
    delete state.security
    for (const operationId of Object.keys(state.operations)) {
      delete state.operations[operationId]?.security
    }
  }
  return state
}

function exportClient(state: State<string, string, string>) {
  function _exportClient(dir: string, props: GenerateClientProps): Promise<void>
  function _exportClient(
    dir: string,
    openapiGeneratorEndpoint: string,
    props?: OpenApiPostProcessors & ExportStateOptions,
  ): Promise<void>
  function _exportClient(
    dir = '.',
    propsOrEndpoint: GenerateClientProps | string,
    postProcessorsOrStateOpts?: OpenApiPostProcessors & ExportStateOptions,
  ) {
    let options: GenerateClientProps
    if (typeof propsOrEndpoint === 'string') {
      options = { generator: 'openapi-generator', endpoint: propsOrEndpoint, postProcessors: postProcessorsOrStateOpts }
    } else {
      options = propsOrEndpoint
    }

    state = applyExportOptions(state, postProcessorsOrStateOpts)

    if (options.generator === 'openapi-generator') {
      return generateClientWithOpenapiGenerator(state, dir, options.endpoint, options.postProcessors)
    }
    if (options.generator === 'opapi') {
      return generateClientWithOpapi(state, dir)
    }
    throw new Error('Unknown generator')
  }
  return _exportClient
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
    exportClient: exportClient(state),
    exportTypesBySection: (dir = '.', opts?: ExportStateOptions) =>
      generateTypesBySection(applyExportOptions(state, opts), dir),
    exportServer: (dir = '.', useExpressTypes: boolean, opts?: ExportStateOptions) =>
      generateServer(applyExportOptions(state, opts), dir, useExpressTypes),
    exportOpenapi: (dir = '.', opts?: ExportStateOptions) => generateOpenapi(applyExportOptions(state, opts), dir),
    exportState: (dir = '.', opts?: ExportStateAsTypescriptOptions & ExportStateOptions) =>
      exportStateAsTypescript(applyExportOptions(state, opts), dir, opts),
    exportErrors: (dir = '.') => generateErrorsFile(state.errors ?? [], dir),
    exportHandler: (dir = '.', opts?: ExportStateOptions) => generateHandler(applyExportOptions(state, opts), dir),
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

export { exportJsonSchemas, exportZodSchemas } from './handler-generator/export-schemas'
