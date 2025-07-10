import { IBlockContextState } from '../../render-context'
import { BaseBlockToken } from './base-block-token'
import { SpaceMatcher } from './token-matchers'
import { IBlockToken } from './types'

export class SpaceToken extends BaseBlockToken {
  constructor(textSrc: string, lastToken?: IBlockToken) {
    super(textSrc, lastToken, new SpaceMatcher())
  }

  protected override getDesiredContextState(): Partial<IBlockContextState> {
    return {}
  }

  protected extractContentFromMatch(): void {
    if (!this._capture) return
    this.raw = this.content = this._capture[0]
  }

  public renderAsMarkdown(): string {
    return this.content.includes('\n') ? '\n\n' : ' '
  }

  public override requiresSpacingBefore(): boolean {
    return false
  }

  public override requiresSpacingAfter(): boolean {
    return false
  }

  public override updateContextState(): boolean {
    return false
  }
}
