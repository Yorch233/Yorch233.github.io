import { expect, test as base, type Page } from '@playwright/test';

export { expect };

/** Playwright test with a runtime-exception guard on every test. */
export const test = base.extend({
	page: async ({ page }, use) => {
		const errors: string[] = [];
		page.on('pageerror', error => errors.push(String(error)));
		await use(page);
		expect(errors, 'Runtime exceptions were reported').toEqual([]);
	}
});

/** Assert a boolean page expression with the harness-style failure message. */
export async function check(page: Page, expression: string, message: string): Promise<void> {
	expect(await page.evaluate<boolean>(expression), message).toBe(true);
}

/** Poll a boolean page expression until it holds, reporting the original message. */
export async function waitForExpr(page: Page, expression: string, message: string, timeout = 15_000): Promise<void> {
	try {
		await page.waitForFunction(expression, undefined, { timeout });
	} catch {
		throw new Error(`${message}\nCondition never became true: ${expression}`);
	}
}

/** Record every network request URL for lazy-loading assertions. */
export function trackRequests(page: Page): string[] {
	const urls: string[] = [];
	page.on('request', request => urls.push(request.url()));
	return urls;
}

export async function waitForRequest(urls: string[], predicate: (url: string) => boolean, message: string, timeout = 30_000): Promise<void> {
	try {
		await expect.poll(() => urls.some(predicate), { timeout, intervals: [125] }).toBe(true);
	} catch {
		throw new Error(`${message}\nNo matching request was observed.`);
	}
}

/** First-paint instrumentation shared by the loader and branding assertions. */
export async function instrumentLoader(page: Page): Promise<void> {
	await page.addInitScript(() => {
		new MutationObserver((_, observer) => {
			const icon = document.querySelector('link[rel=icon]');
			if (!icon) return;
			window.__firstYoForm = document.documentElement.dataset.yoAppearance;
			window.__firstYoIcon = icon.getAttribute('href') ?? undefined;
			requestAnimationFrame(() => {
				window.__loaderInitialBackground = getComputedStyle(document.querySelector('.page-loader')!).backgroundColor;
				const start = performance.now();
				const ready = new MutationObserver(() => {
					if (!document.documentElement.classList.contains('is-ready')) return;
					window.__loaderVisibleDuration = performance.now() - start;
					ready.disconnect();
				});
				ready.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
			});
			observer.disconnect();
		}).observe(document, { childList: true, subtree: true });
	});
}

export const seenWelcome = (page: Page) => page.addInitScript(() => {
	try { localStorage.setItem('yo-welcome.v1', 'seen'); } catch { /* localStorage unavailable */ }
});

export const viewportLoop = async (page: Page, sizes: Array<[number, number]>, run: (width: number, height: number) => Promise<void>) => {
	for (const [width, height] of sizes) {
		await page.setViewportSize({ width, height });
		await run(width, height);
	}
};

/** Selection must change icon color and silhouette without changing labels. */
export async function verifyControlIcons(page: Page, selector: string, attribute: string, limit = Infinity): Promise<void> {
	await page.waitForTimeout(190);
	await check(page, `(() => {
		const controls = [...document.querySelectorAll(${JSON.stringify(selector)})].slice(0, ${limit});
		const active = controls.filter(n => n.hasAttribute(${JSON.stringify(attribute)}) && n.getAttribute(${JSON.stringify(attribute)}) !== 'false');
		const quiet = controls.filter(n => !active.includes(n) && !n.matches(':hover, :focus-visible'));
		const color = n => getComputedStyle(n.querySelector('.ui-icon')).color;
		return active.length === 1 && quiet.length > 0 && active.every(n => {
			const icon = n.querySelector('.ui-icon');
			return icon && color(n) !== color(quiet[0]) &&
				getComputedStyle(icon.querySelector('.ui-icon__filled')).display === 'inline' &&
				!!icon.querySelector('.ui-icon__filled [data-icon-tone=secondary]') &&
				getComputedStyle(icon.querySelector('.ui-icon__filled [data-icon-tone=secondary]')).fill !== color(n) &&
				getComputedStyle(icon.querySelector('.ui-icon__line')).display === 'none';
		}) && quiet.every(n => getComputedStyle(n.querySelector('.ui-icon__filled')).display === 'none');
	})()`, `Active/inactive SVG icons disagree with control state: ${selector}.`);
}

export async function verifyYoTyping(page: Page, selector: string): Promise<void> {
	await waitForExpr(page, `(() => {
		const message = document.querySelector('${selector} .yo-dialogue');
		const typed = message?.querySelector('.yo-dialogue-visual').textContent;
		return message?.dataset.typing === 'true' && typed.length > 0 && typed.length < message.querySelector('.yo-dialogue-copy').textContent.length;
	})()`, `Yo dialogue never started typing: ${selector}.`);
	const before = await page.evaluate<{ text: string; typed: string; height: number }>(`(() => {
		const message = document.querySelector('${selector} .yo-dialogue');
		return { text: message.querySelector('.yo-dialogue-copy').textContent, typed: message.querySelector('.yo-dialogue-visual').textContent, height: message.offsetHeight };
	})()`);
	await page.waitForTimeout(100);
	await check(page, `document.querySelector('${selector} .yo-dialogue-visual').textContent.length > ${before.typed.length}`, 'Yo dialogue does not reveal characters progressively.');
	await waitForExpr(page, `document.querySelector('${selector} .yo-dialogue').dataset.typing === 'false'`, 'Yo dialogue never finished typing.');
	await check(page, `(() => {
		const message = document.querySelector('${selector} .yo-dialogue');
		return message.querySelector('.yo-dialogue-visual').textContent === ${JSON.stringify(before.text)} &&
			message.querySelector('.yo-dialogue-visual').getAttribute('aria-hidden') === 'true' && message.offsetHeight === ${before.height};
	})()`, 'Yo typing loses text, changes layout or leaks partial words to accessibility.');
}

/**
 * Headless Chromium keeps programmatic focus() from dispatching focus events
 * for some event-driven UI, so focus order is exercised with real key events.
 */
export async function tabTo(page: Page, condition: string, limit = 60): Promise<boolean> {
	for (let attempt = 0; attempt < limit; attempt += 1) {
		if (await page.evaluate<boolean>(condition)) return true;
		await page.keyboard.press('Tab');
	}
	return page.evaluate<boolean>(condition);
}

export async function hoverCenter(page: Page, selector: string): Promise<{ x: number; y: number }> {
	await page.evaluate(`document.activeElement?.blur(); document.querySelector(${JSON.stringify(selector)}).scrollIntoView({ block: 'center', behavior: 'instant' }); true`);
	const point = await page.evaluate<{ x: number; y: number }>(`(() => { const rect = document.querySelector(${JSON.stringify(selector)}).getClientRects()[0]; return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }; })()`);
	await page.mouse.move(point.x, point.y);
	return point;
}

declare global {
	interface Window {
		__firstYoForm?: string;
		__firstYoIcon?: string;
		__loaderInitialBackground?: string;
		__loaderVisibleDuration?: number;
		__themeCircleAnimated?: boolean;
		__nativeThemeAnimate?: typeof Element.prototype.animate;
	}
}
