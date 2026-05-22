import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

export const APP_URL_PATH = '/indicore/'

function redirectRootToApp(): Plugin {
  return {
    name: 'redirect-root-to-app',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (url === '/' || url === '') {
          res.statusCode = 302
          res.setHeader('Location', APP_URL_PATH)
          res.end()
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  base: APP_URL_PATH,
  plugins: [react(), redirectRootToApp()],
  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@mantine/core',
      '@tanstack/react-query',
      'zustand',
      'date-fns',
      'date-fns/locale',
      'clsx',
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/jspdf')) return 'pdf'
          if (id.includes('node_modules/@mantine')) return 'mantine'
          if (id.includes('node_modules/date-fns')) return 'date-fns'
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: APP_URL_PATH,
    warmup: {
      clientFiles: [
        './src/App.tsx',
        './src/main.tsx',
        './src/presentation/features/dashboard/Dashboard.tsx',
        './src/presentation/features/production/Production.tsx',
        './src/presentation/features/orders/Orders.tsx',
        './src/presentation/features/clients/Clients.tsx',
        './src/presentation/features/users/Users.tsx',
        './src/di/container.ts',
      ],
    },
  },
})
