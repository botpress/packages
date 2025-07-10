import { TextCleaner } from '../../../text-utilities/text-cleaner'
import { BaseInlineToken } from '../base-inline-token'

export abstract class BaseFormattedToken extends BaseInlineToken {
  protected abstract readonly _delimiter: string
  protected abstract readonly _markdownDelimiter: string

  public stripDelimiters(): string {
    return TextCleaner.stripDelimiter(this.raw, this._delimiter)
  }

  protected _renderFormattedContent(): string {
    return `${this._markdownDelimiter}${this.content}${this._markdownDelimiter}`
  }
}
