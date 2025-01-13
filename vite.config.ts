import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { compression } from 'vite-plugin-compression2'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: 'src/ui/routes/', generatedRouteTree: 'src/ui/routeTree.gen.ts' }),
    react(),
    compression(),
  ],
  root: 'src/ui',
  build: {
    outDir: '../vdoc/webapp',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    proxy: process.env.USE_VITE_PROXY
      ? {
          '/api': {
            target: 'http://localhost:8080',
            changeOrigin: false,
            secure: false,
          },
          '/static': {
            target: 'http://localhost:8080',
            changeOrigin: false,
            secure: false,
          },
        }
      : {},
    host: '0.0.0.0',
  },
})
