import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to the Express backend during development
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      // Proxy uploaded file requests to the backend
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
