import { check, expect, test, trackRequests, waitForExpr, verifyControlIcons } from './helpers';
import { uiIconCatalog } from '../../src/lib/ui-icon-catalog.js';

test.describe('Icon gallery', () => {
	test('gallery exports, selection states and manifest', async ({ page }) => {
		test.setTimeout(240_000);
		const requests = trackRequests(page);
		await page.goto('/icons/');
		await waitForExpr(page, "!!document.querySelector('.icon-preview') && !document.querySelector('.icon-preview').closest('astro-island').hasAttribute('ssr')", 'The icon gallery island never hydrated.');
		await check(page, `document.querySelectorAll('.icon-gallery-card').length === ${uiIconCatalog.length} && document.querySelectorAll('.icon-gallery-variants a[download]').length === ${uiIconCatalog.length * 2}`, 'Icon gallery is missing glyphs or state exports.');
		let galleryIconsChecked = false;
		for (const [width, height] of [[1280, 900], [390, 844], [320, 568], [667, 375]]) {
			await page.setViewportSize({ width, height });
			await page.evaluate("document.querySelectorAll('.icon-preview-nav button')[3].click(); true");
			if (!galleryIconsChecked) {
				await verifyControlIcons(page, '.icon-preview-nav button', 'aria-pressed');
				galleryIconsChecked = true;
			}
			await page.evaluate("document.querySelectorAll('.icon-preview-options button')[1].click(); true");
			await check(page, "[...document.querySelectorAll('.icon-size-samples .ui-icon')].every(n => n.dataset.state === 'inactive' && getComputedStyle(n.querySelector('.ui-icon__filled')).display === 'none')", 'Inactive size sample state did not update.');
			const galleryCheck = await page.evaluate<{ overflow: number; offenders: string[] }>(`(() => {
				const offenders = [...document.querySelectorAll('.icon-gallery-variants a, .icon-preview button')]
					.filter(n => n.getBoundingClientRect().height < 44)
					.map(n => (n.className || n.tagName) + '@' + Math.round(n.getBoundingClientRect().height) + 'px');
				return { overflow: document.documentElement.scrollWidth - innerWidth, offenders };
			})()`);
			expect(galleryCheck.overflow <= 0 && galleryCheck.offenders.length === 0, `Icon gallery overflows by ${galleryCheck.overflow}px or has small targets at ${width}px: ${galleryCheck.offenders.join(', ') || 'none'}.`).toBe(true);
			await page.evaluate("document.querySelectorAll('.icon-preview-options button')[0].click(); window.scrollTo(0, 0); true");
			if (process.env.SCREENSHOT_DIR && [1280, 390].includes(width)) {
				await page.waitForTimeout(200);
				await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/Qing-icons-${width}.png` });
			}
		}
		expect(requests.some(url => url.includes('/fonts/')), 'A local font request survived the system font stack migration.').toBe(false);
		const iconManifest = await (await page.request.get('/icons/manifest.json')).json();
		expect(iconManifest.length, 'Icon manifest is incomplete.').toBe(uiIconCatalog.length);
		const iconResponses = await Promise.all(iconManifest.flatMap((item: { variants: Record<string, string> }) => Object.values(item.variants)).map(async (path: string) => {
			const response = await page.request.get(path);
			const svg = await response.text();
			return response.ok() && svg.includes('viewBox="0 0 24 24"') && !svg.includes('<image');
		}));
		expect(iconResponses.every(Boolean), 'A standalone SVG state is unavailable or contains a bitmap.').toBe(true);
	});
});
