import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Custom Vite plugin: remove `crossorigin` from bundled asset tags.
// In Electron's file:// context, `crossorigin` on <script>/<link> tags
// triggers CORS enforcement. file:// has no origin → the browser silently
// blocks the assets → blank white page on every launch.
// (Google Fonts <link crossorigin> is intentionally left untouched.)
function removeAssetCrossOrigin(): Plugin {
  return {
    name: 'remove-asset-crossorigin',
    transformIndexHtml(html: string) {
      // Remove crossorigin only from local asset references (./assets/...)
      return html
        .replace(
          /<script([^>]*?)\s+crossorigin([^>]*?)src="\.\/assets\//g,
          '<script$1$2src="./assets/'
        )
        .replace(
          /<link([^>]*?)\s+crossorigin([^>]*?)href="\.\/assets\//g,
          '<link$1$2href="./assets/'
        );
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), removeAssetCrossOrigin()],
  // IMPORTANT for Electron: use relative paths so file:// URLs resolve correctly
  base: './',
  root: path.resolve(__dirname, 'src/renderer'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    // Disable module preload polyfill — it also injects crossorigin
    modulePreload: false,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/renderer/index.html')
      },
      output: {
        format: 'es'
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
});
