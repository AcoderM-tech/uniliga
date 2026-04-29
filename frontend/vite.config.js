import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    // 1. Docker konteyneri tashqi dunyo bilan gaplashishi uchun shart
    host: '0.0.0.0',
    port: 5173,

    // 2. Port doimo fiksatsiyalangan bo'lishi kerak
    strictPort: true,

    // 3. Cloudflare Tunnel orqali statik fayllar (JS/CSS) to'g'ri yuklanishi uchun
    origin: 'https://football.acoderm.uz',

    // 4. Vite xavfsizlik filtri: faqat sening domeningdan kelgan so'rovlarni qabul qiladi
    allowedHosts: [
      'football.acoderm.uz',
      '.acoderm.uz',
      'localhost',
      '127.0.0.1'
    ],

    // 5. Hot Module Replacement (HMR) - Kod o'zgarganda sahifani tunnel orqali yangilash
    hmr: {
      host: 'football.acoderm.uz',
      protocol: 'wss', // HTTPS ostida Secure WebSocket shart
      clientPort: 443  // Cloudflare porti
    },
  },

  // Statik fayllarning bazaviy yo'li
  base: '/',

  build: {
    outDir: 'dist',
    // Prodactionda xatolarni debug qilish oson bo'lishi uchun
    sourcemap: true,
    // Katta loyihalarda chunklarni optimallashtirish
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  }
})