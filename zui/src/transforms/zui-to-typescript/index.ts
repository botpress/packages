import type { Options } from 'json-schema-to-typescript'

type ToTypescriptTyingsOptions = { schemaName: string } & Partial<Options>

export type { ToTypescriptTyingsOptions }
/**
 * WARNING: Do not add node-specific libraries outside the below method
 */
export const toTypescriptTypings = async (jsonSchema: any, options?: ToTypescriptTyingsOptions) => {
  const module = await import('json-schema-to-typescript')

  const generatedType = await module.compile(jsonSchema, options?.schemaName ?? 'Schema', {
    bannerComment: '',
    ...options,
  })

  return !options?.schemaName
    ? generatedType.replace('export interface Schema ', '').replace('export type Schema = ', '')
    : generatedType
}
