import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base + hash routing means the build works on GitHub Pages under any
// repository name, on a custom domain, or from a sub-folder, without changes.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
        },
      },
    },
  },
});
