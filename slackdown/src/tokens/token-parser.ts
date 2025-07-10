import { TextToken } from './inline/text-token'
import type { IInlineToken } from './inline/types'
import { TokenRegistry } from './registry/token-registry'

interface TokenMatch {
  readonly tokenName: string
  readonly content: string
  readonly index: number
  readonly length: number
}

export class TokenParser {
  private readonly registry: TokenRegistry
  private static instance: TokenParser

  constructor() {
    this.registry = TokenRegistry.getInstance()
  }

  public static getInstance(): TokenParser {
    if (!TokenParser.instance) {
      TokenParser.instance = new TokenParser()
    }
    return TokenParser.instance
  }

  public parseText(text: string): IInlineToken[] {
    return this.parseFromIndex(text, 0)
  }

  private parseFromIndex(text: string, startIndex: number): IInlineToken[] {
    const tokens: IInlineToken[] = []
    let currentIndex = startIndex

    while (currentIndex < text.length) {
      const match = this.findNextMatch(text, currentIndex)
      if (!match) {
        this.handleRemainingText(tokens, text, currentIndex)
        break
      }

      this.handleTextBeforeMatch(tokens, text, currentIndex, match.index)
      const token = this.createNestedToken(match)
      tokens.push(token)
      currentIndex = match.index + match.length
    }

    return tokens
  }

  private findNextMatch(text: string, startIndex: number): TokenMatch | null {
    const pattern = this.registry.getSearchPattern()
    const regex = new RegExp(pattern, 'g')
    regex.lastIndex = startIndex

    const match = regex.exec(text)
    if (!match) {
      return null
    }

    const groups = match.groups ?? {}
    const [tokenName, content] = Object.entries(groups).find(([, value]) => value) ?? []

    return tokenName && content
      ? {
          tokenName,
          content,
          index: match.index,
          length: content.length,
        }
      : null
  }

  private createNestedToken(match: TokenMatch): IInlineToken {
    const token = this.registry.createToken(match.tokenName, match.content)
    const nestedTokens = this.parseText(token.stripDelimiters())
    token.addTokens(nestedTokens)
    return token
  }

  private handleRemainingText(tokens: IInlineToken[], text: string, currentIndex: number): void {
    const remainingText = text.slice(currentIndex)
    if (remainingText) {
      tokens.push(new TextToken(remainingText))
    }
  }

  private handleTextBeforeMatch(tokens: IInlineToken[], text: string, currentIndex: number, matchIndex: number): void {
    if (matchIndex > currentIndex) {
      const textBeforeMatch = text.slice(currentIndex, matchIndex)
      tokens.push(new TextToken(textBeforeMatch))
    }
  }
}
