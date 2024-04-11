import { OpenApiBuilder, OperationObject, ReferenceObject } from 'openapi3-ts'
import VError from 'verror'
import { defaultResponseStatus } from './const'
import { generateSchemaFromZod } from './jsonschema'
import { objects } from './objects'
import { ComponentType, State, getRef, isOperationWithBodyProps } from './state'
import { formatBodyName, formatResponseName } from './util'

export const createOpenapi = <
  SchemaName extends string,
  DefaultParameterName extends string,
  SectionName extends string,
>(
  state: State<SchemaName, DefaultParameterName, SectionName>,
) => {
  const { metadata, schemas, operations } = state
  const { description, server, title, version } = metadata

  const openapi = OpenApiBuilder.create({
    openapi: '3.0.0',
    servers: [{ url: server }],
    info: {
      title,
      description,
      version,
    },
    paths: {},
    components: {
      schemas: {},
      responses: {},
      requestBodies: {},
      parameters: {},
    },
  })

  objects.entries(schemas).forEach(([schemaName, { schema }]) => {
    openapi.addSchema(schemaName, schema)
  })

  objects.entries(operations).forEach(([operationName, operationObject]) => {
    const { method, path, response } = operationObject

    const responseName = formatResponseName(operationName)
    const bodyName = formatBodyName(operationName)

    openapi.addResponse(responseName, {
      description: response.description,
      content: {
        'application/json': {
          schema: response.schema,
        },
      },
    })

    const responseRefSchema = generateSchemaFromZod(
      getRef(state, ComponentType.RESPONSES, responseName),
    ) as unknown as ReferenceObject

    const operation: OperationObject = {
      operationId: operationName,
      description: operationObject.description,
      parameters: [],
      responses: {
        default: responseRefSchema as ReferenceObject,
        [response.status ?? defaultResponseStatus]: responseRefSchema as ReferenceObject,
      },
    }

    if (isOperationWithBodyProps(operationObject)) {
      const requestBody = operationObject.requestBody
      const contentType = operationObject.contentType ?? 'application/json'

      openapi.addRequestBody(bodyName, {
        description: requestBody.description,
        content: {
          [contentType]: {
            schema: requestBody.schema,
          },
        },
      })

      const bodyRefSchema = generateSchemaFromZod(
        getRef(state, ComponentType.REQUESTS, bodyName),
      ) as unknown as ReferenceObject

      operation.requestBody = bodyRefSchema
    }

    if (operationObject.parameters) {
      objects.entries(operationObject.parameters).forEach(([parameterName, parameter]) => {
        const parameterType = parameter.type

        switch (parameterType) {
          case 'string':
            operation.parameters?.push({
              name: parameterName,
              in: parameter.in,
              description: parameter.description,
              required: parameter.in === 'path' ? true : parameter.required,
              schema: {
                type: 'string',
                enum: parameter.enum as string[],
              },
            })
            break
          case 'string[]':
            operation.parameters?.push({
              name: parameterName,
              in: parameter.in,
              description: parameter.description,
              required: parameter.required,
              schema: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: parameter.enum,
                },
              },
            })
            break
          case 'object':
            operation.parameters?.push({
              name: parameterName,
              in: parameter.in,
              description: parameter.description,
              required: parameter.required,
              schema: parameter.schema,
            })
            break
          case 'boolean':
            operation.parameters?.push({
              name: parameterName,
              in: parameter.in,
              description: parameter.description,
              required: parameter.required,
              schema: {
                type: 'boolean',
              },
            })
            break
          case 'integer':
            operation.parameters?.push({
              name: parameterName,
              in: parameter.in,
              description: parameter.description,
              required: parameter.required,
              schema: {
                type: 'integer',
              },
            })
            break
          case 'number':
            operation.parameters?.push({
              name: parameterName,
              in: parameter.in,
              description: parameter.description,
              required: parameter.required,
              schema: {
                type: 'number',
              },
            })
            break
          default:
            throw new VError(`Parameter type ${parameterType} is not supported`)
        }
      })
    }

    if (!openapi.rootDoc.paths) {
      openapi.rootDoc.paths = {}
    }

    if (!openapi.rootDoc.paths[path]) {
      openapi.rootDoc.paths[path] = {}
    }

    if (openapi.rootDoc.paths[path]?.[method]) {
      throw new VError(`Operation ${method} ${path} already exists`)
    }

    openapi.rootDoc.paths[path]![method] = operation
  })

  return openapi
}
