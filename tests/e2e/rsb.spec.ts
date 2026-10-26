import { check, expect, instrumentLoader, test, trackRequests, waitForExpr, waitForRequest, verifyControlIcons } from './helpers';

test.describe('RSB demo', () => {
	test('loader splash, lazy audio & playback', async ({ page }) => {
		test.setTimeout(300_000);
		const requests = trackRequests(page);
		await instrumentLoader(page);
		await page.goto('/RSB/');
		await page.waitForLoadState('load');
		await waitForExpr(page, "document.documentElement.classList.contains('is-ready')", 'The page loader never finished.');
		await check(page, `(() => {
			const loader = document.querySelector('.page-loader'), wordmark = document.querySelector('.page-loader-wordmark'), wave = document.querySelector('.page-loader-wave');
			if (!wordmark || !wave || !loader) return false;
			const bars = [...wave.children];
			const avatar = loader.querySelector('.page-loader-avatar');
			const rows = [...document.querySelectorAll('.page-reveal-row')];
			const delays = rows.map(row => parseFloat(getComputedStyle(row).getPropertyValue('--page-reveal-delay')) || 0);
			const barStyles = bars.map(bar => getComputedStyle(bar));
			return wordmark.textContent === 'Loading' && avatar?.complete && avatar.naturalWidth > 0 && avatar.getBoundingClientRect().bottom < wordmark.getBoundingClientRect().top && getComputedStyle(avatar).animationName === 'none' &&
				window.__loaderInitialBackground === 'rgb(255, 255, 255)' && !loader.querySelector('.page-loader-sky') &&
				!document.querySelector('.page-loader-subtitle, .page-loader-label') &&
				wave.getBoundingClientRect().top >= wordmark.getBoundingClientRect().bottom &&
				bars.length === 5 && barStyles.every(style => style.backgroundColor === 'rgb(47, 104, 196)' && parseFloat(style.width) < parseFloat(style.height) && style.animationName === 'loader-wave') &&
				new Set(barStyles.map(style => style.animationDelay)).size === 5 &&
				!document.querySelector('.page-loader-bar, .page-loader-track, .page-loader-fill') &&
				rows.length > 0 && Math.max(...delays) > 0 && !document.querySelector('.page-loader-ring') && window.__loaderVisibleDuration >= 777;
		})()`, 'Loader must open on a plain white splash — Qing’s cartoon avatar above a small "Loading" word and five blue wave bars — then stage a top-to-bottom row reveal after at least 777ms.');

		expect(requests.some(url => url.includes('AudioDemoIsland')), 'Preact Island loaded before becoming visible.').toBe(false);
		expect(requests.some(url => url.endsWith('.opus')), 'Audio loaded before the Island became visible.').toBe(false);

		await page.evaluate("document.querySelector('.rsb-audio-section')?.scrollIntoView({ block: 'center' }); true");
		await waitForRequest(requests, url => url.includes('AudioDemoIsland'), 'Preact Island did not hydrate after scrolling.');
		// The Worker request only happens after the default methods' Opus data
		// arrives and decodes, so it gates the request-count assertions below.
		await waitForRequest(requests, url => url.includes('waveform.worker'), 'Default waveform view did not load the waveform Worker.');
		await check(page, `(() => {
			const comparison = document.querySelector('.wave-compare');
			const activeMethod = comparison.querySelector('.method-chip[aria-pressed=true]');
			const inactiveMethod = comparison.querySelector('.method-chip[aria-pressed=false]');
			const activeView = comparison.querySelector('.view-toggle-btn[aria-pressed=true]');
			const inactiveView = comparison.querySelector('.view-toggle-btn[aria-pressed=false]');
			const active = getComputedStyle(activeMethod), inactive = getComputedStyle(inactiveMethod);
			const selectedView = getComputedStyle(activeView), unselectedView = getComputedStyle(inactiveView);
			const sweep = getComputedStyle(activeMethod, '::before');
			const navigation = getComputedStyle(document.querySelector('.audio-nav-btn'));
			return navigation.backgroundColor === 'rgb(255, 255, 255)' && navigation.boxShadow !== 'none' && active.backgroundColor === 'rgb(255, 255, 255)' && active.color === 'rgb(255, 255, 255)' && active.borderColor === sweep.backgroundColor && sweep.backgroundColor !== 'rgba(0, 0, 0, 0)' && sweep.clipPath.includes('142%') && sweep.transitionDuration !== '0s' && active.boxShadow !== 'none' && active.borderRadius === '999px' &&
				getComputedStyle(comparison.querySelector('.progress-play')).backgroundColor === 'rgb(47, 104, 196)' &&
				inactive.backgroundColor === 'rgb(255, 255, 255)' && inactive.borderColor === 'rgb(223, 227, 233)' && inactive.boxShadow !== 'none' && inactive.borderRadius === '999px' &&
				(() => { const thumb = activeView.parentElement.querySelector('.segmented-thumb'); return thumb && getComputedStyle(thumb).backgroundColor === 'rgb(255, 255, 255)' && parseInt(thumb.style.width, 10) > 0 && getComputedStyle(thumb).transitionDuration !== '0s'; })() &&
				selectedView.backgroundColor === 'rgba(0, 0, 0, 0)' && getComputedStyle(activeView).color !== 'rgb(255, 255, 255)' &&
				unselectedView.backgroundColor === 'rgba(0, 0, 0, 0)' && unselectedView.boxShadow === 'none' &&
				getComputedStyle(comparison.querySelector('.segmented-toggle')).borderRadius === '999px';
		})()`, 'RSB selections should use the blue active pill, and the View switch a white thumb on a tinted segmented track.');
		const initialOpus = [...new Set(requests.filter(url => url.endsWith('.opus')))];
		expect(initialOpus.length, 'Initial Opus request count').toBe(4);
		expect(initialOpus.every(url => /\/(Measurement|Ground_Truth)\//.test(url)), 'An unselected method loaded during initial hydration.').toBe(true);
		expect(requests.some(url => url.endsWith('.wav')), 'A WAV file was requested without a download action.').toBe(false);
		expect(requests.some(url => url.endsWith('.spectrogram.avif')), 'A spectrogram loaded before the spectrogram view was selected.').toBe(false);

		await page.locator('.wave-compare').first().locator('.method-chip', { hasText: 'NCSN++M' }).click();
		await waitForExpr(page, "(() => { const audio = document.querySelector('.wave-audio'); return audio && !audio.paused && audio.currentSrc.startsWith('blob:'); })()",
			'Selecting a method did not start the cached Opus audio.', 20_000);

		const afterSelection = [...new Set(requests.filter(url => url.endsWith('.opus')))];
		const ncsnRequests = afterSelection.filter(url => url.includes('/NCSN++M/'));
		expect(ncsnRequests.length, 'On-demand NCSN++M request count').toBe(1);
		const playback = JSON.parse(await page.evaluate<string>(`JSON.stringify({
			active: [...document.querySelectorAll('.wave-compare')][0].querySelector('.method-chip.active')?.textContent.trim(),
			paused: [...document.querySelectorAll('.wave-audio')][0].paused,
			currentSrc: [...document.querySelectorAll('.wave-audio')][0].currentSrc
		})`));
		expect(playback.active).toContain('NCSN++M');
		expect(playback.paused === false && playback.currentSrc.startsWith('blob:'), `Method selection did not automatically start the cached Opus audio: ${JSON.stringify(playback)}`).toBe(true);

		await page.evaluate("(() => { const slider = document.querySelector('.volume-slider'); slider.value = '125'; slider.dispatchEvent(new Event('input', { bubbles: true })); return true; })()");
		await page.waitForTimeout(300);
		const afterVolume = await page.evaluate<{ paused: boolean; src: string }>("({ paused: document.querySelector('.wave-audio').paused, src: document.querySelector('.wave-audio').currentSrc })");
		expect(afterVolume.paused === false && afterVolume.src === playback.currentSrc, 'Volume updates interrupted the selected source.').toBe(true);

		await page.evaluate(`
			[...document.querySelectorAll('.wave-compare')][0]
				.querySelector('.method-chip.active')
				.click();
			const slider = [...document.querySelectorAll('.volume-slider')][0];
			slider.value = '150';
			slider.dispatchEvent(new Event('input', { bubbles: true }));
			true;
		`);
		await page.waitForTimeout(300);
		const sharedControl = JSON.parse(await page.evaluate<string>(`JSON.stringify({
			paused: [...document.querySelectorAll('.wave-audio')][0].paused,
			volumes: [...document.querySelectorAll('.volume-slider')].map((node) => node.value)
		})`));
		expect(sharedControl.paused, 'Clicking the active method did not pause playback.').toBe(true);
		expect(sharedControl.volumes.length === 2 && sharedControl.volumes.every((value: string) => value === '150'), 'Global volume did not synchronize between components.').toBe(true);

		const waveformState = JSON.parse(await page.evaluate<string>(`JSON.stringify({
			preloads: [...document.querySelectorAll('audio')].map((audio) => audio.preload),
			canvas: [...document.querySelectorAll('canvas')].map((canvas) => ({ width: canvas.width, height: canvas.height })),
			cards: document.querySelectorAll('.wave-compare').length,
			methods: [...document.querySelectorAll('.wave-compare')][0].querySelectorAll('.method-chip').length,
			actions: [...document.querySelectorAll('.audio-actions')].map((node) => node.querySelectorAll('button').length),
			views: [...document.querySelectorAll('.wave-compare')][0].querySelectorAll('.view-toggle-btn').length
		})`));
		expect(waveformState.preloads.length === 3 && waveformState.preloads.every((value: string) => value === 'none'), 'Audio preload policy is not "none".').toBe(true);
		expect(waveformState.canvas.some((canvas: { width: number; height: number }) => canvas.width > 0 && canvas.height > 0), 'Real-time waveform canvas was not rendered.').toBe(true);
		expect(waveformState.cards, 'Visible comparison card count').toBe(2);
		expect(waveformState.methods, 'Method chip count').toBe(6);
		expect(waveformState.actions.every((count: number) => count === 3), 'Dataset navigation controls do not match the original layout.').toBe(true);
		expect(waveformState.views, 'Visualization mode toggle is incomplete.').toBe(3);
		expect(requests.some(url => url.endsWith('.spectrogram.avif')), 'Waveform view unexpectedly loaded a spectrogram.').toBe(false);

		await page.evaluate(`
			[...document.querySelectorAll('.wave-compare')][0]
				.querySelectorAll('.view-toggle-btn')[1]
				.click();
			true;
		`);
		await page.waitForTimeout(1000);
		const spectrogramRequests = [...new Set(requests.filter(url => url.endsWith('.spectrogram.avif')))];
		expect(spectrogramRequests.length, 'Static spectrogram request count').toBe(2);
		expect(requests.some(url => url.includes('audioAnalysis.worker')), 'Legacy spectrogram Worker was requested.').toBe(false);

		const magnifierTarget = await page.evaluate<Promise<{ x: number; y: number }>>(`
			(async () => {
				const comparison = [...document.querySelectorAll('.wave-compare')][0];
				await Promise.all([...comparison.querySelectorAll('.spectrogram-canvas')].map((image) => image.decode()));
				const frame = comparison.querySelector('.spectrogram-image-frame');
				frame.scrollIntoView({ block: 'center', behavior: 'instant' });
				await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
				const rect = frame.getBoundingClientRect();
				return { x: rect.left + rect.width * 0.42, y: rect.top + rect.height * 0.58 };
			})()
		`);
		await page.mouse.move(magnifierTarget.x, magnifierTarget.y);
		await page.waitForTimeout(100);
		const magnifier = JSON.parse(await page.evaluate<string>(`(() => {
			const comparison = [...document.querySelectorAll('.wave-compare')][0];
			const lenses = [...comparison.querySelectorAll('.spectrogram-magnifier')];
			return JSON.stringify({
				options: comparison.querySelectorAll('.spectrogram-magnification-option').length,
				magnifiers: lenses.length,
				positions: lenses.map((node) => [node.style.left, node.style.top])
			});
		})()`));
		expect(magnifier.options, 'Magnification switch should be removed').toBe(0);
		expect(magnifier.magnifiers, 'Synchronized magnifier count').toBe(2);
		expect(magnifier.positions[0].join('|') === magnifier.positions[1].join('|'), 'Spectrogram magnifier positions are not synchronized.').toBe(true);

		await page.waitForTimeout(100);
		const zoom = JSON.parse(await page.evaluate<string>(`(() => {
			const comparison = [...document.querySelectorAll('.wave-compare')][0];
			const lenses = [...comparison.querySelectorAll('.spectrogram-magnifier')];
			return JSON.stringify({
				lenses: lenses.map((node) => ({
					backgroundSize: node.style.backgroundSize,
					frameWidth: node.parentElement.getBoundingClientRect().width,
					frameHeight: node.parentElement.getBoundingClientRect().height
				}))
			});
		})()`));
		expect(zoom.lenses.every((lens: { backgroundSize: string; frameWidth: number; frameHeight: number }) => {
			const [backgroundWidth, backgroundHeight] = lens.backgroundSize.split(' ').map(Number.parseFloat);
			return Math.abs(backgroundWidth - lens.frameWidth * 1.5) < 1 && Math.abs(backgroundHeight - lens.frameHeight * 1.5) < 1;
		}), 'Magnifier background is not rendered at the fixed 1.5× zoom.').toBe(true);
		expect([...new Set(requests.filter(url => url.endsWith('.spectrogram.avif')))].length, 'The fixed magnifier must reuse the same spectrogram assets.').toBe(2);

		await page.evaluate(`
			[...document.querySelectorAll('.visual-toggle .segmented-option')].find(node => node.textContent.trim() === 'Off').click();
			true;
		`);
		await page.waitForTimeout(500);
		const simpleMode = JSON.parse(await page.evaluate<string>(`JSON.stringify({
			rows: [...document.querySelectorAll('.simple-table')][0]?.querySelectorAll('tbody tr').length || 0,
			audio: [...document.querySelectorAll('.simple-table audio')].map((node) => node.preload),
			downloads: [...document.querySelectorAll('.simple-table .simple-download')].length
		})`));
		expect(simpleMode.rows, 'Simple-mode row count').toBe(5);
		expect(simpleMode.audio.length === 30 && simpleMode.audio.every((value: string) => value === 'none'), 'Simple-mode audio preload policy is not "none".').toBe(true);
		expect(simpleMode.downloads, 'WAV download links in simple mode').toBe(0);

		const wavResponse = await page.request.get('/audio/RSB/RSB/051o020a_c1_454_snr=5.2.wav');
		expect(wavResponse.ok(), 'WAV download URL is not available.').toBe(true);
	});

	test('waveform and spectrogram layouts hold on every screen', async ({ page }) => {
		test.setTimeout(600_000);
		const requests = trackRequests(page);
		await page.goto('/RSB/');
		// The loader splash swallows pointer events until is-ready; wait it out
		// so the seek gestures below reach the progress bar.
		await waitForExpr(page, "!document.documentElement.classList.contains('is-loading')", 'RSB never finished loading.');
		await page.evaluate("document.querySelector('.rsb-audio-section')?.scrollIntoView({ block: 'center' }); true");
		await waitForRequest(requests, url => url.includes('AudioDemoIsland'), 'Preact Island did not hydrate after scrolling.');
		await waitForRequest(requests, url => url.includes('waveform.worker'), 'Default waveform view did not load the waveform Worker.');
		/* Phone layouts have their own accordion/player coverage in mobile-audio.spec.ts. */
		let rsbIconsChecked = false;
		for (const [width, height] of [[1280, 800], [768, 1024], [2560, 1440]]) {
			await page.setViewportSize({ width, height });
			await page.evaluate("document.querySelector('.wave-compare .view-toggle-btn').click(); true");
			await waitForExpr(page, "(() => { const canvas = document.querySelector('.wave-canvas'); return canvas && canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.some((value, index) => index % 4 === 3 && value > 0); })()",
				`Waveform canvas never painted at ${width}x${height}.`, 30_000);
			await page.waitForTimeout(180);
			/* The waveform swap animates the card height (fade 200ms + sweep
			   320ms): let it settle or the seek below lands on a moving row. */
			await waitForExpr(page, "(() => { const v = document.querySelector('.wave-view'); return !v || !v.style.height; })()", 'The view swap never settled before seeking.', 10_000);
			// Icon selection state is viewport-invariant; verify it once.
			if (!rsbIconsChecked) { await verifyControlIcons(page, '.wave-compare .view-toggle-btn', 'aria-pressed', 2); rsbIconsChecked = true; }
			await check(page, `(() => {
				const card = document.querySelector('.wave-compare');
				return document.documentElement.scrollWidth <= innerWidth &&
					[...document.querySelectorAll('.wave-compare, .wave-panel')].every(n => n.scrollWidth <= n.clientWidth + 1) &&
					parseFloat(getComputedStyle(document.querySelector('.rsb-section')).fontSize) >= 15 &&
					[...card.querySelectorAll('.method-chip, .view-toggle-btn, .progress-play, .progress-bar, .volume-button, .wave-download')].every(n => n.getBoundingClientRect().height >= (n.classList.contains('view-toggle-btn') && innerWidth > 720 ? 32 : 44) && parseFloat(getComputedStyle(n).fontSize) >= 12) &&
					card.querySelectorAll('.method-chip[aria-pressed=true]').length === 1;
			})()`, `RSB waveform controls overflow or lose readable text/touch targets at ${width}x${height}.`);
			await waitForExpr(page, "Number(document.querySelector('.progress-bar').max) > 0", 'Playback duration never arrived.');
			const seekTarget = await page.evaluate<{ x: number; y: number }>(`(() => {
				const input = document.querySelector('.progress-bar');
				input.closest('.wave-compare').querySelector('audio').pause();
				input.scrollIntoView({ block: 'center' });
				const bounds = input.getBoundingClientRect();
				const radius = parseFloat(getComputedStyle(input.parentElement).getPropertyValue('--progress-thumb-size')) / 2;
				window.__seekTarget = { x: bounds.left + radius + (bounds.width - radius * 2) * 0.75, y: bounds.top + bounds.height / 2 };
				return window.__seekTarget;
			})()`);
			await page.mouse.move(seekTarget.x, seekTarget.y);
			await page.mouse.down();
			await page.mouse.up();
			await waitForExpr(page, `(() => {
				const input = document.querySelector('.progress-bar'), track = input.parentElement;
				const audio = input.closest('.wave-compare') && input.closest('.wave-compare').querySelector('audio');
				const ratio = Number(input.value) / Number(input.max);
				const tip = document.body.querySelector(':scope > .progress-tooltip');
				const r = tip && tip.getBoundingClientRect();
				return Math.abs(ratio - 0.75) < 0.02 && Math.abs(audio.currentTime - Number(input.value)) < 0.02 &&
					Math.abs(parseFloat(track.style.getPropertyValue('--playback-progress')) / 100 - ratio) < 0.002 &&
					(() => { if (!tip) return false; const b = tip.getBoundingClientRect(); return b.top >= 0 && b.bottom <= innerHeight && b.left >= 0 && b.right <= innerWidth; })();
			})()`, `Seeking to 75% failed at ${width}x${height}.`);
			for (const key of ['Home', 'End']) {
				await page.keyboard.press(key);
				await waitForExpr(page, `(() => {
					const input = document.querySelector('.progress-bar');
					const expected = ${key === 'Home' ? '0' : 'Number(input.max)'};
					return Math.abs(Number(input.value) - expected) < 0.02 &&
						Math.abs(input.closest('.wave-compare').querySelector('audio').currentTime - expected) < 0.02 &&
						getComputedStyle(input).outlineStyle !== 'none';
				})()`, `${key} seeking or focus ring failed at ${width}x${height}.`);
			}
			await page.evaluate("document.querySelectorAll('.wave-compare .view-toggle-btn')[1].click(); true");
			await waitForExpr(page, "!!document.querySelector('.wave-compare .spectrogram-row')", 'Spectrogram view never opened.');
			await check(page, `(() => {
				const sides = [...document.querySelectorAll('.wave-compare .spectrogram-side')];
				const [a, b] = sides.map(n => n.getBoundingClientRect());
				return sides.every(n => n.dataset.label && n.querySelector('.spectrogram-image-frame').clientWidth >= 150) &&
					(${width} <= 720 ? b.top >= a.bottom : b.left >= a.right) &&
					document.querySelector('.wave-panel').scrollWidth <= document.querySelector('.wave-panel').clientWidth + 1 &&
					document.querySelector('.view-toggle-btn[aria-pressed=true]').textContent.trim() === 'Spectrogram';
			})()`, `RSB spectrogram labels, layout or controls fail at ${width}x${height}.`);
		}
		await page.evaluate("document.querySelector('.wave-compare .legend-item').focus(); true");
		await page.keyboard.press('Enter');
		await waitForExpr(page, "document.querySelector('.legend-item').getAttribute('aria-pressed') === 'true'", 'Legend toggle did not activate.');
		await page.evaluate("document.querySelector('.audio-nav-btn:last-child').click(); true");
		await waitForExpr(page, "document.querySelector('.wave-desc-index').textContent === '#2'", 'Dataset navigation to #2 failed.');
		await page.evaluate("document.querySelector('.audio-nav-btn').click(); true");
		await waitForExpr(page, "document.querySelector('.wave-desc-index').textContent === '#1'", 'Dataset navigation to #1 failed.');
		await page.evaluate("document.querySelector('.audio-show-more').click(); true");
		await waitForExpr(page, "document.querySelector('.audio-group').querySelectorAll('.wave-compare').length === 5", 'Showing more datasets failed.');
		await page.evaluate("document.querySelector('.audio-show-more').click(); true");
		await waitForExpr(page, "document.querySelector('.audio-group').querySelectorAll('.wave-compare').length === 1", 'Collapsing datasets failed.');
		await check(page, "document.querySelector('.rsb-figure-caption').getBoundingClientRect().top >= document.querySelector('.rsb-figure-media').getBoundingClientRect().bottom", 'RSB figure caption covers scientific content.');
		await page.evaluate("document.querySelector('[data-figure-next]').click(); true");
		await waitForExpr(page, "document.querySelector('[data-figure-count]').textContent.trim() === '2 / 3'", 'Figure carousel next failed.');
		await page.evaluate("document.querySelector('[data-figure-slide][aria-hidden=false] [data-figure-open]').click(); true");
		await waitForExpr(page, "document.querySelector('[data-figure-modal]').open", 'Full-screen figure did not open.');
		await check(page, "document.querySelector('[data-figure-modal]').contains(document.activeElement)", 'RSB full-screen figure loses focus.');
		await page.evaluate("document.querySelector('[data-figure-modal-close]').click(); true");
		await waitForExpr(page, "!document.querySelector('[data-figure-modal]').open", 'Full-screen figure did not close.');
	});
});
