import openapiTS, { OpenAPI3 } from 'openapi-typescript'

export const generateOpenapiTypescript = (openapiSpec: OpenAPI3) => {
  return openapiTS(openapiSpec, {
    defaultNonNullable: true,
    exportType: true,
    postTransform(type) {
      return type.replace(' | undefined', '')
    },
  })
}
