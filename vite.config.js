import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  build: {
    // No source maps in production — evita exponer el código fuente
    sourcemap: mode !== 'production',

    rollupOptions: {
      output: {
        // Nombres con hash para cache-busting + dificultar reverse engineering
        chunkFileNames:  'assets/[hash].js',
        entryFileNames:  'assets/[hash].js',
        assetFileNames:  'assets/[hash].[ext]',
      },
    },
  },

  // No exponer variables de entorno sensibles al bundle accidentalmente
  envPrefix: 'VITE_',
}));
