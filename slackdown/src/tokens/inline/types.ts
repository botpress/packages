export interface IInlineToken {
  readonly raw: string
  readonly content: string
  readonly tokens: IInlineToken[]

  addTokens(tokens: IInlineToken[]): void
  renderAsMarkdown(): string
  stripDelimiters(): string
}
