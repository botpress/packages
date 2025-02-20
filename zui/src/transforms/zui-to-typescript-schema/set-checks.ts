import { primitiveToTypescriptValue as toTs } from '../common/utils'
// import { ZodArrayDef } from '../../z/types/array'

// export const generateArrayChecks = (def: ZodArrayDef): string => {
//   const checks: string[] = []
//   if (def.exactLength) {
//     const { value, message } = def.exactLength
//     checks.push(`.length(${toTs(value)}, ${toTs(message)})`)
//   }
//   if (def.minLength) {
//     const { value, message } = def.minLength
//     checks.push(`.min(${toTs(value)}, ${toTs(message)})`)
//   }
//   if (def.maxLength) {
//     const { value, message } = def.maxLength
//     checks.push(`.max(${toTs(value)}, ${toTs(message)})`)
//   }
//   return checks.join('')
// }
import { ZodSetDef } from '../../z/types/set'
export const generateSetChecks = (def: ZodSetDef): string => {
  const checks: string[] = []
  if (def.minSize) {
    const { value, message } = def.minSize
    checks.push(`.min(${toTs(value)}, ${toTs(message)})`)
  }
  if (def.maxSize) {
    const { value, message } = def.maxSize
    checks.push(`.max(${toTs(value)}, ${toTs(message)})`)
  }
  return checks.join('')
}
