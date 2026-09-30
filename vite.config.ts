/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { execSync } from 'node:child_process'
import pkg from './package.json' with { type: 'json' }

// GitHub Pages serves the app from /<repo-name>/. Locally it lives at /.
const base = process.env.BASE_PATH ?? '/'

// Shown in Settings so you can tell which version is installed: "0.5.0 · 2026-09-30 · a1b2c3d".
function version() {
  let sha = ''
  try {
    sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    /* not a git checkout */
  }
  return [pkg.version, new Date().toISOString().slice(0, 10), sha].filter(Boolean).join(' · ')
}

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(version()) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'Parlons',
        short_name: 'Parlons',
        description: 'Speaking-first language practice, offline.',
        start_url: '.',
        scope: '.',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0F2A6B',
        theme_color: '#0F2A6B',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Cache every built file so the whole app works offline.
        globPatterns: ['**/*.{js,css,html,png,svg,ico,webmanifest,woff2,mp3,m4a,ogg,json}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
