import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const now = new Date()
const buildVersion = `v${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/game-library/',
  define: {
    __BUILD_VERSION__: JSON.stringify(buildVersion),
  },
})
