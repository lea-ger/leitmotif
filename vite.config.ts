import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import unocss from "unocss/vite";
import {presetWind4} from "unocss";
import {presetDaisy} from "@ameinhardt/unocss-preset-daisy";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    unocss({
      presets: [presetWind4(), presetDaisy()]
    })
  ]
})
