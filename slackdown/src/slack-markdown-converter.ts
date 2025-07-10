import { IMarkdownRenderContext, MarkdownRenderContext, IBlockContextState } from './render-context'
import { TextCleaner } from './text-utilities/text-cleaner'
import { BlockTokenizer } from './tokens/block/block-tokenizer'
import { IBlockToken } from './tokens/block/types'
import { registerTokens } from './tokens/registry/token-registration'

export class SlackMarkdownConverter {
  private readonly _tokens: IBlockToken[]
  private readonly _context: IMarkdownRenderContext
  private readonly _spacingFormatter: SpacingFormatter

  public constructor(src: string) {
    registerTokens()
    this._context = new MarkdownRenderContext()
    this._spacingFormatter = new SpacingFormatter(this._context)
    const normalizedText = TextCleaner.stripDelimiter(src || '', '\r')
    this._tokens = BlockTokenizer.tokenize(normalizedText)
  }

  public toMarkdown(): string {
    const result = this._tokens.reduce((acc, token, i) => {
      const rendered = token.renderAsMarkdown()
      if (!rendered) return acc

      return this._spacingFormatter.format(acc, token, this._tokens[i + 1])
    }, '')

    return TextCleaner.cleanupMarkdown(result)
  }
}

class SpacingFormatter {
  constructor(private readonly context: IMarkdownRenderContext) {}

  public format(currentResult: string, token: IBlockToken, nextToken?: IBlockToken): string {
    const previousState = this.context.currentState
    token.updateContextState(this.context)
    const needsBlockSeparator = this.stateRequiresBlockSeparator(previousState)

    let result = currentResult
    result = this.handleLeadingSpacing(result, token, needsBlockSeparator)
    result += token.renderAsMarkdown()
    result = this.handleTrailingSpacing(result, token, nextToken)

    return result
  }

  private stateRequiresBlockSeparator(previousState: IBlockContextState): boolean {
    const currentState = this.context.currentState
    return (
      previousState.isInList !== currentState.isInList ||
      previousState.isInBlockQuote !== currentState.isInBlockQuote ||
      previousState.isInCodeBlock !== currentState.isInCodeBlock
    )
  }

  private handleLeadingSpacing(currentResult: string, token: IBlockToken, needsBlockSeparator: boolean): string {
    if (!token.requiresSpacingBefore(this.context)) {
      return currentResult
    }

    if (needsBlockSeparator) {
      return TextCleaner.ensureDoubleNewline(currentResult)
    }

    if (this.context.currentState.isInList || this.context.currentState.isInBlockQuote) {
      return currentResult.endsWith('\n') ? currentResult : currentResult + '\n'
    }

    return currentResult
  }

  private handleTrailingSpacing(currentResult: string, token: IBlockToken, nextToken?: IBlockToken): string {
    return token.requiresSpacingAfter(nextToken) ? TextCleaner.ensureDoubleNewline(currentResult) : currentResult
  }
}
