import { JexIR } from '../typings'
import { flattenIntersections } from './flatten-intersections'
import { flattenUnions } from './flatten-unions'

export const normalize = (jexirSchema: JexIR): JexIR => {
  jexirSchema = flattenUnions(jexirSchema)
  jexirSchema = flattenIntersections(jexirSchema)

  // TODO: apply intersections to objects like { a: string } & { b: number } => { a: string, b: number }

  return jexirSchema
}
