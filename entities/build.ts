import fs from 'fs'
import _ from 'lodash'
const bytes = fs.readFileSync('./node_modules/entities-wasm/web/entities_bg.wasm')

const chunks = _.chunk(bytes.toString('base64'), 128)
  .map((c, idx, arr) => `"${c.join('')}"${idx === arr.length - 1 ? '' : ','}`)
  .join('\n')

const fileContent = `export const wasmBin = [
    ${chunks}
].join('')
`

fs.writeFileSync('src/lists/engines/wasm/bin.ts', fileContent)
