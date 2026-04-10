import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import { createPinia } from 'pinia'

// GitHub Pages SPA fallback:
// If 404.html redirected to /<base>/#/some/path, restore that path for the router.
if (window.location.hash.startsWith('#/')) {
  const routeFromHash = window.location.hash.slice(1)
  const base = import.meta.env.BASE_URL || '/'
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base
  window.history.replaceState(null, '', `${normalizedBase}${routeFromHash}`)
}

const pinia = createPinia()
createApp(App)
    .use(router)
    .use(pinia)
    .mount('#app')
