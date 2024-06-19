import { z } from './src'


// fs.writeFileSync('./output.ts', typings)
const schema = z.coerce.date().displayAs({ id: 'doood', params: {} } as never)
const serialized = schema.toJsonSchema()

const deserialized = z.fromJsonSchema(serialized)
console.log(serialized)
console.log(deserialized._def)
console.log(deserialized.parse(new Date().toISOString()).toISOString())