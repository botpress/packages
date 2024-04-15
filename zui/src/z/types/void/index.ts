import { DefaultComponentDefinitions, UIComponentDefinitions } from '../../../ui/types'
import { ZodIssueCode } from '../error'
import { RawCreateParams, ZodFirstPartyTypeKind, ZodType, ZodTypeDef } from '../index'
import { processCreateParams, ZodParsedType } from '../utils'
import { addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../utils/parseUtil'

export interface ZodVoidDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodVoid
}

export class ZodVoid<UI extends UIComponentDefinitions = DefaultComponentDefinitions> extends ZodType<
  void,
  ZodVoidDef,
  void,
  UI
> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }

  static create = <UI extends UIComponentDefinitions>(params?: RawCreateParams): ZodVoid<UI> => {
    return new ZodVoid({
      typeName: ZodFirstPartyTypeKind.ZodVoid,
      ...processCreateParams(params),
    })
  }
}
