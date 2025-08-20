import { spawn } from 'cross-spawn'
import { test, expect } from 'vitest'

type CommandOutput = {
  stdout: string
  stderr: string
  exitCode: number
}
const runCommand = (cmd: string): Promise<CommandOutput> => {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, { shell: true, stdio: 'pipe' })
    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({ stdout, stderr, exitCode: code ?? 0 })
    })

    child.on('error', (err) => {
      reject(err)
    })
  })
}

const parseStd = (output: string): string[] => {
  const lines = output.split('\n')
  return lines
    .map((l) => l.trim())
    .filter((l) => !!l)
    .filter((l) => !l.startsWith('>'))
}

const RETRY = 'pnpm start'

test('retry-cli help should run successfully', async () => {
  const { stderr, exitCode } = await runCommand(`${RETRY} --help`)
  expect(stderr).toBe('')
  expect(exitCode).toBe(0)
})

test('retry-cli retry of a successful command should run successfully once', async () => {
  const { stderr, stdout, exitCode } = await runCommand(`${RETRY} -n 20 -- echo "HELLO WORLD"`)
  expect(stderr).toBe('')
  expect(parseStd(stdout)).toEqual(['HELLO WORLD'])
  expect(exitCode).toBe(0)
})

test('retry-cli retry of an unsuccessfull command should retry n + 1 times', async () => {
  const { stderr, exitCode } = await runCommand(
    `${RETRY} -n 5 -f 0 -- node -e "console.error('### ERROR'); process.exit(42)"`
  )
  expect(parseStd(stderr)).toEqual(['### ERROR', '### ERROR', '### ERROR', '### ERROR', '### ERROR', '### ERROR'])
  expect(exitCode).not.toEqual(0)
})

test('retry-cli retry of a flaky command should retry until success', async () => {
  const threshold = Date.now() + 2000
  const script = `if (Date.now() > ${threshold}) { process.exit(0) }; setTimeout(() => { console.error('### ERROR'); process.exit(1) }, 1000)`

  const { stderr, exitCode } = await runCommand(`${RETRY} -n 2 -f 0 -- node -e "${script}"`)
  expect(parseStd(stderr)).toEqual(['### ERROR', '### ERROR'])
  expect(exitCode).toEqual(0)
})
