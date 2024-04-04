import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      zod: path.resolve(__dirname, './src/zod/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
