// Import puppeteer
import { Logger } from '@bpinternal/log4bot'
import esbuild from 'esbuild'
import fs from 'fs'
import pathlib, { join } from 'path'
import puppeteer from 'puppeteer'
import { TunnelResponse, TunnelServer } from '../../src'
import { expect, sleep } from '../utils'
import { TUNNEL_ID, REQUEST_ID, REQUEST_BODY, RESPONSE_BODY } from './constants'

const dirname = join(process.cwd(), 'e2e/browser')

const readTsScript = (port: number) => {
  const filePath = pathlib.join(dirname, 'ts-script.ts')
  const fileContent = fs.readFileSync(filePath, 'utf8')
  const tsScript = fileContent.replace(/process\.env\.PORT!/g, port.toString())

  return tsScript
}

const toJs = async (tsScript: string): Promise<string> => {
  const buildResult = await esbuild.build({
    stdin: {
      contents: tsScript,
      resolveDir: dirname,
      loader: 'ts'
    },
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'browser',
    target: 'es2017'
  })
  const jsScript = buildResult.outputFiles[0]!.text
  return jsScript
}

const launchBrowser = async (jsScript: string, logger: Logger) => {
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setRequestInterception(false)
  page.on('console', (msg) => logger.debug(`PAGE LOG: ${msg.text()}`))
  await page.evaluate(jsScript)
  return browser
}

export const test = async (port: number, logger: Logger) => {
  const server = await TunnelServer.new({ port })
  const responsePromise = new Promise<TunnelResponse>((resolve) => {
    server.events.on('connection', (tunnelHead) => {
      tunnelHead.events.onceOrMore('response', (response) => {
        if (response.requestId !== REQUEST_ID) {
          return 'keep-listening'
        }
        logger.debug(`received: ${JSON.stringify(response, null, 2)}`)
        resolve(response)
        return 'stop-listening'
      })
    })
  })

  const jsScript = await toJs(readTsScript(port))
  const browser = await launchBrowser(jsScript, logger)
  await sleep(1000) // for tunnel to connect in browser

  const tunnelHead = server.getTunnel(TUNNEL_ID)
  if (!tunnelHead) {
    throw new Error(`Tunnel ${TUNNEL_ID} not found`)
  }

  const helloPromise = new Promise<void>((resolve) => {
    tunnelHead.events.once('hello', () => {
      logger.info('head received hello')
      resolve()
    })
  })
  tunnelHead.hello()

  tunnelHead.send({
    id: REQUEST_ID,
    method: 'GET',
    path: '/hello',
    headers: {},
    body: REQUEST_BODY
  })

  const serverExitPromise = server.wait().then(() => {
    throw new Error('Server exited')
  })

  const successPromise = Promise.all([responsePromise, helloPromise])

  const [response] = await Promise.race([successPromise, serverExitPromise])

  await browser.close()
  server.close()

  expect(response.requestId).toBe(REQUEST_ID)
  expect(response.body).toBe(RESPONSE_BODY)
}
