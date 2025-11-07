import type { SchemaObject } from 'openapi3-ts'
import { VError } from 'verror'
import { z } from 'zod'
import { OpenApiProps, schema } from './opapi'
import type { PathParams } from './path-params'
import { isAlphanumeric, isCapitalAlphabetical, uniqueBy } from './util'
import { generateSchemaFromZod } from './jsonschema'
import { OpenApiZodAny } from '@anatine/zod-openapi'
import { objects } from './objects'
import { addOperation } from './operation'

type SchemaType = 'zod-schema' | 'json-schema'
type SchemaOfType<T extends SchemaType> = T extends 'zod-schema' ? OpenApiZodAny : SchemaObject

export type Options = { allowUnions: boolean }
const DEFAULT_OPTIONS: Options = { allowUnions: false }

export class State<SchemaName extends string, DefaultParameterName extends string, SectionName extends string> {
  metadata: Metadata
  refs: RefMap
  defaultParameters?: { [name in DefaultParameterName]: Parameter<'json-schema'> }
  sections: Section<SectionName>[]
  schemas: Record<SchemaName, { schema: SchemaObject; section: SectionName }>
  errors?: ApiError[]
  operations: { [name: string]: Operation<DefaultParameterName, SectionName, string, 'json-schema'> } = {}
  options?: Options
  security?: Security[]

  constructor(props: OpenApiProps<SchemaName, DefaultParameterName, SectionName>, opts: Partial<Options> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...opts }

    const schemaEntries = props.schemas
      ? Object.entries<(typeof props.schemas)[SchemaName]>(props.schemas).map(([name, data]) => ({
          name,
          schema: data.schema,
          section: data.section,
        }))
      : []

    this.refs = {
      parameters: {},
      requestBodies: {},
      responses: {},
      schemas: {},
    }

    this.sections = props.sections
      ? objects.entries(props.sections).map(([name, section]) => ({
          ...section,
          name,
          operations: [],
          schema: schemaEntries.find((schemaEntry) => schemaEntry.section === name)?.name,
        }))
      : []

    const schemas: Record<string, { schema: SchemaObject; section: SectionName }> = {}
    schemaEntries.forEach((schemaEntry) => {
      const name = schemaEntry.name

      if (!isAlphanumeric(name)) {
        throw new VError(`Invalid operation name ${name}. It must be alphanumeric and start with a letter`)
      }

      if (schemas[name]) {
        throw new VError(`Schema ${name} already exists`)
      }

      schemas[name] = {
        section: schemaEntry.section,
        schema: generateSchemaFromZod(schemaEntry.schema, this.options),
      }
      this.refs.schemas[name] = true
    })

    this.schemas = schemas

    const userErrors = props.errors ?? []
    const defaultErrors = [unknownError, internalError]
    this.errors = uniqueBy([...defaultErrors, ...userErrors], 'type')

    this.errors.forEach((error) => {
      if (!isCapitalAlphabetical(error.type)) {
        throw new VError(`Invalid error type ${error.type}. It must be alphabetical and start with a capital letter`)
      }

      if (error.description.includes('\n')) {
        throw new VError(`Error ${error.type} description must not contain new lines`)
      }

      if (error.description.includes("\\'")) {
        throw new VError(`Error ${error.type} description must not contain single quotes`)
      }
    })

    this.defaultParameters = props.defaultParameters
      ? (objects.mapValues(props.defaultParameters, mapParameter) satisfies Record<
          DefaultParameterName,
          Parameter<'json-schema'>
        >)
      : undefined

    this.metadata = props.metadata
    this.security = props.security
  }

  addOperation<Path extends string>(operation: Operation<DefaultParameterName, SectionName, Path, 'zod-schema'>) {
    addOperation(this, operation)
  }

  getRef(type: ComponentType, name: string): OpenApiZodAny {
    if (!this.refs[type][name]) {
      throw new VError(`${type} ${name} does not exist`)
    }

    return schema(z.object({}), {
      type: undefined,
      properties: undefined,
      required: undefined,
      $ref: `#/components/${type}/${name}`,
    })
  }
}

const unknownError: ApiError = {
  status: 500,
  type: 'Unknown',
  description: 'An unknown error occurred',
}

const internalError: ApiError = {
  status: 500,
  type: 'Internal',
  description: 'An internal error occurred',
}

export type Security = 'BearerAuth' | 'BasicAuth'

export type ApiError = {
  status: 400 | 401 | 402 | 403 | 404 | 405 | 408 | 409 | 410 | 413 | 415 | 424 | 429 | 500 | 501 | 502 | 503 | 504
  type: string
  description: string
}

export type Section<SectionName extends string> = {
  name: SectionName
  title: string
  description: string
  schema?: string
  operations: string[]
}

export type Metadata = {
  // Server url endpoint of the api
  server: string
  // Title of the api
  title: string
  // Version of the api
  version: string
  // Description of the api
  description: string
  // Prefix of the api
  prefix?: string
}

type RefMap = { [name in ComponentType]: { [name: string]: boolean } }

type BaseParameter = {
  description: string
}

export type PathParameter = BaseParameter & {
  type: 'string'
  in: 'path'
  enum?: string[]
}

export type StandardParameter = BaseParameter & {
  type: 'string'
  required?: boolean
  enum?: string[] | readonly string[]
  in: 'query' | 'header' | 'cookie'
}

export type BooleanParameter = BaseParameter & {
  type: 'boolean'
  required?: boolean
  in: 'query' | 'header' | 'cookie'
}

export type IntegerParameter = BaseParameter & {
  type: 'integer'
  required?: boolean
  in: 'query' | 'header' | 'cookie'
}

export type NumberParameter = BaseParameter & {
  type: 'number'
  required?: boolean
  in: 'query' | 'header' | 'cookie'
}

export type QueryParameterStringArray = BaseParameter & {
  type: 'string[]'
  required?: boolean
  enum?: string[]
  in: 'query'
}

export type QueryParameterObject<S extends SchemaType = 'zod-schema'> = BaseParameter & {
  type: 'object'
  in: 'query'
  required?: boolean
  schema: SchemaOfType<S>
}

export type Parameter<S extends SchemaType = 'zod-schema'> =
  | StandardParameter
  | BooleanParameter
  | IntegerParameter
  | NumberParameter
  | PathParameter
  | QueryParameterStringArray
  | QueryParameterObject<S>

export const operationsWithBodyMethod = ['post', 'put', 'patch'] as const
type OperationsWithBodyMethod = (typeof operationsWithBodyMethod)[number]

export type OperationWithBodyProps<
  DefaultParameterName extends string,
  SectionName extends string,
  Path extends string = string,
  S extends SchemaType = 'zod-schema',
> = {
  // Method of the operation
  method: OperationsWithBodyMethod

  // Request body of the operation
  requestBody: {
    description: string
    schema: SchemaOfType<S>
    format?: 'binary'
  }
  contentType?: 'application/json' | '*/*'
} & BaseOperationProps<DefaultParameterName, SectionName, Path, S>

export const operationsWithoutBodyMethod = ['get', 'delete', 'options', 'head', 'trace'] as const
export type OperationWithoutBodyMethod = (typeof operationsWithoutBodyMethod)[number]
export type OperationWithoutBodyProps<
  DefaultParameterName extends string,
  SectionName extends string,
  Path extends string = string,
  S extends SchemaType = 'zod-schema',
> = {
  // Method of the operation
  method: OperationWithoutBodyMethod
} & BaseOperationProps<DefaultParameterName, SectionName, Path, S>

export type Operation<
  DefaultParameterName extends string,
  SectionName extends string,
  Path extends string = string,
  S extends SchemaType = 'zod-schema',
> =
  | OperationWithBodyProps<DefaultParameterName, SectionName, Path, S>
  | OperationWithoutBodyProps<DefaultParameterName, SectionName, Path, S>

export function isOperationWithBodyProps<
  DefaultParameterName extends string,
  SectionName extends string,
  Path extends string,
  TypeOfSchema extends SchemaType = 'json-schema',
>(
  operation: Operation<DefaultParameterName, SectionName, Path, TypeOfSchema>,
): operation is OperationWithBodyProps<DefaultParameterName, SectionName, Path, TypeOfSchema> {
  if ((operationsWithBodyMethod as any as string[]).includes(operation.method)) {
    return true
  } else return false
}

export enum ComponentType {
  SCHEMAS = 'schemas',
  RESPONSES = 'responses',
  REQUESTS = 'requestBodies',
  PARAMETERS = 'parameters',
}

export type ParametersMap<Path extends string = string, S extends SchemaType = 'zod-schema'> = Record<
  PathParams<Path>,
  PathParameter
> &
  Record<string, Parameter<S>> // flexible enough to allow bypassing type strictness

type BaseOperationProps<
  DefaultParameterName extends string,
  SectionName extends string,
  Path extends string = string,
  S extends SchemaType = 'zod-schema',
> = {
  // Name of the operation
  name: string
  // Path of the operation
  path: Path
  // Description of the operation
  description: string
  // additional parameters from the headers, cookies, query or path
  parameters?: ParametersMap<Path, S>
  disableDefaultParameters?: {
    [name in DefaultParameterName]?: boolean
  }
  section?: SectionName
  // Security of the operation
  security?: Security[]
  // Response body of the operation
  response: {
    // Status code of the response
    // Default is 200
    status?: 200 | 201 | 418 | 302
    description: string
    schema: SchemaOfType<S>
    format?: 'binary'
  }
  // Tags of the operation
  tags?: string[]
  // If an operation is deprecated
  deprecated?: boolean
}

export const mapParameter = (param: Parameter<'zod-schema'>): Parameter<'json-schema'> => {
  if ('schema' in param) {
    return {
      ...param,
      schema: generateSchemaFromZod(param.schema),
    }
  }
  return param
}
