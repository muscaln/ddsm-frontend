import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'

import LoginView from './loginView.vue'
import MainView from './mainView.vue'

// Auth guard function
function requireAuth(to, from, next) {
  const token = localStorage.getItem('access_token')
  if (token) {
    next()
  } else {
    next('/login')
  }
}

function requireGuest(to, from, next) {
  const token = localStorage.getItem('access_token')
  if (!token) {
    next()
  } else {
    next('/dashboard')
  }
}

const routes = [
  { 
    path: '/', 
    redirect: '/login' 
  },
  { 
    path: '/login', 
    component: LoginView,
    beforeEnter: requireGuest
  },
  { 
    path: '/dashboard', 
    component: MainView,
    beforeEnter: requireAuth
  },
  {
    path: '/predict',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

createApp(App).use(router).mount('#app')