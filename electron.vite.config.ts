import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import path from 'path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, './src/shared'),
        '@main': path.resolve(__dirname, './src/main'),
        '@preload': path.resolve(__dirname, './src/preload'),
      },
    },
    build: {
      outDir: 'dist/main',
      emptyOutDir: true,
      rollupOptions: {
        external: ['./generated'],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': path.resolve(__dirname, './src/shared'),
      },
    },
    build: {
      outDir: 'dist/preload',
      emptyOutDir: true,
    },
  },
});
