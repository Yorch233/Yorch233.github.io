import { check, expect, seenWelcome, test, trackRequests, waitForExpr } from './helpers';
import { readFile } from 'node:fs/promises';
import { publications } from '../../src/data/publications.js';

const profile = JSON.parse(await readFile('src/data/profile.json', 'utf8'));

const homeViewports: Array<[number, number]> = [[1280, 800], [768, 1024], [390, 844], [375, 667], [320, 568], [667, 375], [844, 390]];

test.describe('Homepage layout, glass, theme & contact', () => {
	test('clouds, theme switch and reduced motion', async ({ page }) => {
		test.setTimeout(240_000);
		const requests = trackRequests(page);
		await seenWelcome(page);
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/#publications');
		await waitForExpr(page, "location.hash === '#publications' && !!document.querySelector('.meet-card') && !document.documentElement.classList.contains('is-loading')", 'The homepage never finished loading.');
		expect(requests.some(url => url.endsWith('/backgrounds/cloud-sky-v1.webp')) && !requests.some(url => url.endsWith('/cloud-sky-reference.png')), 'Homepage cloud asset is missing or loads the unoptimized reference.').toBe(true);
		await check(page, "document.querySelector('.home-clouds').getAttribute('aria-hidden') === 'true' && getComputedStyle(document.querySelector('.home-clouds')).pointerEvents === 'none' && getComputedStyle(document.querySelector('.home-clouds')).position === 'fixed'", 'Decorative clouds block content or scroll with the page.');
		const cloudsBefore = await page.evaluate("[...document.querySelectorAll('.home-clouds span')].map(n => getComputedStyle(n).transform).join('|')");
		const cloudX = await page.evaluate<number[]>("[...document.querySelectorAll('.home-clouds span')].slice(0, 2).map(n => new DOMMatrixReadOnly(getComputedStyle(n).transform).m41)");
		await page.waitForTimeout(1000);
		await check(page, `[...document.querySelectorAll('.home-clouds span')].slice(0, 2).some((n, i) => new DOMMatrixReadOnly(getComputedStyle(n).transform).m41 < ${JSON.stringify(cloudX)}[i] - innerWidth * .008)`, 'Cloud flow is too subtle or reverses direction.');
		// Record the actual animation request before clicking: a 520ms animation
		// can finish between round trips, making live-animation polling flaky.
		await page.evaluate("window.__nativeThemeAnimate = Element.prototype.animate; window.__themeCircleAnimated = false; Element.prototype.animate = function(frames, options) { if (options?.pseudoElement === '::view-transition-new(root)' && Array.isArray(frames?.clipPath) && String(frames.clipPath[0]).startsWith('circle(0px at ')) window.__themeCircleAnimated = true; return window.__nativeThemeAnimate.call(this, frames, options); }; true");
		await page.evaluate("document.querySelector('.theme-toggle').click(); true");
		await waitForExpr(page, "document.documentElement.dataset.theme === 'dark'", 'Theme never switched to dark.');
		await check(page, "location.hash === '#publications' && document.querySelector('.theme-toggle').getAttribute('aria-pressed') === 'true' && localStorage.getItem('home-theme.v1') === 'dark'", 'Theme switching changed the section or failed to save its choice.');
		if (await page.evaluate<boolean>('!!document.startViewTransition')) {
			await waitForExpr(page, 'window.__themeCircleAnimated', 'Dark mode did not run its circular reveal.');
		}
		await waitForExpr(page, '!document.documentElement.dataset.themeTransition', 'Theme transition never settled.');
		await page.evaluate("Element.prototype.animate = window.__nativeThemeAnimate; delete window.__nativeThemeAnimate; delete window.__themeCircleAnimated; true");
		await check(page, "getComputedStyle(document.body).backgroundColor === 'rgb(17, 27, 43)'", 'Dark mode did not paint the homepage.');
		await check(page, "getComputedStyle(document.querySelector('.home-clouds span')).backgroundImage.includes('/backgrounds/cloud-dusk-v1.webp')", 'Dark mode did not select its dusk cloud texture.');
		expect(requests.some(url => url.endsWith('/backgrounds/cloud-dusk-v1.webp')), 'Dusk clouds were not loaded after selecting dark mode.').toBe(true);
		expect(cloudsBefore).not.toBe(await page.evaluate("[...document.querySelectorAll('.home-clouds span')].map(n => getComputedStyle(n).transform).join('|')"));
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await check(page, "[...document.querySelectorAll('.home-clouds span')].every(n => getComputedStyle(n).animationName === 'none' && getComputedStyle(n).transform === 'none')", 'Cloud background keeps moving under reduced motion.');
		await check(page, "[...document.querySelectorAll('.page-loader-wave span')].every(n => getComputedStyle(n).animationName === 'none') && getComputedStyle(document.querySelector('.page-loader-avatar')).animationName === 'none'", 'Loader wave keeps moving under reduced motion.');
		await page.evaluate("document.querySelector('.theme-toggle').click(); true");
		await check(page, "document.documentElement.dataset.theme === 'light' && !document.documentElement.dataset.themeTransition", 'Reduced motion did not switch themes immediately.');
		await page.emulateMedia({ reducedMotion: 'no-preference' });
	});

	test('reading layout holds on every screen', async ({ page }) => {
		test.setTimeout(300_000);
		await seenWelcome(page);
		await page.goto('/#publications');
		await waitForExpr(page, "location.hash === '#publications' && !!document.querySelector('.meet-card') && !document.documentElement.classList.contains('is-loading')", 'The homepage never finished loading.');
		for (const [width, height] of homeViewports) {
			await page.setViewportSize({ width, height });
			await page.waitForTimeout(550);
			await page.evaluate('window.scrollTo(0, 0); true');
			const layout = await page.evaluate<Record<string, number>>(`(() => {
				const card = document.querySelector('.meet-card').getBoundingClientRect();
				const more = document.querySelector('.meet-more').getBoundingClientRect();
				const bubble = document.querySelector('.meet-bubble').getBoundingClientRect();
				const body = document.querySelector('.card-body');
				return { cardTop: card.top, cardBottom: card.bottom, moreBottom: more.bottom,
					bubbleLeft: bubble.left, bubbleRight: bubble.right,
					bodyHeight: body.clientHeight, bodyWidth: body.clientWidth, bodyScrollWidth: body.scrollWidth,
					height: innerHeight, width: innerWidth,
					pageWidth: document.documentElement.scrollWidth };
			})()`);
			expect(layout.cardBottom > layout.cardTop && layout.moreBottom >= layout.cardBottom, `Homepage card or replies are clipped at ${width}x${height}: ${JSON.stringify(layout)}`).toBe(true);
			expect(layout.bodyHeight, `Homepage reading area is too small at ${width}x${height}.`).toBeGreaterThanOrEqual(80);
			expect(layout.bodyScrollWidth <= layout.bodyWidth, `Homepage text overflows its reading pane at ${width}x${height}.`).toBe(true);
			expect(layout.pageWidth <= layout.width, `Homepage overflows horizontally at ${width}x${height}.`).toBe(true);
			await check(page, "(() => { const frame = document.querySelector('.meet--chat').getBoundingClientRect(); const card = document.querySelector('.meet-card').getBoundingClientRect(); return Math.abs(frame.width - card.width) < 1; })()", `Homepage reading card leaves an unused column at ${width}x${height}.`);
			await check(page, `(() => {
				const left = document.querySelector('.topbar .brand').getBoundingClientRect(), shell = document.querySelector('.actions-pill').getBoundingClientRect();
				const tools = document.querySelector('.home-utilities').getBoundingClientRect(), sel = document.querySelector('.home-nav-indicator').getBoundingClientRect();
				/* Desktop glass runs 12px taller than the shell; on phones the five
				   links are uniform 50×50 round icon buttons and the white
				   selection mirrors their size, centered vertically. */
				const sizeOk = innerWidth > 960
					? Math.abs(sel.height - shell.height - 12) < 1
					: Math.abs(sel.height - 50) < 1 && Math.abs(sel.width - 64) < 1;
				const vCentered = Math.abs((sel.top + sel.bottom) / 2 - (shell.top + shell.bottom) / 2) < (innerWidth > 960 ? 1 : 2);
				const inside = left.left >= 0 && tools.right <= innerWidth && sizeOk && vCentered &&
					(innerWidth > 960 || (sel.top >= shell.top && sel.bottom <= shell.bottom));
				if (innerWidth > 960) return inside && shell.left - left.right >= 7 && tools.left - shell.right >= 5 && Math.abs(shell.top - tools.top) <= 1;
				return inside && tools.left - left.right >= 7 && shell.left >= 0 && shell.right <= innerWidth && shell.top > tools.bottom &&
					document.querySelector('.meet-avatar').getBoundingClientRect().bottom < shell.top &&
					[...document.querySelectorAll('.toplink')].every(link => link.getBoundingClientRect().height >= 44 && link.querySelector('.nav-label').getBoundingClientRect().width <= link.clientWidth + 24);
			})()`, `Navigation overlaps, overflows or loses its selection relationship at ${width}x${height}.`);
			expect(layout.bubbleLeft >= 0 && layout.bubbleRight <= layout.width, `Yo's speech is clipped at ${width}x${height}.`).toBe(true);
			await page.evaluate('window.scrollTo(0, document.documentElement.scrollHeight); true');
			await check(page, "(() => { const body = document.querySelector('.card-body'); return body.scrollHeight <= body.clientHeight + 1 && document.querySelector('.home-footer').getBoundingClientRect().bottom <= innerHeight + 1; })()", `Homepage overflowing content cannot scroll at ${width}x${height}.`);
			await check(page, "[...document.querySelectorAll('.topbar .floating-capsule')].every(node => { const rect = node.getBoundingClientRect(); return rect.top >= 0 && rect.bottom < innerHeight; })", `Header capsules do not remain reachable after scrolling at ${width}x${height}.`);
		}
		await page.evaluate("document.querySelector('.meet-close').click(); true");
		await waitForExpr(page, "!!document.querySelector('.meet-greet') && location.hash === ''", 'Closing the reading card failed.');
		await check(page, `(() => {
			const about = document.querySelector('.home-about');
			if (!about) return false;
			const text = about.textContent;
			const bio = ${JSON.stringify(profile.bio)}.map(paragraph => paragraph.replace(/\\*\\*/g, ''));
			return bio.every(paragraph => text.includes(paragraph.slice(0, 60))) &&
				text.includes('Advisor') && text.includes(${JSON.stringify(profile.advisor)}) &&
				about.querySelectorAll('.chip').length === ${JSON.stringify(profile.interests.length)};
		})()`, 'Welcome page is missing complete About Me content.');
		await check(page, `(() => {
			const links = [...document.querySelectorAll('.profile-identifiers a')].map(link => link.href);
			return links.length === 4 &&
				links.some(href => href.startsWith('mailto:')) &&
				links.some(href => href.includes('github.com')) &&
				links.some(href => href.includes('huggingface.co')) &&
				links.some(href => href.includes('orcid.org'));
		})()`, 'About Me is missing an email, GitHub, Hugging Face or ORCID link.');
		for (const [width, height] of homeViewports.slice(1)) {
			await page.setViewportSize({ width, height });
			await page.waitForTimeout(550);
			await check(page, `(() => {
				const greeting = document.querySelector('.meet-greet');
				greeting.querySelector('[data-topic=contact]').scrollIntoView({block: 'center', behavior: 'instant'});
				const last = greeting.querySelector('[data-topic=contact]').getBoundingClientRect();
				return last.top >= 68 && last.bottom <= innerHeight + 1;
			})()`, `Homepage greeting topics are unreachable at ${width}x${height}.`);
		}
	});

	test('Demo links animate once per hover and navigate directly', async ({ page }) => {
		await seenWelcome(page);
		await page.goto('/#publications');
		const link = page.locator('.pub-demo-link').first();
		const states = () => link.locator('[data-sparkle]').evaluateAll(stars => stars.flatMap(star => star.getAnimations().map(animation => animation.playState)));
		const bounds = () => link.locator('.ui-icon__line [data-sparkle]').evaluateAll(stars => stars.map(star => {
			const { x, y, width, height } = star.getBoundingClientRect();
			const origin = star.closest('svg')!.getBoundingClientRect();
			return { x: x - origin.x, y: y - origin.y, width, height };
		}));
		const initialBounds = await bounds();
		await link.hover();
		expect(new URL(page.url()).hash).toBe('#publications');
		await expect.poll(states).toContain('finished');
		const finalBounds = await bounds();
		for (const [index, box] of finalBounds.entries()) {
			const opposite = initialBounds[1 - index];
			for (const key of ['x', 'y', 'width', 'height'] as const) expect(Math.abs(box[key] - opposite[key])).toBeLessThan(1);
		}
		await link.locator('.ui-icon').hover();
		expect(await states()).not.toContain('running');
		await page.locator('.pub-title').first().hover();
		await expect.poll(states).toEqual([]);
		await link.hover();
		expect(await states()).toContain('running');
		await link.click();
		await page.waitForURL('**/CoF/');
		await page.goBack();
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto('/#publications');
		await page.locator('.pub-demo-link').first().hover();
		expect(await states()).toEqual([]);
		await page.locator('.pub-demo-link').first().click();
		await page.waitForURL('**/CoF/');
	});

	test('publication abstracts stay hidden until expanded', async ({ page }) => {
		await seenWelcome(page);
		await page.goto('/#publications');
		await page.locator('.pub-abstract-toggle').first().waitFor();
		const cards = page.locator('.pub');
		await expect(cards).toHaveCount(publications.length);
		for (const width of [1280, 320]) {
			await page.setViewportSize({ width, height: 800 });
			for (const [index, paper] of publications.entries()) {
				const card = cards.nth(index);
				const abstractBlock = card.locator('.pub-abstract');
				const toggle = card.locator('.pub-abstract-toggle');
				await expect(card.locator('.pub-tldr')).toContainText(paper.tldr);
				await expect(abstractBlock).toBeHidden();
				await expect(toggle).toHaveAttribute('aria-controls', (await abstractBlock.getAttribute('id'))!);
				await expect(toggle).toHaveAttribute('aria-expanded', 'false');
				await expect(toggle).toHaveText('Expand');
				await toggle.press('Enter');
				await expect(abstractBlock).toBeVisible();
				await expect(abstractBlock.locator('.pub-summary')).toHaveText('Abstract' + paper.abstract);
				await expect(toggle).toHaveAttribute('aria-expanded', 'true');
				await expect(toggle).toHaveText('Collapse');
				for (let other = 0; other < publications.length; other++) {
					if (other !== index) await expect(cards.nth(other).locator('.pub-abstract')).toBeHidden();
				}
				await toggle.press('Space');
				await expect(abstractBlock).toBeHidden();
				await expect(toggle).toBeFocused();
			}
			await check(page, 'document.documentElement.scrollWidth <= innerWidth', `Publication abstracts overflow at ${width}px.`);
		}
	});

	test('glass tiers, lenses and navigation geometry', async ({ page }) => {
		test.setTimeout(240_000);
		await seenWelcome(page);
		await page.goto('/#publications');
		await waitForExpr(page, "location.hash === '#publications' && !!document.querySelector('.meet-card') && !document.documentElement.classList.contains('is-loading')", 'The homepage never finished loading.');
		await page.evaluate('window.scrollTo(0, 0); true');
		/* The compact-lens assertion mirrors the harness: it runs while the
		   viewport loop has just ended on the compact 844x390 screen. */
		await page.setViewportSize({ width: 844, height: 390 });
		await page.waitForTimeout(550);
		await check(page, "[...document.querySelectorAll('.topbar .floating-capsule')].every(node => node.style.getPropertyValue('--glass-refraction').includes('url(#home-lens-') && (node.matches('.actions-pill') ? getComputedStyle(node, '::before').backdropFilter.includes('blur(5px)') : !getComputedStyle(node, '::before').backdropFilter.includes('blur(')) && getComputedStyle(node, '::before').transform === 'none' && getComputedStyle(node, '::after').display === 'block') && document.querySelectorAll('.glass-defs feDisplacementMap').length === 4", 'Compact header capsules should retain optical lenses, with 5px blur on the primary navigation.');
		await page.setViewportSize({ width: 1280, height: 800 });
		await waitForExpr(page, "[...document.querySelectorAll('.topbar .floating-capsule')].every(node => node.style.getPropertyValue('--glass-refraction').includes('url(#home-lens-'))", 'Header lens references never attached.');
		await waitForExpr(page, "[...document.querySelectorAll('.topbar .floating-capsule')].every(node => { const id = node.style.getPropertyValue('--glass-refraction').match(/#([^)]*)/)[1]; const filter = document.getElementById(id); return Number(filter.getAttribute('width')) === node.offsetWidth && Number(filter.getAttribute('height')) === node.offsetHeight; })", 'Header lenses never matched their capsule size.');
		await check(page, "[...document.querySelectorAll('.topbar .floating-capsule')].every(node => { const id = node.style.getPropertyValue('--glass-refraction').match(/#([^)]*)/)[1]; const filter = document.getElementById(id); return Number(filter.getAttribute('width')) === node.offsetWidth && Number(filter.getAttribute('height')) === node.offsetHeight && filter.querySelectorAll('feDisplacementMap').length === 1 && !filter.querySelector('feColorMatrix'); })", 'Header glass lenses lost their size or introduced dispersion after viewport changes.');
		await check(page, "[...document.querySelectorAll('.topic-pill, .link-pill')].every(node => !node.style.getPropertyValue('--glass-refraction') && getComputedStyle(node).backdropFilter === 'none' && (node.matches('.topic-pill--primary, .link-pill--primary') ? getComputedStyle(node, '::before').backdropFilter === 'none' && !['none', 'normal'].includes(getComputedStyle(node, '::after').content) : getComputedStyle(node, '::after').display === 'none'))", 'Primary buttons retain glass edges; secondary navigation and resource links remain flat without reflected edges.');
		await check(page, "[...document.querySelectorAll('.home-clouds span')].every(node => !getComputedStyle(node).filter.includes('blur(')) && ['none'].includes(getComputedStyle(document.querySelector('.yo-welcome')).backdropFilter) && getComputedStyle(document.querySelector('.yo-welcome'), '::backdrop').backdropFilter === 'none'", 'Clouds and welcome overlays should use transparency instead of blur.');
		const glassScale = "Number(document.querySelector('.glass-defs filter feDisplacementMap').getAttribute('scale')) / Number(document.querySelector('.glass-defs filter').getAttribute('data-rest-scale'))";
		await check(page, "getComputedStyle(document.querySelector('.topbar')).backdropFilter === 'none'", 'Legacy header blur hides the glass rim refraction.');
		await check(page, `(() => {
			const button = document.createElement('button');
			button.className = 'topic-pill--primary'; button.dataset.glassTier = '2'; button.dataset.glassColor = 'green';
			document.body.append(button);
			const green = getComputedStyle(button).getPropertyValue('--glass-tint').trim();
			button.dataset.glassColor = 'white'; const whiteInk = getComputedStyle(button).color;
			button.dataset.glassColor = 'blue'; const blueInk = getComputedStyle(button).color;
			button.removeAttribute('data-glass-color'); button.style.setProperty('--glass-tint', '#9557c5');
			const custom = getComputedStyle(button).getPropertyValue('--glass-tint').trim();
			const filter = getComputedStyle(button, '::before').backdropFilter;
			button.remove();
			const ok = green.toLowerCase() === '#31d73f' && custom === '#9557c5' && filter === 'none' && whiteInk === 'rgb(37, 59, 88)' && blueInk === 'rgb(255, 255, 255)'; if (!ok) console.error('Glass tint diagnostic', {green, custom, filter}); return ok;
		})()`, 'The shared body glass must accept the green preset and arbitrary custom tints.');

		await page.evaluate("document.querySelector('.brand.floating-capsule').dispatchEvent(new PointerEvent('pointerdown', {pointerType: 'touch'})); true");
		await page.waitForTimeout(220);
		expect(await page.evaluate<number>(glassScale), 'Glass does not develop a liquid press response.').toBeGreaterThan(1.15);
		await page.evaluate("document.querySelector('.brand.floating-capsule').dispatchEvent(new PointerEvent('pointercancel')); true");
		await page.waitForTimeout(700);
		expect(Math.abs(await page.evaluate<number>(glassScale) - 1), 'Glass does not settle after cancelled touch.').toBeLessThan(.01);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await waitForExpr(page, `matchMedia('(prefers-reduced-motion: reduce)').matches && ${glassScale} === 1`, 'Glass scale never settled under reduced motion.');
		await page.evaluate("document.querySelector('.brand.floating-capsule').dispatchEvent(new PointerEvent('pointerdown', {pointerType: 'touch'})); true");
		await page.waitForTimeout(100);
		expect(await page.evaluate<number>(glassScale), 'Glass keeps flowing under reduced motion.').toBe(1);
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		/* The mascot must work with keyboard and reduced motion. */
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.waitForTimeout(150);
		for (const selector of ['.actions-pill .toplink', '.home-utilities .cv-btn', '.home-utilities .theme-toggle']) {
			await page.evaluate(`document.querySelector(${JSON.stringify(selector)}).focus(); true`);
			await page.waitForTimeout(250);
			const groupScale = `(() => { const group = document.querySelector(${JSON.stringify(selector)}).closest('.floating-capsule'); const id = group.style.getPropertyValue('--glass-refraction').match(/#([^)]*)/)[1]; const lens = document.getElementById(id); return Number(lens.querySelector('feDisplacementMap').getAttribute('scale')) / Number(lens.getAttribute('data-rest-scale')); })()`;
			expect(await page.evaluate<number>(groupScale), `Nested keyboard focus does not activate the glass group: ${selector}.`).toBeGreaterThan(1.04);
			await page.evaluate('document.activeElement.blur(); true');
			await page.waitForTimeout(700);
			expect(Math.abs(await page.evaluate<number>(groupScale) - 1), `Glass group did not settle after focus left: ${selector}.`).toBeLessThan(.01);
		}
		for (const section of ['news', 'awards', 'about']) {
			await page.evaluate(`document.querySelector('.toplink[href="#${section}"]').click(); true`);
			await page.waitForTimeout(90);
		}
		await page.waitForTimeout(1000);
		await check(page, `(() => {
			const selected = document.querySelector('.toplink[aria-current]');
			const pill = document.querySelector('.home-nav-indicator');
			const a = selected.getBoundingClientRect(), b = pill.getBoundingClientRect();
			const shell = document.querySelector('.actions-pill').getBoundingClientRect();
			const glass = document.querySelector('.home-nav-glass');
			return selected.getAttribute('href') === '#about' && Math.abs(a.left - b.left - 8) < 1 && Math.abs(b.width - a.width - 16) < 1 &&
				Math.abs(b.height - shell.height - 12) < 1 && Math.abs(shell.top - b.top - 6) < 1 && Math.abs(b.bottom - shell.bottom - 6) < 1 &&
				getComputedStyle(pill).backgroundColor === 'rgba(0, 0, 0, 0)' && !getComputedStyle(glass).backdropFilter.includes('blur(') &&
				glass.style.getPropertyValue('--glass-refraction').includes('url(#home-lens-') &&
				getComputedStyle(document.querySelector('.actions-pill'), '::before').backdropFilter.includes('blur(5px)');
		})()`, 'Desktop glass selection lost its 12px overhang, lens or settled geometry.');
		await page.evaluate('history.back(); true');
		await waitForExpr(page, "document.querySelector('.toplink[aria-current]').getAttribute('href') === '#awards'", 'Back navigation lost the awards selection.');
		await page.evaluate('history.forward(); true');
		await waitForExpr(page, "document.querySelector('.toplink[aria-current]').getAttribute('href') === '#about'", 'Forward navigation lost the about selection.');
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.evaluate("document.querySelector('.toplink[href=\"#news\"]').click(); true");
		await page.waitForTimeout(50);
		await check(page, "(() => {const a=document.querySelector('.toplink[aria-current]').getBoundingClientRect(),b=document.querySelector('.home-nav-indicator').getBoundingClientRect();return Math.abs(a.left-b.left-8)<1;})()", 'Navigation animates its selection under reduced motion.');
		await page.evaluate("document.querySelector('.toplink[href=\"#about\"]').click(); true");
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await waitForExpr(page, "document.querySelectorAll('.meet-avatar [data-yo-eye=\"dots\"]').length === 2", 'Dots eyes never rendered.');
		await check(page, "[...document.querySelectorAll('.meet-avatar [data-yo-eye=\"dots\"]')].every(eye => eye.querySelector('ellipse[rx=\"4.5\"][ry=\"6.5\"]') && !eye.querySelector('circle'))", 'Dots eyes no longer match the black-bean reference.');
	});

	test('floating mascot, gaze, contact and history agreement', async ({ page }) => {
		test.setTimeout(240_000);
		const requests = trackRequests(page);
		await seenWelcome(page);
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		await waitForExpr(page, "!!document.querySelector('.meet-greet') && !document.documentElement.classList.contains('is-loading')", 'The homepage never finished loading.');
		await page.evaluate("document.querySelector('.meet-avatar .yo-cloud').click(); true");
		await waitForExpr(page, "document.querySelector('.meet-yo').dataset.peeking === 'false'", 'Yo never came fully into view.');
		await waitForExpr(page, "document.querySelector('.meet-avatar .yo-cloud').dataset.mood === 'idle'", 'Yo never settled to idle after activation.');
		await page.evaluate("document.querySelector('.meet-avatar').scrollIntoView({block: 'center', behavior: 'instant'}); true");
		await page.waitForTimeout(200);
		const restingGaze = await page.evaluate("document.querySelector('.meet-avatar [data-yo-eye]').getAttribute('transform')");
		const gazePoint = await page.evaluate<{ x: number; y: number }>("(() => { const rect = document.querySelector('.meet-avatar').getBoundingClientRect(); return { x: Math.max(8, rect.left - 40), y: rect.top + rect.height / 3 }; })()");
		await page.mouse.move(gazePoint.x, gazePoint.y);
		await waitForExpr(page, `document.querySelector('.meet-avatar [data-yo-eye]').getAttribute('transform') !== ${JSON.stringify(restingGaze)}`, 'Yo did not follow the pointer with his eyes.');
		await waitForExpr(page, "[...document.querySelectorAll('.meet-avatar .yo-cloud-paw')].every(hand => Number(hand.getAttribute('opacity')) < .01)", 'Idle hands stayed visible.');
		const flowingPuff = await page.evaluate("document.querySelector('.meet-avatar .yo-cloud-body').getAttribute('transform')");
		await waitForExpr(page, `document.querySelector('.meet-avatar .yo-cloud-body').getAttribute('transform') !== ${JSON.stringify(flowingPuff)}`, 'Yo has no idle motion.');
		// Activation already plays happy. Its five-second cooldown begins when
		// that reaction settles; a second pet should be checked after it expires.
		await page.waitForTimeout(5100);
		await page.evaluate("document.querySelector('.meet-avatar .yo-cloud').click(); true");
		await waitForExpr(page, "[...document.querySelectorAll('.meet-avatar .yo-cloud-paw')].every(hand => Number(hand.getAttribute('opacity')) > .9)", 'Petting did not reveal his hands.');
		await waitForExpr(page, "[...document.querySelectorAll('.meet-avatar .yo-cloud-paw')].every(hand => Number(hand.getAttribute('opacity')) < .01)", 'Petting hands never settled again.');
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.evaluate("document.querySelector('.yo-cloud').focus(); true");
		await page.keyboard.press('Enter');
		await waitForExpr(page, "document.querySelector('.meet-bubble').textContent.includes('Hehe.')", 'Petting Yo under reduced motion did not answer.');
		await waitForExpr(page, "document.querySelector('.yo-cloud-stage')?.dataset.motion === 'static'", 'Reduced motion stage never went static.');
		const stillPose = await page.evaluate("document.querySelector('.yo-cloud-body').getAttribute('transform')");
		const stillPuffs = await page.evaluate("[...document.querySelectorAll('.meet-avatar [data-fluffy-surface]')].map(puff => puff.getAttribute('transform')).join('|')");
		await page.waitForTimeout(250);
		expect(stillPose).toBe(await page.evaluate("document.querySelector('.yo-cloud-body').getAttribute('transform')"));
		expect(stillPuffs).toBe(await page.evaluate("[...document.querySelectorAll('.meet-avatar [data-fluffy-surface]')].map(puff => puff.getAttribute('transform')).join('|')"));
		await page.evaluate("document.querySelector('.home-nav-links a[href=\"#about\"]').click(); true");
		await waitForExpr(page, "!!document.querySelector('.home-about') && !document.querySelector('.meet-more') && document.activeElement?.tagName === 'H1'", 'The about topic did not open onto the reading page.');
		await page.evaluate("document.querySelector('.topic-chips [data-topic=\"news\"]').click(); true");
		await waitForExpr(page, "location.hash === '#news' && document.querySelector('.meet-card-head h2')?.textContent === 'News'", 'The news topic chip failed.');
		await page.evaluate('history.back(); true');
		await waitForExpr(page, "location.hash === '#about' && !!document.querySelector('.home-about')", 'Back from news lost the about page.');
		await page.evaluate("document.querySelector('.brand').click(); true");
		await waitForExpr(page, "location.hash === '' && !!document.querySelector('.meet-greet') && document.activeElement === document.querySelector('.topic-chips [data-topic=news]')", 'Returning home did not restore the greeting focus.');

		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.evaluate("document.querySelector('.meet-avatar').scrollIntoView({block: 'center', behavior: 'instant'}); true");
		await check(page, "!document.querySelector('.yo-motion-toggle') && getComputedStyle(document.querySelector('.meet-yo')).position === 'fixed'", 'Yo is not floating or the removed motion control remains.');
		const floatingBefore = await page.evaluate<number>("document.querySelector('.meet-avatar').getBoundingClientRect().bottom");
		await page.evaluate('window.scrollTo(0, document.documentElement.scrollHeight); true');
		expect(Math.abs(floatingBefore - await page.evaluate<number>("document.querySelector('.meet-avatar').getBoundingClientRect().bottom")), 'Yo moves with the document instead of staying in the viewport.').toBeLessThan(1);
		await page.evaluate('window.scrollTo(0, 0); true');
		await page.evaluate("document.querySelector('.cv-btn').click(); true");
		await expect(page.locator('.cv-dialog')).toBeVisible();
        await page.locator('.cv-dialog-close').click();
        await expect(page.locator('.cv-dialog')).not.toBeVisible();
        await page.locator('.toplink[href="#contact"]').click();
        await waitForExpr(page, "location.hash === '#contact' && document.activeElement?.tagName === 'H2'", 'Contact navigation did not reach its heading.');
		for (const [width, height] of [[1280, 800], [390, 844], [320, 568], [667, 375], [640, 400]]) {
			await page.setViewportSize({ width, height });
			const contact = await page.evaluate<Record<string, unknown>>(`(() => {
				const primary = document.querySelector('.contact-primary').getBoundingClientRect();
				const profiles = document.querySelector('.contact-social').getBoundingClientRect();
				const card = document.querySelector('.meet-card').getBoundingClientRect();
				const body = document.querySelector('.card-body');
				const action = document.querySelector('.contact-address');
				return {
					stacked: profiles.top >= primary.bottom,
					enclosed: primary.left >= card.left && profiles.right <= card.right && profiles.bottom <= card.bottom,
					naturalFlow: body.scrollHeight <= body.clientHeight + 1 && document.documentElement.scrollWidth <= innerWidth,
					mail: action.getAttribute('href'), actionHeight: action.getBoundingClientRect().height,
					address: document.querySelector('.contact-email').textContent,
					icons: [...document.querySelectorAll('.contact-profile')].map(link => link.querySelector('.icon').dataset.icon),
					rowHeights: [...document.querySelectorAll('.contact-profile')].map(link => link.getBoundingClientRect().height)
				};
			})()`);
			expect(contact.stacked && contact.enclosed && contact.naturalFlow, `Contact layout clips content or loses its card/reading order at ${width}x${height}: ${JSON.stringify(contact)}`).toBe(true);
			expect(contact.mail === 'mailto:' + contact.address && (contact.actionHeight as number) >= 43.99 && (contact.rowHeights as number[]).every(value => value >= 43.99), `Contact email or touch targets are unusable at ${width}x${height}.`).toBe(true);
			expect((contact.icons as string[]).join(','), 'Contact profile rows lost their brand icons.').toBe('github,huggingface,orcid');
		}
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.evaluate("document.querySelector('.brand').click(); true");
		await waitForExpr(page, "location.hash === '' && !!document.querySelector('.meet-greet')", 'The brand click never returned home.');
		await page.evaluate('history.back(); true');
		await waitForExpr(page, "location.hash === '#contact' && document.activeElement?.tagName === 'H2'", 'Back did not restore the contact section.');
		await page.evaluate('history.forward(); true');
		await waitForExpr(page, "location.hash === '' && document.activeElement?.getAttribute('data-topic') === 'contact'", 'Forward did not restore the greeting state.');
		await page.evaluate("document.querySelector('[data-topic=publications]').click(); true");
		await waitForExpr(page, "!!document.querySelector('.card-body .pub')", 'Publications content never appeared.', 3000);
		await check(page, "!document.querySelector('.card-skel') && [...document.querySelectorAll('.pub-links .link-pill--primary')].every(a => a.textContent.trim() === 'Demo')", 'Local content is delayed or the CoF destination is misleading.');
		await page.evaluate("document.querySelector('.brand').click(); true");
		await waitForExpr(page, "!!document.querySelector('.meet-greet')", 'The brand click never returned home.');
		expect(requests.some(url => url.includes('/fonts/MiSans-VF.woff2')), 'The bundled MiSans font never loaded.').toBe(true);
		await check(page, "!document.querySelector('a[href^=\"/custom\"]') && !document.body.textContent.includes('Yo Studio')", 'The removed character creator still has a homepage entry.');
		expect((await page.request.get('/custom/')).status(), 'The removed character creator route is still served.').toBe(404);
	});
});
