import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // The dev proxy target is configurable so a backend on a non-default port can
  // be used without editing this file. Set VITE_BACKEND_ORIGIN in .env.local
  // (gitignored) to override; everyone else gets :8000.
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_BACKEND_ORIGIN || 'http://localhost:8000'

  // Where the built site will be served from. Netlify and the dev server both
  // sit at the root; a GitHub project page sits under /<repo>/, and its
  // workflow sets DEPLOY_BASE to say so. Every asset URL and the router's
  // basename derive from this one value, so they cannot disagree.
  const base = process.env.DEPLOY_BASE || '/'

  return {
    base,
    plugins: [react(), tailwindcss()],
    server: {
      open: true,
      proxy: {
        '/api': {
          target: backend,
          changeOrigin: true,
        },
      },
    },
  }
})
