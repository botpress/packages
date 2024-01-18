import chalk from 'chalk'
import { mkdirSync, readdirSync, readFileSync, rmdirSync, statSync, unlinkSync, writeFileSync } from 'fs'
import { join } from 'path'
import log from './log'

export function initDirectory(dir: string) {
  mkdirSync(dir, { recursive: true })
}

export function appendHeaders(dir: string, header: string) {
  const files = getFiles(dir)

  files.map((file) => {
    if (file.endsWith('.ts')) {
      log.info(`Appending header to file ${chalk.blue(file)}`)
      appendToFile(file, header)
    }
  })
}

export function appendToFile(filepath: string, text: string) {
  const content = readFileSync(filepath)
  writeFileSync(filepath, `${text}\n${content}`)
}

export function deleteEmptyDir(dir: string) {
  const files = readdirSync(dir)

  files.forEach((file) => {
    const dirPath = join(dir, file)

    if (statSync(dirPath).isDirectory()) {
      const dirFiles = readdirSync(dirPath)

      if (dirFiles.length === 0) {
        log.info(`Deleting directory ${chalk.blue(dirPath)}`)
        rmdirSync(dirPath)
      }
    }
  })
}

export function deleteNonTypescriptFiles(dir: string) {
  const files = getFiles(dir)

  files.forEach((file) => {
    if (!file.endsWith('.ts')) {
      log.info(`Deleting file ${chalk.blue(file)}`)
      unlinkSync(file)
    }
  })
}

export function saveFile(dir: string, path: string, content: string) {
  log.info(`Saving ${chalk.blue(path)} file`)
  writeFileSync(join(dir, path), content)
}

export function getFiles(dir: string, files: string[] = []) {
  const dirFiles = readdirSync(dir)

  dirFiles.forEach((file) => {
    const filePath = join(dir, file)

    if (statSync(filePath).isDirectory()) {
      getFiles(filePath, files)
    } else {
      files.push(filePath)
    }
  })

  return files
}

export function removeLineFromFiles(dir: string, invalidLine: string) {
  const files = getFiles(dir)

  files.map((file) => {
    log.info(`Removing invalid line from file ${chalk.blue(file)}`)
    removeLineFromFile(file, invalidLine)
  })
}

export function removeLineFromFile(filepath: string, line: string) {
  const content = readFileSync(filepath, 'utf8')
  const newContent = content.replace(line, '')
  writeFileSync(filepath, newContent)
}
