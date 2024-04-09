import { z } from './src'

console.log(z.string().ui)
const schhema = z.object({
  name: z.string().title('Name'),
})

console.log(schhema.ui)
console.log(schhema._def)
console.log(JSON.stringify(schhema.toJsonSchema()))
schhema.toTypescriptTypings().then((t) => console.log(t))
