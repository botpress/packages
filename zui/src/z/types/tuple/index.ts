import { unique } from '../../utils'
import {
  ZodIssueCode,
  ParseInputLazyPath,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  processCreateParams,
  ZodParsedType,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
  ParseStatus,
  SyncParseReturnType,
} from '../index'
import { CustomSet } from '../utils/custom-set'

export type ZodTupleItems = [ZodTypeAny, ...ZodTypeAny[]]
export type AssertArray<T> = T extends any[] ? T : never
export type OutputTypeOfTuple<T extends ZodTupleItems | []> = AssertArray<{
  [k in keyof T]: T[k] extends ZodType<any, any> ? T[k]['_output'] : never
}>
export type OutputTypeOfTupleWithRest<
  T extends ZodTupleItems | [],
  Rest extends ZodTypeAny | null = null,
> = Rest extends ZodTypeAny ? [...OutputTypeOfTuple<T>, ...Rest['_output'][]] : OutputTypeOfTuple<T>

export type InputTypeOfTuple<T extends ZodTupleItems | []> = AssertArray<{
  [k in keyof T]: T[k] extends ZodType<any, any> ? T[k]['_input'] : never
}>
export type InputTypeOfTupleWithRest<
  T extends ZodTupleItems | [],
  Rest extends ZodTypeAny | null = null,
> = Rest extends ZodTypeAny ? [...InputTypeOfTuple<T>, ...Rest['_input'][]] : InputTypeOfTuple<T>

export interface ZodTupleDef<T extends ZodTupleItems | [] = ZodTupleItems, Rest extends ZodTypeAny | null = null>
  extends ZodTypeDef {
  items: T
  rest: Rest
  typeName: ZodFirstPartyTypeKind.ZodTuple
}

export type AnyZodTuple = ZodTuple<[ZodTypeAny, ...ZodTypeAny[]] | [], ZodTypeAny | null>
export class ZodTuple<
  T extends [ZodTypeAny, ...ZodTypeAny[]] | [] = [ZodTypeAny, ...ZodTypeAny[]],
  Rest extends ZodTypeAny | null = null,
> extends ZodType<OutputTypeOfTupleWithRest<T, Rest>, ZodTupleDef<T, Rest>, InputTypeOfTupleWithRest<T, Rest>> {
  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    const items = this._def.items.map((item) => item.dereference(defs)) as [ZodTypeAny, ...ZodTypeAny[]]
    const rest = this._def.rest ? this._def.rest.dereference(defs) : null
    return new ZodTuple({
      ...this._def,
      items,
      rest,
    })
  }

  getReferences(): string[] {
    return unique([
      ...this._def.items.flatMap((item) => item.getReferences()),
      ...(this._def.rest ? this._def.rest.getReferences() : []),
    ])
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType,
      })
      return INVALID
    }

    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: 'array',
      })

      return INVALID
    }

    const rest = this._def.rest

    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: 'array',
      })
      status.dirty()
    }

    const items = ([...ctx.data] as any[])
      .map((item, itemIndex) => {
        const schema = this._def.items[itemIndex] || this._def.rest
        if (!schema) return null as any as SyncParseReturnType<any>
        return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex))
      })
      .filter((x) => !!x) // filter nulls

    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results)
      })
    } else {
      return ParseStatus.mergeArray(status, items as SyncParseReturnType[])
    }
  }

  get items() {
    return this._def.items
  }

  rest<Rest extends ZodTypeAny>(rest: Rest): ZodTuple<T, Rest> {
    return new ZodTuple({
      ...this._def,
      rest,
    })
  }

  static create = <T extends [ZodTypeAny, ...ZodTypeAny[]] | []>(
    schemas: T,
    params?: RawCreateParams,
  ): ZodTuple<T, null> => {
    if (!Array.isArray(schemas)) {
      throw new Error('You must pass an array of schemas to z.tuple([ ... ])')
    }
    return new ZodTuple({
      items: schemas,
      typeName: ZodFirstPartyTypeKind.ZodTuple,
      rest: null,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodTuple)) return false
    if (!this._restEquals(schema)) return false

    const compare = (a: ZodType, b: ZodType) => a.isEqual(b)
    const thisItems = new CustomSet<ZodType>(this._def.items, { compare })
    const schemaItems = new CustomSet<ZodType>(schema._def.items, { compare })
    return thisItems.isEqual(schemaItems)
  }

  private _restEquals(schema: ZodTuple) {
    if (this._def.rest === null) {
      return schema._def.rest === null
    }
    return schema._def.rest !== null && this._def.rest.isEqual(schema._def.rest)
  }
}
