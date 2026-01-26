// uno.config.ts
import { defineConfig, presetIcons, presetUno } from 'unocss';

export default defineConfig({
	presets: [
		presetUno(),
		presetIcons({
			scale: 1,
			warn: true,
			collections: {
				tabler: () => import('@iconify-json/tabler/icons.json').then((i) => i.default)
			}
		})
	]
});
