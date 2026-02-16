import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    base: './',
    root: '.', // Changed to project root for web version
    build: {
      outDir: 'dist', // Changed from dist-web to dist for Vercel
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html') // Changed from index-web.html to index.html
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        buffer: 'buffer/',
      },
    },
    server: {
      port: 5173,
    },
    define: {
      // Expose env variables to the client
      'import.meta.env.VITE_DROPBOX_APP_KEY': JSON.stringify(env.VITE_DROPBOX_APP_KEY),
      // Add global Buffer for browser
      global: 'globalThis',
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
    },
  }
})
