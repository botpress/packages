import { BaseBlockToken } from './base-block-token'
import { ParagraphMatcher } from './token-matchers'
import { TokenParser } from '../token-parser'
import { RegexPatterns } from '../../text-utilities/regex-patterns'
import { IBlockToken } from './types'
import { IBlockContextState } from '../../render-context'

export class ParagraphToken extends BaseBlockToken {
  private static readonly HEADER_PATTERN = RegexPatterns.HEADER

  constructor(textSrc: string, lastToken?: IBlockToken) {
    super(textSrc, lastToken, new ParagraphMatcher())
  }

  protected override getDesiredContextState(): Partial<IBlockContextState> {
    return {}
  }

  protected extractContentFromMatch(): void {
    if (!this._capture) return

    this.raw = this._capture[0]
    this.content = this._capture[1]?.trim() ?? ''
    const tokens = TokenParser.getInstance().parseText(this.content)
    this.addItem({ content: this.content, tokens })
  }

  public renderAsMarkdown(): string {
    const content = this.items[0]?.tokens.map((t) => t.renderAsMarkdown()).join('') ?? ''
    return this.shouldEscapeHeaderSyntax() ? `\\${content}` : content
  }

  private shouldEscapeHeaderSyntax(): boolean {
    return new RegExp(ParagraphToken.HEADER_PATTERN).test(this.content)
  }

  public override requiresSpacingAfter(): boolean {
    return true
  }
}
