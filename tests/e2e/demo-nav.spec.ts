import { check, expect, instrumentLoader, test, waitForExpr } from './helpers';
import { demoGuides } from '../../src/data/demo-guide.js';
import { publications } from '../../src/data/publications.js';

const demoViewports: Array<[number, number]> = [[1280, 640], [1280, 720], [375, 667], [320, 568], [667, 375], [640, 400]];

test.describe('Demo floating navigation & ruler', () => {
	test('floating capsules, ruler and section jumps on every screen', async ({ page }) => {
		test.setTimeout(900_000);
		const brandedRoutes = new Set<string>();
		await instrumentLoader(page);
		for (const [width, height] of demoViewports) {
			for (const route of ['RSB', 'CoF'] as const) {
				await page.setViewportSize({ width, height });
				await page.goto(`/${route}/`);
				await waitForExpr(page, "!document.documentElement.classList.contains('is-loading') && document.querySelectorAll('.demo-floating-header > [data-visible=\"false\"]').length === 2", `${route} never finished loading.`);
				// First-paint branding is per document, not per viewport; verify once per route.
				if (!brandedRoutes.has(route)) {
					await check(page, "window.__firstYoForm === 'fluffy' && window.__firstYoIcon.includes('/qing-avatar.svg') && document.querySelector('link[rel=icon]').href.includes('/qing-avatar.svg') && document.querySelector('img[data-yo-logo]').src.includes('/yo-fluffy.svg')", `${route} branding lost the selected form.`);
					brandedRoutes.add(route);
				}
				await check(page, "!document.querySelector('.demo-yo') && !document.querySelector('.yo-actions-panel') && !document.querySelector('.yo-cloud')", `${route} should not render a mascot companion.`);
				await page.waitForTimeout(400); // A short settle; the capsule waits below gate the real conditions.
				await check(page, "[...document.querySelectorAll('.demo-floating-header > div')].every(n => n.inert)", `${route} hidden capsules can receive focus.`);
				await check(page, "JSON.stringify([...document.querySelectorAll('[data-demo-resources] a[data-full-text]')].map(a => a.href)) === JSON.stringify([...document.querySelectorAll('.demo-resource-links a')].map(a => a.href))", `${route} floating full-text resources differ from the original links.`);
				await check(page, "document.querySelector('.demo-capsule-paper-title').textContent.replace(/\\s+/g, ' ').trim() === document.querySelector('[data-demo-title]').textContent.replace(/\\s+/g, ' ').trim() && document.querySelector('.demo-capsule-publication').textContent.includes('2026')", `${route} floating paper identity is incomplete.`);
				await check(page, `(() => { const links=[...document.querySelectorAll('.demo-resource-links a')]; const fullText = links.filter(a => a.dataset.fullText === 'true'); return links.length === ${route === 'RSB' ? 2 : 1} && fullText.some(a => a.href === '${route === 'RSB' ? 'https://ieeexplore.ieee.org/document/11623672' : 'https://arxiv.org/pdf/2609.24651'}' && a.textContent.trim() === '${route === 'RSB' ? 'IEEE' : 'arXiv PDF'}') && links.every(a => !/github|huggingface|modelscope/.test(a.href)); })()`, `${route} full-text controls include wrong destinations.`);
				await page.evaluate("window.scrollTo(0, document.querySelector('[data-demo-title]').getBoundingClientRect().bottom + scrollY + 20); true");
				await waitForExpr(page, "document.querySelector('.demo-title-capsule').dataset.visible === 'true'", `${route} title capsule never appeared.`);
				await check(page, "document.querySelector('.demo-resources-capsule').dataset.visible === 'false'", `${route} resources floated before leaving the viewport.`);
				await page.evaluate("window.scrollTo(0, document.querySelector('[data-demo-resources]').getBoundingClientRect().bottom + scrollY + 40); true");
				await waitForExpr(page, "document.querySelector('.demo-resources-capsule').dataset.visible === 'true'", `${route} resources capsule never appeared.`);
				await waitForExpr(page, "[...document.querySelectorAll('.demo-floating-header > .floating-capsule')].every(node => ['none', 'matrix(1, 0, 0, 1, 0, 0)'].includes(getComputedStyle(node).transform))", `${route} capsules never settled after floating.`);
				await waitForExpr(page, "document.querySelector('.demo-return').dataset.visible === 'true'", `${route} return capsule never appeared.`);
				await check(page, "(() => { const scrim = getComputedStyle(document.querySelector('.demo-floating-header'), '::before'); const nav = document.querySelector('.demo-return'); const links = [...nav.querySelectorAll('a')]; return !nav.inert && links.length === 2 && links[0].textContent.trim() === 'Scroll to top' && links[1].textContent.trim() === 'Return to home' && links[1].getAttribute('href') === '/' && links.every(link => { const box = link.getBoundingClientRect(); return box.width >= 44 && box.height >= 44 && box.left >= 0 && box.right <= innerWidth && box.bottom <= innerHeight; }) && scrim.backdropFilter === 'none' && scrim.backgroundColor !== 'rgba(0, 0, 0, 0)' && scrim.maskImage.includes('linear-gradient') && getComputedStyle(document.querySelector('.demo-floating-header'), '::before').opacity === '1'; })()", `${route} return controls or feathered header scrim are incorrect at ${width}x${height}.`);
				if (width <= 960) {
					await check(page, "[...document.querySelectorAll('.demo-floating-header .floating-capsule')].every(node => !node.style.getPropertyValue('--glass-refraction') && getComputedStyle(node, '::before').backdropFilter === 'blur(18px) saturate(1.12)' && getComputedStyle(node, '::before').transform === 'none' && getComputedStyle(node, '::after').display === 'block') && !document.querySelector('.glass-defs feDisplacementMap')", `${route} compact capsules should use frosted blur without optical lenses.`);
				} else {
					await waitForExpr(page, "[...document.querySelectorAll('.demo-floating-header .floating-capsule')].every(node => node.style.getPropertyValue('--glass-refraction').includes('url(#home-lens-'))", `${route} lenses never attached on desktop.`);
					await check(page, "[...document.querySelectorAll('.demo-floating-header .floating-capsule, .demo-return .floating-capsule')].every(node => { const id = node.style.getPropertyValue('--glass-refraction').match(/#([^)]*)/)[1]; const lens = document.getElementById(id); const surface = getComputedStyle(node, '::before'); return Number(lens.getAttribute('width')) === node.offsetWidth && Number(lens.getAttribute('height')) === node.offsetHeight && lens.querySelectorAll('feDisplacementMap').length === 1 && !lens.querySelector('feColorMatrix') && getComputedStyle(node).backgroundColor === 'rgba(0, 0, 0, 0)' && surface.backdropFilter.includes('#' + id) && (node.closest('.demo-floating-header') ? surface.backdropFilter.includes('blur(1px)') : !surface.backdropFilter.includes('blur(')); })", `${route} floating capsules lost their transparent, size-correct liquid-glass lenses.`);
				}
				const capsuleLayout = await page.evaluate<{ left: { left: number; right: number; bottom: number; top: number }; right: { left: number; right: number; bottom: number; top: number }; viewport: number[]; pageWidth: number; text: Array<{ display: string; scroll: number; client: number }>; links: number[] }>("(() => { const left=document.querySelector('.demo-title-capsule').getBoundingClientRect().toJSON(); const right=document.querySelector('.demo-resources-capsule').getBoundingClientRect().toJSON(); return {left, right, viewport:[innerWidth, innerHeight], pageWidth:document.documentElement.scrollWidth, text:[...document.querySelectorAll('.demo-capsule-title span')].map(n => ({display:getComputedStyle(n).display, scroll:n.scrollWidth, client:n.clientWidth})), links:[...document.querySelectorAll('.demo-resource-link')].map(n => n.getBoundingClientRect().height)}; })()");
				expect(capsuleLayout.left.left >= 0 && capsuleLayout.right.right <= width && (capsuleLayout.left.right + 7 <= capsuleLayout.right.left || capsuleLayout.left.bottom + 7 <= capsuleLayout.right.top) && capsuleLayout.right.bottom < height && capsuleLayout.pageWidth <= width && capsuleLayout.text.every((n: { display: string; scroll: number; client: number }) => n.display !== 'none' && n.scroll <= n.client) && capsuleLayout.links.every((n: number) => n >= 44), `${route} full-title capsules overlap, truncate or overflow at ${width}x${height}: ${JSON.stringify(capsuleLayout)}`).toBe(true);
				if (process.env.SCREENSHOT_DIR) {
					await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/${route}-capsules-${width}x${height}.png` });
				}
				await page.evaluate("document.querySelector('[data-scroll-top]').click(); true");
				await waitForExpr(page, "[...document.querySelectorAll('.demo-floating-header > div')].every(n => n.dataset.visible === 'false' && n.inert) && document.querySelector('[data-demo-title]').getBoundingClientRect().top >= 0 && scrollY === 0", `${route} scroll-to-top never reset the capsules.`);
				await check(page, `document.querySelectorAll('.demo-section-list a').length === ${demoGuides[route].length} && [...document.querySelectorAll('.demo-section-list a')].every(a => document.getElementById(a.hash.slice(1))) && document.querySelectorAll('.demo-section-list a[aria-current]').length === 1`, `${route} section ruler has missing targets or inconsistent current state.`);
				await check(page, "document.querySelectorAll('.demo-section-tick').length === document.querySelectorAll('.demo-section-list a').length && ['none', 'normal'].includes(getComputedStyle(document.querySelector('.demo-section-list'), '::before').content)", `${route} section ruler contains ticks without corresponding content.`);
				if (width < 960 || height < 600) {
					await check(page, "getComputedStyle(document.querySelector('.demo-section-list')).display === 'none' && document.querySelector('.demo-section-toggle').getBoundingClientRect().width >= 44", `${route} compact ruler does not collapse or has an undersized toggle.`);
					await page.evaluate("document.querySelector('.demo-section-toggle').click(); true");
					await waitForExpr(page, "document.querySelector('.demo-section-toggle').getAttribute('aria-expanded') === 'true' && document.querySelector('.demo-return').inert", `${route} section menu never opened.`);
					await check(page, "document.querySelector('.demo-return').inert", `${route} return controls must yield to the chapter menu.`);
					await check(page, "(() => { const list = document.querySelector('.demo-section-list').getBoundingClientRect(); return list.top >= 0 && list.bottom <= innerHeight && list.right <= innerWidth && [...document.querySelectorAll('.demo-section-list a')].every(a => a.getBoundingClientRect().height >= 44); })()", `${route} compact section list overflows the window or has small touch targets.`);
					await page.evaluate("document.querySelector('.demo-section-toggle').focus(); document.querySelector('.demo-section-list a').focus(); true");
					await check(page, "document.querySelector('[data-section-nav]').dataset.open === 'true'", `${route} section list closes while focus moves inside it.`);
					await page.keyboard.press('Escape');
					await waitForExpr(page, "document.querySelector('[data-section-nav]').dataset.open === 'false' && document.activeElement === document.querySelector('.demo-section-toggle')", `${route} Escape did not close the section menu onto its toggle.`);
					await page.evaluate("document.querySelector('.demo-section-toggle').click(); true");
					await page.mouse.click(width - 4, height - 4);
					await waitForExpr(page, "document.querySelector('[data-section-nav]').dataset.open === 'false'", `${route} outside click did not close the section menu.`);
					await page.evaluate("document.querySelector('.demo-section-toggle').click(); true");
				} else {
					await page.evaluate("document.querySelector('.demo-section-list a').focus(); true");
					await page.keyboard.press('Tab');
					await waitForExpr(page, "(() => { const link = document.querySelector('.demo-section-list a:focus-visible'); return link && getComputedStyle(link.querySelector('.demo-section-label')).opacity === '1' && link.querySelector('.demo-section-tick').getBoundingClientRect().width >= 31; })()", `${route} keyboard focus never revealed the section label.`);
				}
				await page.evaluate("[...document.querySelectorAll('.demo-section-list a')].at(-1).click(); true");
				await waitForExpr(page, "(() => { const link = [...document.querySelectorAll('.demo-section-list a')].at(-1); return location.hash === link.hash && link.getAttribute('aria-current') === 'location' && document.activeElement === document.getElementById(link.hash.slice(1)); })()", `${route} section jump never landed on the last chapter.`);
				await check(page, "document.querySelector('[data-section-nav]').dataset.open === 'false' && document.documentElement.scrollWidth <= innerWidth", `${route} section jump leaves an open list or overflows.`);
				await waitForExpr(page, "(() => { const target = document.activeElement.getBoundingClientRect(); const header = document.querySelector('.demo-floating-header').getBoundingClientRect(); return target.top >= header.bottom + 4; })()", `${route} section anchor is hidden under the floating capsules.`);
                if (width <= 720) {
                    // Hydration can shorten the phone audio list while section
                    // reveal transforms are running. Check the settled landing too.
                    await page.waitForTimeout(850);
                    await check(page, "(() => { const target = document.activeElement.getBoundingClientRect(); const header = document.querySelector('.demo-floating-header').getBoundingClientRect(); return target.top >= header.bottom + 4; })()", `${route} phone anchor drifted under the header after hydration.`);
                }
				if (width === 1280 && height === 640) {
					const citation = publications.find(paper => paper.slug === route)!.bibtex;
					await check(page, `document.querySelector('[data-bibtex]').textContent === ${JSON.stringify(citation)}`, `${route} citation differs from its publication metadata.`);
					await page.evaluate("document.querySelector('[data-paper-citation] [data-copy-text]').click(); true");
					await waitForExpr(page, "document.querySelector('[data-copy-status]').textContent === 'BibTeX copied to clipboard.'", `${route} BibTeX copy never confirmed.`);
					expect(await page.evaluate<string>('navigator.clipboard.readText()'), `${route} copied the wrong citation.`).toBe(citation);
				}
				await page.evaluate('history.back(); true');
				await waitForExpr(page, '!location.hash && scrollY === 0', `${route} history back never returned to the top.`);
			}
		}
	});
});
