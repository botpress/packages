## How to use

```js
import { zui, getZuiSchemas } from '@bpinternal/zui'

const objectSchema = zui.object({
  name: zui.string().title('Name').describe('Name of the user'),
  age: zui.number().min(0).max(100).title('Age').describe('Age in years'),
  hobby: zui.string().title('Hobby').examples(['Skiing', 'Hiking', 'Swimming', 'Coding'])
})

// schema: JSON Schema containing the additional properties under `x-zui`
// uischema: Can be provided to jsonform to show the UI
const { schema, uischema } = getZuiSchemas(objectSchema)
```
