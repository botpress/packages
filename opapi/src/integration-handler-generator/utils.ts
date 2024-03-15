export type ValueOf<T> = T[keyof T]

// objects

export const mapValues = <K extends string, V1, V2>(obj: Record<K, V1>, fn: (v: V1, k: K) => V2): Record<K, V2> => {
  const result: Record<K, V2> = {} as Record<K, V2>
  for (const [k, v] of entries(obj)) {
    result[k] = fn(v, k)
  }
  return result
}

export const mapKeys = <K1 extends string, K2 extends string, V>(
  obj: Record<K1, V>,
  fn: (k: K1, v: V) => K2,
): Record<K2, V> => {
  const result: Record<K2, V> = {} as Record<K2, V>
  for (const [k, v] of entries(obj)) {
    const newKey = fn(k, v)
    result[newKey] = v
  }
  return result
}

export const entries = <K extends string, V>(obj: Record<K, V>): [K, V][] => {
  const result: [K, V][] = []
  for (const k in obj) {
    const v = obj[k]
    result.push([k, v])
  }
  return result
}

export const values = <V>(obj: Record<string, V>): V[] => {
  const result: V[] = []
  for (const k in obj) {
    const v = obj[k]!
    result.push(v)
  }
  return result
}

export const filter = <K extends string, V>(obj: Record<K, V>, fn: (v: V, k: K) => boolean): Record<K, V> => {
  const result: Record<K, V> = {} as Record<K, V>
  for (const [k, v] of entries(obj)) {
    if (fn(v, k)) {
      result[k] = v
    }
  }
  return result
}

export const groupBy = <X>(xs: X[], fn: (x: X) => string): Record<string, X[]> => {
  const result: Record<string, X[]> = {}
  for (const x of xs) {
    const key = fn(x)
    if (result[key] === undefined) {
      result[key] = []
    }
    result[key]!.push(x)
  }
  return result
}

// casing

export namespace casing {
  const capitalizeFirstLetter = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()

  const splitHyphens = (tokens: string[]) => tokens.flatMap((token) => token.split('-'))
  const splitUnderscores = (tokens: string[]) => tokens.flatMap((token) => token.split('_'))
  const splitCaseChange = (tokens: string[]) => tokens.flatMap((token) => token.split(/(?<=[a-z])(?=[A-Z])/))
  const splitTokens = (tokens: string[]) => {
    return [splitHyphens, splitUnderscores, splitCaseChange].reduce((acc, step) => step(acc), tokens)
  }

  type SupportedCase = `${'pascal' | 'kebab' | 'snake' | 'screamingSnake' | 'camel'}Case`

  const fromTokens = {
    pascalCase: (tokens: string[]) => {
      return tokens.map(capitalizeFirstLetter).join('')
    },
    kebabCase: (tokens: string[]) => {
      return tokens.map((token) => token.toLowerCase()).join('-')
    },
    snakeCase: (tokens: string[]) => {
      return tokens.map((token) => token.toLowerCase()).join('_')
    },
    screamingSnakeCase: (tokens: string[]) => {
      return tokens.map((token) => token.toUpperCase()).join('_')
    },
    camelCase: (tokens: string[]) => {
      const [first, ...others] = tokens
      return [first!.toLowerCase(), ...others.map(capitalizeFirstLetter)].join('')
    },
  } as Record<SupportedCase, (tokens: string[]) => string>

  export const to = mapValues(fromTokens, (fn) => (text: string) => {
    const tokens = splitTokens([text])
    return fn(tokens)
  }) satisfies Record<SupportedCase, (text: string) => string>

  export const is = mapValues(to, (fn) => (text: string) => {
    const result = fn(text)
    return result === text
  }) satisfies Record<SupportedCase, (text: string) => boolean>
}
