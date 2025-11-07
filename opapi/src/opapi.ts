import { extendApi, OpenApiZodAny } from '@anatine/zod-openapi'
import {
  generateClientWithOpenapiGenerator,
  generateClientWithOpapi,
  generateErrorsFile,
  generateOpenapi,
  generateServer,
  generateTypesBySection,
} from './generator'
import {
  ApiError,
  ComponentType,
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

export class OpenApi<SchemaName extends string, DefaultParameterName extends string, SectionName extends string> {
  private _state: State<SchemaName, DefaultParameterName, SectionName>

  constructor(props: OpenApiProps<SchemaName, DefaultParameterName, SectionName>, options: Partial<Options> = {}) {
    this._state = new State(props, options)
  }

  getState() {
    return this._state
  }

  getModelRef(name: SchemaName): OpenApiZodAny {
    return this._state.getRef(ComponentType.SCHEMAS, name)
  }

  addOperation<Path extends string>(operation: Operation<DefaultParameterName, SectionName, Path, 'zod-schema'>) {
    this._state.addOperation(operation)
  }

  exportClient(dir: string, options: GenerateClientOptions) {
    if (options.generator === 'openapi-generator') {
      return generateClientWithOpenapiGenerator(this._state, dir, options.endpoint, options.postProcessors)
    }
    if (options.generator === 'opapi') {
      return generateClientWithOpapi(this._state, dir)
    }
    throw new Error('Unknown generator')
  }

  exportTypesBySection(dir = '.') {
    generateTypesBySection(this._state, dir)
  }

  exportServer(dir = '.', useExpressTypes: boolean) {
    generateServer(this._state, dir, useExpressTypes)
  }

  exportOpenapi(dir = '.') {
    generateOpenapi(this._state, dir)
  }

  exportState(dir = '.', options?: ExportStateAsTypescriptOptions) {
    exportStateAsTypescript(this._state, dir, options)
  }

  exportErrors(dir = '.') {
    generateErrorsFile(this._state.errors ?? [], dir)
  }

  exportHandler(dir = '.') {
    generateHandler(this._state, dir)
  }
}

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

export type GenerateClientOptions =
  | {
      generator: 'openapi-generator'
      endpoint: string
      postProcessors?: OpenApiPostProcessors
    }
  | {
      generator: 'opapi'
    }

export type SchemaOf<O extends OpenApi<any, any, any>> =
  O extends OpenApi<infer Skema, infer _Param, infer _Sexion> ? Skema : never

export type ParameterOf<O extends OpenApi<any, any, any>> =
  O extends OpenApi<infer _Skema, infer Param, infer _Sexion> ? Param : never

export type SectionOf<O extends OpenApi<any, any, any>> =
  O extends OpenApi<infer _Skema, infer _Param, infer Sexion> ? Sexion : never

export { exportJsonSchemas, exportZodSchemas } from './handler-generator/export-schemas'
