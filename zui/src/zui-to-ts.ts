import type { Options } from 'json-schema-to-typescript'

/**
 * WARNING: Do not add node-specific libraries outside the below method
 */
export const toTypescriptTypes = async (jsonSchema: any, options?: { schemaName: string } & Options) => {
  const module = await import('json-schema-to-typescript')

  const generatedType = await module.compile(jsonSchema, options?.schemaName ?? 'Schema', {
    bannerComment: '',
    ...options,
  })

  return !options?.schemaName ? generatedType.replace(/export interface Schema /g, '') : generatedType
}
