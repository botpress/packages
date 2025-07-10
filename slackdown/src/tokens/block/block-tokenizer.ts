import { BlockQuoteToken } from './blockquote-token'
import { CodeBlockToken } from './code-block-token'
import { BulletedListToken } from './list/bulleted-list-token'
import { OrderedListToken } from './list/ordered-list-token'
import { ParagraphToken } from './paragraph-token'
import { SpaceToken } from './space-token'
import { IBlockToken } from './types'

export namespace BlockTokenizer {
  interface TokenizeState {
    readonly tokens: readonly IBlockToken[]
    readonly remainingText: string
    readonly lastToken?: IBlockToken
  }

  interface TokenizeResult {
    readonly token: IBlockToken
    readonly remaining: string
  }

  const BLOCK_TOKENIZERS = [
    SpaceToken,
    CodeBlockToken,
    BulletedListToken,
    OrderedListToken,
    BlockQuoteToken,
    ParagraphToken,
  ] as const

  export const tokenize = (text: string): IBlockToken[] => {
    const initialState: TokenizeState = {
      tokens: [],
      remainingText: text,
      lastToken: undefined,
    }

    const finalState = processAllTokens(initialState)
    return [...finalState.tokens]
  }

  const processAllTokens = (state: TokenizeState): TokenizeState => {
    if (!state.remainingText) {
      return state
    }

    const result = processNextToken(state.remainingText, state.lastToken)
    if (!result) {
      return state
    }

    const nextState = createNextState(state, result)
    return processAllTokens(nextState)
  }

  const createNextState = (currentState: TokenizeState, result: TokenizeResult): TokenizeState => {
    const { token, remaining } = result

    if (token.ignore) {
      return {
        ...currentState,
        remainingText: remaining,
      }
    }

    return {
      tokens: [...currentState.tokens, token],
      remainingText: remaining,
      lastToken: token,
    }
  }

  const processNextToken = (text: string, lastToken?: IBlockToken): TokenizeResult | null => {
    for (const TokenClass of BLOCK_TOKENIZERS) {
      const token = new TokenClass(text, lastToken)
      if (token.hasMatchingContent()) {
        return {
          token,
          remaining: token.getRemainingText(),
        }
      }
    }

    return text.length > 1
      ? {
          token: new ParagraphToken(text.slice(0, 1), lastToken),
          remaining: text.slice(1),
        }
      : null
  }
}
