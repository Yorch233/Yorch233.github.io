import preact from '@astrojs/preact';
import icon from 'astro-icon';
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://yorch233.github.io',
	output: 'static',
	integrations: [
		preact(),
		icon({
			include: {
				ph: [
					'address-book',
					'arrow-right',
					'arrow-square-out',
					'brain',
					'books',
					'chart-bar',
					'circles-three-plus',
					'code',
					'envelope-simple',
					'file-text',
					'graduation-cap',
					'house-fill',
					'map-pin',
					'magnifying-glass',
					'share-network',
					'student',
					'wave-sine'
				],
				'simple-icons': ['github', 'huggingface', 'orcid']
			}
		})
	],
	build: {
		format: 'directory'
	},
	vite: {
		worker: {
			format: 'es'
		}
	}
});
