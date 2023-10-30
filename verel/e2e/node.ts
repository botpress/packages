import * as vrl from '../src'
import * as consts from './consts'
import * as utils from './utils'

const main = () => {
  const validProgramCheck = vrl.check(consts.validProgram)
  utils.expect(validProgramCheck.errors.length).toBe(0)

  const invalidProgramCheck = vrl.check(consts.invalidProgram)
  const isError = invalidProgramCheck.errors.length >= 1
  utils.expect(isError).toBe(true)

  const validProgramExecution = vrl.execute(consts.validProgram, consts.inputEvent)
  utils.expect(validProgramExecution.event).toBe(consts.outputEvent)
  utils.expect(validProgramExecution.result).toBe('success')

  utils.expect(() => vrl.execute(consts.invalidProgram, consts.inputEvent)).toThrow()
}

try {
  main()
  console.log('done')
  process.exit(0)
} catch (err) {
  console.error(err)
  process.exit(1)
}
