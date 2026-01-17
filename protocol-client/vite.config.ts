import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    // Load env file from the project root (one level up from protocol-client)
    const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
    
    return {
      // Explicitly set the root to the protocol-client folder
      root: './',
      
      server: {
        port: 3000,
        host: '0.0.0.0', // Required for GitHub Codespaces/Docker
        strictPort: true,
      },

      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
          manifest: {
            name: 'PROTOCOL: BLACKOUT',
            short_name: 'BLACKOUT',
            theme_color: '#020617',
            background_color: '#020617',
            display: 'standalone',
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
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,json,webp}'],
            cleanupOutdatedCaches: true,
          }
        })
      ],

      define: {
        // Injecting Gemini API Key from root .env
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },

      resolve: {
        alias: {
          // The '@' now correctly points to the 'src' folder inside protocol-client
          '@': path.resolve(__dirname, './src'),
          // The '@shared' alias points directly to your root shared folder
          '@shared': path.resolve(__dirname, '../shared'),
        }
      },

      build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              // Ensure these paths match your new 'shared' structure
              engine: ['../shared/combatEngine.ts', '../shared/aiLogic.ts'],
            }
          }
        }
      }
    };
});