import { RawCreateParams, ZodFirstPartyTypeKind, ZodType, ZodTypeDef } from '../index'
import { processCreateParams } from '../utils'
import { INVALID, ParseReturnType } from '../utils/parseUtil'

export interface ZodGenericDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodGeneric
  name: string
}

export class ZodGeneric extends ZodType<NonNullable<unknown>, ZodGenericDef> {
  _parse(): ParseReturnType<never> {
    // A generic cannot be used to parse data. It is meant to be used to reference another schema that is not known yet.
    return INVALID
  }

  static create = (name: string, params?: RawCreateParams): ZodGeneric => {
    return new ZodGeneric({
      typeName: ZodFirstPartyTypeKind.ZodGeneric,
      ...processCreateParams(params),
      name,
    })
  }

  public override isOptional(): boolean {
    return false
  }

  public override isNullable(): boolean {
    return false
  }
}
