import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    basicSsl(),
  ],
  server: {
    allowedHosts: ['localhost', 'exploratively-older-tressa.ngrok-free.dev', 'leitmotif.le-ger.com/'],
  }
})
