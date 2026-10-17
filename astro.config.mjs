import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';

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
		plugins: [{
			name: 'separate-dev-build-cache',
			config: (_config, { command }) => ({
				cacheDir: fileURLToPath(new URL(`./node_modules/.vite/${command}/`, import.meta.url))
			})
		}],
		optimizeDeps: {
			include: ['preact/compat']
		},
		worker: {
			format: 'es'
		}
	}
});
