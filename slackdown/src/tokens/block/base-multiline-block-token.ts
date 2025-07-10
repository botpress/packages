import { BaseBlockToken } from './base-block-token'
import { IBlockToken } from './types'
import { TokenParser } from '../token-parser'

export abstract class BaseMultilineBlockToken extends BaseBlockToken {
  public override hasMatchingContent(): boolean {
    const hasMatch = super.hasMatchingContent()
    if (!hasMatch) {
      return false
    }

    this.processContent()
    return true
  }

  protected processContent(): void {
    if (this.canAppendToToken(this.lastToken)) {
      this.appendToLastToken()
      this.ignore = true
    } else {
      this.appendContent(this.content)
    }
  }

  protected appendContent(content: string): void {
    const inlineTokens = TokenParser.getInstance().parseText(content)
    this.addItem({ content, tokens: inlineTokens })
  }

  protected appendToLastToken(): void {
    if (this.lastToken instanceof BaseMultilineBlockToken) {
      this.lastToken.appendContent(this.content)
    }
  }

  protected abstract canAppendToToken(token?: IBlockToken): boolean
}
