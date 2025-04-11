import '@icon-park/vue-next/styles/index.css';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import 'virtual:uno.css';
import { createApp } from 'vue';
import App from './App.vue';
import router from './modules/router.js';
import pinia from './modules/store.js';

router.beforeEach((to, from, next) => {
	if (to.meta && to.meta.title) {
		document.title = to.meta.title;
	}
	next();
});

const app = createApp(App);

app.use(router);
app.use(pinia);
app.use(ElementPlus);
app.mount('#app');
