import { BoldToken } from '../inline/formatted/bold-token'
import { CodeToken } from '../inline/formatted/code-token'
import { ItalicToken } from '../inline/formatted/italic-token'
import { StrikethroughToken } from '../inline/formatted/strikethrough-token'
import { LinkToken } from '../inline/link-token'
import { TextToken } from '../inline/text-token'

export const registerTokens = () => {
  BoldToken.register()
  ItalicToken.register()
  CodeToken.register()
  StrikethroughToken.register()
  LinkToken.register()
  TextToken.register()
}
