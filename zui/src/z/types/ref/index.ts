import { ZodFirstPartyTypeKind, ZodType, ZodTypeDef, INVALID, ParseInput, ParseReturnType } from '../index'

export interface ZodRefDef extends ZodTypeDef {
  typeName: ZodFirstPartyTypeKind.ZodRef
  uri: string
}

type ZodRefOutput = NonNullable<unknown>

export class ZodRef extends ZodType<ZodRefOutput, ZodRefDef> {
  _parse(_input: ParseInput): ParseReturnType<never> {
    // a schema containing references should never be used to parse data
    return INVALID
  }

  static create = (uri: string): ZodRef => {
    return new ZodRef({
      typeName: ZodFirstPartyTypeKind.ZodRef,
      uri,
    })
  }

  public override isOptional(): boolean {
    return false
  }

  public override isNullable(): boolean {
    return false
  }
}