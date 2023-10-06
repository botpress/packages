import { lists } from '..'

const main = async () => {
  const entities: lists.ListEntityDef[] = [
    {
      name: 'fruit',
      fuzzy: 'medium',
      values: [
        {
          name: 'apple',
          synonyms: ['apples', 'red apple', 'red apples', 'aple']
        }
      ]
    }
  ]
  const ex = new lists.ListEntityExtractor(entities, { engine: 'wasm' })

  const extracted = ex.extract('I like appels and oranges')

  console.log(extracted)
  if (extracted.length !== 1) {
    throw new Error('Expected 1 extracted entity')
  }
}

void main()
  .then(() => {
    console.log('done')
    process.exit(0)
  })
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
