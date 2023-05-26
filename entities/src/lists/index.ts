import { EntityParser } from '../typings'
import * as wasm from './wasm'
import * as node from './node'
import { ListEntityDef, Tokenizer } from './typings'
import { spaceTokenizer } from './space-tokenizer'

export * from './typings'

export type ListEntityEngine = 'wasm' | 'node'

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

  public constructor(private _entities: ListEntityDef[], props: Partial<ListEntityParserProps> = {}) {
    this._props = { ...DEFAULT_PROPS, ...props }
  }

  public parse = (text: string) => {
    const tokens = this._props.tokenizer(text)

    const extractions =
      this._props.engine === 'wasm'
        ? wasm.extractForListModels(tokens, this._entities)
        : node.extractForListModels(tokens, this._entities)

    return extractions.map((x) => ({
      type: 'list' as const,
      ...x
    }))
  }
}
