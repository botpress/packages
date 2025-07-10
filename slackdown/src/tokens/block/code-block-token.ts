import { IBlockContextState, IMarkdownRenderContext } from '../../render-context'
import { MarkdownSyntax } from '../../text-utilities/markdown-syntax'
import { BaseMultilineBlockToken } from './base-multiline-block-token'
import { CodeBlockMatcher } from './token-matchers'
import { IBlockToken } from './types'

export class CodeBlockToken extends BaseMultilineBlockToken {
  private static readonly NEWLINE_TRIM_PATTERN = /^\n+|\n+$/g
  private static readonly BACKTICK_PATTERN = /^```|```$/g
  private static readonly UNCLOSED_PATTERN = /^```[^`]*$/

  constructor(textSrc: string, lastToken?: IBlockToken) {
    super(textSrc, lastToken, new CodeBlockMatcher())
  }

  protected canAppendToToken(token?: IBlockToken): boolean {
    return token instanceof CodeBlockToken
  }

  protected override getDesiredContextState(): Partial<IBlockContextState> {
    return { isInCodeBlock: true }
  }

  public override requiresSpacingBefore(context: IMarkdownRenderContext): boolean {
    return !context.currentState.isInCodeBlock
  }

  public override requiresSpacingAfter(nextToken?: IBlockToken): boolean {
    return !(nextToken instanceof CodeBlockToken)
  }

  private isUnclosedCodeBlock(text: string): boolean {
    return CodeBlockToken.UNCLOSED_PATTERN.test(text)
  }

  protected extractContentFromMatch(): void {
    if (!this._capture) return
    this.raw = this._capture[0]

    if (this.isUnclosedCodeBlock(this.raw)) {
      this.content = this.raw.replace(CodeBlockToken.BACKTICK_PATTERN, '')
    } else {
      this.content =
        this._capture[1]
          ?.replace(CodeBlockToken.NEWLINE_TRIM_PATTERN, '')
          ?.split('\n')
          ?.map((line) => line.trimEnd())
          ?.join('\n') ?? ''
    }
  }

  public renderAsMarkdown(): string {
    if (this.isUnclosedCodeBlock(this.raw)) {
      return this.raw
    }

    return [
      `${MarkdownSyntax.MARKDOWN.CODE_BLOCK_FENCE}${MarkdownSyntax.MARKDOWN.CODE_BLOCK_LANG}`,
      this.content,
      MarkdownSyntax.MARKDOWN.CODE_BLOCK_FENCE,
    ].join('\n')
  }
}
