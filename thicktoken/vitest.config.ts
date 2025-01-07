import { defineConfig } from 'vitest/config'
import path from 'node:path'
import fs from 'node:fs'
import dotenv from 'dotenv'

const envLocal = [
  path.resolve(__dirname, '.', '.env'),
  path.resolve(__dirname, '.', '.env.local'),
  path.resolve(__dirname, '../', '.env'),
  path.resolve(__dirname, '../', '.env.local')
].find(fs.existsSync)

if (envLocal) {
  dotenv.config({ path: envLocal })
}

export default defineConfig({
  test: {
    include: ['./src/**/*.test.{ts,tsx}'],
    setupFiles: './vitest.setup.ts'
  }
})
