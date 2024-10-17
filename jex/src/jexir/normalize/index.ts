import { JexIR } from '../typings'
import { flattenIntersections } from './flatten-intersections'
import { flattenUnions } from './flatten-unions'

export const normalize = (jexirSchema: JexIR): JexIR => {
  jexirSchema = flattenUnions(jexirSchema)
  jexirSchema = flattenIntersections(jexirSchema)
  return jexirSchema
}
