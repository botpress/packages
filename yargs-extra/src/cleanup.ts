import { YargsArgv, YargsConfig, YargsSchema } from './type-utils'

function cleanupConfig<Y extends YargsSchema>(schema: Y, rawConfig: YargsArgv<Y>): YargsConfig<Y>
function cleanupConfig<Y extends YargsSchema>(schema: Y, rawConfig: Partial<YargsArgv<Y>>): Partial<YargsConfig<Y>>
function cleanupConfig<Y extends YargsSchema>(schema: Y, rawConfig: Partial<YargsArgv<Y>>): Partial<YargsConfig<Y>> {
  const config: Partial<YargsArgv<Y>> = {}
  for (const key in rawConfig) {
    if (key in schema) {
      const k: keyof Y = key
      config[k] = rawConfig[k] as YargsArgv<Y>[typeof k]
    }
  }
  return config as YargsArgv<Y>
}
export { cleanupConfig }
