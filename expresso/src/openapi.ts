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
  ResponseObject,
} from 'openapi3-ts'
import { getPathVariables, mapPathFromExpressToOpenAPI } from './parse-path'
import { AnyEndpoint } from './typings'

const OPENAPI_VERSION = '3.0.0'

type PathItemObject = ReturnType<typeof pathItemObject>

const pathParameterObject = (p: string): ParameterObject => {
  const schema: SchemaObject = { type: 'string' }
  return {
    name: p,
    in: 'path',
    schema,
    required: true,
  }
}

const headerParameterObject = (p: string, optional: boolean): ParameterObject => {
  const schema: SchemaObject = { type: 'string' }
  return {
    name: p,
    in: 'header',
    schema,
    required: !optional,
  }
}

const operationObject = ({ operationId, input, output }: AnyEndpoint): OperationObject => {
  const requestBody: RequestBodyObject | undefined = input && {
    content: {
      'application/json': {
        schema: { ...generateSchema(input), nullable: false },
      },
    },
    required: true,
  }

  const responseBody: ResponseObject | undefined = output && {
    description: '',
    content: {
      'application/json': {
        schema: { ...generateSchema(output), nullable: false },
      },
    },
  }

  return {
    operationId,
    requestBody,
    responses: {
      default: responseBody,
    },
  }
}

const pathItemObject = (e: AnyEndpoint) => {
  const { path, method, headers } = e

  const pathParams = getPathVariables(path).map(pathParameterObject)
  const headerParams = _.entries(headers).map(([k, v]) => headerParameterObject(k, v.isOptional()))
  return {
    parameters: [...pathParams, ...headerParams],
    [method]: operationObject(e),
  }
}

export const generateOpenAPI = (endpoints: AnyEndpoint[], info: InfoObject): PathObject => {
  const paths: Record<string, PathItemObject> = {}
  for (const e of endpoints) {
    const { path: rawPath } = e
    const path = mapPathFromExpressToOpenAPI(rawPath)
    const pathItem = pathItemObject(e)
    if (paths[path]) {
      // multiple methods on same path
      paths[path] = { ...paths[path], ...pathItem } // TODO: maybe merge paramaters ?
    } else {
      paths[path] = pathItem
    }
  }

  return OpenApiBuilder.create({
    info,
    openapi: OPENAPI_VERSION,
    paths,
  })
}
