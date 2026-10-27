import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  esbuild: { loader: 'jsx', include: /src\/.*\.(js|jsx)$/ },
  build: { chunkSizeWarningLimit: 800, rollupOptions: { output: { manualChunks: { react: ['react', 'react-dom'], icons: ['lucide-react'] } } } },
  server: { proxy: { '/api': 'http://localhost:4000' } },
});
