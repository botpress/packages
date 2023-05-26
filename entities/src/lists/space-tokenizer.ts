import { Tokenizer } from './typings'

export const spaceTokenizer: Tokenizer = (text: string): string[] => {
  return text.split(new RegExp('( )', 'g')).filter((x) => !!x)
}
