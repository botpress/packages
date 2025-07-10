import { IBlockContextState, IMarkdownRenderContext } from '../../../render-context'
import { BaseMultilineBlockToken } from '../base-multiline-block-token'
import { IBlockToken } from '../types'

export abstract class BaseListToken extends BaseMultilineBlockToken {
  protected canAppendToToken(token?: IBlockToken): boolean {
    return token instanceof BaseListToken
  }

  protected getDesiredContextState(): Partial<IBlockContextState> {
    return { isInList: true }
  }

  public override requiresSpacingBefore(context: IMarkdownRenderContext): boolean {
    return !context.currentState.isInList
  }

  public override requiresSpacingAfter(nextToken?: IBlockToken): boolean {
    return !(nextToken instanceof BaseListToken)
  }

  public renderAsMarkdown(): string {
    return this.items
      .map(
        (item, index) =>
          `${this.getListItemPrefix(index)}${item.tokens.map((token) => token.renderAsMarkdown()).join('')}`,
      )
      .join('\n')
  }

  protected abstract getListItemPrefix(index?: number): string
}
