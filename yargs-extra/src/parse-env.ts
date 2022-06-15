import decamelize from 'decamelize'
import _ from 'lodash'
import yargs from 'yargs'
import { parseValue } from './parse-value'
import { YargsConfig, YargsSchema } from './type-utils'

const tryExtractingFromEnv = <O extends yargs.Options>(
  paramName: string,
  schema: O,
  prefix: string | undefined
): yargs.InferredOptionType<O> | undefined => {
  const possibleNames: string[] = [paramName]
  const { alias } = schema
  if (_.isString(alias) && alias) {
    possibleNames.push(alias)
  } else if (_.isArray(alias)) {
    possibleNames.push(...alias)
  }

  for (const paramAlias of possibleNames) {
    let envVarName = decamelize(paramAlias, { preserveConsecutiveUppercase: true, separator: '_' }).toUpperCase()
    envVarName = prefix ? `${prefix.toUpperCase()}_${envVarName}` : envVarName
    const envVarValue = process.env[envVarName]
    if (!envVarValue) {
      continue
    }

    const parsedEnvValue = parseValue(schema, envVarValue)
    if (parsedEnvValue !== undefined) {
      return parsedEnvValue
    }
  }
}

/**
 *
 * Fills the argv datastructure returned by yargs with value of environment variables.
 * For the CLI parameter --languageURL the expected environment variable is LANGUAGE_URL
 *
 * @param yargsSchema the yargs builder parameter that declares what named parameters are required
 * @param argv the filled argv datastructure returned by yargs
 */
export const parseEnv = <T extends YargsSchema>(
  yargsSchema: T,
  prefix: string | undefined = undefined
): Partial<YargsConfig<T>> => {
  const returned: Partial<YargsConfig<T>> = {}
  for (const param in yargsSchema) {
    const schema = yargsSchema[param]
    const extracted = tryExtractingFromEnv(param, schema, prefix)
    if (extracted !== undefined) {
      returned[param] = extracted
    }
  }
  return returned
}
