import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/Home.vue'),
    },
    {
      path: '/edit',
      name: 'edit',
      component: () => import('../views/Edit.vue'),
    },
    {
      path: '/note/:id',
      name: 'note',
      component: () => import('../views/Note.vue'),
    },
  ],
})

export default router
