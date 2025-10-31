import { OpenApiBuilder, OperationObject, ReferenceObject } from 'openapi3-ts'
import VError from 'verror'
import { defaultResponseStatus } from './const'
import { generateSchemaFromZod } from './jsonschema'
import { objects } from './objects'
import { ComponentType, Security, Operation, State, getRef, isOperationWithBodyProps, Tags } from './state'
import { formatBodyName, formatResponseName } from './util'

const TAG_EXCLUDED = 'x-excluded'
const TAG_EXPERIMENTAL = 'x-experimental'

export const createOpenapi = <
  SchemaName extends string,
  DefaultParameterName extends string,
  SectionName extends string,
>(
  state: State<SchemaName, DefaultParameterName, SectionName>,
) => {
  const { metadata, schemas, operations, security } = state
  const { description, server, title, version } = metadata

  const securitySchemes: Set<Security> = new Set()
  security?.forEach((name) => securitySchemes.add(name))

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
      securitySchemes: {},
    },
    security: security ? [Object.fromEntries(security.map((name) => [name, []]))] : undefined,
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

    operationObject.security?.forEach((name) => securitySchemes.add(name))

    const operation: OperationObject = {
      [TAG_EXCLUDED]: !isOperationIncluded(operationObject, state.options?.filterOperationsByTags ?? {}),
      [TAG_EXPERIMENTAL]: operationObject.tags?.experimental,
      deprecated: operationObject.tags?.deprecated,
      operationId: operationName,
      description: operationObject.description,
      parameters: [],
      security: operationObject.security
        ? [Object.fromEntries(operationObject.security.map((name) => [name, []]))]
        : undefined,
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

  if (securitySchemes.has('BearerAuth')) {
    openapi.addSecurityScheme('BearerAuth', {
      type: 'http',
      scheme: 'bearer',
    })
  }
  if (securitySchemes.has('BasicAuth')) {
    openapi.addSecurityScheme('BasicAuth', {
      type: 'http',
      scheme: 'basic',
    })
  }

  return openapi
}

const isOperationIncluded = <SchemaName extends string, DefaultParameterName extends string>(
  operation: Operation<DefaultParameterName, SchemaName, string, 'json-schema'>,
  filterTags: Tags,
) => {
  const includedByDocumentation = (filterTags.documented && operation.tags?.documented) || !filterTags.documented
  const includedByExperimental = (filterTags.experimental && operation.tags?.experimental) || !filterTags.experimental
  const includedByDeprecated = (filterTags.deprecated && operation.tags?.deprecated) || !filterTags.deprecated
  return includedByDocumentation && includedByDeprecated && includedByExperimental
}
