import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/when-was-i-here/' : '/',
  plugins: [react()],
  test: {
    globals: true,
  },
}))
