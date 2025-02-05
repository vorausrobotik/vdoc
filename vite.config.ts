import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { compression } from 'vite-plugin-compression2'
import { codecovVitePlugin } from '@codecov/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ routesDirectory: 'src/ui/routes/', generatedRouteTree: 'src/ui/routeTree.gen.ts' }),
    react(),
    compression(),
    // Put the Codecov vite plugin after all other plugins
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: 'vdoc',
      uploadToken: process.env.CODECOV_TOKEN,
      telemetry: false,
    }),
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
