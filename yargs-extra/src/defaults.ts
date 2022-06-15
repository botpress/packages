import { YargsArgv, YargsSchema } from './type-utils'

export const defaultConfig = <Y extends YargsSchema>(yargSchema: Y): Partial<YargsArgv<Y>> => {
  let defaults: Partial<YargsArgv<Y>> = {}
  for (const param in yargSchema) {
    const yargProp = yargSchema[param]
    const { default: _default } = yargProp
    defaults = { ...defaults, [param]: _default }
  }
  return defaults
}
