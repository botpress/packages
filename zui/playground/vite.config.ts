import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // fixes monaco error log in console
      path: 'rollup-plugin-node-polyfills/polyfills/path',
    },
  },
})
