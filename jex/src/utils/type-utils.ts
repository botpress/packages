/**
 * Allows to deeply inspect a type while debugging
 */
export type Resolve<T> = T extends (...args: infer A) => infer R
  ? (...args: Resolve<A>) => Resolve<R>
  : T extends Promise<infer R>
    ? Promise<Resolve<R>>
    : T extends object
      ? T extends infer O
        ? { [K in keyof O]: Resolve<O[K]> }
        : never
      : T
