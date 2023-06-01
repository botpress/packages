export namespace objects {
  export const entries = <K extends string, V>(obj: Record<K, V>): [K, V][] => Object.entries(obj) as [K, V][]
  export const mapValues = <K extends string, V, R>(obj: Record<K, V>, fn: (value: V, key: K) => R): Record<K, R> => {
    const result: Record<K, R> = {} as any
    entries(obj).forEach(([key, value]) => {
      result[key] = fn(value, key)
    })
    return result
  }
}
