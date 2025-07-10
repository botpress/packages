import { MarkdownSyntax } from '../../text-utilities/markdown-syntax'
import { RegexPatterns } from '../../text-utilities/regex-patterns'
import { TextCleaner } from '../../text-utilities/text-cleaner'
import { isValidUrl } from '../../text-utilities/url-validation'
import { BaseInlineToken } from './base-inline-token'

export class LinkToken extends BaseInlineToken {
  private readonly _url: string
  private readonly _displayText: string

  public constructor(textSrc: string) {
    super(textSrc)
    const content = TextCleaner.stripDelimiter(textSrc, MarkdownSyntax.SLACK.LINK_START).replaceAll(/^<|>$/g, '')
    const [url = '', displayText = ''] = content.split(MarkdownSyntax.SLACK.LINK_SEPARATOR)
    this._url = url
    this._displayText = displayText || url
  }

  public static override readonly SEARCH_QUERY = RegexPatterns.LINK

  public stripDelimiters(): string {
    return this._displayText
  }

  protected _renderFormattedContent(): string {
    return isValidUrl(this._url) ? `[${this._displayText}](${this._url})` : this.raw
  }
}
