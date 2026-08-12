/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    postcss: {},
  },
  server: {
    port: 5173,
    open: true,
    // Khi ngrok trỏ vào FE (5173), chuyển /api/* sang API backend để SePay webhook không bị 404
    proxy: {
      '/api': {
        target: 'http://localhost:5091',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
} as any)
