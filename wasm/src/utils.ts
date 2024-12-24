export function mapValues<T extends Record<string, any>, U>(
  obj: T,
  iteratee: (value: T[keyof T], key: keyof T) => U
): Record<keyof T, U> {
  const result: Record<keyof T, U> = {} as Record<keyof T, U>

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = iteratee(obj[key], key)
    }
  }

  return result
}

export function uniq<T>(array: T[]): T[] {
  const seen = new Set<T>()
  const result: T[] = []

  for (const item of array) {
    if (!seen.has(item)) {
      seen.add(item)
      result.push(item)
    }
  }

  return result
}

export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as unknown as T
  }

  const result: any = {}
  for (const key in value) {
    if (value.hasOwnProperty(key)) {
      result[key] = deepClone(value[key])
    }
  }

  return result
}
