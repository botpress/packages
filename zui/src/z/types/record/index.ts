import { unique } from '../../utils'
import {
  BRAND,
  ZodIssueCode,
  ParseInputLazyPath,
  RawCreateParams,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  ZodString,
  processCreateParams,
  ZodParsedType,
  addIssueToContext,
  INVALID,
  ParseInput,
  ParseReturnType,
  ParseStatus,
} from '../index'

export interface ZodRecordDef<Key extends KeySchema = ZodString, Value extends ZodTypeAny = ZodTypeAny>
  extends ZodTypeDef {
  valueType: Value
  keyType: Key
  typeName: ZodFirstPartyTypeKind.ZodRecord
}

export type KeySchema = ZodType<string | number | symbol, any, any>

export type RecordType<K extends string | number | symbol, V> = [string] extends [K]
  ? Record<K, V>
  : [number] extends [K]
    ? Record<K, V>
    : [symbol] extends [K]
      ? Record<K, V>
      : [BRAND<string | number | symbol>] extends [K]
        ? Record<K, V>
        : Partial<Record<K, V>>

export class ZodRecord<Key extends KeySchema = ZodString, Value extends ZodTypeAny = ZodTypeAny> extends ZodType<
  RecordType<Key['_output'], Value['_output']>,
  ZodRecordDef<Key, Value>,
  RecordType<Key['_input'], Value['_input']>
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
    return new ZodRecord({
      ...this._def,
      keyType,
      valueType,
    })
  }

  getReferences(): string[] {
    return unique([...this._def.keyType.getReferences(), ...this._def.valueType.getReferences()])
  }

  clone(): ZodRecord<Key, Value> {
    return new ZodRecord({
      ...this._def,
      keyType: this._def.keyType.clone(),
      valueType: this._def.valueType.clone(),
    }) as ZodRecord<Key, Value>
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { status, ctx } = this._processInputParams(input)
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType,
      })
      return INVALID
    }

    const pairs: {
      key: ParseReturnType<any>
      value: ParseReturnType<any>
    }[] = []

    const keyType = this._def.keyType
    const valueType = this._def.valueType

    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
      })
    }

    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs)
    } else {
      return ParseStatus.mergeObjectSync(status, pairs as any)
    }
  }

  get element() {
    return this._def.valueType
  }

  static create<Value extends ZodTypeAny>(valueType: Value, params?: RawCreateParams): ZodRecord<ZodString, Value>
  static create<Keys extends KeySchema, Value extends ZodTypeAny>(
    keySchema: Keys,
    valueType: Value,
    params?: RawCreateParams,
  ): ZodRecord<Keys, Value>
  static create(first: any, second?: any, third?: any): ZodRecord<any, any> {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third),
      })
    }

    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodRecord)) return false
    if (!this._def.keyType.isEqual(schema._def.keyType)) return false
    if (!this._def.valueType.isEqual(schema._def.valueType)) return false
    return true
  }
}
