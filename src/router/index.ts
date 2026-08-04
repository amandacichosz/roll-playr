import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import PlayerPickerView from '@/views/PlayerPickerView.vue'
import ScoreKeeperView from '@/views/ScoreKeeperView.vue'
import NotFoundView from '@/views/NotFoundView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/player-picker',
      name: 'player-picker',
      component: PlayerPickerView
    },
    {
      path: '/score-keeper',
      name: 'score-keeper',
      component: ScoreKeeperView
    },
    {
      path: '/:catchAll(.*)',
      name: 'not-found',
      component: NotFoundView
    }
  ],
})

export default router
