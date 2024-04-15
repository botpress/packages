import { DefaultComponentDefinitions, UIComponentDefinitions } from '../../../ui/types'
import { RawCreateParams, ZodFirstPartyTypeKind, ZodType, ZodTypeDef } from '../index'
import { processCreateParams } from '../utils'
import { OK, ParseInput, ParseReturnType } from '../utils/parseUtil'

export interface ZodUnknownDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodUnknown
}

export class ZodUnknown<UI extends UIComponentDefinitions = DefaultComponentDefinitions> extends ZodType<
  unknown,
  ZodUnknownDef,
  unknown,
  UI
> {
  // required
  _unknown = true as const
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    return OK(input.data)
  }

  static create = <UI extends UIComponentDefinitions = DefaultComponentDefinitions>(
    params?: RawCreateParams,
  ): ZodUnknown<UI> => {
    return new ZodUnknown<UI>({
      typeName: ZodFirstPartyTypeKind.ZodUnknown,
      ...processCreateParams(params),
    })
  }
}
