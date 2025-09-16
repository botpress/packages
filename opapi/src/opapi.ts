import { extendApi, type OpenApiZodAny } from '@anatine/zod-openapi'
import {
  generateClientWithOpapi,
  generateClientWithOpenapiGenerator,
  generateErrorsFile,
  generateOpenapi,
  generateServer,
  generateTypesBySection,
} from './generator'
import { exportStateAsTypescript, type ExportStateAsTypescriptOptions } from './generators/ts-state'
import { generateHandler } from './handler-generator'
import { addOperation } from './operation'
import {
  type ApiError,
  ComponentType,
  createState,
  getRef,
  type Metadata,
  type Operation,
  type Options,
  type Parameter,
  type State,
  type ParametersMap,
  PathParameter,
} from './state'
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
}

export type CodePostProcessor = (code: string) => Promise<string> | string

export type OpenApiPostProcessors = {
  apiCode: CodePostProcessor
}

export type GenerateClientProps =
  | {
      generator: 'openapi-generator'
      endpoint: string
      postProcessors?: OpenApiPostProcessors
    }
  | {
      generator: 'opapi'
    }

function createExportClient(state: State<string, string, string>) {
  function _exportClient(
    dir: string,
    openapiGeneratorEndpoint: string,
    postProcessors?: OpenApiPostProcessors,
  ): Promise<void>
  function _exportClient(dir: string, props: GenerateClientProps): Promise<void>
  function _exportClient(dir = '.', props: GenerateClientProps | string, postProcessors?: OpenApiPostProcessors) {
    let options: GenerateClientProps
    if (typeof props === 'string') {
      options = { generator: 'openapi-generator', endpoint: props, postProcessors }
    } else {
      options = props
    }

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
  type InputItem = {
    type: Parameter<'zod-schema'>['type']
    description: Parameter<'zod-schema'>['description']
  }
  type Inputs = {
    parameters: {
      query: Record<string, InputItem>
    }
    response: Operation<DefaultParameterName, SectionName, string, 'zod-schema'>['response']
  }
  const complexifyParameters = (parameters: Inputs['parameters']): ParametersMap<string, 'zod-schema'> => {
    const map: ParametersMap<string, 'zod-schema'> = {}
    for (const [key, value] of Object.entries(parameters.query)) {
      map[key] = {
        type: value.type,
        description: value.description,
        in: 'query',
      } as any
    }
    return map
  }
  const simp = {
    ops: {
      get: (path: string, name: string, inputs: Inputs) => {
        addOperation(state, {
          name,
          description: name,
          method: 'get',
          path,
          parameters: complexifyParameters(inputs.parameters),
          response: inputs.response,
        })
      },
    },
    dt: {
      boolean: (description: string): InputItem => ({
        type: 'boolean',
        description,
      }),
      integer: (description: string): InputItem => ({
        type: 'integer',
        description,
      }),
      number: (description: string): InputItem => ({
        type: 'number',
        description,
      }),
    },
  } as const

  return {
    getModelRef: (name: SchemaName): OpenApiZodAny => getRef(state, ComponentType.SCHEMAS, name),
    addOperation: <Path extends string>(
      operationProps: Operation<DefaultParameterName, SectionName, Path, 'zod-schema'>,
    ) => addOperation(state, operationProps),
    exportClient: createExportClient(state),
    exportTypesBySection: (dir = '.') => generateTypesBySection(state, dir),
    exportServer: (dir = '.', useExpressTypes: boolean) => generateServer(state, dir, useExpressTypes),
    exportOpenapi: (dir = '.') => generateOpenapi(state, dir),
    exportState: (dir = '.', opts?: ExportStateAsTypescriptOptions) => exportStateAsTypescript(state, dir, opts),
    exportErrors: (dir = '.') => generateErrorsFile(state.errors ?? [], dir),
    exportHandler: (dir = '.') => generateHandler(state, dir),
    simp,
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

export type SchemaOf<O extends OpenApi<any, any, any>> = O extends OpenApi<infer Skema, infer _Param, infer _Sexion>
  ? Skema
  : never

export type ParameterOf<O extends OpenApi<any, any, any>> = O extends OpenApi<infer _Skema, infer Param, infer _Sexion>
  ? Param
  : never

export type SectionOf<O extends OpenApi<any, any, any>> = O extends OpenApi<infer _Skema, infer _Param, infer Sexion>
  ? Sexion
  : never

export { exportJsonSchemas, exportZodSchemas } from './handler-generator/export-schemas'
