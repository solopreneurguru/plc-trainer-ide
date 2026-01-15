import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@runtime': path.resolve(__dirname, './src/runtime'),
      '@compilers': path.resolve(__dirname, './src/compilers'),
      '@decompilers': path.resolve(__dirname, './src/decompilers'),
      '@ui': path.resolve(__dirname, './src/renderer/ui'),
      '@store': path.resolve(__dirname, './src/renderer/store'),
    },
  },
  base: './',
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
});
