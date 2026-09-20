import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // We register the service worker ourselves (src/components/PWAUpdatePrompt.jsx)
      // so the user is never reloaded in the middle of an emergency session.
      injectRegister: null,
      registerType: 'prompt',

      includeAssets: [
        'offline.html',
        'icons/favicon-64.png',
        'icons/apple-touch-icon.png',
      ],

      manifest: {
        id: '/',
        name: 'Break Glass — Emergency Access Management System',
        short_name: 'Break Glass',
        description:
          'Offline-first emergency access to protected organizational documents: request, review, approve, expire, audit.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#070C1E',
        theme_color: '#070C1E',
        categories: ['productivity', 'security', 'utilities'],
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },

      workbox: {
        // Precache every build artifact. Vite content-hashes filenames, so this
        // list is regenerated on each build — this is the bit the old
        // hand-written FILES_TO_CACHE array could never get right.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2}'],

        // SPA: any navigation while offline is served from the cached shell,
        // so deep links like /admin/requests keep working.
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/rest\//, /^\/auth\//],

        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false, // the update prompt decides when to swap

        // Don't let a big precache silently fail.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,

        runtimeCaching: [
          {
            // Supabase (and any other API) — network first, short timeout, so an
            // offline device falls through to cache instead of hanging.
            urlPattern: ({ url }) => url.origin.endsWith('.supabase.co'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'bg-api',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },

      devOptions: {
        // Lets you test offline behaviour with `npm run dev`.
        // Set to false if the SW gets in the way of HMR.
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
})
