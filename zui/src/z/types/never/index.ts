import { DefaultComponentDefinitions, UIComponentDefinitions } from '../../../ui/types'
import { ZodIssueCode } from '../error'
import { RawCreateParams, ZodFirstPartyTypeKind, ZodType, ZodTypeDef } from '../index'
import { processCreateParams, ZodParsedType } from '../utils'
import { addIssueToContext, INVALID, ParseInput, ParseReturnType } from '../utils/parseUtil'

export interface ZodNeverDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodNever
}

export class ZodNever<UI extends UIComponentDefinitions = DefaultComponentDefinitions> extends ZodType<
  never,
  ZodNeverDef,
  never,
  UI
> {
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const ctx = this._getOrReturnCtx(input)
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType,
    })
    return INVALID
  }
  static create = <UI extends UIComponentDefinitions = DefaultComponentDefinitions>(
    params?: RawCreateParams,
  ): ZodNever<UI> => {
    return new ZodNever({
      typeName: ZodFirstPartyTypeKind.ZodNever,
      ...processCreateParams(params),
    })
  }
}
