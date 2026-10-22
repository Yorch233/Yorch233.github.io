import { check, expect, instrumentLoader, seenWelcome, test, trackRequests, waitForExpr, verifyYoTyping } from './helpers';
import { SITE_FAVICON_URL, SITE_LOGO_URL, SITE_TOUCH_ICON_URL } from '../../src/lib/site-logo.js';
import { publications } from '../../src/data/publications.js';
import { readFile } from 'node:fs/promises';

const profile = JSON.parse(await readFile('src/data/profile.json', 'utf8'));

test.describe('Yo mascot life, narration & actions', () => {
	test('fixed Fluffy identity, idle life and reactions', async ({ page }) => {
		test.setTimeout(300_000);
		const requests = trackRequests(page);
		await instrumentLoader(page);
		await seenWelcome(page);
		// Old wardrobe records must no longer alter Yo's fixed homepage look.
		await page.addInitScript(() => {
			localStorage.setItem('yo-form.v1', 'blue');
			localStorage.setItem('yo-look.v1', JSON.stringify({ shape: 'cloud', glasses: 'square', hat: 'beret', eyes: 'pupils', bow: false }));
		});
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		await waitForExpr(page, "!!document.querySelector('.meet-greet') && !document.documentElement.classList.contains('is-loading') && document.querySelectorAll('.meet-avatar [data-yo-eye=\"dots\"]').length === 2", 'The homepage never finished loading.');
		await check(page, "document.querySelectorAll('.meet-avatar .yo-cloud-face circle[r=\"16\"]').length === 2 && !!document.querySelector('.meet-avatar .yo-cloud-fluff') && !document.querySelector('[data-yo-form]') && !document.querySelector('.meet-avatar rect[height=\"32\"]') && !document.querySelector('.meet-avatar rect[y=\"-14\"]')", 'Old wardrobe settings changed the fixed homepage mascot.');
		await page.evaluate("document.querySelector('.meet-avatar .yo-cloud').click(); true");
		await waitForExpr(page, "document.querySelector('.meet-yo').dataset.peeking === 'false'", 'Yo never came fully into view.');
		await waitForExpr(page, "document.querySelector('.meet-avatar .yo-cloud').dataset.mood === 'idle' && document.querySelectorAll('.meet-avatar [data-yo-eye=dots]').length === 2", 'Yo never settled into idle.');
		await page.evaluate("document.querySelector('.meet-avatar').scrollIntoView({block: 'center', behavior: 'instant'}); true");
		// Observe idle behavior without petting or moving the pointer:
		// Blinks and spontaneous glances keep the fixed Fluffy mascot alive.
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await page.mouse.move(0, 0);
		const idleLife = await page.evaluate<Promise<{ blinks: number; gazeRange: number; handsHidden: boolean; overflow: boolean }>>(`new Promise(resolve => {
			const root = document.querySelector('.meet-avatar');
			const eyes = root.querySelector('.yo-cloud-eyes');
			const pupil = root.querySelector('[data-yo-eye]');
			const started = performance.now();
			let wasClosed = false, blinks = 0, minGaze = Infinity, maxGaze = -Infinity;
			let handsHidden = true;
			let idleSince = started;
			let overflow = false;
			const timer = setInterval(() => {
				const closed = eyes.transform.baseVal.consolidate().matrix.d < .4;
				if (closed && !wasClosed) blinks += 1;
				wasClosed = closed;
				if (performance.now() - started > 2000) {
					const gaze = pupil.transform.baseVal.consolidate().matrix.e;
					minGaze = Math.min(minGaze, gaze);
					maxGaze = Math.max(maxGaze, gaze);
				}
				if (root.querySelector('.yo-cloud').dataset.mood !== 'idle') idleSince = performance.now();
				// Hand retraction eases with a 180ms time constant; let it settle
				// before checking idle opacity after a spontaneous gesture.
				if (performance.now() - idleSince > 1000) handsHidden &&= [...root.querySelectorAll('.yo-cloud-paw')].every(hand => Number(hand.getAttribute('opacity')) < .01);
				overflow ||= document.documentElement.scrollWidth > innerWidth;
				if (performance.now() - started >= 16000) {
					clearInterval(timer);
					resolve({ blinks, gazeRange: maxGaze - minGaze, handsHidden, overflow });
				}
			}, 25);
		})`);
		expect(idleLife.blinks, `Yo's idle blinks are too infrequent: ${JSON.stringify(idleLife)}`).toBeGreaterThanOrEqual(3);
		expect(idleLife.gazeRange, `Yo does not look around between interactions: ${JSON.stringify(idleLife)}`).toBeGreaterThan(1.5);
		expect(idleLife.handsHidden, 'Idle motion exposed hands without a gesture.').toBe(true);
		expect(idleLife.overflow, 'Fluffy caused horizontal overflow.').toBe(false);
		await check(page, "document.querySelector('.yo-cloud')?.dataset.form === 'fluffy' && !document.querySelector('[data-yo-form]') && document.querySelector('link[rel=icon]').href.includes('/qing-avatar.svg')", 'Fixed Fluffy branding is inconsistent.');
		await waitForExpr(page, "document.querySelector('.brand-avatar').complete && document.querySelector('.brand-avatar').naturalWidth > 0", 'The brand avatar never loaded.');
		await check(page, `document.querySelector('.brand-avatar').getAttribute('src') === ${JSON.stringify(SITE_LOGO_URL)} &&
			document.querySelector('.hero-avatar').getAttribute('src') === ${JSON.stringify(profile.avatar)} &&
			document.querySelector('link[rel=icon]').getAttribute('href') === ${JSON.stringify(SITE_FAVICON_URL)} &&
			document.querySelector('link[rel=apple-touch-icon]').getAttribute('href') === ${JSON.stringify(SITE_TOUCH_ICON_URL)}`, 'Qing’s cartoon branding or portrait is missing.');
		await check(page, `(() => {
			const image = document.querySelector('.brand-avatar');
			const canvas = document.createElement('canvas');
			canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
			const context = canvas.getContext('2d'); context.drawImage(image, 0, 0);
			const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
			let transparent = 0, solid = 0;
			for (let i = 3; i < pixels.length; i += 4) { if (!pixels[i]) transparent++; if (pixels[i] > 240) solid++; }
			return pixels[3] === 0 && transparent > canvas.width * canvas.height * 0.2 && solid > 100;
		})()`, 'The page logo lost its transparent background or visible Qing silhouette.');
		const siteFavicon = await (await page.request.get(SITE_FAVICON_URL)).text();
		expect(siteFavicon.includes('data:image/png;base64,') && !siteFavicon.includes('<rect') && !siteFavicon.includes('clip-path') && !siteFavicon.includes('/logo/'), 'The transparent favicon has a tile/mask or depends on an external image.').toBe(true);
		await check(page, `(async () => {
			const image = new Image(); image.src = ${JSON.stringify(SITE_FAVICON_URL)};
			await image.decode();
			const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
			const context = canvas.getContext('2d'); context.drawImage(image, 0, 0, 32, 32);
			const pixels = context.getImageData(0, 0, 32, 32).data;
			let transparent = 0, solid = 0;
			for (let i = 3; i < pixels.length; i += 4) { if (!pixels[i]) transparent++; if (pixels[i] > 240) solid++; }
			return pixels[3] === 0 && transparent > 32 * 32 * 0.2 && solid > 100;
		})()`, 'The actual browser SVG favicon lost alpha or its visible Qing silhouette at 32px.');
		expect((await page.request.get(SITE_TOUCH_ICON_URL)).ok(), 'Qing’s touch icon is unavailable.').toBe(true);
		await check(page, "!!document.querySelector('.yo-cloud-fluff [data-fluffy-surface] linearGradient') && !document.querySelector('.yo-cloud-stage image, .yo-cloud-stage feDisplacementMap')", 'Live Fluffy must use a pure SVG surface without images or displacement.');
		const fluffyLogo = await (await page.request.get('/logo/yo-fluffy.svg')).text();
		expect(fluffyLogo.includes('data-fluffy-surface') && !fluffyLogo.includes('<image') && !fluffyLogo.includes('data:image'), 'The native Fluffy mark depends on an external image.').toBe(true);
		expect(fluffyLogo.includes('class="yo-bow"') && fluffyLogo.includes('#3a75d0') && fluffyLogo.includes('<circle cx="82"') && fluffyLogo.includes('<circle cx="118"') && (fluffyLogo.match(/r="16"/g) || []).length === 2, 'Fluffy branding is missing its round glasses.').toBe(true);
		// Real activity interrupts any life chain observed during the 16s sample.
		await page.mouse.move(0, 0);
		await waitForExpr(page, "document.querySelector('.yo-cloud')?.dataset.mood === 'idle'", 'Yo never returned to idle after activity.');
		await waitForExpr(page, "[...document.querySelectorAll('.yo-cloud-paw')].every(p => Number(p.getAttribute('opacity')) < .01)", 'Hands never hid after activity.');
		await check(page, "!!document.querySelector('.yo-cloud-bow path') && document.querySelectorAll('.yo-cloud [data-yo-eye=dots]').length === 2 && [...document.querySelectorAll('.yo-cloud-face circle[r=\"16\"]')].map(c => Number(c.getAttribute('cx'))).join(',') === '82,118' && [...document.querySelectorAll('.yo-cloud-paw')].every(p => Number(p.getAttribute('opacity')) < .01)", 'Fluffy must have round glasses centered on its bean eyes and hidden idle hands.');
		const fluffyMotion = await page.evaluate("document.querySelector('.yo-cloud-body').getAttribute('transform')");
		await page.waitForTimeout(250);
		expect(fluffyMotion).not.toBe(await page.evaluate("document.querySelector('.yo-cloud-body').getAttribute('transform')"));
		// An automatic happy chain in the idle sample may have just ended. Honor
		// its existing five-second cooldown before checking a new pet reaction.
		await page.waitForTimeout(5100);
		await page.evaluate("document.querySelector('.yo-cloud').click(); true");
		await waitForExpr(page, "!!document.querySelector('.yo-cloud-mood-happy') && !!document.querySelector('.yo-cloud-face ellipse[rx=\"12\"]')", 'Petting did not produce the happy reaction.');
		await page.reload();
		await waitForExpr(page, "document.querySelector('.yo-cloud')?.dataset.form === 'fluffy' && !document.documentElement.classList.contains('is-loading')", 'The reload never finished.');
		await check(page, "window.__firstYoForm === 'fluffy' && window.__firstYoIcon.includes('/qing-avatar.svg')", 'Reload painted the wrong initial logo/loader form.');
		await page.evaluate("document.querySelector('.meet-avatar .yo-cloud').click(); true");
		await waitForExpr(page, "document.querySelector('.meet-yo').dataset.peeking === 'false'", 'Yo never came fully into view after reload.');
		await page.evaluate("document.querySelector('[data-topic=publications]').click(); true");
		await waitForExpr(page, "location.hash === '#publications' && !!document.querySelector('.yo-cloud-mood-studying')", 'Reading never made Yo study.');
		const quietFluffy = await page.evaluate("document.querySelector('.yo-cloud-body').getAttribute('transform')");
		await page.waitForTimeout(250);
		expect(quietFluffy === await page.evaluate("document.querySelector('.yo-cloud-body').getAttribute('transform')") && await page.evaluate<boolean>("document.querySelector('.yo-cloud-stage').dataset.motion === 'static'"), 'Fluffy moves while reading.').toBe(true);
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.evaluate("document.querySelector('.brand').click(); true");
		await waitForExpr(page, "!!document.querySelector('.meet-greet')", 'The brand click never returned home.');
		const reducedFluffy = await page.evaluate("document.querySelector('.yo-cloud-body').getAttribute('transform')");
		await page.waitForTimeout(250);
		expect(reducedFluffy === await page.evaluate("document.querySelector('.yo-cloud-body').getAttribute('transform')") && await page.evaluate<boolean>("document.querySelector('.yo-cloud-stage').dataset.motion === 'static'"), 'Fluffy ignores reduced motion.').toBe(true);
		await page.evaluate("window.dispatchEvent(new StorageEvent('storage', { key: 'yo-form.v1', newValue: 'blue' })); window.dispatchEvent(new CustomEvent('yo:form-change', {detail: 'blue'})); true");
		await check(page, "document.querySelector('.yo-cloud')?.dataset.form === 'fluffy' && document.querySelector('link[rel=icon]').href.includes('/qing-avatar.svg')", 'Legacy preference events changed Fluffy.');
		expect(requests.some(url => url.includes('/fonts/MiSans-Latin-VF.woff2')), 'The bundled MiSans Latin font never loaded.').toBe(true);
	});

	test('hover and focus narration covers every section', async ({ page }) => {
		test.setTimeout(300_000);
		await seenWelcome(page);
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/');
		await waitForExpr(page, "!!document.querySelector('.meet-greet') && !document.documentElement.classList.contains('is-loading')", 'The homepage never finished loading.');
		await page.evaluate("document.querySelector('.meet-avatar .yo-cloud').click(); true");
		await waitForExpr(page, "document.querySelector('.meet-yo').dataset.peeking === 'false'", 'Yo never came fully into view.');
		// Real pointer movement must reveal contextual narration on all five sections,
		// including nested icons, rich-text links and controls updated in place.
		const hoverYo = async (selector: string, expected: string) => {
			await page.mouse.move(0, 0);
			await page.evaluate(`document.activeElement?.blur(); document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'}); true`);
			const point = await page.evaluate<{ x: number; y: number }>(`(() => {const rect=document.querySelector(${JSON.stringify(selector)}).getClientRects()[0];return {x:rect.left+rect.width/2,y:rect.top+rect.height/2};})()`);
			await page.mouse.move(point.x, point.y);
			await waitForExpr(page, `getComputedStyle(document.querySelector('.meet-bubble')).visibility === 'visible' && document.querySelector('.meet-bubble').textContent.includes(${JSON.stringify(expected)})`, `Hover narration never appeared for ${selector}.`);
		};
		const hoverCases: Array<[string, Array<[string, string]>]> = [
			['about', [['.profile-portrait', "That's Qing"], ['.profile-education', 'Jiangsu University'], ['.home-about .meta > span:last-child', 'advisor'], ['.about-copy', 'Schrödinger bridges'], ['.chip:nth-child(3)', 'masked diffusion'], ['.profile-github', 'open-source work'], ['.profile-huggingface', 'Hugging Face'], ['.profile-orcid', 'ORCID'], ['.cv-btn', 'download availability'], ['.theme-toggle', 'comfy']]],
			['publications', [['.pub-title a', 'Select the title'], ['.pub-authors b', 'helped write'], ['.pub-summary', publications[0]!.slug === 'RSB' ? 'RSB aims' : 'gives diffusion'], ['.pub-links .link-pill--primary', publications[0]!.slug === 'RSB' ? 'RSB Demo' : 'CoF Demo'], ['.pub:last-of-type .link-pill--primary', publications.at(-1)!.slug === 'RSB' ? 'RSB Demo' : 'CoF Demo'], ['.pub-links a[href*=arxiv]', 'preprint'], ['.link-pill-copy', 'BibTeX citation']]],
			['news', [['.timeline .is-latest .date', 'CoF is on arXiv'], ['.timeline .is-latest a[href*=arxiv]', 'research preprint'], ['.timeline .is-latest a[href="/CoF/"]', 'CoF Demo'], ['.news-toggle', 'earlier updates']]],
			['awards', [['.award-title', 'National First Prize'], ['.tip', 'competition is called'], ['.award-topic', 'National First Prize']]],
			['contact', [['.contact-address', 'mail app'], ['.contact-social a[href*=github]', 'open-source work'], ['.contact-social a[href*=huggingface]', 'Hugging Face'], ['.contact-social a[href*=orcid]', 'research record']]]
		];
		for (const [section, cases] of hoverCases) {
			await page.evaluate(`document.querySelector('.toplink[href="#${section}"]').click(); true`);
			await waitForExpr(page, section === 'about' ? "!!document.querySelector('.meet-greet')" : `location.hash === '#${section}' && !!document.querySelector('.meet-card')`, `The ${section} section never opened.`);
			if (section === 'publications') await page.evaluate("document.querySelector('.pub-abstract-toggle').click(); true");
			for (const [selector, expected] of cases) await hoverYo(selector, expected);
			if (section === 'publications') {
				await page.evaluate("document.querySelector('.link-pill-copy').click(); true");
				await waitForExpr(page, "document.querySelector('.citation-dialog')?.open", 'The citation dialog never opened during narration.');
				await page.evaluate("document.querySelector('.citation-copy').click(); true");
				await waitForExpr(page, "document.querySelector('.citation-status').textContent === 'Copied!'", 'Citation copy never confirmed during narration.');
				await page.evaluate("document.querySelector('.citation-close').click(); true");
				await waitForExpr(page, "!document.querySelector('.citation-dialog')", 'The citation dialog never closed during narration.');
			}
			if (section === 'news') {
				await check(page, "document.querySelector('.news a[href=\"#awards\"]')?.closest('li').querySelector('.date').textContent === '2025'", 'The latest award milestone is missing from the default News view.');
				await page.evaluate("document.querySelector('.news-toggle').click(); true");
				await check(page, "(() => { const milestones = [...document.querySelectorAll('.news a[href=\"#awards\"]')].map(link => link.closest('li')); return milestones.length === 2 && milestones.map(item => item.querySelector('.date').textContent).join(',') === '2025,2023' && milestones.every(item => item.textContent.includes('National First Prize') && item.textContent.includes('team leader and primary contributor')); })()", 'The complete News timeline lost an award milestone or its supplied year and role.');
				await hoverYo('.news li:last-child .date', 'finding relationships');
				await hoverYo('.news-toggle', 'tuck the older updates');
			}
			if (section === 'awards') {
				await check(page, "!document.querySelector('.award-more, .award-content') && [...document.querySelectorAll('.award-topic')].length === 2 && [...document.querySelectorAll('.award-topic')].every(topic => topic.getBoundingClientRect().height > 0)", 'Awards should show both project topics directly without a detail disclosure.');
			}
		}
		await hoverYo('.home-footer', 'Thanks for visiting');
		await verifyYoTyping(page, '.meet-bubble');
		await page.evaluate('document.activeElement?.blur(); true');
		await page.mouse.move(0, 0);
		await waitForExpr(page, "getComputedStyle(document.querySelector('.meet-bubble')).visibility === 'hidden' && !document.querySelector('.meet-yo').hasAttribute('data-feedback')", 'Hover narration never dismissed.');
		await page.evaluate("document.querySelector('.brand').focus(); true");
		await page.keyboard.press('Tab');
		await waitForExpr(page, "document.activeElement?.matches('.toplink[href=\"#about\"]') && document.querySelector('.meet-bubble').textContent.includes('Meet Qing') && getComputedStyle(document.querySelector('.meet-bubble')).visibility === 'visible'", 'Keyboard focus did not narrate the About link.');
		await page.evaluate("document.activeElement?.blur(); document.querySelector('.brand').click(); true");
		await waitForExpr(page, "!!document.querySelector('.meet-greet')", 'The brand click never returned home.');
	});

	test('narrow phone reading frames and bottom navigation', async ({ page }) => {
		test.setTimeout(240_000);
		await seenWelcome(page);
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/#publications');
		await waitForExpr(page, "location.hash === '#publications' && !!document.querySelector('.meet-card') && !document.documentElement.classList.contains('is-loading')", 'The homepage never finished loading.');
		await page.evaluate("document.querySelector('.meet-avatar .yo-cloud').click(); true");
		await waitForExpr(page, "document.querySelector('.meet-yo').dataset.peeking === 'false'", 'Yo never came fully into view.');
		await page.setViewportSize({ width: 320, height: 568 });
		let sharedCardFrame: string | undefined;
		for (const topic of ['news', 'awards', 'contact', 'publications']) {
			await page.evaluate(`document.querySelector('.home-nav-links a[href="#${topic}"]').click(); true`);
			await waitForExpr(page, `location.hash === '#${topic}' && document.activeElement?.tagName === 'H2'`, `The ${topic} destination never opened on the phone.`);
			await check(page, "[...document.querySelectorAll('.toplink')].every(link => link.getBoundingClientRect().height >= 44 && getComputedStyle(link).display !== 'none')", 'Mobile destinations are hidden or have small touch targets.');
			await check(page, "(() => { const body = document.querySelector('.card-body'); return body.scrollWidth <= body.clientWidth && body.clientHeight >= 150 && document.documentElement.scrollWidth <= innerWidth; })()", `Card ${topic} overflows on a narrow phone.`);
			const frame = await page.evaluate<string>(`(() => {
				const card = document.querySelector('.meet-card'), head = document.querySelector('.meet-card-head');
				const title = document.querySelector('#section-heading'), body = document.querySelector('.card-body');
				return JSON.stringify([Math.round(card.getBoundingClientRect().width), getComputedStyle(card).borderRadius,
					getComputedStyle(head).marginLeft, getComputedStyle(head).paddingTop, getComputedStyle(head).borderBottomColor,
					getComputedStyle(title).fontSize, getComputedStyle(body).padding,
					Math.round(document.querySelector('.meet-close').getBoundingClientRect().height)]);
			})()`);
			sharedCardFrame ??= frame;
			expect(frame, `Card ${topic} diverges from the shared reading frame on a narrow phone. Shared: ${sharedCardFrame}`).toBe(sharedCardFrame);
			if (topic !== 'publications') {
				await page.evaluate("document.querySelector('.meet-close').click(); true");
				const focusTarget = `.topic-chips [data-topic=${topic}]`;
				await waitForExpr(page, `location.hash === '' && document.activeElement === document.querySelector('${focusTarget}')`, `Closing ${topic} did not restore focus to its chip.`);
			}
		}
		await check(page, "getComputedStyle(document.querySelector('.meet-yo')).display === 'none' && document.querySelector('.meet-yo').inert", 'Yo remains available while reading on a narrow phone.');
		await page.setViewportSize({ width: 1280, height: 800 });
		await waitForExpr(page, "!document.querySelector('.meet-yo').inert && document.querySelector('.yo-cloud')?.dataset.mood === 'studying'", 'Yo never resumed studying on desktop.');
		await page.evaluate("document.querySelector('.yo-cloud').click(); true");
		try {
			await page.waitForFunction("document.querySelector('.yo-cloud')?.dataset.mood === 'happy'", undefined, { timeout: 6000 });
		} catch {
			// The activation click earlier in this test may still hold the 5s pet
			// cooldown on a warm run; pet again once it has expired.
			await page.evaluate("document.querySelector('.yo-cloud').click(); true");
			await waitForExpr(page, "document.querySelector('.yo-cloud')?.dataset.mood === 'happy'", 'Petting during reading never reacted.');
		}
		const readingPet = await page.evaluate("document.querySelector('.yo-cloud-body').getAttribute('transform')");
		await page.waitForTimeout(300);
		expect(readingPet, 'Petting interrupted quiet reading.').toBe(await page.evaluate("document.querySelector('.yo-cloud-body').getAttribute('transform')"));
		await waitForExpr(page, "document.querySelector('.yo-cloud')?.dataset.mood === 'studying'", 'Yo never returned to studying after the pet.');
		await page.evaluate("document.querySelector('.brand').click(); true");
		await waitForExpr(page, "!!document.querySelector('.meet-greet')", 'The brand click never returned home.');

		// The narrow-screen navigation stays at the bottom with all five destinations.
		await page.setViewportSize({ width: 375, height: 667 });
		await page.evaluate('new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true))))');
		await check(page, "document.querySelectorAll('.topbar .floating-capsule').length === 4 && document.querySelector('.home-utilities').contains(document.querySelector('.cv-btn')) && document.querySelector('.home-utilities').contains(document.querySelector('.theme-toggle')) && document.querySelector('.cv-btn').classList.contains('floating-capsule') && document.querySelector('.theme-toggle').classList.contains('floating-capsule') && document.querySelector('.theme-toggle').getBoundingClientRect().left - document.querySelector('.cv-btn').getBoundingClientRect().right >= 6 && !document.querySelector('.home-utilities').classList.contains('floating-capsule') && !document.querySelector('.actions-pill .cv-btn, .actions-pill .theme-toggle') && [...document.querySelectorAll('.topic-chips .topic-pill')].map(a => a.dataset.topic).join(',') === 'publications,news,awards,contact' && [...document.querySelectorAll('.home-nav-links .toplink')].map(a => a.hash).join(',') === '#about,#news,#publications,#awards,#contact' && !document.querySelector('.topic-chips [data-topic=about]')", 'Homepage utility capsules or content navigation are inconsistent.');
		await check(page, `(() => {
			const nav = document.querySelector('.actions-pill'), box = nav.getBoundingClientRect();
			const pill = document.querySelector('.home-nav-indicator'), pillBox = pill.getBoundingClientRect();
			return Math.abs(pillBox.width - 64) < 1 && Math.abs(pillBox.height - 50) < 1 && getComputedStyle(pill).backgroundColor === 'rgb(255, 255, 255)' &&
				getComputedStyle(nav).borderRadius === '999px' && getComputedStyle(pill).borderRadius === '999px' &&
				getComputedStyle(document.querySelector('.home-nav-glass')).display === 'none' && getComputedStyle(nav).position === 'fixed' && box.bottom <= innerHeight && innerHeight - box.bottom <= 36 &&
				box.left >= 0 && box.right <= innerWidth && !document.querySelector('.nav-toggle') &&
				getComputedStyle(document.querySelector('.meet-yo')).display === 'none' && document.querySelector('.meet-yo').inert &&
				[...document.querySelectorAll('.toplink')].every(link => {
					const icon = link.querySelector('.ui-icon').getBoundingClientRect(), label = link.querySelector('.nav-label').getBoundingClientRect();
					return link.getBoundingClientRect().height >= 44 && icon.width === 20 && getComputedStyle(link).fontSize === '9px' && label.top >= icon.bottom && label.width <= link.clientWidth + 24;
				});
		})()`, 'Bottom navigation overflows, shows Yo by default or loses its round icon-button arrangement.');
		await page.evaluate("document.querySelector('.cv-btn').click(); true");
        await expect(page.locator('.cv-dialog')).toBeVisible();
        await page.locator('.cv-dialog-close').click();
        await expect(page.locator('.cv-dialog')).not.toBeVisible();
        await expect(page.locator('.cv-btn')).toBeFocused();
		await page.evaluate("document.querySelector('.home-nav-links a[href=\"#publications\"]').click(); true");
		await waitForExpr(page, "location.hash === '#publications' && !!document.querySelector('.meet-card')", 'Papers never opened from the phone navigation.');
	});

	test('action menu, prop rigs and narration', async ({ page }) => {
		test.setTimeout(240_000);
		await seenWelcome(page);
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/#publications');
		await waitForExpr(page, "location.hash === '#publications' && !!document.querySelector('.meet-card') && !document.documentElement.classList.contains('is-loading')", 'The homepage never finished loading.');
		// Approved life states use the real controls, with one mutually exclusive rig.
		await page.evaluate("document.querySelector('.meet-avatar .yo-cloud').click(); true");
		await page.evaluate("document.querySelector('.meet-avatar .yo-cloud').focus(); document.querySelector('.meet-avatar .yo-cloud').dispatchEvent(new KeyboardEvent('keydown', { key: 'F10', shiftKey: true, bubbles: true, cancelable: true })); true");
		await waitForExpr(page, "!document.querySelector('.yo-actions-panel').hidden", 'Shift+F10 never opened the action menu.');
		await waitForExpr(page, 'document.activeElement === document.querySelector(\'.yo-actions-panel button\')', 'The action menu never took focus.');
		await check(page, "document.querySelector('.yo-actions-trigger')?.getAttribute('aria-expanded') === 'true' && document.querySelector('.yo-actions-trigger')?.getAttribute('aria-controls') === document.querySelector('.yo-actions-panel').id", 'Yo’s action menu must stay reachable from the keyboard and reflect its state on the trigger.');
		await page.evaluate("document.activeElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); true");
		await waitForExpr(page, "document.querySelector('.yo-actions-panel').hidden && document.activeElement === document.querySelector('.meet-avatar .yo-cloud')", 'Escape did not close the action menu onto Yo.');
		const openYoActions = async () => {
			const prevented = await page.evaluate<boolean>("(() => { const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2 }); return !document.querySelector('.meet-avatar .yo-cloud').dispatchEvent(event); })()");
			expect(prevented, 'Right-clicking Yo did not suppress the browser menu.').toBe(true);
			await waitForExpr(page, "!document.querySelector('.yo-actions-panel').hidden", 'The action menu never reopened.');
		};
		const chooseYo = async (mood: string) => {
			await openYoActions();
			await page.evaluate(`document.querySelector('[data-yo-action=${JSON.stringify(mood)}]').click(); true`);
			await waitForExpr(page, `document.querySelector('.meet-avatar .yo-cloud').dataset.mood === ${JSON.stringify(mood)}`, `Choosing ${mood} never applied the mood.`);
		};
		await chooseYo('thinking');
		// A freshly entered state rejects an immediate switch until the lock lapses.
		await openYoActions();
		await page.evaluate("document.querySelector('[data-yo-action=coding]').click(); true");
		await check(page, "document.querySelector('.meet-avatar .yo-cloud').dataset.mood === 'thinking' && document.querySelector('[data-yo-action=coding]').getAttribute('aria-disabled') === 'true'", 'A fresh state allowed an immediate switch or missed the lock hint.');
		for (const action of ['studying', 'writing-paper', 'coding', 'happy', 'hungry', 'drink-coffee', 'boring', 'daydreaming', 'embarrassed']) {
			await page.waitForTimeout(1400);
			await chooseYo(action);
			if (['studying', 'writing-paper', 'coding', 'drink-coffee'].includes(action)) {
				await waitForExpr(page, `Number(document.querySelector('[data-yo-prop=${JSON.stringify(action)}]').getAttribute('opacity')) === 1`, `The ${action} prop never appeared.`);
				await check(page, "Boolean(document.querySelector('.meet-avatar .yo-cloud-bow').compareDocumentPosition(document.querySelector('.meet-avatar .yo-props')) & Node.DOCUMENT_POSITION_FOLLOWING)", 'Foreground props must occlude the bow.');
				await check(page, "[...document.querySelectorAll('.meet-avatar [data-yo-prop]')].filter(n=>Number(n.getAttribute('opacity'))>.01).length === 1", 'Yo overlapped two prop rigs.');
			}
		}
		await page.waitForTimeout(1400);
		await chooseYo('drink-coffee');
		await page.waitForTimeout(2200);
		if (process.env.SCREENSHOT_DIR) {
			await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/yo-coffee.png` });
		}
		for (const [width, height] of [[320, 667], [667, 320]]) {
			await page.setViewportSize({ width, height });
			await waitForExpr(page, "document.querySelector('.meet-yo').inert && document.querySelector('.meet-avatar svg').dataset.motion === 'static'", `Yo never went inert at ${width}x${height}.`);
			await check(page, "getComputedStyle(document.querySelector('.meet-yo')).display === 'none' && !document.querySelector('.yo-actions-trigger') && document.querySelector('.yo-actions-panel').hidden", `Mobile Yo or his action menu remains visible or active at ${width}x${height}.`);
		}
		if (process.env.SCREENSHOT_DIR) {
			for (const [name, width, height] of [['desktop', 1280, 800], ['phone', 390, 844]] as const) {
				await page.setViewportSize({ width, height });
				await page.evaluate("document.querySelector('.brand').click(); document.activeElement?.blur(); true");
				await waitForExpr(page, "!!document.querySelector('.meet-greet') && !['happy', 'surprised'].includes(document.querySelector('.yo-cloud')?.dataset.mood)", 'The greeting never settled for screenshots.');
				await page.evaluate('document.activeElement?.blur(); true');
				await waitForExpr(page, "document.querySelector('.meet > .sr-only').textContent === ''", 'A stray live announcement survived.');
				await page.waitForTimeout(300);
				await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/${name}.png` });
				if (name === 'desktop') {
					await page.evaluate("window.scrollTo({top: 240, behavior: 'instant'}); document.activeElement?.blur(); true");
					await page.waitForTimeout(150);
					await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/glass-scroll.png` });
					await page.evaluate("window.scrollTo({top: 0, behavior: 'instant'}); true");
				}
				await page.evaluate("document.querySelector('.theme-toggle').click(); true");
				await waitForExpr(page, "document.documentElement.dataset.theme === 'dark' && !document.documentElement.dataset.themeTransition", 'Dark mode never settled for screenshots.');
				await check(page, 'document.documentElement.scrollWidth <= innerWidth && document.querySelector(\'.theme-toggle\').getBoundingClientRect().right <= innerWidth', 'Theme switch overflows the mobile header.');
				await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/${name}-dark.png` });
				await page.evaluate("document.querySelector('.theme-toggle').click(); true");
				await waitForExpr(page, "document.documentElement.dataset.theme === 'light' && !document.documentElement.dataset.themeTransition", 'Light mode never settled for screenshots.');
			}
		}
	});
});
