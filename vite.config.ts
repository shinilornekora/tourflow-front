/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

// Весь API ходит через gateway бэкенда (tourflow/backend/cmd/gateway) по /api.
// В деве Vite проксирует /api на gateway, поэтому refresh-cookie остаётся same-origin.
const gateway = process.env.VITE_GATEWAY_URL ?? 'http://localhost:8080';

export default defineConfig({
  // Для GitHub Pages сборка идёт с VITE_BASE=/tourflow-front/.
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
  resolve: { alias },
  server: {
    port: 3000,
    proxy: { '/api': { target: gateway, changeOrigin: true } },
  },
  preview: { port: 3000, proxy: { '/api': { target: gateway, changeOrigin: true } } },
  test: {
    globals: true,
    coverage: { provider: 'v8', include: ['src/**/*.{ts,tsx}'], exclude: ['src/test/**', 'src/main.tsx'] },
  },
});
