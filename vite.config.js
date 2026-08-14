import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    watch: {
      usePolling: true,
      interval: 500,
      ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
    },
    hmr: {
      host: 'j1.local',
    }
  },
  build: {
    outDir: 'dist',
  }
});
