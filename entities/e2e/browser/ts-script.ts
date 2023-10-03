import { spaceTokenizer } from '../../src/lists/space-tokenizer'
import { extractForListModels } from '../../src/lists/engines/wasm'

const json = <T>(obj: T): string => JSON.stringify(obj, null, 2)

const main = async () => {
  const es = extractForListModels(spaceTokenizer('I want to eat an apple'), [
    {
      name: 'fruit',
      fuzzy: 0.8,
      values: [
        {
          name: 'apple',
          synonyms: ['apple', 'apples', 'aple', 'appel'].map((x) => ({ tokens: spaceTokenizer(x) }))
        }
      ]
    }
  ])

  console.log(json(es))
}
void main()
  .then(() => {})
  .catch((err) => {
    console.error('ERROR', err.message)
  })
