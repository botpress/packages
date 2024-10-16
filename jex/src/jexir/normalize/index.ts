import { JexIR } from '../typings'
import { flattenUnions } from './flatten-unions'

export const normalize = (jexirSchema: JexIR): JexIR => {
  jexirSchema = flattenUnions(jexirSchema)
  return jexirSchema
}
