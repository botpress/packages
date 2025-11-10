import { extendApi, OpenApiZodAny } from '@anatine/zod-openapi'
import {
  generateClientWithOpenapiGenerator,
  generateClientWithOpapi,
  generateErrorsFile,
  generateOpenapi,
  generateServer,
  generateTypesBySection,
} from './generator'
import { ComponentType, Operation, Options, State, CreateStateProps, cloneState, getRef, createState } from './state'
import { exportStateAsTypescript, ExportStateAsTypescriptOptions } from './generators/ts-state'
import { generateHandler } from './handler-generator'
import { applyExportOptions, ExportStateOptions } from './export-options'
import { addOperation } from './operation'
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

  constructor(props: CreateStateProps<SchemaName, DefaultParameterName, SectionName>, options: Partial<Options> = {}) {
    this._state = createState(props, options)
  }

  static fromState<SchemaName extends string, DefaultParameterName extends string, SectionName extends string>(
    state: State<SchemaName, DefaultParameterName, SectionName>,
  ) {
    const openapi = new OpenApi({ metadata: state.metadata })
    openapi._state = state
    return openapi
  }

  getState() {
    return cloneState(this._state)
  }

  getModelRef(name: SchemaName): OpenApiZodAny {
    return getRef(this._state, ComponentType.SCHEMAS, name)
  }

  addOperation<Path extends string>(operation: Operation<DefaultParameterName, SectionName, Path, 'zod-schema'>) {
    addOperation(this._state, operation)
  }

  exportClient(dir: string, options: GenerateClientOptions & ExportStateOptions) {
    if (options.generator === 'openapi-generator') {
      return generateClientWithOpenapiGenerator(
        applyExportOptions(this._state, options),
        dir,
        options.endpoint,
        options.postProcessors,
      )
    }
    if (options.generator === 'opapi') {
      return generateClientWithOpapi(applyExportOptions(this._state, options), dir)
    }
    throw new Error('Unknown generator')
  }

  exportTypesBySection(dir = '.', options?: ExportStateOptions) {
    return generateTypesBySection(applyExportOptions(this._state, options), dir)
  }

  exportServer(dir = '.', useExpressTypes: boolean, options?: ExportStateOptions) {
    return generateServer(applyExportOptions(this._state, options), dir, useExpressTypes)
  }

  exportOpenapi(dir = '.', options?: ExportStateOptions) {
    return generateOpenapi(applyExportOptions(this._state, options), dir)
  }

  exportState(dir = '.', options?: ExportStateAsTypescriptOptions & ExportStateOptions) {
    return exportStateAsTypescript(applyExportOptions(this._state, options), dir, options)
  }

  exportErrors(dir = '.') {
    return generateErrorsFile(this._state.errors ?? [], dir)
  }

  exportHandler(dir = '.', options?: ExportStateOptions) {
    return generateHandler(applyExportOptions(this._state, options), dir)
  }
}

export type CodePostProcessor = (code: string) => Promise<string> | string

export type OpenApiPostProcessors = {
  apiCode: CodePostProcessor
}

export type GenerateClientOptions = (
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

export type SchemaOf<O extends OpenApi<any, any, any>> =
  O extends OpenApi<infer Skema, infer _Param, infer _Sexion> ? Skema : never

export type ParameterOf<O extends OpenApi<any, any, any>> =
  O extends OpenApi<infer _Skema, infer Param, infer _Sexion> ? Param : never

export type SectionOf<O extends OpenApi<any, any, any>> =
  O extends OpenApi<infer _Skema, infer _Param, infer Sexion> ? Sexion : never

export { exportJsonSchemas, exportZodSchemas } from './handler-generator/export-schemas'
