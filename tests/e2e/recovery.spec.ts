import type { Page } from '@playwright/test';
import { denoiseSamples } from '../../src/data/cof-audio.js';
import { expect, seenWelcome, test } from './helpers';

declare global {
	interface Window {
		__audioOrigins: Record<string, string>;
	}
}

const sampleOpus = denoiseSamples[0].replace(/\.wav$/, '.opus');

async function openHome(page: Page) {
	await seenWelcome(page);
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/#publications');
	await expect(page.locator('.pub').first()).toBeVisible();
	await expect(page.locator('html')).toHaveClass(/is-revealed/);
}

async function openAudio(page: Page) {
	await page.setViewportSize({ width: 1280, height: 800 });
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/CoF/');
	await page.locator('#cof-audio-heading').scrollIntoViewIfNeeded();
	await expect(page.locator('.audio-group').first().locator('.wave-compare')).toBeVisible();
	await expect.poll(() => page.locator('.wave-compare').first().evaluate(node =>
		!node.closest('astro-island')?.hasAttribute('ssr'))).toBe(true);
}

test.describe('Reading and audio recovery', () => {
	test('section switches preserve independent abstracts and expanded news', async ({ page }) => {
		await openHome(page);
		const papers = page.locator('.pub');
		await papers.first().getByRole('button', { name: 'Expand abstract for CoF' }).click();
		await page.locator('.toplink[href="#news"]').click();
		await page.locator('.news-toggle').click();
		await expect(page.locator('.news-toggle')).toHaveAttribute('aria-expanded', 'true');
		await page.locator('.toplink[href="#publications"]').click();
		await expect(papers.first().locator('.pub-abstract')).toBeVisible();
		await expect(papers.nth(1).locator('.pub-abstract')).toBeHidden();
		await page.locator('.toplink[href="#news"]').click();
		await expect(page.locator('.news-toggle')).toHaveAttribute('aria-expanded', 'true');
		await expect(page.locator('.meet-card')).toHaveCount(1);
		await expect(page.locator('.pub')).toHaveCount(0);
	});

	test('Back restores the reading position after restoring expanded content', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 640 });
		await openHome(page);
		await page.locator('.pub').first().getByRole('button', { name: 'Expand abstract for CoF' }).click();
		await page.evaluate(() => window.scrollTo({ top: 650, behavior: 'instant' }));
		const readingY = await page.evaluate(() => window.scrollY);
		expect(readingY).toBeGreaterThan(500);
		await page.locator('.toplink[href="#news"]').click();
		await expect(page.locator('#section-heading')).toHaveText('News');
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
		await page.goBack();
		await expect(page.locator('.pub').first().locator('.pub-abstract')).toBeVisible();
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(readingY, 0);
		await expect(page.locator('.toplink[href="#publications"]')).toHaveAttribute('aria-current', 'location');
		await page.goForward();
		await expect(page.locator('#section-heading')).toHaveText('News');
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
		await page.locator('.toplink[href="#publications"]').click();
		await expect(page.locator('.pub').first().locator('.pub-abstract')).toBeVisible();
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
	});

	test('each history entry restores its own expansion snapshot', async ({ page }) => {
		await openHome(page);
		const abstract = page.locator('.pub').first().locator('.pub-abstract');
		await expect(abstract).toBeHidden();
		await page.locator('.toplink[href="#news"]').click();
		await page.locator('.toplink[href="#publications"]').click();
		await page.locator('.pub').first().getByRole('button', { name: 'Expand abstract for CoF' }).click();
		await page.locator('.toplink[href="#news"]').click();
		await page.goBack();
		await expect(abstract).toBeVisible();
		await page.goBack();
		await expect(page.locator('#section-heading')).toHaveText('News');
		await page.goBack();
		await expect(abstract).toBeHidden();
		await page.goForward();
		await expect(page.locator('#section-heading')).toHaveText('News');
		await page.goForward();
		await expect(abstract).toBeVisible();
	});

	test('Back to a native skip-link entry keeps its reading section', async ({ page }) => {
		await openHome(page);
		await page.locator('.skip-link').focus();
		await page.locator('.skip-link').press('Enter');
		await expect(page).toHaveURL(/#main-content$/);
		await expect(page.locator('.pub').first()).toBeVisible();
		await page.locator('.toplink[href="#news"]').click();
		await expect(page.locator('#section-heading')).toHaveText('News');
		await page.goBack();
		await expect(page).toHaveURL(/#main-content$/);
		await expect(page.locator('.pub').first()).toBeVisible();
		await expect(page.locator('#main-content')).toBeFocused();
	});

	for (const theme of ['light', 'dark'] as const) {
		test(`cold ${theme} visits preload only the matching cloud texture`, async ({ page }) => {
			const textures: string[] = [];
			page.on('request', request => {
				if (/\/backgrounds\/cloud-(sky|dusk)-v1\.webp$/.test(request.url())) textures.push(request.url());
			});
			await seenWelcome(page);
			await page.addInitScript(value => localStorage.setItem('home-theme.v1', value), theme);
			await page.goto('/');
			await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
			await expect(page.locator('html')).toHaveClass(/is-revealed/);
			const asset = theme === 'dark' ? 'cloud-dusk-v1.webp' : 'cloud-sky-v1.webp';
			await expect.poll(() => textures.length).toBeGreaterThan(0);
			expect(textures.every(url => url.endsWith(asset))).toBe(true);
			await expect(page.locator('link[rel="preload"][as="image"]')).toHaveAttribute('href', `/backgrounds/${asset}`);
		});
	}

	test('a failed desktop waveform retries through the existing view controls', async ({ page }) => {
		let attempts = 0;
		await page.route('**/audio/CoF/nfe4/Measurement/**', async route => {
			if (!decodeURIComponent(new URL(route.request().url()).pathname).endsWith(sampleOpus)) return route.continue();
			attempts += 1;
			if (attempts === 1) return route.fulfill({ status: 503, body: 'Temporary test failure' });
			return route.continue();
		});
		await openAudio(page);
		const card = page.locator('.wave-compare').first();
		await expect(card.locator('.wave-error')).toBeVisible();
		expect(attempts).toBe(1);
		await card.getByRole('button', { name: 'Spectrogram', exact: true }).click();
		await card.getByRole('button', { name: 'Waveform', exact: true }).click();
		await expect.poll(() => attempts).toBe(2);
		await expect(card.locator('.wave-error')).toHaveCount(0);
		await expect(card.locator('.wave-loading')).toHaveCount(0);
		await expect.poll(() => card.locator('.wave-canvas').evaluate(canvas =>
			(canvas as HTMLCanvasElement).width)).toBeGreaterThan(300);
		await expect(card.locator('.wave-download')).toHaveAttribute('href', /\/nfe4\/Measurement\/.+\.wav$/);
	});

	for (const fails of [false, true]) {
		test(`a late old-budget ${fails ? 'failure' : 'response'} cannot replace the current audio source`, async ({ page }) => {
			// Associate each real blob with its fetched URL without changing the
			// bytes, so the assertion checks the actual source attached to audio.
			await page.addInitScript(() => {
				const origins = new WeakMap<ArrayBuffer, string>();
				const blobs = new WeakMap<Blob, string>();
				const state = window as Window & { __audioOrigins: Record<string, string> };
				state.__audioOrigins = {};
				const nativeFetch = window.fetch.bind(window);
				window.fetch = async (input, init) => {
					const response = await nativeFetch(input, init);
					const arrayBuffer = response.arrayBuffer.bind(response);
					response.arrayBuffer = async () => {
						const buffer = await arrayBuffer();
						origins.set(buffer, response.url);
						return buffer;
					};
					return response;
				};
				const NativeBlob = window.Blob;
				window.Blob = class extends NativeBlob {
					constructor(parts: BlobPart[] = [], options?: BlobPropertyBag) {
						super(parts, options);
						const origin = parts[0] instanceof ArrayBuffer ? origins.get(parts[0]) : undefined;
						if (origin) blobs.set(this, origin);
					}
				};
				const createObjectURL = URL.createObjectURL.bind(URL);
				URL.createObjectURL = object => {
					const url = createObjectURL(object);
					if (object instanceof Blob) state.__audioOrigins[url] = blobs.get(object) ?? '';
					return url;
				};
			});
			let release!: () => void;
			const gate = new Promise<void>(resolve => { release = resolve; });
			let held = false;
			await page.route('**/audio/CoF/nfe4/SB-VE_cof/**', async route => {
				const response = fails ? undefined : await route.fetch();
				held = true;
				await gate;
				if (fails) await route.fulfill({ status: 503, body: 'Expired request failure' });
				else await route.fulfill({ response });
			});
			try {
				await openAudio(page);
				const card = page.locator('.wave-compare').first();
				await card.locator('.method-chip', { hasText: 'CoF (SB-VE)' }).click();
				await expect.poll(() => held).toBe(true);
				await card.locator('.budget-toggle').getByRole('button', { name: '1 NFE', exact: true }).click();
				const sourcePath = () => card.locator('audio').evaluate(audio => {
					const origins = (window as Window & { __audioOrigins: Record<string, string> }).__audioOrigins;
					return origins[(audio as HTMLAudioElement).src] ?? '';
				});
				await expect.poll(sourcePath).toContain('/audio/CoF/nfe1/SB-VE_cof/');
				const completion = page.waitForResponse(response => response.url().includes('/nfe4/SB-VE_cof/'));
				release();
				await (await completion).finished();
				if (!fails) await page.waitForFunction(() => Object.values((window as Window & {
					__audioOrigins: Record<string, string>;
				}).__audioOrigins).some(url => url.includes('/nfe4/SB-VE_cof/')));
				await page.evaluate(() => new Promise<void>(resolve =>
					requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
				expect(await sourcePath()).toContain('/audio/CoF/nfe1/SB-VE_cof/');
				await expect(card.locator('.wave-download')).toHaveAttribute('href', /\/nfe1\/SB-VE_cof\//);
				await expect(card.locator('.wave-error')).toHaveCount(0);
			} finally {
				release();
			}
		});
	}

	test('returning to a pending budget can reuse its resource without a stuck waveform', async ({ page }) => {
		let release!: () => void;
		const gate = new Promise<void>(resolve => { release = resolve; });
		let held = false;
		await page.route('**/audio/CoF/nfe4/SB-VE_cof/**', async route => {
			const response = await route.fetch();
			held = true;
			await gate;
			await route.fulfill({ response });
		});
		try {
			await openAudio(page);
			const card = page.locator('.wave-compare').first();
			await card.locator('.method-chip', { hasText: 'CoF (SB-VE)' }).click();
			await expect.poll(() => held).toBe(true);
			await card.locator('.budget-toggle').getByRole('button', { name: '1 NFE', exact: true }).click();
			await expect(card.locator('.wave-download')).toHaveAttribute('href', /\/nfe1\/SB-VE_cof\//);
			await expect(card.locator('.wave-loading')).toHaveCount(0);
			await card.locator('.budget-toggle').getByRole('button', { name: '4 NFE', exact: true }).click();
			const completion = page.waitForResponse(response => response.url().includes('/nfe4/SB-VE_cof/'));
			release();
			await (await completion).finished();
			await expect(card.locator('.wave-download')).toHaveAttribute('href', /\/nfe4\/SB-VE_cof\//);
			await expect(card.locator('.wave-loading')).toHaveCount(0);
			await expect(card.locator('.wave-error')).toHaveCount(0);
			await expect(card.locator('audio')).toHaveAttribute('src', /^blob:/);
		} finally {
			release();
		}
	});

	test('returning to a cached method clears a different method loading overlay', async ({ page }) => {
		let release!: () => void;
		const gate = new Promise<void>(resolve => { release = resolve; });
		let held = false;
		await page.route('**/audio/CoF/nfe4/SB-VE_cof/**', async route => {
			const response = await route.fetch();
			held = true;
			await gate;
			await route.fulfill({ response });
		});
		try {
			await openAudio(page);
			const card = page.locator('.wave-compare').first();
			await expect(card.locator('.wave-loading')).toHaveCount(0);
			await card.locator('.method-chip', { hasText: 'CoF (SB-VE)' }).click();
			await expect.poll(() => held).toBe(true);
			await expect(card.locator('.wave-loading')).toBeVisible();
			await card.locator('.method-chip-measurement').click();
			await expect(card.locator('.wave-loading')).toHaveCount(0);
			await expect(card.locator('.wave-error')).toHaveCount(0);
			await expect(card.locator('.wave-download')).toHaveAttribute('href', /\/Measurement\//);
			await expect.poll(() => card.locator('audio').evaluate(audio => (audio as HTMLAudioElement).paused)).toBe(false);
		} finally {
			release();
		}
	});
});
