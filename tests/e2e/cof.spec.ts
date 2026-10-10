import { check, expect, test, waitForExpr } from './helpers';
import { datasets as cofDatasets, metrics as cofMetrics, series as cofSeries, results as cofRawResults, formatMetric, valueAt } from '../../src/lib/cof-results.js';

const cofViewports: Array<[number, number]> = [[1280, 800], [320, 568], [667, 375]];

test.describe('CoF results controls & values', () => {
	for (const [width, height] of cofViewports) {
		test(`results controls, values and charts at ${width}x${height}`, async ({ page }) => {
			test.setTimeout(900_000);
			await page.setViewportSize({ width, height });
			await page.goto('/CoF/');
			await waitForExpr(page, "!document.documentElement.classList.contains('is-loading')", 'CoF never finished loading.');
			await page.evaluate("document.querySelector('.cof-results').scrollIntoView({block: 'start', behavior: 'instant'}); true");
			await waitForExpr(page, "!document.querySelector('.cof-results').closest('astro-island').hasAttribute('ssr')", 'The CoF results island never hydrated.');
			await waitForExpr(page, "[...document.querySelectorAll('.cof-results-svg')].every(n => Math.abs(n.viewBox.baseVal.width - n.getBoundingClientRect().width) < 2) && !document.querySelector('.discrete-slider-input').disabled", 'CoF charts or slider never became ready.');
			await check(page, "document.querySelector('.cof-results').dataset.view === 'bars' && document.querySelector('.cof-results-view-options [aria-pressed=true]').textContent.includes('Chart') && document.querySelector('.cof-results-bar-panel') && !document.querySelector('.cof-results-curve-panel')", 'CoF should initially show only bar charts.');
			await page.evaluate("document.querySelector('.cof-results-budget-control input[type=range]').scrollIntoView({block: 'center', behavior: 'instant'}); document.querySelector('.cof-results-budget-control input[type=range]').focus({preventScroll:true}); true");
			await check(page, "(() => { const slider = document.querySelector('.cof-results-budget-control input[type=range]'); const box = slider.getBoundingClientRect(); const thumb = document.querySelector('.cof-results-budget-slider .discrete-slider-thumb'); const dataset = document.querySelector('.cof-results-dataset-options'); const view = document.querySelector('.cof-results-view-options'); const rows = [...document.querySelectorAll('.cof-results-filter-row')]; const title = document.querySelector('.cof-results-plot-header > div:first-child').getBoundingClientRect(); const filters = document.querySelector('.cof-results-filter-panel').getBoundingClientRect(); const budget = document.querySelector('.cof-results-budget-control').getBoundingClientRect(); const underTitle = filters.top >= title.bottom - 1; const layout = budget.top >= filters.bottom - 1; return slider.labels[0].textContent.trim() === 'NFE' && slider.min === '0' && slider.max === '5' && slider.step === '1' && box.height >= 44 && box.width >= 44 && [...document.querySelectorAll('.discrete-slider-labels span')].map(n => n.textContent).join(',') === '1,2,4,8,16,24' && thumb.textContent.trim() === '1 NFE' && !thumb.querySelector('.ui-icon') && rows.length === 2 && rows[0].textContent.includes('Dataset') && rows[1].textContent.includes('View') && underTitle && layout && dataset.querySelector('[aria-pressed=true]').textContent.includes('WHAM') && dataset.querySelectorAll('.cof-results-filter-choice').length === 2 && dataset.querySelectorAll('.ui-icon').length === 2 && view.querySelector('[aria-pressed=true]').textContent.includes('Chart') && view.querySelectorAll('.cof-results-filter-choice').length === 2 && view.querySelectorAll('.ui-icon').length === 2; })()", 'CoF filter rows should read Dataset, then View, then the NFE budget row, sit below the title, and remain accessible.');
			await check(page, "document.querySelectorAll('.cof-results-metric-label').length === 5 && [...document.querySelectorAll('.cof-results-metric-label')].every(label => !label.matches('button') && label.closest('.cof-results-bar-group').querySelector('.cof-results-svg') && label.getAttribute('aria-describedby')) && !document.querySelector('.cof-results-metric-control')", 'CoF chart view should show explanatory metric labels without metric-selection controls.');
			if (width === 1280 && process.env.SCREENSHOT_DIR) {
				await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/CoF-results-switches-desktop.png` });
			}
			for (const [index, nfe] of [1, 2, 4, 8, 16, 24].entries()) {
				if (index > 0) await page.keyboard.press('ArrowRight');
				await waitForExpr(page, `document.querySelector('.cof-results').dataset.nfe === '${nfe}' && document.querySelector('.discrete-slider-input').getAttribute('aria-valuetext') === '${nfe} NFE'`, `Arrow keys never reached ${nfe} NFE.`);
			}
			const sliderBox = await page.evaluate<{ left: number; top: number; width: number; height: number }>("(() => { const r = document.querySelector('.discrete-slider-input').getBoundingClientRect(); return {left:r.left, top:r.top, width:r.width, height:r.height}; })()");
			const pointAt = (index: number) => ({ x: sliderBox.left + 15 + (sliderBox.width - 30) * index / 5, y: sliderBox.top + sliderBox.height / 2 });
			const clickAt = async (point: { x: number; y: number }) => {
				await page.mouse.move(point.x, point.y);
				await page.mouse.down();
				await page.mouse.up();
			};
			await clickAt(pointAt(2));
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.nfe === '4'", 'Clicking the slider never chose 4 NFE.');
			await page.mouse.move(pointAt(2).x, pointAt(2).y);
			await page.mouse.down();
			for (const index of [2.5, 3, 3.5, 4]) {
				const point = pointAt(index);
				await page.mouse.move(point.x, point.y);
			}
			await page.mouse.up();
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.nfe === '16'", 'Dragging the slider never chose 16 NFE.');
			await check(page, "(() => { const active = document.querySelector('.cof-results-filter-choice[aria-pressed=true]'); const inactive = document.querySelector('.cof-results-filter-choice[aria-pressed=false]'); return getComputedStyle(active).getPropertyValue('--glass-tint').trim() === '#3478df' && getComputedStyle(active).color === 'rgb(255, 255, 255)' && getComputedStyle(inactive).getPropertyValue('--glass-tint').trim() === '#8fa9cb' && getComputedStyle(active).borderRadius === '999px' && getComputedStyle(inactive).borderRadius === '999px'; })()", 'CoF filter capsules lost their project-blue selected state or muted capsule treatment.');
			for (const [datasetIndex, dataset] of cofDatasets.entries()) {
				await page.evaluate(`document.querySelectorAll('.cof-results-dataset-options button')[${datasetIndex}].click(); true`);
				for (const [metricIndex, metric] of cofMetrics.entries()) {
					await page.evaluate("document.querySelector('.cof-results-view-options [aria-pressed=false]').click(); true");
					await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'curves' && document.querySelector('.cof-results-view-options [aria-pressed=true]').textContent.includes('Curves') && document.querySelector('.cof-results-curve-panel') && !document.querySelector('.cof-results-bar-panel') && document.querySelector('.cof-results-metric-control') && !document.querySelector('.cof-results-budget-control')", 'The curve view never replaced the chart view.');
					await page.evaluate(`document.querySelectorAll('.cof-results-metric-option')[${metricIndex}].click(); true`);
					await waitForExpr(page, `document.querySelector('.cof-results').dataset.metric === '${metric}'`, `The ${metric} metric option never applied.`);
					// Walk to the first series' NFE 24 point with real key events; see
					// the tabTo note on programmatic focus.
					await page.evaluate("[...document.querySelectorAll('.cof-results-point')][0].focus(); true");
					for (let step = 0; step < 5; step += 1) await page.keyboard.press('Tab');
					await check(page, "document.activeElement?.dataset?.nfe === '24'", 'CoF curve points are not reachable in DOM order by keyboard.');
					await waitForExpr(page, `document.querySelector('.cof-results').dataset.nfe === '16' && document.querySelector('.cof-results').dataset.dataset === '${dataset}' && document.querySelector('.cof-results-inspect').textContent.includes('NFE 24')`, 'Focused curve point never inspected NFE 24.');
					await waitForExpr(page, "[...document.querySelectorAll('.cof-results-svg')].every(n => Math.abs(n.viewBox.baseVal.width - n.getBoundingClientRect().width) < 2)", 'CoF curve SVGs never matched their viewBox.');
					await check(page, "document.querySelectorAll('.cof-results-point').length === 24 && [...document.querySelectorAll('.cof-results-svg path')].every(n => !/NaN|Infinity/.test(n.getAttribute('d') || ''))", 'CoF curves lost points or contain invalid coordinates.');
					await check(page, "document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('.cof-results button')].every(n => n.getBoundingClientRect().height >= 44 && n.getBoundingClientRect().width >= 44)", `CoF curve controls do not fit ${width}x${height}.`);
					if (metric === 'UTMOS') {
						await check(page, "document.querySelector('.cof-results-curve-panel svg[role=group]').getAttribute('aria-label').includes('logarithmic')", 'UTMOS does not expose its logarithmic scale.');
					}
					await page.evaluate("document.querySelector('.cof-results-view-options [aria-pressed=false]').click(); true");
					await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'bars' && document.querySelector('.cof-results-view-options [aria-pressed=true]').textContent.includes('Chart') && document.querySelector('.cof-results-bar-panel') && !document.querySelector('.cof-results-curve-panel')", 'The chart view never returned.');
					await waitForExpr(page, "[...document.querySelectorAll('.cof-results-svg')].every(n => Math.abs(n.viewBox.baseVal.width - n.getBoundingClientRect().width) < 2)", 'CoF chart SVGs never matched their viewBox.');
					await check(page, `document.querySelector('.cof-results').dataset.metric === '${metric}' && document.querySelector('.cof-results').dataset.nfe === '16' && document.querySelector('.cof-results').dataset.dataset === '${dataset}' && document.querySelectorAll('.cof-results-metric-label').length === 5 && !document.querySelector('.cof-results-metric-option') && document.querySelector('.cof-results-budget-control') && document.querySelector('.discrete-slider-input').value === '4'`, 'Chart view switch lost the selected dataset or NFE, retained a metric-selection control, or failed to restore the NFE selector.');
					for (const barMetric of cofMetrics) {
						const displayed = await page.evaluate<string[]>(`[...document.querySelectorAll('[data-bar-metric="${barMetric}"] [data-bar-value]')].slice(3).map(n => n.dataset.barValue)`);
						const expected = cofSeries.map(item => formatMetric(barMetric, valueAt(dataset, barMetric, item.key, 16)));
						if (barMetric === 'WER') expected.push(formatMetric('WER', (cofRawResults.clean as Record<string, { WER: number }>)[dataset]!.WER));
						expect(JSON.stringify(displayed), `CoF ${dataset}/${barMetric} bars show wrong values after selection.`).toBe(JSON.stringify(expected));
					}
					await check(page, "document.querySelectorAll('[data-bar-metric]').length === 5 && document.querySelectorAll('[data-bar-value]').length === 36 && document.querySelectorAll('[data-bar-metric=WER] [data-bar-method=\"Clean reference\"]').length === 1", 'CoF overview is missing a metric or comparison method.');
					await check(page, "[...document.querySelectorAll('.cof-results-metric-label')].every(label => { const svg = label.closest('.cof-results-bar-group').querySelector('.cof-results-svg'); const tip = document.getElementById(label.getAttribute('aria-describedby')); return label.getBoundingClientRect().top >= svg.getBoundingClientRect().bottom - 1 && tip?.getAttribute('role') === 'tooltip' && tip.textContent.trim().length > 0; })", 'CoF chart metric labels are not below their x-axis or lack accessible explanations.');
					await check(page, "[...document.querySelectorAll('[data-bar-metric]')].every(chart => chart.dataset.barMetric === 'SI-SDR' && document.querySelector('.cof-results').dataset.dataset === 'WSJ0+REVERB' ? Boolean(chart.querySelector('.cof-results-zero')) : Boolean(chart.querySelector('.cof-results-truncated-base, .cof-results-zero')))", 'CoF chart y-axis scale is missing its baseline or truncation marker.');
					await check(page, "document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('.cof-results-svg')].every(n => Math.abs(n.viewBox.baseVal.width - n.getBoundingClientRect().width) < 2) && [...document.querySelectorAll('.cof-results button')].every(n => n.getBoundingClientRect().height >= 44 && n.getBoundingClientRect().width >= 44)", `CoF charts or controls do not fit ${width}x${height}.`);
					await page.evaluate(`(async () => { await document.fonts.ready; document.documentElement.style.scrollBehavior = 'auto'; document.querySelectorAll('.cof-results-metric-label')[${metricIndex}].scrollIntoView({block:'center',behavior:'auto'}); return true; })()`);
					await page.waitForTimeout(600);
					const metricButton = await page.evaluate<{ x: number; y: number }>(`(() => { const r = document.querySelectorAll('.cof-results-metric-label')[${metricIndex}].getBoundingClientRect(); return {x:r.left + r.width / 2, y:r.top + r.height / 2}; })()`);
					await page.mouse.move(metricButton.x, metricButton.y);
					await waitForExpr(page, `(() => { const button = document.querySelectorAll('.cof-results-metric-label')[${metricIndex}]; const tip = document.getElementById(button.getAttribute('aria-describedby')); return getComputedStyle(tip).visibility === 'visible' && tip.textContent.trim().length > 0; })()`, `Hovering the ${metric} label never revealed its tooltip.`);
					if (width === 1280 && datasetIndex === 0 && metricIndex === 0 && process.env.SCREENSHOT_DIR) {
						await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/CoF-metric-selector-placement.png` });
					}
					if (metric === 'SI-SDR' && datasetIndex === 1) {
						await check(page, "(() => { const chart = document.querySelector('[data-bar-metric=\"SI-SDR\"]'); const bar = chart.querySelector('[data-bar-method=Unprocessed]'); return bar.dataset.barValue === '-9.1' && Number(bar.querySelector('rect').getAttribute('height')) > 0 && Number(bar.querySelector('rect').getAttribute('y')) === Number(chart.querySelector('.cof-results-zero').getAttribute('y1')); })()", 'Negative SI-SDR input reference is missing or does not extend below zero.');
					}
				}
			}
			await page.evaluate("document.querySelector('.cof-results-view-options [aria-pressed=false]').click(); true");
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'curves'", 'The curve view never reopened.');
			await page.evaluate("document.querySelectorAll('.cof-results-metric-option')[2].click(); true");
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.metric === 'SI-SDR' && document.querySelector('.cof-results-metric-option[aria-pressed=true]').textContent.includes('SI-SDR')", 'Selecting SI-SDR failed.');
			await page.evaluate("document.querySelectorAll('.cof-results-metric-option')[4].click(); true");
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.metric === 'WER'", 'Selecting WER failed.');
			await page.evaluate("document.querySelector('.cof-results-view-options [aria-pressed=false]').click(); true");
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'bars'", 'The chart view never reopened.');
			await page.evaluate("document.querySelector('.cof-results-view-options [aria-pressed=false]').focus(); true");
			await page.keyboard.press('Enter');
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'curves' && document.querySelector('.cof-results-metric-control .cof-results-metric-option[aria-pressed=true]').textContent.includes('WER') && document.querySelector('.cof-results').dataset.nfe === '16' && !document.querySelector('.cof-results-budget-control')", 'Keyboard activation of the curve view lost the WER metric or NFE.');
			await page.evaluate("[...document.querySelectorAll('.cof-results-point')][0].focus(); true");
			for (let step = 0; step < 3; step += 1) await page.keyboard.press('Tab');
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.nfe === '16' && document.querySelector('.cof-results-inspect').textContent.includes('NFE 8')", 'Tabbing through curve points never reached NFE 8.');
			await check(page, "!document.querySelector('.cof-results-budget-control') && document.querySelector('.cof-results-context').textContent.includes('across NFE')", 'Curves should inspect point values without exposing or changing the Chart-only NFE selection.');
			await page.evaluate("document.querySelector('.cof-results-view-options [aria-pressed=false]').click(); true");
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'bars' && document.querySelector('.cof-results').dataset.nfe === '16' && !document.querySelector('.cof-results-point')", 'Returning to charts lost the NFE 16 selection.');
			await check(page, "document.querySelector('.cof-results-budget-control') && document.querySelector('.discrete-slider-input').value === '4' && document.querySelector('.discrete-slider-input').getAttribute('aria-valuetext') === '16 NFE' && document.querySelector('.discrete-slider-labels [data-selected]').textContent === '16'", 'Chart view did not restore its previous NFE selection.');
			await check(page, "document.querySelector('[data-bar-metric=WER] [data-bar-method=SB-VE]').dataset.barValue === '" + formatMetric('WER', valueAt(cofDatasets[1]!, 'WER', cofSeries[0]!.key, 16)) + "'", 'Chart values do not reflect the preserved NFE selection.');
			await check(page, "!document.querySelector('.cof-results-data, .cof-results-source')", 'CoF still shows the removed table or source footer.');
			await check(page, "!document.querySelector('.cof-results-bar-short') && [...document.querySelectorAll('.cof-results-bar-key small')].every(n => /^(NFE |No processing)/.test(n.textContent.trim())) && [...document.querySelectorAll('[data-bar-metric=PESQ] [data-bar-method]')].map(n => n.dataset.marker).join(',') === 'cross,square,diamond,circle,circle,triangle,triangle'", 'CoF method abbreviations were not replaced by matched shape markers.');
			await check(page, "(() => { const bars = [...document.querySelectorAll('[data-bar-metric=PESQ] [data-bar-method] > rect:first-child')]; return bars.slice(3).map(n => n.getAttribute('fill')).join(',') === '#b5d7fa,#238bfa,#b5d7fa,#238bfa'; })()", 'CoF and pretrained model colors are inconsistent.');
			await check(page, "document.querySelector('.cof-results-clean-reference')?.textContent.includes('5.80%') && document.querySelector('[data-bar-metric=WER] [data-bar-method=\"Clean reference\"]').getAttribute('aria-label').includes('Clean reference')", 'CoF WER is missing the clean reference value.');
			// Keyboard focus reveals the tooltip once (real Shift+Tab; programmatic
			// focus fires no events in headless Chromium), then hover updates it in
			// place for every bar.
			await page.evaluate("document.querySelectorAll('[data-bar-metric=PESQ] [data-bar-method]')[1].focus(); true");
			await page.keyboard.press('Shift+Tab');
			await waitForExpr(page, "(() => { const bar = document.querySelectorAll('[data-bar-metric=PESQ] [data-bar-method]')[0]; const tip = document.querySelector('.cof-results-bar-tooltip'); return tip?.querySelector('strong').textContent === bar.dataset.barMethod && tip.textContent.includes(bar.dataset.barValue); })()", 'Keyboard focus never revealed the bar tooltip.');
			for (let methodIndex = 0; methodIndex < 7; methodIndex++) {
				await page.evaluate(`document.querySelectorAll('[data-bar-metric=PESQ] [data-bar-method]')[${methodIndex}].focus(); true`);
				const barPoint = await page.evaluate<{ x: number; y: number }>(`(() => { const rect = document.querySelectorAll('[data-bar-metric=PESQ] [data-bar-method] > rect:first-child')[${methodIndex}]; rect.scrollIntoView({block:'center',behavior:'instant'}); const r = rect.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
				await page.mouse.move(barPoint.x, barPoint.y);
				await waitForExpr(page, `document.querySelector('.cof-results-bar-tooltip strong')?.textContent === document.querySelectorAll('[data-bar-metric=PESQ] [data-bar-method]')[${methodIndex}].dataset.barMethod`, `Hovering bar ${methodIndex} never moved the tooltip.`);
			}
			if (process.env.SCREENSHOT_DIR) {
				await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/CoF-results-${width}x${height}.png` });
			}
		});
	}

	test('CoF CSV download is available', async ({ page }) => {
		expect((await page.request.get('/CoF/results.csv')).ok(), 'CoF CSV download is unavailable.').toBe(true);
	});
});
