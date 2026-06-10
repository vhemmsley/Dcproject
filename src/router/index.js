import { createRouter, createWebHistory } from 'vue-router'

import LandingPage from '@/components/LandingPage.vue'
import SendBlaster from '@/components/pages/blast/SendBlaster.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: LandingPage },
    { path: '/sendblaster', component: SendBlaster },
  ],
})

export default router
