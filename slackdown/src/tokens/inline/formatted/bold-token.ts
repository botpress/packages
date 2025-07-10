import { MarkdownSyntax } from '../../../text-utilities/markdown-syntax'
import { RegexPatterns } from '../../../text-utilities/regex-patterns'
import { BaseFormattedToken } from './base-formatted-token'

export class BoldToken extends BaseFormattedToken {
  protected readonly _delimiter = MarkdownSyntax.SLACK.BOLD
  protected readonly _markdownDelimiter = MarkdownSyntax.MARKDOWN.BOLD
  public static override readonly SEARCH_QUERY = RegexPatterns.BOLD
}
