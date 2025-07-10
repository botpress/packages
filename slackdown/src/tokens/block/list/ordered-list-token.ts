import { OrderedListMatcher } from '../token-matchers'
import { IBlockToken } from '../types'
import { BaseListToken } from './base-list-token'

export class OrderedListToken extends BaseListToken {
  constructor(textSrc: string, lastToken?: IBlockToken) {
    super(textSrc, lastToken, new OrderedListMatcher())
  }

  protected extractContentFromMatch(): void {
    if (!this._capture) return
    this.raw = this._capture[0] ?? ''
    this.content = this._capture[1] ?? ''
  }

  protected getListItemPrefix(index: number): string {
    return `${index + 1}. `
  }
}
