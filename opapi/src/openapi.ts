import { OpenApiBuilder, OpenAPIObject, OperationObject, ReferenceObject } from 'openapi3-ts/oas31'
import VError from 'verror'
import { defaultResponseStatus } from './const'
import { generateSchemaFromZod } from './jsonschema'
import { objects } from './objects'
import { ComponentType, State, getRef, isOperationWithBodyProps } from './state'
import { formatBodyName, formatResponseName } from './util'

export const createOpenapiFromSpec = (spec: OpenAPIObject) =>
  OpenApiBuilder.create(spec)

const createOpenapiFromState = <
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

    // TODO generateSchemaFromZod returns SchemaObject but we expect a ReferenceObject here
    const responseRefSchema = generateSchemaFromZod(
      getRef(state, ComponentType.RESPONSES, responseName),
    ) as unknown as ReferenceObject

    const operation: OperationObject = {
      operationId: operationName,
      description: operationObject.description,
      parameters: [],
      responses: {
        default: responseRefSchema,
        [response.status ?? defaultResponseStatus]: responseRefSchema,
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

      // TODO we expect this to be a ReferenceObject but generateSchemaFromZod returns SchemaObject only.
      const bodyRefSchema = generateSchemaFromZod(getRef(state, ComponentType.REQUESTS, bodyName))

      // TODO this expects a RequestBodyObject or ReferenceObject but generateSchemaFromZod returns SchemaObject only.
      operation.requestBody = bodyRefSchema as unknown as ReferenceObject
    }

    if (operationObject.parameters && operation.parameters) {
      for (const [parameterName, parameterSpec] of Object.entries(operationObject.parameters)) {
        const parameterType = parameterSpec.type

        const parameter = {
          name: parameterName,
          in: parameterSpec.in,
          description: parameterSpec.description,
        }

        switch (parameterType) {
          case 'string':
            operation.parameters.push({
              ...parameter,
              required: parameterSpec.in === 'path' ? true : parameterSpec.required,
              schema: {
                type: 'string',
                enum: parameterSpec.enum as string[],
              },
            })
            break
          case 'string[]':
            operation.parameters.push({
              ...parameter,
              required: parameterSpec.required,
              schema: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: parameterSpec.enum,
                },
              },
            })
            break
          case 'object':
            operation.parameters.push({
              ...parameter,
              required: parameterSpec.required,
              schema: parameterSpec.schema,
            })
            break
          case 'boolean':
            operation.parameters.push({
              ...parameter,
              required: parameterSpec.required,
              schema: {
                type: 'boolean',
              },
            })
            break
          case 'integer':
            operation.parameters.push({
              ...parameter,
              required: parameterSpec.required,
              schema: {
                type: 'integer',
              },
            })
            break
          case 'number':
            operation.parameters.push({
              ...parameter,
              required: parameterSpec.required,
              schema: {
                type: 'number',
              },
            })
            break
          default:
            throw new VError(`Parameter type ${parameterType} is not supported`)
        }
      }
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

export const createOpenapi = createOpenapiFromState
