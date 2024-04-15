import { DefaultComponentDefinitions, UIComponentDefinitions } from '../../../ui/types'
import { ZodIssueCode } from '../error'
import { RawCreateParams, ZodFirstPartyTypeKind, ZodType, ZodTypeDef } from '../index'
import { processCreateParams, ZodParsedType } from '../utils'
import { addIssueToContext, INVALID, ParseInput, ParseReturnType } from '../utils/parseUtil'

export interface ZodNaNDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodNaN
}

export class ZodNaN<UI extends UIComponentDefinitions = DefaultComponentDefinitions> extends ZodType<
  number,
  ZodNaNDef,
  number,
  UI
> {
  _parse(input: ParseInput): ParseReturnType<any> {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType,
      })
      return INVALID
    }

    return { status: 'valid', value: input.data }
  }

  static create = <UI extends UIComponentDefinitions = DefaultComponentDefinitions>(
    params?: RawCreateParams,
  ): ZodNaN<UI> => {
    return new ZodNaN<UI>({
      typeName: ZodFirstPartyTypeKind.ZodNaN,
      ...processCreateParams(params),
    })
  }
}
