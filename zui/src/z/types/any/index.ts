import { DefaultComponentDefinitions, UIComponentDefinitions } from '../../../ui/types'
import { RawCreateParams, ZodFirstPartyTypeKind, ZodType, ZodTypeDef } from '../index'
import { processCreateParams } from '../utils'
import { OK, ParseInput, ParseReturnType } from '../utils/parseUtil'

export interface ZodAnyDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodAny
}

export class ZodAny<UI extends UIComponentDefinitions = DefaultComponentDefinitions> extends ZodType<
  any,
  ZodAnyDef,
  any,
  UI
> {
  // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
  _any = true as const
  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    return OK(input.data)
  }
  static create = <UI extends UIComponentDefinitions = DefaultComponentDefinitions>(
    params?: RawCreateParams,
  ): ZodAny<UI> => {
    return new ZodAny<UI>({
      typeName: ZodFirstPartyTypeKind.ZodAny,
      ...processCreateParams(params),
    })
  }
}
