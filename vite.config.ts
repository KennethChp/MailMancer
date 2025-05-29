import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        content: resolve(__dirname, 'src/content.tsx'),
        background: resolve(__dirname, 'src/background.ts')
      },
      output: {
        entryFileNames: () => {
          return `[name].js`;
        },
        chunkFileNames: '[name].[hash].js',
        assetFileNames: '[name].[ext]',
        // Prevent code splitting for content scripts
        manualChunks: (id) => {
          if (id.includes('content.tsx')) {
            return 'content';
          }
          if (id.includes('background.ts')) {
            return 'background';
          }
          return 'vendor';
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
})
