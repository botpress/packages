import { ZodFirstPartyTypeKind, ZodType, ZodTypeAny, ZodTypeDef, ParseInput, ParseReturnType } from '../index'

type Key = string | number | symbol

export interface ZodBrandedDef<T extends ZodTypeAny = ZodTypeAny> extends ZodTypeDef {
  type: T
  typeName: ZodFirstPartyTypeKind.ZodBranded
}

export const BRAND: unique symbol = Symbol('zod_brand')
export type BRAND<T extends Key = Key> = {
  [BRAND]: {
    [k in T]: true
  }
}

export class ZodBranded<T extends ZodTypeAny = ZodTypeAny, B extends Key = Key> extends ZodType<
  T['_output'] & BRAND<B>,
  ZodBrandedDef<T>,
  T['_input']
> {
  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    return new ZodBranded({
      ...this._def,
      type: this._def.type.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.type.getReferences()
  }

  clone(): ZodBranded<T, B> {
    return new ZodBranded({
      ...this._def,
      type: this._def.type.clone(),
    }) as ZodBranded<T, B>
  }

  _parse(input: ParseInput): ParseReturnType<any> {
    const { ctx } = this._processInputParams(input)
    const data = ctx.data
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx,
    })
  }

  unwrap() {
    return this._def.type
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodBranded)) return false
    return this._def.type.isEqual(schema._def.type)
  }

  naked(): ZodTypeAny {
    return this._def.type.naked()
  }

  mandatory(): ZodBranded<ZodTypeAny, B> {
    return new ZodBranded({
      ...this._def,
      type: this._def.type.mandatory(),
    })
  }
}
