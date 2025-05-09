import { unique } from '../../utils'
import {
  ZodIssueCode,
  ParseInputLazyPath,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  processCreateParams,
  ZodParsedType,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
  SyncParseReturnType,
} from '../index'

export interface ZodMapDef<Key extends ZodTypeAny = ZodTypeAny, Value extends ZodTypeAny = ZodTypeAny>
  extends ZodTypeDef {
  valueType: Value
  keyType: Key
  typeName: ZodFirstPartyTypeKind.ZodMap
}

export class ZodMap<Key extends ZodTypeAny = ZodTypeAny, Value extends ZodTypeAny = ZodTypeAny> extends ZodType<
  Map<Key['_output'], Value['_output']>,
  ZodMapDef<Key, Value>,
  Map<Key['_input'], Value['_input']>
> {
  get keySchema() {
    return this._def.keyType
  }
  get valueSchema() {
    return this._def.valueType
  }

  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    const keyType = this._def.keyType.dereference(defs)
    const valueType = this._def.valueType.dereference(defs)
    return new ZodMap({
      ...this._def,
      keyType,
      valueType,
    })
  }

  getReferences(): string[] {
    return unique([...this._def.keyType.getReferences(), ...this._def.valueType.getReferences()])
  }

  clone(): ZodMap<Key, Value> {
    return new ZodMap({
      ...this._def,
      keyType: this._def.keyType.clone(),
      valueType: this._def.valueType.clone(),
    }) as ZodMap<Key, Value>
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType,
      })
      return INVALID
    }

    const keyType = this._def.keyType
    const valueType = this._def.valueType

    const pairs = [...(ctx.data as Map<unknown, unknown>).entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, 'key'])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, 'value'])),
      }
    })

    if (ctx.common.async) {
      const finalMap = new Map()
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key
          const value = await pair.value
          if (key.status === 'aborted' || value.status === 'aborted') {
            return INVALID
          }
          if (key.status === 'dirty' || value.status === 'dirty') {
            status.dirty()
          }

          finalMap.set(key.value, value.value)
        }
        return { status: status.value, value: finalMap }
      })
    } else {
      const finalMap = new Map()
      for (const pair of pairs) {
        const key = pair.key as SyncParseReturnType
        const value = pair.value as SyncParseReturnType
        if (key.status === 'aborted' || value.status === 'aborted') {
          return INVALID
        }
        if (key.status === 'dirty' || value.status === 'dirty') {
          status.dirty()
        }

        finalMap.set(key.value, value.value)
      }
      return { status: status.value, value: finalMap }
    }
  }
  static create = <Key extends ZodTypeAny = ZodTypeAny, Value extends ZodTypeAny = ZodTypeAny>(
    keyType: Key,
    valueType: Value,
    params?: RawCreateParams,
  ): ZodMap<Key, Value> => {
    return new ZodMap({
      valueType,
      keyType,
      typeName: ZodFirstPartyTypeKind.ZodMap,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodMap)) return false
    if (!this._def.keyType.isEqual(schema._def.keyType)) return false
    if (!this._def.valueType.isEqual(schema._def.valueType)) return false
    return true
  }
}
