import { defineConfig } from 'vite';
export default defineConfig({
  root: 'client',
  publicDir: '../public',
  base: './',
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: { output: { manualChunks: { three: ['three'] } } }
  },
  server: { host: '0.0.0.0' },
  preview: { host: '0.0.0.0' }
});
