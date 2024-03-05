import { generateSchema } from '@anatine/zod-openapi'
import _ from 'lodash'
import {
  OpenApiBuilder,
  InfoObject,
  PathObject,
  OperationObject,
  ParameterObject,
  SchemaObject,
  RequestBodyObject,
  ResponseObject
} from 'openapi3-ts'
import { getPathVariables, mapPathFromExpressToOpenAPI } from './parse-path'
import { CustomInfo } from './router'
import { AnyEndpoint, ZodTypeWithMeta } from './typings'

const OPENAPI_VERSION = '3.0.0'

type PathItemObject = ReturnType<typeof pathItemObject>

const pathParameterObject = (p: string): ParameterObject => {
  const schema: SchemaObject = { type: 'string' }
  return {
    name: p,
    in: 'path',
    schema,
    required: true
  }
}

const headerParameterObject = (p: string, optional: boolean): ParameterObject => {
  const schema: SchemaObject = { type: 'string' }
  return {
    name: p,
    in: 'header',
    schema,
    required: !optional
  }
}

/** When building the schema, if there is a title, we build it as a reference instead */
const buildSchema = (item: ZodTypeWithMeta, schemaRefs: Record<string, SchemaObject>) => {
  const title = (item?.metaOpenApi as any)?.title

  if (!title) {
    return { ...generateSchema(item), nullable: false }
  } else {
    schemaRefs[title] = generateSchema(item)
    return { $ref: `#/components/schemas/${title}`, nullable: false }
  }
}

const operationObject = (
  { operationId, input, output, deprecated }: AnyEndpoint,
  schemas: Record<string, SchemaObject>
): OperationObject => {
  const requestBody: RequestBodyObject | undefined = input && {
    content: {
      'application/json': {
        schema: buildSchema(input, schemas)
      }
    },
    required: true
  }

  const responseBody: ResponseObject | undefined = output && {
    description: '',
    content: {
      'application/json': {
        schema: buildSchema(output, schemas)
      }
    }
  }

  return {
    operationId,
    deprecated,
    requestBody,
    responses: {
      default: responseBody
    }
  }
}

const pathItemObject = (endpoint: AnyEndpoint, schemas: Record<string, SchemaObject>) => {
  const { path, method, headers } = endpoint

  const pathParams = getPathVariables(path).map(pathParameterObject)
  const headerParams = _.entries(headers).map(([k, v]) => headerParameterObject(k, v.isOptional()))
  return {
    parameters: [...pathParams, ...headerParams],
    [method]: operationObject(endpoint, schemas)
  }
}

export const generateOpenAPI = (endpoints: AnyEndpoint[], info: CustomInfo) => {
  const paths: Record<string, PathItemObject> = {}
  const schemas: Record<string, SchemaObject> = {}

  if (info.schemas) {
    Object.entries(info.schemas).forEach(([name, schema]) => {
      schemas[name] = generateSchema(schema)
    })
  }

  for (const e of endpoints) {
    const { path: rawPath } = e
    const path = mapPathFromExpressToOpenAPI(rawPath)
    const pathItem = pathItemObject(e, schemas)

    if (paths[path]) {
      // multiple methods on same path
      paths[path] = { ...paths[path], ...pathItem } // TODO: maybe merge paramaters ?
    } else {
      paths[path] = pathItem
    }
  }

  return OpenApiBuilder.create({
    info: _.omit(info, 'schemas') as InfoObject,
    openapi: OPENAPI_VERSION,
    paths,
    components: { schemas }
  })
}
