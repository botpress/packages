import { MarkdownSyntax } from '../../../text-utilities/markdown-syntax'
import { RegexPatterns } from '../../../text-utilities/regex-patterns'
import { BaseFormattedToken } from './base-formatted-token'

export class StrikethroughToken extends BaseFormattedToken {
  protected readonly _delimiter = MarkdownSyntax.SLACK.STRIKETHROUGH
  protected readonly _markdownDelimiter = MarkdownSyntax.MARKDOWN.STRIKETHROUGH
  public static override readonly SEARCH_QUERY = RegexPatterns.STRIKETHROUGH
}
