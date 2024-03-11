import decompress from 'decompress'
import fs from 'fs'
import fsAsync from 'fs/promises'
import log from '../log'
import type { CodePostProcessor } from '../opapi'
import { OpenapiGeneratorClient } from '../openapi-generator-client'

export const runOpenApiCodeGenerator = async (
  dir: string,
  endpoint: string,
  openapiSpect: any,
  openApiPostProcessor?: CodePostProcessor,
) => {
  const client = OpenapiGeneratorClient(endpoint)

  const id = await client.generateClient(openapiSpect, {
    supportsES6: true,
    useSingleRequestParameter: true,
    withNodeImports: false,
  })

  const buffer = await client.downloadClient(id)
  await decompress(buffer, dir, { strip: 1, filter: (file) => file.path.endsWith('.ts') })

  const codePath = `${dir}/api.ts`
  if (!fs.existsSync(codePath)) {
    throw new Error(`Generated code not found at "${codePath}" after decompressing the OpenAPI Generator output`)
  }

  if (openApiPostProcessor) {
    log.info('Running OpenAPI code post processor')
    let code = await fsAsync.readFile(codePath, 'utf8')
    code = await openApiPostProcessor(code)
    await fsAsync.writeFile(codePath, code)
  }
}
