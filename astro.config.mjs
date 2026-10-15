import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';

export default defineConfig({
	site: 'https://yorch233.github.io',
	output: 'static',
	devToolbar: {
		enabled: false
	},
	integrations: [preact()],
	build: {
		format: 'directory'
	},
	vite: {
		worker: {
			format: 'es'
		}
	}
});
