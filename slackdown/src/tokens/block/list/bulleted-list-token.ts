import { MarkdownSyntax } from '../../../text-utilities/markdown-syntax'
import { BulletedListMatcher } from '../token-matchers'
import { IBlockToken } from '../types'
import { BaseListToken } from './base-list-token'

export class BulletedListToken extends BaseListToken {
  constructor(textSrc: string, lastToken?: IBlockToken) {
    super(textSrc, lastToken, new BulletedListMatcher())
  }

  protected extractContentFromMatch(): void {
    if (!this._capture) return
    this.raw = this._capture[0] ?? ''
    this.content = this._capture[1] ?? ''
  }

  protected getListItemPrefix(): string {
    return `${MarkdownSyntax.MARKDOWN.BULLET} `
  }
}
