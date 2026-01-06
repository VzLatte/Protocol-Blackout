import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          // 'autoUpdate' ensures the player gets balance patches immediately
          registerType: 'autoUpdate',
          
          // Files to include in the initial 'install' phase
          includeAssets: [
            'favicon.ico', 
            'apple-touch-icon.png', 
            'masked-icon.svg',
            'sfx/*.mp3',      // Caches all sound effects
            'images/*.webp',   // Caches all optimized unit art
            'fonts/*.woff2'    // Caches local typography
          ],

          manifest: {
            name: 'PROTOCOL: BLACKOUT',
            short_name: 'BLACKOUT',
            description: 'Psychological Combat Engine',
            theme_color: '#020617',
            background_color: '#020617',
            display: 'standalone',
            orientation: 'portrait',
            categories: ['games', 'strategy'],
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },

          // WORKBOX: The engine for true offline functionality
          workbox: {
            // Caches all build artifacts (JS, CSS, HTML)
            globPatterns: ['**/*.{js,css,html,ico,png,svg,mp3,json,webp}'],
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            skipWaiting: true,
            
            // Runtime Caching: For assets not caught in the build (like external fonts)
            runtimeCaching: [
              {
                urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                  }
                }
              }
            ]
          }
        })
      ],
      define: {
        // WARNING: These keys will be visible in the client-side source code.
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      // Optimization for tactical games with many data files
      build: {
        sourcemap: false, // Hide source structure in production
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              engine: ['./src/combatEngine.ts', './src/aiLogic.ts'],
              data: ['./src/campaignRegistry.ts', './src/operativeRegistry.ts']
            }
          }
        }
      }
    };
});