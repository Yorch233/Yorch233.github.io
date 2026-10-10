import { defineConfig } from '@playwright/test';

const devServer = process.env.E2E_SERVER === 'dev';
const port = 4322;
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
	testDir: './tests/e2e',
	timeout: 120_000,
	expect: { timeout: 10_000 },
	forbidOnly: !!process.env.CI,
	reporter: 'list',
	// Timing-sensitive assertions (loader splash, animation polling) assume a
	// quiet machine; run serially like the previous runtime harness did.
	workers: 1,
	use: {
		baseURL,
		trace: 'retain-on-failure',
		permissions: ['clipboard-read', 'clipboard-write'],
		launchOptions: { args: ['--autoplay-policy=no-user-gesture-required'] }
	},
	webServer: devServer
		? {
				command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
				url: `${baseURL}/`,
				reuseExistingServer: !process.env.CI,
				timeout: 120_000
			}
		: {
				command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${port}`,
				url: `${baseURL}/`,
				reuseExistingServer: !process.env.CI,
				timeout: 300_000
			}
});
