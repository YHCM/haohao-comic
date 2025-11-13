import { createWebHistory, createRouter } from 'vue-router'

// 动态导入
const routes = [
  {
    path: '/',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/comic/:comicId',
    component: () => import('@/views/Comic.vue'),
  },
  {
    path: '/comic/:comicId/chapter/:chapterId',
    component: () => import('@/views/Chapter.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
