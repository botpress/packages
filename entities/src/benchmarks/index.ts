import { ListEntityModel } from '../list-engine'

import * as bench1 from './benchmark-1'

export type BenchMark = {
  name: string
  entities: ListEntityModel[]
  utterances: string[]
}

export const benchmark1: BenchMark = {
  name: 'benchmark-1',
  entities: bench1.listEntities,
  utterances: bench1.utterances
}
