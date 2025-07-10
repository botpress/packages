import { TokenRegistry } from '../registry/token-registry'
import { InlineTokenRenderer } from './renderer'
import type { IInlineToken } from './types'

export abstract class BaseInlineToken implements IInlineToken {
  protected _raw: string
  protected _content: string
  protected _tokens: IInlineToken[] = []

  public static readonly SEARCH_QUERY: string = ''

  public constructor(textSrc: string) {
    this._raw = textSrc
    this._content = textSrc
  }

  public get raw(): string {
    return this._raw
  }

  public get content(): string {
    return this._content
  }

  protected set content(value: string) {
    this._content = value
  }

  public get tokens(): IInlineToken[] {
    return this._tokens
  }

  public addTokens(tokens: IInlineToken[]): void {
    this._tokens = tokens
  }

  protected renderChildTokens(): string {
    return InlineTokenRenderer.renderInlineTokens(this._tokens)
  }

  public renderAsMarkdown(): string {
    if (this._tokens.length > 0) {
      this.content = this.renderChildTokens()
      this._tokens = []
    }
    return this._renderFormattedContent()
  }

  public static register(): void {
    TokenRegistry.getInstance().register(this as unknown as any)
  }

  public abstract stripDelimiters(): string
  protected abstract _renderFormattedContent(): string
}
