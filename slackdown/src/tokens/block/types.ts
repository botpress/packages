import { IMarkdownRenderContext } from '../../render-context'
import { IInlineToken } from '../inline/types'

export interface IBlockTokenContent {
  content: string
  tokens: IInlineToken[]
}

export interface IBlockToken {
  readonly raw: string
  readonly content: string
  readonly items: ReadonlyArray<IBlockTokenContent>
  readonly ignore: boolean

  hasMatchingContent(): boolean
  getRemainingText(): string
  updateContextState(context: IMarkdownRenderContext): void
  requiresSpacingBefore(context: IMarkdownRenderContext): boolean
  requiresSpacingAfter(nextToken?: IBlockToken): boolean
  renderAsMarkdown(): string
}

export interface IBlockTokenMatcher {
  match(text: string): RegExpExecArray | null
}
