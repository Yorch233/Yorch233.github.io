import { check, expect, instrumentLoader, seenWelcome, test, trackRequests, waitForExpr } from './helpers';
import { CITATION_FORMATS, formatCitation } from '../../src/lib/citations.js';
import { publications } from '../../src/data/publications.js';

const citationCount = publications.length;

test.describe('Homepage welcome dialog & citations', () => {
	test('direct reading links bypass the welcome dialog', async ({ page }) => {
		await page.goto('/#publications');
		await waitForExpr(page, "location.hash === '#publications' && document.querySelector('.meet-card-head h2')?.textContent === 'Publications' && !document.documentElement.classList.contains('is-loading')",
			'The #publications alias did not land on the Publications card.');
		await check(page, "!document.querySelector('.yo-welcome').open && localStorage.getItem('yo-welcome.v1') === null", 'A direct reading link is blocked by the welcome dialog.');
	});

	test('first visit: entrance, containment, layout and exit', async ({ page }) => {
		test.setTimeout(180_000);
		await instrumentLoader(page);
		await page.goto('/');
		await check(page, "document.documentElement.classList.contains('is-revealed') || !document.querySelector('.yo-welcome').open", 'The welcome dialog covered the page loader.');
		await waitForExpr(page, "document.querySelector('.yo-welcome')?.open && !!document.querySelector('.yo-welcome .yo-cloud') && !document.documentElement.classList.contains('is-loading')",
			'The welcome dialog never opened.');
		await check(page, "!document.hidden && document.querySelector('.yo-welcome').getAnimations().length === 1", 'The visible welcome dialog did not create its entrance animation.');
		await check(page, "document.activeElement.matches('.yo-welcome-explore') && document.body.style.overflow === 'hidden' && getComputedStyle(document.querySelector('.meet-yo')).visibility === 'hidden' && document.querySelector('.yo-welcome .yo-cloud').dataset.form === 'fluffy'",
			'Welcome focus, scroll lock or mascot identity is incorrect.');
		await check(page, `document.querySelector('#yo-welcome-title').textContent === 'Hi, I’m Yo.' && document.querySelector('#yo-welcome-description').textContent.includes("Qing's Bot") && document.querySelector('.meet-avatar .yo-cloud').getAttribute('aria-label').startsWith('Yo,') && !document.querySelector('.yo-welcome-replay') && document.querySelector('.home-footer-note').textContent === 'Yo has the final say.' && document.querySelector('.home-footer [data-icon=yo]').getAttribute('aria-hidden') === 'true' && document.querySelector('.home-footer [data-icon=yo]').dataset.state === 'inactive' && !document.querySelector('.home-footer a, .home-footer button')`,
			'The mascot name, introduction or footer attribution is outdated.');
		await page.keyboard.press('Tab');
		await check(page, "document.querySelector('.yo-welcome').contains(document.activeElement)", 'Welcome keyboard focus escaped the modal.');
		for (const [width, height] of [[1280, 800], [390, 844], [320, 568], [667, 375]]) {
			await page.setViewportSize({ width, height });
			await page.waitForTimeout(250);
			await check(page, `(() => {
				const dialog = document.querySelector('.yo-welcome'), scroller = dialog.querySelector('.yo-welcome-scroll');
				dialog.querySelector('.yo-welcome-explore').scrollIntoView({block: 'nearest'});
				const bounds = dialog.getBoundingClientRect(), action = dialog.querySelector('.yo-welcome-explore').getBoundingClientRect(), close = dialog.querySelector('.yo-welcome-close').getBoundingClientRect();
				return bounds.left >= 0 && bounds.right <= innerWidth && bounds.top >= 0 && bounds.bottom <= innerHeight && scroller.scrollWidth <= scroller.clientWidth && action.top >= bounds.top && action.bottom <= bounds.bottom && close.top >= 0 && close.bottom <= innerHeight;
			})()`, `Welcome dialog is clipped at ${width}x${height}.`);
			if (process.env.SCREENSHOT_DIR) {
				await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/welcome-${width}x${height}.png` });
			}
		}
		const welcomeBeforeExit = await page.evaluate<{ top: number; width: number }>("document.querySelector('.yo-welcome').getBoundingClientRect().toJSON()");
		await page.keyboard.press('Escape');
		await check(page, "document.querySelector('.yo-welcome').open && document.body.style.overflow === 'hidden'", 'Welcome exit closes the modal before its reverse animation.');
		await waitForExpr(page, "document.querySelector('.yo-welcome').getAnimations().some(motion => motion.playbackRate < 0)", 'Welcome exit did not reverse its entrance animation.');
		await page.waitForTimeout(140);
		await check(page, `(() => { const box = document.querySelector('.yo-welcome').getBoundingClientRect(); return box.top < ${welcomeBeforeExit.top} && box.width < ${welcomeBeforeExit.width}; })()`, 'Welcome exit does not move upward and shrink along its entry path.');
		await waitForExpr(page, "!document.querySelector('.yo-welcome').open && localStorage.getItem('yo-welcome.v1') === 'seen'", 'Welcome dialog never finished closing.');
		await check(page, "document.activeElement.matches('.hero-name') && document.body.style.overflow === ''", 'Welcome dismissal did not restore page focus and scrolling.');
	});

	test('a fresh mobile visit keeps Yo and the introduction offscreen', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/');
		await waitForExpr(page, "!!document.querySelector('.meet-greet') && !document.documentElement.classList.contains('is-loading')", 'Homepage never finished loading.');
		await check(page, "!document.querySelector('.yo-welcome').open && localStorage.getItem('yo-welcome.v1') === null && getComputedStyle(document.querySelector('.meet-yo')).display === 'none' && document.querySelector('.meet-yo').inert && document.body.style.overflow === ''",
			'A first mobile visit shows Yo, blocks scrolling or consumes the desktop introduction.');
	});

	test('poke, explore, close, outside click and remembered dismissal', async ({ page }) => {
		test.setTimeout(240_000);
		const requests = trackRequests(page);
		await page.goto('/');
		await waitForExpr(page, "document.querySelector('.yo-welcome')?.open && !!document.querySelector('.yo-welcome .yo-cloud')", 'The welcome dialog never opened.');
		const freshWelcome = async () => {
			await page.evaluate("localStorage.removeItem('yo-welcome.v1'); true");
			await page.reload();
			await waitForExpr(page, "document.querySelector('.yo-welcome')?.open && !!document.querySelector('.yo-welcome .yo-cloud')", 'The welcome dialog never reopened.');
		};
		await page.evaluate("document.querySelector('.yo-welcome .yo-cloud').click(); true");
		await waitForExpr(page, "document.querySelector('.yo-welcome-note .yo-dialogue-copy').textContent === 'Hehe. That tickles!'", 'Poking the welcome mascot did not answer.');
		await waitForExpr(page, "document.querySelector('.yo-welcome .yo-cloud').dataset.mood === 'idle'", 'Welcome mascot stayed excited after the poke.');
		await page.evaluate("document.querySelector('.yo-welcome-explore').click(); true");
		await waitForExpr(page, "!document.querySelector('.yo-welcome').open && document.activeElement.matches('.hero-name')", 'Exploring did not close the dialog onto the hero.');
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await freshWelcome();
		await check(page, "document.querySelector('.yo-welcome').getAnimations().length === 0", 'Welcome flies in under reduced motion.');
		await page.evaluate("document.querySelector('.yo-welcome-close').click(); true");
		await waitForExpr(page, "!document.querySelector('.yo-welcome').open && document.activeElement.matches('.hero-name')", 'The close control did not dismiss the welcome dialog.');
		await page.emulateMedia({ reducedMotion: 'no-preference' });
		await freshWelcome();
		await page.mouse.click(2, 2);
		await waitForExpr(page, "!document.querySelector('.yo-welcome').open && document.activeElement.matches('.hero-name')", 'An outside click did not dismiss the welcome dialog.');
		await page.reload();
		await waitForExpr(page, "!!document.querySelector('.meet-greet') && !document.documentElement.classList.contains('is-loading')", 'Homepage never finished reloading.');
		await check(page, "!document.querySelector('.yo-welcome').open", 'The dismissed welcome dialog reappeared after reload.');
		await check(page, "document.querySelector('.meet-yo').dataset.peeking === 'true' && document.querySelector('.meet-yo-hi').textContent === 'Hi' && document.querySelector('.meet-avatar .yo-cloud').dataset.peek === 'true' && getComputedStyle(document.querySelector('.meet-bubble')).visibility === 'hidden' && getComputedStyle(document.querySelector('.meet-yo')).right === '0px'",
			'Homepage Yo should greet quietly from the edge until invited.');
		await page.evaluate("document.querySelector('.meet-avatar .yo-cloud').focus(); true");
		await page.keyboard.press('Enter');
		await waitForExpr(page, "document.querySelector('.meet-yo').dataset.peeking === 'false' && !document.querySelector('.meet-yo-hi')", 'Activating Yo did not bring him fully into view.');
		await page.evaluate("document.querySelector('.meet-yo .yo-dialogue-close').click(); true");
		await waitForExpr(page, "document.querySelector('.meet-yo').dataset.peeking === 'true' && document.activeElement === document.querySelector('.meet-avatar .yo-cloud')", 'Closing his dialogue did not return Yo to the edge.');
		await page.evaluate("document.querySelector('.meet-avatar .yo-cloud').click(); true");
		await page.evaluate("document.querySelector('.toplink[href=\"#publications\"]').click(); true");
		await waitForExpr(page, "location.hash === '#publications' && !!document.querySelector('.meet-card')", 'The publications section never opened.');
		const readingPose = await page.evaluate("document.querySelector('.meet-avatar .yo-cloud-body').getAttribute('transform') + '|' + [...document.querySelectorAll('.meet-avatar [data-fluffy-surface]')].map(puff => puff.getAttribute('transform')).join('|')");
		await page.waitForTimeout(250);
		expect(readingPose).toBe(await page.evaluate("document.querySelector('.meet-avatar .yo-cloud-body').getAttribute('transform') + '|' + [...document.querySelectorAll('.meet-avatar [data-fluffy-surface]')].map(puff => puff.getAttribute('transform')).join('|')"));
		expect(requests.some(url => url.includes('/fonts/MiSans-Latin-VF.woff2')), 'The bundled MiSans Latin font never loaded.').toBe(true);
		expect(requests.some(url => /fonts\.(googleapis|gstatic)\.com/.test(url)), 'A render-blocking remote font dependency remains.').toBe(false);
	});

	test('citations copy every paper in every format', async ({ page }) => {
		test.setTimeout(300_000);
		await seenWelcome(page);
		await page.setViewportSize({ width: 1280, height: 800 });
		await page.goto('/#publications');
		await waitForExpr(page, "location.hash === '#publications' && !!document.querySelector('.meet-card')", 'The publications card never opened.');
		for (let index = 0; index < publications.length; index++) {
			await page.evaluate(`document.querySelectorAll('.link-pill-copy')[${index}].click(); true`);
			await waitForExpr(page, "document.querySelector('.citation-dialog')?.open", `Citation dialog did not open for paper ${index}.`);
			await check(page, "document.querySelector('.citation-dialog').contains(document.activeElement)", 'Citation dialog did not receive focus.');
			await waitForExpr(page, "document.querySelector('.citation-flight').getAnimations().every(animation => animation.playState !== 'running')", 'Citation flight animation never settled.');
			const corner = await page.evaluate<{ x: number; y: number }>("(() => { const r = document.querySelector('.citation-flight').getBoundingClientRect(); return {x:r.right-32, y:r.top+32}; })()");
			await page.mouse.move(corner.x, corner.y);
			await waitForExpr(page, "parseFloat(document.querySelector('.citation-card').style.getPropertyValue('--tilt-x')) < 0", 'Citation card did not tilt toward the pointer.');
			await page.mouse.move(0, 0);
			await waitForExpr(page, "document.querySelector('.citation-card').style.getPropertyValue('--tilt-x') === '0deg'", 'Citation card did not settle flat.');
			for (const format of CITATION_FORMATS) {
				await page.evaluate(`document.querySelector('#cite-tab-${format.id}').click(); true`);
				await page.evaluate("document.querySelector('.citation-copy').click(); true");
				await waitForExpr(page, "document.querySelector('.citation-status').textContent === 'Copied!'", `Citation copy did not confirm for ${format.id}.`);
				const copiedCitation = await page.evaluate('navigator.clipboard.readText()');
				expect(copiedCitation, 'Citation copy used the wrong paper or format.').toBe(formatCitation(publications[index]!, format.id));
			}
			await page.evaluate("document.querySelector('#cite-tab-gb').focus(); true");
			await page.keyboard.press('ArrowLeft');
			await waitForExpr(page, "document.querySelector('#cite-tab-apa').getAttribute('aria-selected') === 'true' && document.activeElement.id === 'cite-tab-apa'", 'Citation tabs lost their roving focus.');
			await page.waitForTimeout(500);
			if (index === 0 && process.env.SCREENSHOT_DIR) {
				await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/citation-desktop.png` });
			}
			await page.keyboard.press('Escape');
			await waitForExpr(page, "!document.querySelector('.citation-dialog')", 'Citation dialog never closed.');
			await check(page, `document.activeElement === document.querySelectorAll('.link-pill-copy')[${index}]`, 'Citation close did not restore its article button focus.');
		}
		await page.setViewportSize({ width: 320, height: 568 });
		await page.evaluate("document.querySelector('.link-pill-copy').click(); true");
		await waitForExpr(page, "document.querySelector('.citation-dialog')?.open", 'Citation dialog did not open on a narrow phone.');
		await page.waitForTimeout(600);
		await check(page, "document.querySelector('.citation-card').getBoundingClientRect().right <= innerWidth && document.querySelector('.citation-dialog').scrollWidth <= innerWidth", 'Citation card overflows a narrow phone.');
		await check(page, "document.querySelector('.citation-copy').getBoundingClientRect().bottom <= innerHeight", 'Citation copy action falls below the phone viewport.');
		await check(page, "(() => { const button = document.querySelector('.citation-copy'); const paint = getComputedStyle(button); return paint.color === 'rgb(255, 255, 255)' && paint.getPropertyValue('--glass-tint').trim() !== '#fff' && paint.getPropertyValue('--glass-opacity').trim() === '94%'; })()",
			'Citation copy must retain a readable primary fill, rather than white text on white glass.');
		if (process.env.SCREENSHOT_DIR) {
			await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/citation-phone.png` });
		}
		await page.evaluate("document.querySelector('.citation-close').click(); true");
		await waitForExpr(page, "!document.querySelector('.citation-dialog')", 'Citation dialog never closed on the phone.');
		expect(citationCount).toBeGreaterThan(0);
	});
});
