import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';

function permanentViteWebsocketResolutionPlugin(): Plugin {
  return {
    name: 'permanent-vite-websocket-resolution',
    enforce: 'pre',
    transform(code, id) {
      if (id.includes('vite/dist/client/client.mjs') || id.includes('@vite/client')) {
        return code
          .replace(
            /reject\(new Error\(['"`]WebSocket closed without opened\.['"`]\)\)/g,
            'resolve(undefined)'
          )
          .replace(
            /console\.error\(`\[vite\] failed to connect to websocket[\s\S]*?\`\)/g,
            'void 0'
          );
      }
      return null;
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [
      permanentViteWebsocketResolutionPlugin(),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    build: {
      target: 'es2022',
      minify: 'esbuild',
      cssMinify: true,
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/recharts') || id.includes('node_modules/d3')) {
              return 'vendor-charts';
            }
            if (id.includes('node_modules/firebase')) {
              return 'vendor-firebase';
            }
          },
        },
      },
    },
    server: {
      hmr: false,
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
