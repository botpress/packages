import { MarkdownSyntax } from '../../../text-utilities/markdown-syntax'
import { RegexPatterns } from '../../../text-utilities/regex-patterns'
import { BaseFormattedToken } from './base-formatted-token'

export class CodeToken extends BaseFormattedToken {
  protected readonly _delimiter = MarkdownSyntax.SLACK.CODE
  protected readonly _markdownDelimiter = MarkdownSyntax.MARKDOWN.CODE
  public static override readonly SEARCH_QUERY = RegexPatterns.CODE
}
