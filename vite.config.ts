import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Okta Bingo',
        short_name: 'Okta Bingo',
        description: 'Turn your Okta Number Challenges into a Bingo game!',
        theme_color: '#00297a',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/bingo/',
        scope: '/bingo/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
    }),
  ],
  base: '/bingo/',
})
