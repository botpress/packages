import { IBlockToken, IBlockTokenContent, IBlockTokenMatcher } from './types'
import { IBlockContextState, IMarkdownRenderContext } from '../../render-context'

export abstract class BaseBlockToken implements IBlockToken {
  private _ignore = false
  protected _capture: RegExpExecArray | null = null
  private _rawContent = ''
  private _textContent = ''
  private _items: IBlockTokenContent[] = []

  constructor(
    protected readonly textSrc: string,
    protected readonly lastToken: IBlockToken | undefined,
    protected readonly matcher: IBlockTokenMatcher,
  ) {}

  public updateContextState(context: IMarkdownRenderContext): void {
    context.transitionTo(this.getDesiredContextState())
  }

  protected abstract getDesiredContextState(): Partial<IBlockContextState>

  public get ignore(): boolean {
    return this._ignore
  }

  protected set ignore(value: boolean) {
    this._ignore = value
  }

  public get raw(): string {
    return this._rawContent
  }

  protected set raw(value: string) {
    this._rawContent = value
  }

  public get content(): string {
    return this._textContent
  }

  protected set content(value: string) {
    this._textContent = value
  }

  public get items(): ReadonlyArray<IBlockTokenContent> {
    return this._items
  }

  protected addItem(item: IBlockTokenContent): void {
    this._items.push(item)
  }

  public hasMatchingContent(): boolean {
    this._capture = this.matcher.match(this.textSrc)
    if (!this._capture?.length) return false

    this.extractContentFromMatch()
    return true
  }

  public getRemainingText(): string {
    return this.textSrc.slice(this.raw.length)
  }

  public requiresSpacingBefore(_context: IMarkdownRenderContext): boolean {
    return true
  }

  public requiresSpacingAfter(_nextToken?: IBlockToken): boolean {
    return true
  }

  protected abstract extractContentFromMatch(): void
  public abstract renderAsMarkdown(): string
}
