import { ListEntityModel, extractForListModel } from './list-engine'
import { spaceTokenizer } from './space-tokenizer'

const extractUtt = (utt: string, model: ListEntityModel) => {
  const tokens = spaceTokenizer(utt)
  return extractForListModel(tokens, model)
}

const output = extractUtt('Blueberries are berries that are blue', {
  name: 'fruit',
  fuzzy: 0.8,
  tokens: {
    Blueberry: [['Blueberries'], ['berries']]
  }
})

console.log(output)
