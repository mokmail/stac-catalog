import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isDocker = process.env.USE_LOCAL_TITILER === 'true'
const titilerTarget = isDocker ? 'http://localhost:8000' : 'https://titiler.xyz'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/titiler': {
        target: titilerTarget,
        changeOrigin: true,
        secure: !isDocker,
        rewrite: (path) => path.replace(/^\/titiler/, '')
      },
      '/api/bev': {
        target: 'https://data.bev.gv.at',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/bev/, '')
      }
    }
  }
})
