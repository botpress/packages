import { EntityExtractor } from '../typings'
import { wasm, javascript, ListEntityModel } from './engines'
import { spaceTokenizer } from './space-tokenizer'
import { FuzzyTolerance, ListEntityDef, ListEntityEngine, Tokenizer } from './typings'

export * from './typings'

const FUZZY_TOLERANCE: Record<FuzzyTolerance, number> = {
  loose: 0.65,
  medium: 0.8,
  strict: 1
}

export type ListEntityExtractorProps = {
  tokenizer: Tokenizer
  engine: ListEntityEngine
}

const DEFAULT_PROPS: ListEntityExtractorProps = {
  tokenizer: spaceTokenizer,
  engine: 'wasm'
}

export class ListEntityExtractor implements EntityExtractor {
  private _props: ListEntityExtractorProps
  private _models: ListEntityModel[]

  public constructor(entities: ListEntityDef[], props: Partial<ListEntityExtractorProps> = {}) {
    this._props = { ...DEFAULT_PROPS, ...props }
    this._models = entities.map((x) => ({
      name: x.name,
      fuzzy: FUZZY_TOLERANCE[x.fuzzy],
      values: x.values.map((y) => ({
        ...y,
        synonyms: y.synonyms.map((z) => ({ tokens: this._props.tokenizer(z) }))
      }))
    }))
  }

  public extract = (text: string) => {
    const tokens = this._props.tokenizer(text)

    const extractions =
      this._props.engine === 'wasm'
        ? wasm.extractForListModels(tokens, this._models)
        : javascript.extractForListModels(tokens, this._models)

    return extractions.map((x) => ({
      type: 'list' as const,
      ...x
    }))
  }
}
