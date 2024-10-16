import * as jexir from './jexir'

export const jexMerge = (a: jexir.JexIRObject, b: jexir.JexIRObject): jexir.JexIRObject => {
  const merged: jexir.JexIRObject = { type: 'object', properties: {} }

  const aKeys = Object.keys(a.properties)
  const bKeys = Object.keys(b.properties)
  const allKeys = new Set([...aKeys, ...bKeys])

  for (const key of allKeys) {
    const aProp = a.properties[key]
    const bProp = b.properties[key]

    if (bProp) {
      merged.properties[key] = bProp // no deep merge, just overwrite
    } else if (aProp) {
      merged.properties[key] = aProp
    }
  }

  return merged
}
