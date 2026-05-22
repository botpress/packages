import { State } from './state'

export type ExportStateOptions = Partial<{
  ignoreDefaultParameters: boolean
  ignoreSecurity: boolean
}>

export const applyExportOptions = <
  SchemaName extends string,
  DefaultParameterName extends string,
  SectionName extends string,
>(
  state: State<SchemaName, DefaultParameterName, SectionName>,
  options?: ExportStateOptions,
) => {
  if (options?.ignoreDefaultParameters && state.defaultParameters) {
    const defaultParametersName = Object.keys(state.defaultParameters)
    for (const operationId of Object.keys(state.operations)) {
      if (!state.operations[operationId]?.parameters) {
        continue
      }
      state.operations[operationId].parameters = Object.fromEntries(
        Object.entries(state.operations[operationId].parameters).filter(
          ([parameterName]) => !defaultParametersName.includes(parameterName),
        ),
      )
    }
  }
  if (options?.ignoreSecurity) {
    delete state.security
    for (const operationId of Object.keys(state.operations)) {
      delete state.operations[operationId]?.security
    }
  }
  return state
}
