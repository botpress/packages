import { BaseInlineToken } from './base-inline-token'

export class TextToken extends BaseInlineToken {
  public stripDelimiters(): string {
    return this.content
  }

  protected _renderFormattedContent(): string {
    return this.content
  }
}
