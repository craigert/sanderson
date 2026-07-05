import { createRouter, createWebHistory } from 'vue-router';
import CosmereMap from './components/CosmereMap.vue';
import BookList from './components/BookList.vue';
import BookDetail from './components/BookDetail.vue';

const routes = [
  { path: '/', component: CosmereMap },
  { path: '/books', component: BookList },
  { path: '/book/:id', component: BookDetail },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
