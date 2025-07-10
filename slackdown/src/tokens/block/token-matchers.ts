import { RegexPatterns } from '../../text-utilities/regex-patterns'
import { IBlockTokenMatcher } from './types'

export class ParagraphMatcher implements IBlockTokenMatcher {
  public match(text: string): RegExpExecArray | null {
    return new RegExp(RegexPatterns.PARAGRAPH).exec(text)
  }
}

export class BlockQuoteMatcher implements IBlockTokenMatcher {
  public match(text: string): RegExpExecArray | null {
    return new RegExp(RegexPatterns.BLOCK_QUOTE).exec(text)
  }
}

export class CodeBlockMatcher implements IBlockTokenMatcher {
  private static readonly UNCLOSED_PATTERN = /^```[^`]*$/

  public match(text: string): RegExpExecArray | null {
    return this.isUnclosedCodeBlock(text)
      ? new RegExp(text).exec(text)
      : new RegExp(RegexPatterns.CODE_BLOCK, 's').exec(text)
  }

  private isUnclosedCodeBlock(text: string): boolean {
    return CodeBlockMatcher.UNCLOSED_PATTERN.test(text)
  }
}

export class BulletedListMatcher implements IBlockTokenMatcher {
  public match(text: string): RegExpExecArray | null {
    return new RegExp(RegexPatterns.BULLETED_LIST).exec(text)
  }
}

export class OrderedListMatcher implements IBlockTokenMatcher {
  public match(text: string): RegExpExecArray | null {
    return new RegExp(RegexPatterns.ORDERED_LIST).exec(text)
  }
}

export class SpaceMatcher implements IBlockTokenMatcher {
  public match(text: string): RegExpExecArray | null {
    return new RegExp(RegexPatterns.SPACE).exec(text)
  }
}
