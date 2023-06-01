import type { SchemaObject } from 'openapi3-ts'
import { VError } from 'verror'
import { ZodTypeAny, z } from 'zod'
import { schema } from './opapi'
import type { PathParams } from './path-params'
import { isAlphanumeric, isCapitalAlphabetical } from './util'
import { generateSchemaFromZod } from './jsonschema'

type MaybeZod = ZodTypeAny | SchemaObject

export type State<SchemaName extends string, DefaultParameterName extends string, SectionName extends string> = {
  metadata: Metadata
  refs: RefMap
  defaultParameters?: { [name in DefaultParameterName]: Parameter }
  sections: {
    name: SectionName
    title: string
    description: string
    schema?: string
    operations: string[]
  }[]
  schemas: Record<SchemaName, { schema: SchemaObject; section: SectionName }>
  errors?: ApiError[]
  operations: { [name: string]: Operation<DefaultParameterName, SectionName, string, SchemaObject> }
}

const unknownError: ApiError = {
  status: 500,
  type: 'Unknown',
  description: 'An unknown error occurred'
}

const internalError: ApiError = {
  status: 500,
  type: 'Internal',
  description: 'An internal error occurred'
}

export type ApiError = {
  status: 400 | 401 | 402 | 403 | 404 | 405 | 408 | 409 | 413 | 415 | 429 | 500 | 501 | 502 | 503 | 504
  type: string
  description: string
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

export type QueryParameterStringArray = BaseParameter & {
  type: 'string[]'
  required?: boolean
  enum?: string[]
  in: 'query'
}

export type QueryParameterObject = BaseParameter & {
  type: 'object'
  in: 'query'
  required?: boolean
  schema: SchemaObject
}

export type Parameter = StandardParameter | PathParameter | QueryParameterObject | QueryParameterStringArray

export type OperationWithBodyProps<
  DefaultParameterName extends string,
  SectionName extends string,
  Path extends string,
  Schema extends MaybeZod
> = {
  // Method of the operation
  method: 'post' | 'put' | 'patch'

  // Request body of the operation
  requestBody: {
    description: string
    schema: SchemaObject
  }
} & BaseOperationProps<DefaultParameterName, SectionName, Path, Schema>

export type OperationWithoutBodyProps<
  DefaultParameterName extends string,
  SectionName extends string,
  Path extends string,
  Schema extends MaybeZod
> = {
  // Method of the operation
  method: 'get' | 'delete' | 'options' | 'head' | 'trace'
} & BaseOperationProps<DefaultParameterName, SectionName, Path, Schema>

export type Operation<
  DefaultParameterName extends string,
  SectionName extends string,
  Path extends string,
  Schema extends MaybeZod
> =
  | OperationWithBodyProps<DefaultParameterName, SectionName, Path, Schema>
  | OperationWithoutBodyProps<DefaultParameterName, SectionName, Path, Schema>

export enum ComponentType {
  SCHEMAS = 'schemas',
  RESPONSES = 'responses',
  REQUESTS = 'requestBodies',
  PARAMETERS = 'parameters'
}

export type ParametersMap<Path extends string = string> = Record<PathParams<Path>, PathParameter> &
  Record<string, Parameter> // flexible enough to allow bypassing type strictness

type BaseOperationProps<
  DefaultParameterName extends string,
  SectionName extends string,
  Path extends string,
  Schema extends MaybeZod
> = {
  // Name of the operation
  name: string
  // Path of the operation
  path: Path
  // Description of the operation
  description: string
  // additional parameters from the headers, cookies, query or path
  parameters?: ParametersMap<Path>
  disableDefaultParameters?: {
    [name in DefaultParameterName]?: boolean
  }
  section?: SectionName
  // Response body of the operation
  response: {
    // Status code of the response
    // Default is 200
    status?: 200 | 201 | 418
    description: string
    schema: Schema
  }
}

type CreateStateProps<SchemaName extends string, DefaultParameterName extends string, SectionName extends string> = {
  metadata: Metadata
  defaultParameters?: Record<DefaultParameterName, Parameter>
  schemas?: Record<SchemaName, { schema: ZodTypeAny; section: SectionName }>
  sections?: Record<SectionName, { title: string; description: string }>
  errors?: readonly ApiError[]
}

export function createState<SchemaName extends string, DefaultParameterName extends string, SectionName extends string>(
  props: CreateStateProps<SchemaName, DefaultParameterName, SectionName>
): State<SchemaName, DefaultParameterName, SectionName> {
  const schemaEntries = props.schemas
    ? Object.entries<(typeof props.schemas)[SchemaName]>(props.schemas).map(([name, data]) => ({
        name,
        schema: data.schema,
        section: data.section
      }))
    : []

  const schemas: Record<string, { schema: SchemaObject; section: SectionName }> = {}

  const refs: State<SchemaName, DefaultParameterName, SectionName>['refs'] = {
    parameters: {},
    requestBodies: {},
    responses: {},
    schemas: {}
  }

  const toPairs = <K extends string, T>(obj: Record<K, T>): [K, T][] => Object.entries(obj) as [K, T][]

  const sections = props.sections
    ? toPairs(props.sections).map(([name, section]) => ({
        ...section,
        name,
        operations: [],
        schema: schemaEntries.find((schemaEntry) => schemaEntry.section === name)?.name
      }))
    : []

  schemaEntries.forEach((schemaEntry) => {
    const name = schemaEntry.name

    if (!isAlphanumeric(name)) {
      throw new VError(`Invalid operation name ${name}. It must be alphanumeric and start with a letter`)
    }

    if (schemas[name]) {
      throw new VError(`Operation ${name} already exists`)
    }

    schemas[name] = {
      section: schemaEntry.section,
      schema: generateSchemaFromZod(schemaEntry.schema)
    }
    refs.schemas[name] = true
  })

  const errors = [unknownError, internalError, ...(props.errors ?? [])]

  const existingErrors = new Set<string>()

  errors.forEach((error) => {
    if (existingErrors.has(error.type)) {
      throw new VError(`Error ${error.type} already exists`)
    }

    existingErrors.add(error.type)

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

  return {
    operations: {},
    metadata: props.metadata,
    defaultParameters: props.defaultParameters,
    errors,
    refs,
    schemas,
    sections
  }
}

export function getRef(state: State<string, string, string>, type: ComponentType, name: string): ZodTypeAny {
  if (!state.refs[type][name]) {
    throw new VError(`${type} ${name} does not exist`)
  }

  return schema(z.object({}), {
    type: undefined,
    properties: undefined,
    required: undefined,
    $ref: `#/components/${type}/${name}`
  })
}
