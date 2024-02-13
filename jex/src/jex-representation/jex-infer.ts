import * as utils from '../utils'
import * as types from './typings'

type _InferTuple<T extends types.JexType[]> = T extends []
  ? []
  : T extends [infer A]
    ? [JexInfer<utils.types.Cast<A, types.JexType>>]
    : T extends [infer A, ...infer B]
      ? [JexInfer<utils.types.Cast<A, types.JexType>>, ..._InferTuple<utils.types.Cast<B, types.JexType[]>>]
      : T

export type JexInfer<J extends types.JexType> =
  J extends types.JexStringLiteral<infer V>
    ? V
    : J extends types.JexNumberLiteral<infer V>
      ? V
      : J extends types.JexBooleanLiteral<infer V>
        ? V
        : J extends types.JexString
          ? string
          : J extends types.JexNumber
            ? number
            : J extends types.JexBoolean
              ? boolean
              : J extends types.JexNull
                ? null
                : J extends types.JexUndefined
                  ? undefined
                  : J extends types.JexUnion
                    ? JexInfer<J['anyOf'][number]>
                    : J extends types.JexObject
                      ? { [K in keyof J['properties']]: JexInfer<J['properties'][K]> }
                      : J extends types.JexArray
                        ? JexInfer<J['items']>[]
                        : J extends types.JexMap
                          ? { [key: string]: JexInfer<J['items']> }
                          : J extends types.JexAny
                            ? any
                            : J extends types.JexTuple
                              ? _InferTuple<J['items']>
                              : never
