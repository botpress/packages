import { escapeString } from '../zui-to-typescript-type/utils'

export const toTypesriptPrimitive = (primitive: string | number | boolean | null): string => {
  if (typeof primitive === 'string') {
    return escapeString(primitive)
  }
  return `${primitive}`
}

export const mapValues = <K extends string, V1, V2>(
  map: Record<K, V1>,
  fn: (value: V1, key: K) => V2,
): Record<K, V2> => {
  const result: Record<K, V2> = {} as any
  for (const key in map) {
    result[key] = fn(map[key], key)
  }
  return result
}
