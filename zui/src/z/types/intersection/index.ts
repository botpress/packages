import { unique } from '../../utils'
import {
  ZodIssueCode,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  getParsedType,
  processCreateParams,
  util,
  ZodParsedType,
  addIssueToContext,
  INVALID,
  isAborted,
  isDirty,
  ParseInput,
  ParseReturnType,
  SyncParseReturnType,
} from '../index'
import { CustomSet } from '../utils/custom-set'

export interface ZodIntersectionDef<T extends ZodTypeAny = ZodTypeAny, U extends ZodTypeAny = ZodTypeAny>
  extends ZodTypeDef {
  left: T
  right: U
  typeName: ZodFirstPartyTypeKind.ZodIntersection
}

function mergeValues(a: any, b: any): { valid: true; data: any } | { valid: false } {
  const aType = getParsedType(a)
  const bType = getParsedType(b)

  if (a === b) {
    return { valid: true, data: a }
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b)
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1)

    const newObj: any = { ...a, ...b }
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key])
      if (!sharedValue.valid) {
        return { valid: false }
      }
      newObj[key] = sharedValue.data
    }

    return { valid: true, data: newObj }
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false }
    }

    const newArray: unknown[] = []
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index]
      const itemB = b[index]
      const sharedValue = mergeValues(itemA, itemB)

      if (!sharedValue.valid) {
        return { valid: false }
      }

      newArray.push(sharedValue.data)
    }

    return { valid: true, data: newArray }
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a }
  } else {
    return { valid: false }
  }
}

export class ZodIntersection<T extends ZodTypeAny = ZodTypeAny, U extends ZodTypeAny = ZodTypeAny> extends ZodType<
  T['_output'] & U['_output'],
  ZodIntersectionDef<T, U>,
  T['_input'] & U['_input']
> {
  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    return new ZodIntersection({
      ...this._def,
      left: this._def.left.dereference(defs),
      right: this._def.right.dereference(defs),
    })
  }

  getReferences(): string[] {
    return unique([...this._def.left.getReferences(), ...this._def.right.getReferences()])
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { status, ctx } = this._processInputParams(input)
    const handleParsed = (
      parsedLeft: SyncParseReturnType,
      parsedRight: SyncParseReturnType,
    ): SyncParseReturnType<T & U> => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID
      }

      const merged = mergeValues(parsedLeft.value, parsedRight.value)

      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types,
        })
        return INVALID
      }

      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty()
      }

      return { status: status.value, value: merged.data as any }
    }

    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
      ]).then(([left, right]: any) => handleParsed(left, right))
    } else {
      return handleParsed(
        this._def.left._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
        this._def.right._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        }),
      )
    }
  }

  static create = <T extends ZodTypeAny, U extends ZodTypeAny>(
    left: T,
    right: U,
    params?: RawCreateParams,
  ): ZodIntersection<T, U> => {
    return new ZodIntersection({
      left: left,
      right: right,
      typeName: ZodFirstPartyTypeKind.ZodIntersection,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodIntersection)) return false

    const compare = (a: ZodType, b: ZodType) => a.isEqual(b)
    const thisItems = new CustomSet<ZodType>([this._def.left, this._def.right], { compare })
    const thatItems = new CustomSet<ZodType>([schema._def.left, schema._def.right], { compare })
    return thisItems.isEqual(thatItems)
  }
}
