type SplitPath<P extends string> = P extends `${infer X}/${infer Y}` ? [X, ...SplitPath<Y>] : [P]
type KeepPathVar<P extends string> = P extends `{${infer Var}}` ? [Var] : []

type Cast<A, B> = A extends B ? A : B
type FilterPathVar<P extends string[]> = P extends [`${infer Head}`]
  ? KeepPathVar<Head>
  : P extends [infer Head, ...infer Tail]
    ? [...KeepPathVar<Cast<Head, string>>, ...FilterPathVar<Cast<Tail, string[]>>]
    : []

type ToUnion<P extends string[]> = P[number]

export type PathParams<P extends string> = ToUnion<FilterPathVar<SplitPath<P>>>

// type tests

type Extends<A, B> = A extends B ? true : false
type And<A, B> = A extends true ? (B extends true ? true : false) : false
type Is<A, B> = And<Extends<A, B>, Extends<B, A>>

type Expect<_T extends true> = true

type _test_extract_single_path_var = Expect<Is<PathParams<'/foo/{bar}'>, 'bar'>>
type _test_extract_multiple_path_var = Expect<Is<PathParams<'/foo/{bar}/{baz}'>, 'bar' | 'baz'>>
type _test_extract_multiple_separated_path_var = Expect<Is<PathParams<'/foo/{bar}/baz/{qux}'>, 'bar' | 'qux'>>
type _test_extract_no_path_var = Expect<Is<PathParams<'/foo/bar'>, never>>
