import { z } from './src'

console.log(z.string().displayAs('default', {}).ui)
const schhema = z
  .object({
    name: z.string().displayAs('default', {}).title('Name'),
  })
  .displayAs('default', {})

console.log(schhema.ui)
console.log(schhema._def)
console.log(JSON.stringify(schhema.toJsonSchema()))
schhema.toTypescriptTypings().then((t) => console.log(t))
