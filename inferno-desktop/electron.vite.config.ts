import path from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const SERVER_PORT = 47832;

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['better-sqlite3'],
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [react(), tailwindcss({ optimize: false })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src/renderer/src'),
      },
    },
    server: {
      proxy: {
        '/api': `http://localhost:${SERVER_PORT}`,
      },
    },
    define: {
      __SERVER_PORT__: SERVER_PORT,
    },
  },
});
