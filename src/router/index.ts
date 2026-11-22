import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import PlayerPickerView from '@/views/PlayerPickerView.vue'
import ScoreKeeperView from '@/views/ScoreKeeperView.vue'
import DiceRollerView from '@/views/DiceRollerView.vue'
import TimerView from '@/views/TimerView.vue'
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
      component: PlayerPickerView,
      meta: { title: 'Player Picker', menu: true },
    },
    {
      path: '/score-keeper',
      name: 'score-keeper',
      component: ScoreKeeperView,
      meta: { title: 'Score Keeper', menu: true },
    },
    {
      path: '/dice-roller',
      name: 'dice-roller',
      component: DiceRollerView,
      meta: { title: 'Dice Roller' },
    },
    {
      path: '/timer',
      name: 'timer',
      component: TimerView,
      meta: { title: 'Timer' },
    },
    {
      path: '/:catchAll(.*)',
      name: 'not-found',
      component: NotFoundView
    }
  ],
})

export default router
