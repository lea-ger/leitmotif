import { createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('./views/HomeView.vue'),
  },
  {
    path: '/host',
    name: 'host',
    component: () => import('./views/HostView.vue'),
  },
  {
    path: '/client/:roomId?',
    name: 'client',
    component: () => import('./views/ClientView.vue'),
    props: true,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
