# Entities

Botpress Entities Extractor

## Install

```bash
npm i @bpinternal/entities
```

## Usage

```ts
import { lists } from '@bpinternal/entities'

const listEntities: lists.ListEntityDef[] = [
  {
    name: 'fruit',
    fuzzy: 'medium',
    values: [
      { name: 'Blueberry', synonyms: ['blueberries', 'blueberry', 'blue berries', 'blue berry'] },
      { name: 'Strawberry', synonyms: ['strawberries', 'strawberry', 'straw berries', 'straw berry'] },
      { name: 'Raspberry', synonyms: ['raspberries', 'raspberry', 'rasp berries', 'rasp berry'] },
      { name: 'Apple', synonyms: ['apple', 'apples', 'red apple', 'yellow apple'] }
    ]
  },
  {
    name: 'company',
    fuzzy: 'medium',
    values: [{ name: 'Apple', synonyms: ['Apple', 'Apple Computers', 'Apple Corporation', 'Apple Inc'] }]
  }
]

const extractor = new lists.ListEntityExtractor(listEntities, { engine: 'wasm' })

const results = extractor.extract('I like blueberries and apples')
console.log(results) // 2 of type fruit and 1 of type company
```

## Disclaimer ⚠️

This package is published under the `@bpinternal` organization. All packages of this organization are meant to be used by the [Botpress](https://github.com/botpress/botpress) team internally and are not meant for our community. However, these packages were still left intentionally public for an important reason : We Love Open-Source. Therefore, if you wish to install this package feel absolutly free to do it. We strongly recomand that you tag your versions properly.

The Botpress Engineering team.

## Licensing

This software is protected by the same license as the [main Botpress repository](https://github.com/botpress/botpress). You can find the license file [here](https://github.com/botpress/botpress/blob/master/LICENSE).
