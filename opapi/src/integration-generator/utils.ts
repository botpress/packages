export type ValueOf<T> = T[keyof T]

// objects

const entries = <K extends string, V>(obj: Record<K, V>): [K, V][] => Object.entries(obj) as [K, V][]
export const filterObject = <K extends string, V>(obj: Record<K, V>, fn: (v: V, k: K) => boolean): Record<K, V> => {
  const result: Record<K, V> = {} as Record<K, V>
  for (const [k, v] of entries(obj)) {
    if (fn(v, k)) {
      result[k] = v
    }
  }
  return result
}

// casing

const capitalizeFirstLetter = (text: string) => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
const splitHyphens = (tokens: string[]) => tokens.flatMap((token) => token.split('-'))
const splitUnderscores = (tokens: string[]) => tokens.flatMap((token) => token.split('_'))
const splitCaseChange = (tokens: string[]) => tokens.flatMap((token) => token.split(/(?<=[a-z])(?=[A-Z])/))
const splitTokens = (tokens: string[]) =>
  [splitHyphens, splitUnderscores, splitCaseChange].reduce((acc, step) => step(acc), tokens)

export const pascalCase = (text: string) => {
  const tokens = splitTokens([text])
  return tokens.map(capitalizeFirstLetter).join('')
}
