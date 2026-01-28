import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
	routes: [
		{
			name: 'Home',
			path: '/',
			component: () => import('../views/Home.vue'),
			meta: { title: 'Qing Yao - Jiangsu University' },
			children: [
				{
					name: 'HomeChat',
					path: '',
					component: () => import('../views/HomeChat.vue')
				},
				{
					name: 'HomePublications',
					path: 'publications',
					component: () => import('../views/HomePublications.vue')
				}
			]
		},
		{
			name: 'RSB',
			path: '/RSB',
			component: () => import('../views/RSB.vue'),
			meta: { title: 'Regularized Schrödinger Bridge via Distortion-Perception Perturbation for High-Fidelity Speech Enhancement - Qing Yao - Jiangsu University' }
		}
	],
	history: createWebHistory()
});

export default router;
