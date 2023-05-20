import * as wasm from './pkg'

export const spaceTokenizer = (text: string): string[] => {
  return text.split(new RegExp('( )', 'g')).filter((x) => !!x)
}

wasm.greet()

wasm.print('Hello, entities!')

console.log(wasm.jaro_winkler_sim('helloo', 'hello'))
console.log(wasm.levenshtein_sim('helloo', 'hello'))

const strTokens = spaceTokenizer('never gonNa give You up never gonna Let you down')
const tokens = wasm.to_toks(strTokens)

console.log(tokens)
