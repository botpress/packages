import { parseEnv } from './parse-env'
import { YargsSchema } from './type-utils'

const originalEnv = { ...process.env }

const setEnv = (env: Record<string, string>) => {
  for (const key in env) {
    process.env[key] = env[key]
  }
}

const cleanupEnv = () => {
  for (const key in process.env) {
    if (key in originalEnv) {
      continue
    }
    delete process.env[key]
  }
}

afterEach(() => {
  cleanupEnv()
})

test('parse_env_string_should_work', () => {
  const schema = {
    myStrParam: { type: 'string' }
  } satisfies YargsSchema

  setEnv({
    YARGS_MY_STR_PARAM: 'hello'
  })

  const argv = parseEnv(schema, 'YARGS')

  expect(argv).toEqual({ myStrParam: 'hello' })
})

test('parse_env_number_should_work', () => {
  const schema = {
    myNumParam: { type: 'number' }
  } satisfies YargsSchema

  setEnv({
    YARGS_MY_NUM_PARAM: '123'
  })

  const argv = parseEnv(schema, 'YARGS')

  expect(argv).toEqual({ myNumParam: 123 })
})

test('parse_env_boolean_should_work', () => {
  const schema = {
    myBoolParam: { type: 'boolean' }
  } satisfies YargsSchema

  setEnv({
    YARGS_MY_BOOL_PARAM: 'true'
  })

  const argv = parseEnv(schema, 'YARGS')

  expect(argv).toEqual({ myBoolParam: true })
})

test('parse_env_choices_should_work', () => {
  const choices = ['a', 'b', 'c'] as const
  const schema = {
    myChoiceParam: { type: 'string', choices }
  } satisfies YargsSchema

  setEnv({
    YARGS_MY_CHOICE_PARAM: 'b'
  })

  const argv = parseEnv(schema, 'YARGS')

  expect(argv).toEqual({ myChoiceParam: 'b' })
})

test('parse_env_string_array_should_work', () => {
  const schema = {
    myStrArrayParam: { type: 'string', array: true }
  } satisfies YargsSchema

  setEnv({
    YARGS_MY_STR_ARRAY_PARAM: 'hello world'
  })

  const argv = parseEnv(schema, 'YARGS')

  expect(argv).toEqual({ myStrArrayParam: ['hello', 'world'] })
})

test('parse_env_number_array_should_work', () => {
  const schema = {
    myNumArrayParam: { type: 'number', array: true }
  } satisfies YargsSchema

  setEnv({
    YARGS_MY_NUM_ARRAY_PARAM: '123 456'
  })

  const argv = parseEnv(schema, 'YARGS')

  expect(argv).toEqual({ myNumArrayParam: [123, 456] })
})

test('parse_env_boolean_array_should_work', () => {
  const schema = {
    myBoolArrayParam: { type: 'boolean', array: true }
  } satisfies YargsSchema

  setEnv({
    YARGS_MY_BOOL_ARRAY_PARAM: '1 0'
  })

  const argv = parseEnv(schema, 'YARGS')

  expect(argv).toEqual({ myBoolArrayParam: [true, false] })
})
