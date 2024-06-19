import { z } from './src'


// // fs.writeFileSync('./output.ts', typings)
// const schema = z.coerce.date().displayAs({ id: 'doood', params: {} } as never)
// const serialized = schema.toJsonSchema()

// const deserialized = z.fromJsonSchema(serialized)
// console.log(serialized)
// console.log(deserialized._def)
// console.log(deserialized.parse(new Date().toISOString()).toISOString())


// const schema = z.coerce.string()

// const serialized = schema.toJsonSchema()
// console.log(serialized)
// const deserialized = z.fromJsonSchema(serialized)
// console.log(deserialized._def)
// console.log(deserialized.parse('hello') && true )
// console.log(typeof deserialized.parse(5) === 'string')



// const schema = z.coerce.bigint()

// const serialized = schema.toJsonSchema()
// console.log(serialized)

// const deserialized = z.fromJsonSchema(serialized)
// console.log(deserialized._def)
// console.log(deserialized.parse('5555') === 5555)


// const schema = z.coerce.boolean()
// const serialized = schema.toJsonSchema()
// console.log(serialized)

// const deserialized = z.fromJsonSchema(serialized)

// console.log(deserialized._def)

// console.log(deserialized.parse('true') === true)
