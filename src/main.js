import { createApp } from 'vue'
import App from './App.vue'
import router from "./modules/router.js";
import pinia from "./modules/store.js";
import '@icon-park/vue-next/styles/index.css';

router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.title) {
    document.title = to.meta.title; // 设置页面标题
  }
  next();
});

const app = createApp(App)

app.use(router)
app.use(pinia)

app.mount('#app')


