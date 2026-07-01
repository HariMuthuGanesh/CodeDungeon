import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,        // Fixed port — won't clash with other apps on 5173/5174
    strictPort: true,  // Fail loudly instead of silently picking another port
  },
})
