import { DefaultComponentDefinitions, UIComponentDefinitions } from '../../../ui/types'
import { ZodIssueCode } from '../error'
import { RawCreateParams, ZodFirstPartyTypeKind, ZodType, ZodTypeDef } from '../index'
import { processCreateParams, ZodParsedType } from '../utils'
import { addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../utils/parseUtil'

export interface ZodSymbolDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodSymbol
}

export class ZodSymbol<UI extends UIComponentDefinitions = DefaultComponentDefinitions> extends ZodType<
  symbol,
  ZodSymbolDef,
  symbol,
  UI
> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType,
      })
      return INVALID
    }

    return OK(input.data)
  }

  static create = <UI extends UIComponentDefinitions = DefaultComponentDefinitions>(
    params?: RawCreateParams,
  ): ZodSymbol<UI> => {
    return new ZodSymbol<UI>({
      typeName: ZodFirstPartyTypeKind.ZodSymbol,
      ...processCreateParams(params),
    })
  }
}
