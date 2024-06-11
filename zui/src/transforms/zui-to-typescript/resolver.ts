import $RefParser from './refparser'
import { JSONSchema } from './types/JSONSchema';
// import { type ParserOptions } from './refparser'
import { log } from './utils'

export type DereferencedPaths = WeakMap<JSONSchema, string>

export function dereference(
  schema: JSONSchema,
  { cwd, $refOptions }: { cwd: string; $refOptions: $RefParser.Options },
): { dereferencedPaths: DereferencedPaths; dereferencedSchema: JSONSchema } {
  log('green', 'dereferencer', 'Dereferencing input schema:', cwd, schema)
  if (typeof process === 'undefined') {
    throw new Error('process is not defined')
  }
  // const parser = new $RefParser()
  const dereferencedPaths: DereferencedPaths = new WeakMap()
  const dereferencedSchema = schema
  // const dereferencedSchema = parser.dereference(cwd, schema as any, {
  //   ...$refOptions,
  //   dereference: {
  //     ...$refOptions.dereference,
  //     onDereference($ref, schema) {
  //       dereferencedPaths.set(schema, $ref)
  //     }
  //   }
  // })
  return { dereferencedPaths, dereferencedSchema }
}
