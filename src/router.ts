import { createRouter, createWebHistory, type RouteRecordRaw} from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('./views/HomeView.vue'),
  },
  {
    path: '/client/:roomId?',
    name: 'client',
    component: () => import('./views/ClientView.vue'),
    props: true,
  },
  {
    path: '/editor',
    name: 'editor',
    component: () => import('./views/EditorView.vue'),
  },
  {
    path: '/learn/:docId?',
    name: 'learn',
    component: () => import('./views/LearnView.vue'),
    props: true,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
