import * as utils from '../utils'
import { $ } from './jex-builder'
import { JexInfer } from './jex-infer'

const _any = $.any()
const _string = $.string()
const _number = $.number()
const _boolean = $.boolean()
const _null = $.null()
const _undefined = $.undefined()
const _literalStr = $.literal('apple')
const _literalNum = $.literal(1)
const _literalBool = $.literal(true)
const _object = $.object({ a: $.string(), b: $.number() })
const _array = $.array($.string())
const _map = $.map($.string())
const _tuple = $.tuple([$.string(), $.number()])
const _union = $.union([$.string(), $.number()])
const _complex = $.array($.union([$.map($.tuple([$.string(), $.number()])), $.object({ a: $.array($.string()) })]))

type ExpectedComplex = (Record<string, [string, number]> | { a: string[] })[]
type _Any = utils.types.Expect<utils.types.Equals<JexInfer<typeof _any>, any>>
type _String = utils.types.Expect<utils.types.Equals<JexInfer<typeof _string>, string>>
type _Number = utils.types.Expect<utils.types.Equals<JexInfer<typeof _number>, number>>
type _Boolean = utils.types.Expect<utils.types.Equals<JexInfer<typeof _boolean>, boolean>>
type _Null = utils.types.Expect<utils.types.Equals<JexInfer<typeof _null>, null>>
type _Undefined = utils.types.Expect<utils.types.Equals<JexInfer<typeof _undefined>, undefined>>
type _LiteralStr = utils.types.Expect<utils.types.Equals<JexInfer<typeof _literalStr>, 'apple'>>
type _LiteralNum = utils.types.Expect<utils.types.Equals<JexInfer<typeof _literalNum>, 1>>
type _LiteralBool = utils.types.Expect<utils.types.Equals<JexInfer<typeof _literalBool>, true>>
type _Object = utils.types.Expect<utils.types.Equals<JexInfer<typeof _object>, { a: string; b: number }>>
type _Array = utils.types.Expect<utils.types.Equals<JexInfer<typeof _array>, string[]>>
type _Map = utils.types.Expect<utils.types.Equals<JexInfer<typeof _map>, Record<string, string>>>
type _Tuple = utils.types.Expect<utils.types.Equals<JexInfer<typeof _tuple>, [string, number]>>
type _Union = utils.types.Expect<utils.types.Equals<JexInfer<typeof _union>, string | number>>
type _Complex = utils.types.Expect<utils.types.Equals<JexInfer<typeof _complex>, ExpectedComplex>>
