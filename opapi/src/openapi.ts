import { OpenApiZodAny, extendApi } from '@anatine/zod-openapi'
import { OpenApiBuilder, OperationObject, ReferenceObject } from 'openapi3-ts'
import VError from 'verror'
import { defaultResponseStatus } from './const'
import { generateSchemaFromZod } from './jsonschema'
import { operationBodyTypeGuard } from './operation'
import { ComponentType, getRef, State } from './state'
import { formatBodyName, formatResponseName } from './util'

export const createOpenapi = <
  SchemaName extends string,
  DefaultParameterName extends string,
  SectionName extends string,
  SchemaSectionName extends SectionName
>(
  state: State<SchemaName, DefaultParameterName, SectionName, SchemaSectionName>
) => {
  const { metadata, schemas, operations } = state
  const { description, server, title, version } = metadata

  const openapi = OpenApiBuilder.create({
    openapi: '3.0.0',
    servers: [{ url: server }],
    info: {
      title,
      description,
      version
    },
    paths: {},
    components: {
      schemas: {},
      responses: {},
      requestBodies: {},
      parameters: {}
    }
  })

  Object.entries(schemas).forEach(([schemaName, schemaProps]) => {
    const { schema } = schemaProps as { schema: OpenApiZodAny }
    openapi.addSchema(schemaName, generateSchemaFromZod(schema))
  })

  Object.entries(operations).forEach(([operationName, operationObject]) => {
    const { method, path, response } = operationObject

    const responseName = formatResponseName(operationName)
    const bodyName = formatBodyName(operationName)

    openapi.addResponse(responseName, {
      description: response.description,
      content: {
        'application/json': {
          schema: generateSchemaFromZod(extendApi(response.schema, { title: responseName }))
        }
      }
    })

    const responseRefSchema = generateSchemaFromZod(
      getRef(state, ComponentType.RESPONSES, responseName)
    ) as ReferenceObject

    const operation: OperationObject = {
      operationId: operationName,
      description: operationObject.description,
      parameters: [],
      responses: {
        default: responseRefSchema as ReferenceObject,
        [response.status ?? defaultResponseStatus]: responseRefSchema as ReferenceObject
      }
    }

    if (operationBodyTypeGuard(operationObject)) {
      const requestBody = operationObject.requestBody

      openapi.addRequestBody(bodyName, {
        description: requestBody.description,
        content: {
          'application/json': {
            schema: generateSchemaFromZod(extendApi(requestBody.schema, { title: bodyName }))
          }
        }
      })

      const bodyRefSchema = generateSchemaFromZod(getRef(state, ComponentType.REQUESTS, bodyName)) as ReferenceObject

      operation.requestBody = bodyRefSchema
    }

    if (operationObject.parameters) {
      Object.entries(operationObject.parameters).forEach(([parameterName, parameter]) => {
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
                enum: parameter.enum as string[]
              }
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
                  enum: parameter.enum
                }
              }
            })
            break
          case 'object':
            operation.parameters?.push({
              name: parameterName,
              in: parameter.in,
              description: parameter.description,
              required: parameter.required,
              schema: generateSchemaFromZod(parameter.schema)
            })
            break
          default:
            throw new VError(`Parameter type ${parameterType} is not supported`)
        }
      })
    }

    if (!openapi.rootDoc.paths[path]) {
      openapi.rootDoc.paths[path] = {}
    }

    if (openapi.rootDoc.paths[path][method]) {
      throw new VError(`Operation ${method} ${path} already exists`)
    }

    openapi.rootDoc.paths[path][method] = operation
  })

  return openapi
}
