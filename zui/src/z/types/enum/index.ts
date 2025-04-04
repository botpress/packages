import {
  ZodIssueCode,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeDef,
  processCreateParams,
  util,
  addIssueToContext,
  INVALID,
  OK,
  ParseInput,
  ParseReturnType,
} from '../index'
import { CustomSet } from '../utils/custom-set'

export type ArrayKeys = keyof any[]
export type Indices<T> = Exclude<keyof T, ArrayKeys>

export type EnumValues = [string, ...string[]]

export type Values<T extends EnumValues> = {
  [k in T[number]]: k
}

export interface ZodEnumDef<T extends EnumValues = EnumValues> extends ZodTypeDef {
  values: T
  typeName: ZodFirstPartyTypeKind.ZodEnum
}

export type Writeable<T> = {
  -readonly [P in keyof T]: T[P]
}

export type FilterEnum<Values, ToExclude> = Values extends []
  ? []
  : Values extends [infer Head, ...infer Rest]
    ? Head extends ToExclude
      ? FilterEnum<Rest, ToExclude>
      : [Head, ...FilterEnum<Rest, ToExclude>]
    : never

export type typecast<A, T> = A extends T ? A : never

export function createZodEnum<U extends string, T extends Readonly<[U, ...U[]]>>(
  values: T,
  params?: RawCreateParams,
): ZodEnum<Writeable<T>>
export function createZodEnum<U extends string, T extends [U, ...U[]]>(values: T, params?: RawCreateParams): ZodEnum<T>
export function createZodEnum(values: [string, ...string[]], params?: RawCreateParams) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params),
  })
}

export class ZodEnum<T extends [string, ...string[]] = [string, ...string[]]> extends ZodType<
  T[number],
  ZodEnumDef<T>
> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    if (typeof input.data !== 'string') {
      const ctx = this._getOrReturnCtx(input)
      const expectedValues = this._def.values
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues) as 'string',
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type,
      })
      return INVALID
    }

    if (this._def.values.indexOf(input.data) === -1) {
      const ctx = this._getOrReturnCtx(input)
      const expectedValues = this._def.values

      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues,
      })
      return INVALID
    }
    return OK(input.data)
  }

  get options() {
    return this._def.values
  }

  get enum(): Values<T> {
    const enumValues: any = {}
    for (const val of this._def.values) {
      enumValues[val] = val
    }
    return enumValues
  }

  get Values(): Values<T> {
    const enumValues: any = {}
    for (const val of this._def.values) {
      enumValues[val] = val
    }
    return enumValues
  }

  get Enum(): Values<T> {
    const enumValues: any = {}
    for (const val of this._def.values) {
      enumValues[val] = val
    }
    return enumValues
  }

  extract<ToExtract extends readonly [T[number], ...T[number][]]>(
    values: ToExtract,
    newDef: RawCreateParams = this._def,
  ): ZodEnum<Writeable<ToExtract>> {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef,
    })
  }

  exclude<ToExclude extends readonly [T[number], ...T[number][]]>(
    values: ToExclude,
    newDef: RawCreateParams = this._def,
  ): ZodEnum<typecast<Writeable<FilterEnum<T, ToExclude[number]>>, [string, ...string[]]>> {
    return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)) as FilterEnum<T, ToExclude[number]>, {
      ...this._def,
      ...newDef,
    }) as ZodEnum<typecast<Writeable<FilterEnum<T, ToExclude[number]>>, [string, ...string[]]>>
  }

  static create = createZodEnum

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodEnum)) return false
    const thisValues = new CustomSet<string>(this._def.values)
    const thatValues = new CustomSet<string>(schema._def.values)
    return thisValues.isEqual(thatValues)
  }
}
