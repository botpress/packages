/**
 * Locate -- and split the command and its arguments.
 * This can't be done with yargs
 */
export const parseArgv = (argv: string[]): { command: string[]; args: string[] } => {
  const index = argv.indexOf('--')
  if (index === -1) {
    return {
      command: argv,
      args: []
    }
  }

  const command = argv.slice(0, index)
  const args = argv.slice(index + 1)
  return { command, args }
}
