import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,ava,babel,nyc,cypress}.config.*',
    ],
  },
})
