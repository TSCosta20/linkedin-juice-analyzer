import { defineConfig } from 'vite';
import { resolve } from 'path';

// Extension pages build — ES modules for background service worker and options page
// emptyOutDir: false so content.js (built by vite.config.ts first) is preserved
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-chunk.js',
        assetFileNames: '[name].[ext]',
        format: 'es',
      },
    },
  },
});
