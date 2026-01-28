import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
	routes: [
		{
			name: 'Home',
			path: '/',
			component: () => import('../views/home/Home.vue'),
			meta: { title: 'Qing Yao - Jiangsu University' },
			children: [
				{
					name: 'HomeChat',
					path: '',
					component: () => import('../views/home/HomeChat.vue')
				},
				{
					name: 'HomePublications',
					path: 'publications',
					component: () => import('../views/home/HomePublications.vue')
				}
			]
		},
		{
			name: 'RSB',
			path: '/RSB',
			component: () => import('../views/paper/RSB.vue'),
			meta: { title: 'Regularized Schrödinger Bridge via Distortion-Perception Perturbation for High-Fidelity Speech Enhancement - Qing Yao - Jiangsu University' }
		}
	],
	history: createWebHistory()
});

export default router;
