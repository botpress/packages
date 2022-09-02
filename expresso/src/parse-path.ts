type SplitPath<P extends string> = P extends `${infer X}/${infer Y}` ? [X, ...SplitPath<Y>] : [P]
type KeepPathVar<P extends string> = P extends `:${infer Var}` ? [Var] : []

type Cast<A, B> = A extends B ? A : B
type FilterPathVar<P extends string[]> = P extends [`${infer Head}`]
  ? KeepPathVar<Head>
  : P extends [infer Head, ...infer Tail]
  ? [...KeepPathVar<Cast<Head, string>>, ...FilterPathVar<Cast<Tail, string[]>>]
  : []

type ToUnion<P extends string[]> = P[number]

export type PathVariables<P extends string> = Record<ToUnion<FilterPathVar<SplitPath<P>>>, string>

export const getPathVariables = <P extends string>(p: P): FilterPathVar<SplitPath<P>> => {
  const parts = p.split('/')
  const vars = parts.filter((p) => p.startsWith(':'))
  return vars.map((v) => v.substring(1)) as FilterPathVar<SplitPath<P>>
}

export const mapPathFromExpressToOpenAPI = (p: string): string => {
  const parts = p.split('/')
  const vars = parts.map((p) => (p.startsWith(':') ? `{${p.substring(1)}}` : p))
  return vars.join('/')
}
