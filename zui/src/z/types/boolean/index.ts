import { DefaultComponentDefinitions, UIComponentDefinitions } from '../../../ui/types'
import { ZodIssueCode } from '../error'
import { RawCreateParams, ZodFirstPartyTypeKind, ZodType, ZodTypeDef } from '../index'
import { processCreateParams, ZodParsedType } from '../utils'
import { addIssueToContext, INVALID, OK, ParseInput, ParseReturnType } from '../utils/parseUtil'

export interface ZodBooleanDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodBoolean
  coerce: boolean
}

export class ZodBoolean<UI extends UIComponentDefinitions = DefaultComponentDefinitions> extends ZodType<
  boolean,
  ZodBooleanDef,
  boolean,
  UI
> {
  _parse(input: ParseInput): ParseReturnType<boolean> {
    if (this._def.coerce) {
      input.data = Boolean(input.data)
    }
    const parsedType = this._getType(input)

    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input)
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType,
      })
      return INVALID
    }
    return OK(input.data)
  }

  static create = <UI extends UIComponentDefinitions = DefaultComponentDefinitions>(
    params?: RawCreateParams & { coerce?: boolean },
  ): ZodBoolean<UI> => {
    return new ZodBoolean<UI>({
      typeName: ZodFirstPartyTypeKind.ZodBoolean,
      coerce: params?.coerce || false,
      ...processCreateParams(params),
    })
  }
}
