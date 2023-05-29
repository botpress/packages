import { EntityParser } from '../typings'
import { wasm, node, ListEntityModel } from './engines'
import { spaceTokenizer } from './space-tokenizer'
import { ListEntityDef, ListEntityEngine, Tokenizer } from './typings'

export * from './typings'

export type ListEntityParserProps = {
  tokenizer: Tokenizer
  engine: ListEntityEngine
}

const DEFAULT_PROPS: ListEntityParserProps = {
  tokenizer: spaceTokenizer,
  engine: 'wasm'
}

export class ListEntityParser implements EntityParser {
  private _props: ListEntityParserProps
  private _models: ListEntityModel[]

  public constructor(entities: ListEntityDef[], props: Partial<ListEntityParserProps> = {}) {
    this._props = { ...DEFAULT_PROPS, ...props }
    this._models = entities.map((x) => ({
      ...x,
      values: x.values.map((y) => ({
        ...y,
        synonyms: y.synonyms.map((z) => ({ tokens: this._props.tokenizer(z) }))
      }))
    }))
  }

  public parse = (text: string) => {
    const tokens = this._props.tokenizer(text)

    const extractions =
      this._props.engine === 'wasm'
        ? wasm.extractForListModels(tokens, this._models)
        : node.extractForListModels(tokens, this._models)

    return extractions.map((x) => ({
      type: 'list' as const,
      ...x
    }))
  }
}
