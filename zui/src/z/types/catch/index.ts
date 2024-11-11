import {
  ZodError,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  processCreateParams,
  isAsync,
  ParseContext,
  ParseInput,
  ParseReturnType,
  util,
} from '../index'

export type CatchFn<Y> = (ctx: { error: ZodError; input: unknown }) => Y
export interface ZodCatchDef<T extends ZodTypeAny = ZodTypeAny> extends ZodTypeDef {
  innerType: T
  catchValue: CatchFn<T['_output']>
  typeName: ZodFirstPartyTypeKind.ZodCatch
}

export class ZodCatch<T extends ZodTypeAny = ZodTypeAny> extends ZodType<
  T['_output'],
  ZodCatchDef<T>,
  unknown // any input will pass validation // T["_input"]
> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { ctx } = this._processInputParams(input)

    // newCtx is used to not collect issues from inner types in ctx
    const newCtx: ParseContext = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: [],
      },
    }

    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx,
      },
    })

    if (isAsync(result)) {
      return result.then((result) => {
        return {
          status: 'valid',
          value:
            result.status === 'valid'
              ? result.value
              : this._def.catchValue({
                  get error() {
                    return new ZodError(newCtx.common.issues)
                  },
                  input: newCtx.data,
                }),
        }
      })
    } else {
      return {
        status: 'valid',
        value:
          result.status === 'valid'
            ? result.value
            : this._def.catchValue({
                get error() {
                  return new ZodError(newCtx.common.issues)
                },
                input: newCtx.data,
              }),
      }
    }
  }

  removeCatch() {
    return this._def.innerType
  }

  static create = <T extends ZodTypeAny>(
    type: T,
    params: RawCreateParams & {
      catch: T['_output'] | CatchFn<T['_output']>
    },
  ): ZodCatch<T> => {
    return new ZodCatch({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodCatch,
      catchValue: typeof params.catch === 'function' ? params.catch : () => params.catch,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodCatch)) return false
    return (
      this._def.innerType.isEqual(schema._def.innerType) &&
      util.compareFunctions(this._def.catchValue, schema._def.catchValue)
    )
  }
}
