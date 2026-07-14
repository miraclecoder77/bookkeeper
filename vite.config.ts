import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,
    open: true,
  },

  build: {
    // jsPDF + html2canvas are large by nature — suppress the noisy warning
    chunkSizeWarningLimit: 1100,

    // CSS code-splitting: each async route chunk gets its own CSS file
    cssCodeSplit: true,

    sourcemap: false,
  },

  // Pre-bundle critical deps for faster cold-start dev server
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  },
})
