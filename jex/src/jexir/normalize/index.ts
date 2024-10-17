import { JexIR } from '../typings'
import { applyIntersections } from './apply-intersections'
import { flattenIntersections } from './flatten-intersections'
import { flattenUnions } from './flatten-unions'

export const normalize = (jexirSchema: JexIR): JexIR => {
  jexirSchema = flattenUnions(jexirSchema)
  jexirSchema = flattenIntersections(jexirSchema)
  jexirSchema = applyIntersections(jexirSchema)
  return jexirSchema
}
