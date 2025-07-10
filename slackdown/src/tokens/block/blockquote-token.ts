import { IBlockContextState, IMarkdownRenderContext } from '../../render-context'
import { MarkdownSyntax } from '../../text-utilities/markdown-syntax'
import { TextCleaner } from '../../text-utilities/text-cleaner'
import { BaseMultilineBlockToken } from './base-multiline-block-token'
import { BlockQuoteMatcher } from './token-matchers'
import { IBlockToken } from './types'

export class BlockQuoteToken extends BaseMultilineBlockToken {
  constructor(textSrc: string, lastToken?: IBlockToken) {
    super(textSrc, lastToken, new BlockQuoteMatcher())
  }

  protected canAppendToToken(token?: IBlockToken): boolean {
    return token instanceof BlockQuoteToken
  }

  protected getDesiredContextState(): Partial<IBlockContextState> {
    return { isInBlockQuote: true }
  }

  public override requiresSpacingBefore(context: IMarkdownRenderContext): boolean {
    return !context.currentState.isInBlockQuote
  }

  public override requiresSpacingAfter(nextToken?: IBlockToken): boolean {
    return !(nextToken instanceof BlockQuoteToken)
  }

  protected extractContentFromMatch(): void {
    if (!this._capture) return
    this.raw = this._capture[0] ?? ''
    this.content = this._capture[1] ?? ''
  }

  public renderAsMarkdown(): string {
    return this.items
      .map((item) => {
        const content = item.tokens.map((token) => token.renderAsMarkdown()).join(' ')
        return `${MarkdownSyntax.MARKDOWN.BLOCK_QUOTE_PREFIX}${TextCleaner.normalizeWhitespace(content)}`
      })
      .join('\n')
  }
}
