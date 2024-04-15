import { DefaultComponentDefinitions, UIComponentDefinitions } from '../../../ui/types'
import { ZodIssueCode } from '../error'
import { RawCreateParams, ZodFirstPartyTypeKind, ZodType, ZodTypeDef } from '../index'
import { processCreateParams, ZodParsedType } from '../utils'
import { addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../utils/parseUtil'

export interface ZodNullDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodNull
}

export class ZodNull<UI extends UIComponentDefinitions = DefaultComponentDefinitions> extends ZodType<
  null,
  ZodNullDef,
  null,
  UI
> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }
  static create = <UI extends UIComponentDefinitions = DefaultComponentDefinitions>(
    params?: RawCreateParams,
  ): ZodNull<UI> => {
    return new ZodNull<UI>({
      typeName: ZodFirstPartyTypeKind.ZodNull,
      ...processCreateParams(params),
    })
  }
}
