import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    // Os .glb são grandes; evita aviso ruidoso sem esconder problemas reais de JS.
    chunkSizeWarningLimit: 900,
  },
})
