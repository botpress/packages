import { MarkdownSyntax } from '../../../text-utilities/markdown-syntax'
import { RegexPatterns } from '../../../text-utilities/regex-patterns'
import { BaseFormattedToken } from './base-formatted-token'

export class ItalicToken extends BaseFormattedToken {
  protected readonly _delimiter = MarkdownSyntax.SLACK.ITALIC
  protected readonly _markdownDelimiter = MarkdownSyntax.MARKDOWN.ITALIC
  public static override readonly SEARCH_QUERY = RegexPatterns.ITALIC
}
