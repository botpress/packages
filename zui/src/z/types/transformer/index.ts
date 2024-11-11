import {
  IssueData,
  input,
  output,
  RawCreateParams,
  RefinementCtx,
  ZodFirstPartyTypeKind,
  ZodType,
  ZodTypeAny,
  ZodTypeDef,
  processCreateParams,
  util,
  addIssueToContext,
  DIRTY,
  INVALID,
  isValid,
  ParseInput,
  ParseReturnType,
} from '../index'

export type Refinement<T> = (arg: T, ctx: RefinementCtx) => any
export type SuperRefinement<T> = (arg: T, ctx: RefinementCtx) => void | Promise<void>

export type RefinementEffect<T> = {
  type: 'refinement'
  refinement: (arg: T, ctx: RefinementCtx) => any
}
export type TransformEffect<T> = {
  type: 'transform'
  transform: (arg: T, ctx: RefinementCtx) => any
}
export type PreprocessEffect<T> = {
  type: 'preprocess'
  transform: (arg: T, ctx: RefinementCtx) => any
}
export type Effect<T> = RefinementEffect<T> | TransformEffect<T> | PreprocessEffect<T>

export interface ZodEffectsDef<T extends ZodTypeAny = ZodTypeAny> extends ZodTypeDef {
  schema: T
  typeName: ZodFirstPartyTypeKind.ZodEffects
  effect: Effect<any>
}

export class ZodEffects<T extends ZodTypeAny = ZodTypeAny, Output = output<T>, Input = input<T>> extends ZodType<
  Output,
  ZodEffectsDef<T>,
  Input
> {
  innerType() {
    return this._def.schema
  }

  sourceType(): T {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects
      ? (this._def.schema as unknown as ZodEffects<T>).sourceType()
      : (this._def.schema as T)
  }

  dereference(defs: Record<string, ZodTypeAny>): ZodTypeAny {
    return new ZodEffects({
      ...this._def,
      schema: this._def.schema.dereference(defs),
    })
  }

  getReferences(): string[] {
    return this._def.schema.getReferences()
  }

  _parse(input: ParseInput): ParseReturnType<this['_output']> {
    const { status, ctx } = this._processInputParams(input)

    const effect = this._def.effect || null

    const checkCtx: RefinementCtx = {
      addIssue: (arg: IssueData) => {
        addIssueToContext(ctx, arg)
        if (arg.fatal) {
          status.abort()
        } else {
          status.dirty()
        }
      },
      get path() {
        return ctx.path
      },
    }

    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx)

    if (effect.type === 'preprocess') {
      const processed = effect.transform(ctx.data, checkCtx)

      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed) => {
          if (status.value === 'aborted') return INVALID

          const result = await this._def.schema._parseAsync({
            data: processed,
            path: ctx.path,
            parent: ctx,
          })
          if (result.status === 'aborted') return INVALID
          if (result.status === 'dirty') return DIRTY(result.value)
          if (status.value === 'dirty') return DIRTY(result.value)
          return result
        })
      } else {
        if (status.value === 'aborted') return INVALID
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx,
        })
        if (result.status === 'aborted') return INVALID
        if (result.status === 'dirty') return DIRTY(result.value)
        if (status.value === 'dirty') return DIRTY(result.value)
        return result
      }
    }
    if (effect.type === 'refinement') {
      const executeRefinement = (acc: unknown): any => {
        const result = effect.refinement(acc, checkCtx)
        if (ctx.common.async) {
          return Promise.resolve(result)
        }
        if (result instanceof Promise) {
          throw new Error('Async refinement encountered during synchronous parse operation. Use .parseAsync instead.')
        }
        return acc
      }

      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        })
        if (inner.status === 'aborted') return INVALID
        if (inner.status === 'dirty') status.dirty()

        // return value is ignored
        executeRefinement(inner.value)
        return { status: status.value, value: inner.value }
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === 'aborted') return INVALID
          if (inner.status === 'dirty') status.dirty()

          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value }
          })
        })
      }
    }

    if (effect.type === 'transform') {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx,
        })

        if (!isValid(base)) return base

        const result = effect.transform(base.value, checkCtx)
        if (result instanceof Promise) {
          throw new Error(
            `Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`,
          )
        }

        return { status: status.value, value: result }
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base)) return base

          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result,
          }))
        })
      }
    }

    util.assertNever(effect)
  }

  static create = <I extends ZodType>(
    schema: I,
    effect: Effect<I['_output']>,
    params?: RawCreateParams,
  ): ZodEffects<I, I['_output']> => {
    return new ZodEffects({
      schema,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect,
      ...processCreateParams(params),
    })
  }

  static createWithPreprocess = <I extends ZodTypeAny>(
    preprocess: (arg: unknown, ctx: RefinementCtx) => unknown,
    schema: I,
    params?: RawCreateParams,
  ): ZodEffects<I, I['_output'], unknown> => {
    return new ZodEffects({
      schema,
      effect: { type: 'preprocess', transform: preprocess },
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      ...processCreateParams(params),
    })
  }

  isEqual(schema: ZodType): boolean {
    if (!(schema instanceof ZodEffects)) return false
    if (!this._def.schema.isEqual(schema._def.schema)) return false

    if (this._def.effect.type === 'refinement') {
      if (schema._def.effect.type !== 'refinement') return false
      return util.compareFunctions(this._def.effect.refinement, schema._def.effect.refinement)
    }

    if (this._def.effect.type === 'transform') {
      if (schema._def.effect.type !== 'transform') return false
      return util.compareFunctions(this._def.effect.transform, schema._def.effect.transform)
    }

    if (this._def.effect.type === 'preprocess') {
      if (schema._def.effect.type !== 'preprocess') return false
      return util.compareFunctions(this._def.effect.transform, schema._def.effect.transform)
    }

    util.assertNever(this._def.effect)
    return false
  }
}
export { ZodEffects as ZodTransformer }
