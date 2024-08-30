import { JSONSchema, z, ZodType } from '../../src'
import { Flex } from '@radix-ui/themes'
import { debounce } from 'lodash'
import * as prettier from 'prettier'
import * as estreePlugin from 'prettier/plugins/estree'
import * as typescriptPlugin from 'prettier/plugins/typescript'
import { useEffect, useState } from 'react'
import { MonacoEditor } from './MonacoEditor'
import { useLocalStorage } from './hooks'
import { ZuiForm } from './ZuiForm'

const initialSchemaCode = `z
  .object({
    someDate: z.date().optional().default(new Date()),
    anEnum: z.enum(['a','b']).optional(),
    textLines: z.array(z.string()).optional().default(['d', 'e']),
    strArrayOptional: z.array(z.string()).optional(),
    defaultNumber: z.number().default(42),
  }).disabled((obj) => {
    return {
      someDate: obj?.anEnum === 'a',
    }
  })`

const getErrorMessage = (error?: unknown) => {
  if (error instanceof Error) {
    return error.message
  }
  return null
}

const formatCode = (code: string) => {
  return prettier.format(code, {
    parser: 'typescript',
    plugins: [typescriptPlugin, estreePlugin],
    singleQuote: true,
    printWidth: 120,
    trailingComma: 'none',
    semi: false,
    bracketSpacing: true,
    requirePragma: false,
  })
}

const CollapsiblePanel = ({
  label,
  defaultOpened,
  children,
}: {
  label: string
  defaultOpened?: boolean
  children: React.ReactNode
}) => {
  const [opened, setOpened] = useState(defaultOpened)
  return (
    <div style={{ border: '1px solid black', padding: 5 }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
        onClick={() => setOpened((o) => !o)}
      >
        <div>{label}</div>
        <div>{opened ? '-' : '+'}</div>
      </div>
      {opened && children}
    </div>
  )
}

const evaluateCode = (code: string): ZodType => {
  return new Function('z', `return ${code}`)(z)
}

export const ZuiPlayground = () => {
  const [code, setCode] = useLocalStorage('zui-playground-code', initialSchemaCode)
  const [jsonSchema, setSchema] = useState<JSONSchema>({})
  const [typeStr, setTypeStr] = useState('')
  const [data, setData] = useState<any>({})

  const [zuiError, setZuiError] = useState<string | null>(null)
  const [schemaError, _setSchemaError] = useState<string | null>(null)
  const [typeError, setTypeError] = useState<string | null>(null)

  const handleCodeChange = debounce((newCode: string) => {
    setZuiError(null)

    try {
      const zuiSchema = evaluateCode(newCode)
      const jsonSchema = zuiSchema.toJsonSchema()
      setSchema(jsonSchema)
      void updateTsTypes(zuiSchema)
    } catch (error) {
      setZuiError(getErrorMessage(error))
    }
  }, 300)

  const updateTsTypes = async (zodSchema: ZodType) => {
    try {
      const type = await zodSchema.toTypescriptAsync({
        formatter: (typings) => formatCode(`type MyType = ${typings}`),
      })

      setTypeStr(type)
    } catch (error) {
      setTypeError(getErrorMessage(error))
    }
  }

  useEffect(() => {
    handleCodeChange(code)
  }, [code])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h3>Super ZUI Playground</h3>
      </div>
      <Flex style={{ gap: 5, display: 'flex' }}>
        <div style={{ flex: 1, width: '33%' }}>
          <CollapsiblePanel label={`ZUI Schema ${zuiError ? `(Error: ${zuiError})` : ''}`} defaultOpened>
            <MonacoEditor value={code} language="typescript" onChange={setCode} />
          </CollapsiblePanel>
        </div>

        <div style={{ flex: 1, width: '33%' }}>
          <CollapsiblePanel label={`JSON Schema ${schemaError ? `(Error: ${schemaError})` : ''}`} defaultOpened>
            <MonacoEditor value={JSON.stringify(jsonSchema, null, 2)} language="json" readOnly={true} />
          </CollapsiblePanel>
        </div>

        <div style={{ flex: 1, width: '33%' }}>
          <CollapsiblePanel label={`Typescript Typing ${typeError ? `(Error: ${typeError})` : ''}`} defaultOpened>
            <MonacoEditor value={typeStr} />
          </CollapsiblePanel>
        </div>
      </Flex>
      <CollapsiblePanel label="Data" defaultOpened>
        <MonacoEditor value={JSON.stringify(data, null, 2)} language="json" readOnly={true} />
      </CollapsiblePanel>
      <ZuiForm schema={jsonSchema} onChange={setData} />
    </div>
  )
}
