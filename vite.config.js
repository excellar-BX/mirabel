import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    allowedHosts: ['unfoisted-annabel-virilocally.ngrok-free.dev'],
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
  },
})
