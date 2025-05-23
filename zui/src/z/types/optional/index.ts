import {
  processCreateParams,
  ZodParsedType,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  OK,
  ParseInput,
  ParseReturnType,
} from '../index'

export interface ZodOptionalDef<T extends ZodTypeAny = ZodTypeAny> extends ZodTypeDef {
  innerType: T
  typeName: ZodFirstPartyTypeKind.ZodOptional
}

export type ZodOptionalType<T extends ZodTypeAny> = ZodOptional<T>

export class ZodOptional<T extends ZodTypeAny = ZodTypeAny> extends ZodType<
  T['_output'] | undefined,
  ZodOptionalDef<T>,
  T['_input'] | undefined
> {
  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    return new ZodOptional({
      ...this._def,
      innerType: this._def.innerType.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.innerType.getReferences()
  }

  clone(): ZodOptional<T> {
    return new ZodOptional({
      ...this._def,
      innerType: this._def.innerType.clone(),
    }) as ZodOptional<T>
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const parsedType = this._getType(input)
    if (parsedType === ZodParsedType.undefined) {
      return OK(undefined)
    }
    return this._def.innerType._parse(input)
  }

  unwrap() {
    return this._def.innerType
  }

  static create = <T extends ZodTypeAny>(type: T, params?: RawCreateParams): ZodOptional<T> => {
    return new ZodOptional({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodOptional,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodOptional)) return false
    return this._def.innerType.isEqual(schema._def.innerType)
  }

  naked() {
    return this._def.innerType.naked()
  }

  mandatory(): ZodTypeAny {
    return this._def.innerType.mandatory()
  }
}
