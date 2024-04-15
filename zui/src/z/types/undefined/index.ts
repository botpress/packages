import { DefaultComponentDefinitions, UIComponentDefinitions } from '../../../ui/types'
import { ZodIssueCode } from '../error'
import { RawCreateParams, ZodFirstPartyTypeKind, ZodType, ZodTypeDef } from '../index'
import { processCreateParams, ZodParsedType } from '../utils'
import { addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../utils/parseUtil'

export interface ZodUndefinedDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodUndefined
}

export class ZodUndefined<UI extends UIComponentDefinitions = DefaultComponentDefinitions> extends ZodType<
  undefined,
  ZodUndefinedDef,
  undefined,
  UI
> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }
  params?: RawCreateParams

  static create = <UI extends UIComponentDefinitions = DefaultComponentDefinitions>(
    params?: RawCreateParams,
  ): ZodUndefined<UI> => {
    return new ZodUndefined<UI>({
      typeName: ZodFirstPartyTypeKind.ZodUndefined,
      ...processCreateParams(params),
    })
  }
}
