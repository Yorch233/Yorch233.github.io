import { check, expect, test, trackRequests, waitForExpr, waitForRequest } from './helpers';
import type { Page } from '@playwright/test';
import { datasets as cofDatasets, metrics as cofMetrics, series as cofSeries, results as cofRawResults, formatMetric, valueAt } from '../../src/lib/cof-results.js';

const cofViewports: Array<[number, number]> = [[1280, 800], [320, 568], [667, 375]];
const cofBudgets = [1, 2, 4, 8, 16, 24];

async function chooseBudget(page: Page, nfe: number) {
	const trigger = page.locator('.cof-results-budget-trigger');
	if (await trigger.getAttribute('aria-expanded') !== 'true') await trigger.click();
	const slider = page.getByRole('slider', { name: 'NFE' });
	await slider.focus();
	await slider.press('Home');
	for (let step = 0; step < cofBudgets.indexOf(nfe); step += 1) await slider.press('ArrowRight');
	await waitForExpr(page, `document.querySelector('.cof-results').dataset.nfe === '${nfe}'`, `The sampling budget never changed to ${nfe} NFE.`);
}

test.describe('CoF results controls & values', () => {
	for (const [width, height] of cofViewports) {
		test(`results controls, values and charts at ${width}x${height}`, async ({ page }) => {
			test.setTimeout(900_000);
			await page.setViewportSize({ width, height });
			await page.goto('/CoF/');
			await waitForExpr(page, "!document.documentElement.classList.contains('is-loading')", 'CoF never finished loading.');
			await page.evaluate("document.querySelector('.cof-results').scrollIntoView({block: 'start', behavior: 'instant'}); true");
			await waitForExpr(page, "!document.querySelector('.cof-results').closest('astro-island').hasAttribute('ssr')", 'The CoF results island never hydrated.');
			await check(page, "(() => { const rows = [...document.querySelectorAll('.cof-results-filter-row')]; return document.querySelector('.cof-results').dataset.view === 'bars' && rows.length === 2 && Boolean(document.querySelector('.cof-results-nfe-control, .cof-results-budget-trigger')) && document.documentElement.scrollWidth <= innerWidth; })()", 'The Chart view is the default and shows the sampling budget control.');
			await page.getByRole('button', { name: 'Curves', exact: true }).click();
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'curves' && !document.querySelector('.cof-results-nfe-control, .cof-results-budget-trigger, .cof-results-budget-popover')", 'Curves view should hide the Chart-only sampling budget control.');
			await page.getByRole('button', { name: 'Chart', exact: true }).click();
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'bars' && document.querySelector('.cof-results-budget-trigger') && document.querySelectorAll('.cof-results-budget-slider .discrete-slider-labels span').length === 6", 'Chart view never showed the sampling budget selector.');
			await check(page, "(() => { const rows = [...document.querySelectorAll('.cof-results-filter-row')]; const budget = document.querySelector('.cof-results-nfe-control').getBoundingClientRect(); const view = rows[1].getBoundingClientRect(); const sameRow = Math.abs(rows[0].getBoundingClientRect().top - view.top) < 2 && Math.abs(view.top - budget.top) < 2; const responsive = budget.top >= view.bottom - 1 || budget.left >= view.right - 1; return innerWidth >= 1200 ? sameRow : responsive; })()", 'Dataset, View, and Sampling budget should share one wide row and wrap cleanly on small screens.');
			await page.locator('.cof-results-budget-trigger').click();
			await check(page, "(() => { const popover = document.querySelector('.cof-results-budget-popover'); const slider = popover.querySelector('.cof-results-budget-slider'); const track = slider.querySelector('.discrete-slider-track'); const fill = slider.querySelector('.discrete-slider-fill'); const thumb = slider.querySelector('.discrete-slider-thumb'); const caption = slider.querySelector('.discrete-slider-caption'); const heading = slider.querySelector('.discrete-slider-heading'); const labels = [...slider.querySelectorAll('.discrete-slider-labels span')].map(n => n.textContent.trim()).join(','); const triggerValue = document.querySelector('.cof-results-budget-trigger strong').textContent.trim(); return !popover.hidden && getComputedStyle(popover).backgroundColor === 'rgb(255, 255, 255)' && popover.getAttribute('role') === 'dialog' && labels === '1,2,4,8,16,24' && getComputedStyle(track).backgroundColor === 'rgb(232, 234, 237)' && getComputedStyle(track).height === '22px' && getComputedStyle(fill).display !== 'none' && getComputedStyle(thumb).borderRadius === '50%' && getComputedStyle(thumb).width === '34px' && thumb.textContent.trim() === '' && caption.textContent.trim() === 'NFE' && triggerValue === '4 NFE' && !heading && slider.querySelector('input').getAttribute('aria-label') === 'NFE'; })()", 'The white popover slider should show a thick rail, a plain circular thumb, six stops, and an NFE caption beneath the rail.');
			await page.keyboard.press('Escape');
			await waitForExpr(page, "document.querySelector('.cof-results-budget-trigger').getAttribute('aria-expanded') === 'false' && document.activeElement === document.querySelector('.cof-results-budget-trigger')", 'Escape should close the sampling budget popover and restore focus.');
			await check(page, "(() => [...document.querySelectorAll('.cof-results-controls button[aria-pressed]')].every(button => { const style = getComputedStyle(button); const selected = button.getAttribute('aria-pressed') === 'true'; return style.borderRadius === '999px' && style.boxShadow !== 'none' && style.backgroundColor === (selected ? 'rgb(47, 104, 196)' : 'rgb(255, 255, 255)') && style.color === (selected ? 'rgb(255, 255, 255)' : 'rgb(37, 54, 77)'); }))()", 'Every benchmark filter should use a white shadowed pill or blue selected pill.');
			await waitForExpr(page, "[...document.querySelectorAll('.cof-results-svg')].every(n => Math.abs(n.viewBox.baseVal.width - n.getBoundingClientRect().width) < 2)", 'CoF charts never became ready.');
			await check(page, "document.querySelector('.cof-results').dataset.view === 'bars' && document.querySelector('.cof-results-view-options [aria-pressed=true]').textContent.includes('Chart') && document.querySelector('.cof-results-bar-panel') && !document.querySelector('.cof-results-curve-panel')", 'Chart view should mount only bar charts.');
			await check(page, "(() => { const dataset = document.querySelector('.cof-results-dataset-options'); const view = document.querySelector('.cof-results-view-options'); const rows = [...document.querySelectorAll('.cof-results-filter-row')]; const title = document.querySelector('.cof-results-plot-header > div:first-child').getBoundingClientRect(); const filters = document.querySelector('.cof-results-filter-panel').getBoundingClientRect(); const datasetRow = rows[0].getBoundingClientRect(); const viewRow = rows[1].getBoundingClientRect(); const budget = document.querySelector('.cof-results-nfe-control').getBoundingClientRect(); const choices = [...document.querySelectorAll('.cof-results-budget-slider .discrete-slider-labels span')]; const sameRow = Math.abs(datasetRow.top - viewRow.top) < 2 && Math.abs(viewRow.top - budget.top) < 2; const responsive = budget.top >= viewRow.bottom - 1 || budget.left >= viewRow.right - 1; const layout = innerWidth >= 1200 ? sameRow : responsive; return choices.map(n => n.textContent.trim()).join(',') === '1,2,4,8,16,24' && !document.querySelector('.cof-results-budget-slider input').disabled && rows.length === 2 && rows[0].textContent.includes('Dataset') && rows[1].textContent.includes('View') && filters.top >= title.bottom - 1 && layout && dataset.querySelector('[aria-pressed=true]').textContent.includes('WHAM') && dataset.querySelectorAll('.cof-results-filter-choice').length === 2 && dataset.querySelectorAll('.ui-icon').length === 2 && view.querySelector('[aria-pressed=true]').textContent.includes('Chart') && view.querySelectorAll('.cof-results-filter-choice').length === 2; })()", 'Chart controls should show dataset, view and sampling budget on one row at wide sizes and remain responsive without overlap at narrow sizes.');
			await check(page, "document.querySelectorAll('.cof-results-metric-label').length === 5 && [...document.querySelectorAll('.cof-results-metric-label')].every(label => !label.matches('button') && label.closest('.cof-results-bar-group').querySelector('.cof-results-svg') && label.getAttribute('aria-describedby')) && !document.querySelector('.cof-results-metric-control')", 'CoF chart view should show explanatory metric labels without metric-selection controls.');
			if (width === 1280 && process.env.SCREENSHOT_DIR) {
				await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/CoF-results-switches-desktop.png` });
			}
			for (const nfe of cofBudgets) {
				await chooseBudget(page, nfe);
				await waitForExpr(page, `document.querySelector('.cof-results').dataset.nfe === '${nfe}' && document.querySelector('.cof-results-budget-trigger strong').textContent === '${nfe} NFE'`, `The shared selector never chose ${nfe} NFE in Chart view.`);
			}
			await waitForExpr(page, "(() => { const slider = document.querySelector('.cof-results-budget-slider'); const fill = slider?.querySelector('.discrete-slider-fill'); return slider?.dataset.max === 'true' && slider.querySelectorAll('.discrete-slider-bubble').length >= 8 && getComputedStyle(fill, '::before').opacity === '1'; })()", 'A full 24 NFE budget should reveal the gradient rail, its sheen, and floating bubbles.');
			await check(page, "document.querySelector('.cof-results-budget-slider .discrete-slider-glow').getAnimations().some(animation => animation.animationName === 'discrete-slider-glow')", 'The maxed rail should run its flowing-light animation.');
			await chooseBudget(page, 1);
			await page.locator('#cof-results-budget-slider').press('ArrowRight');
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.nfe === '2'", 'Keyboard adjustment never chose 2 NFE.');
			await chooseBudget(page, 16);
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.nfe === '16'", 'The shared selector never chose 16 NFE.');
			await check(page, "(() => { const active = document.querySelector('.cof-results-dataset-options .cof-results-filter-choice[aria-pressed=true]'); const inactive = document.querySelector('.cof-results-dataset-options .cof-results-filter-choice[aria-pressed=false]'); const activeStyle = getComputedStyle(active); const inactiveStyle = getComputedStyle(inactive); return active.classList.contains('method-chip') && active.classList.contains('active') && activeStyle.backgroundColor === 'rgb(47, 104, 196)' && activeStyle.color === 'rgb(255, 255, 255)' && activeStyle.borderColor === 'rgb(47, 104, 196)' && inactiveStyle.backgroundColor === 'rgb(255, 255, 255)' && inactiveStyle.color === 'rgb(37, 54, 77)' && inactiveStyle.borderColor === 'rgb(223, 227, 233)' && inactiveStyle.boxShadow !== 'none' && activeStyle.borderRadius === '999px' && inactiveStyle.borderRadius === '999px'; })()", 'CoF dataset buttons should use a blue active pill and a bordered, shadowed white inactive pill.');
			for (const [datasetIndex, dataset] of cofDatasets.entries()) {
				await page.evaluate(`document.querySelectorAll('.cof-results-dataset-options button')[${datasetIndex}].click(); true`);
				for (const [metricIndex, metric] of cofMetrics.entries()) {
					await page.evaluate("document.querySelector('.cof-results-view-options [aria-pressed=false]').click(); true");
					await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'curves' && document.querySelector('.cof-results-view-options [aria-pressed=true]').textContent.includes('Curves') && document.querySelector('.cof-results-curve-panel') && !document.querySelector('.cof-results-bar-panel') && document.querySelector('.cof-results-metric-control') && !document.querySelector('.cof-results-nfe-control, .cof-results-budget-popover')", 'The curve view never replaced the chart view or hid the chart-only sampling selector.');
					await page.evaluate(`document.querySelectorAll('.cof-results-metric-option')[${metricIndex}].click(); true`);
					await waitForExpr(page, `document.querySelector('.cof-results').dataset.metric === '${metric}' && !document.querySelector('.cof-results-fading')`, `The ${metric} metric option never applied.`);
					await check(page, "(() => { const lines = [...document.querySelectorAll('.cof-results-reference-line')]; const labels = [...document.querySelectorAll('.cof-results-reference-label')]; const names = labels.map(node => node.textContent.trim().replace(/ [↓↑]$/, '')).sort(); const budgets = lines.map(line => line.dataset.referenceBudget).sort().join('|'); const arrowsConsistent = lines.every(line => { const label = labels.find(node => node.dataset.referenceName === line.dataset.referenceName); return label && (line.dataset.beyond ? / [↓↑]$/.test(label.textContent.trim()) : !/ [↓↑]$/.test(label.textContent.trim())); }); const horizontal = lines.every(line => Number.isFinite(Number(line.dataset.referenceValue)) && Number(line.querySelector('line').getAttribute('y1')) === Number(line.querySelector('line').getAttribute('y2')) && Number(line.querySelector('line').getAttribute('x2')) > Number(line.querySelector('line').getAttribute('x1'))); const svg = document.querySelector('.cof-results-curve-panel svg[role=group]'); return lines.length === 3 && names.join('|') === 'SGMSE+@100|StoRM@100+1|Unprocessed' && budgets === '|100|100+1' && arrowsConsistent && horizontal && lines.some(line => line.dataset.beyond) && svg.getAttribute('aria-label').includes('zoomed to the model curves'); })()", 'Curves should show horizontal Unprocessed, SGMSE+, and StoRM references with Unprocessed free of a budget suffix, zooming the vertical axis to the curves and marking beyond-range references with an arrow.');
					await check(page, "document.querySelectorAll('.cof-results-point-label').length === 0 && !document.querySelector('.cof-results-selection')", 'Curves should be independent of the sampling budget: no selection line and no permanent point labels.');
					await check(page, "(() => { const items = [...document.querySelectorAll('.cof-results-curve-panel .cof-results-bar-key li > span')].map(n => n.textContent.trim()); const strokes = [...document.querySelectorAll('.cof-results-curve-panel g[data-series-name] > path')].map(p => p.getAttribute('stroke')); return items.length === 7 && items.join('|') === 'Unprocessed|SGMSE+@100|StoRM@100+1|SB-VE|CoF (SB-VE)|OT-CFM|CoF (OT-CFM)' && strokes.join(',') === '#65aefc,#ff7210,#ae8df9,#ff7210'; })()", 'The Curves legend should mirror the Chart chip legend and curves should use each method\'s own theme tint.');
					await check(page, "(() => { const chips = document.querySelectorAll('.cof-results-point-chip'); return chips.length === 24 && [...document.querySelectorAll('.cof-results-point-chip text')].every(t => getComputedStyle(t).fill === 'rgb(255, 255, 255)'); })()", 'Every curve data point should render as its method chip with white monogram text.');
					// Walk to the first series' NFE 24 point with real key events; see
					// the tabTo note on programmatic focus.
					await page.evaluate("[...document.querySelectorAll('.cof-results-point')][0].focus(); true");
					for (let step = 0; step < 5; step += 1) await page.keyboard.press('Tab');
					await check(page, "document.activeElement?.dataset?.nfe === '24'", 'CoF curve points are not reachable in DOM order by keyboard.');
					await waitForExpr(page, `document.querySelector('.cof-results').dataset.nfe === '16' && document.querySelector('.cof-results').dataset.dataset === '${dataset}' && document.activeElement?.dataset?.nfe === '24'`, 'Focused curve point never landed on NFE 24.');
					await waitForExpr(page, "[...document.querySelectorAll('.cof-results-svg')].every(n => Math.abs(n.viewBox.baseVal.width - n.getBoundingClientRect().width) < 2)", 'CoF curve SVGs never matched their viewBox.');
					await check(page, "document.querySelectorAll('.cof-results-point').length === 24 && [...document.querySelectorAll('.cof-results-svg path')].every(n => !/NaN|Infinity/.test(n.getAttribute('d') || ''))", 'CoF curves lost points or contain invalid coordinates.');
					await check(page, "document.documentElement.scrollWidth <= innerWidth && [...document.querySelectorAll('.cof-results button')].every(n => n.getBoundingClientRect().height >= 44 && n.getBoundingClientRect().width >= 44)", `CoF curve controls do not fit ${width}x${height}.`);
					await page.evaluate("document.querySelector('.cof-results-view-options [aria-pressed=false]').click(); true");
					await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'bars' && document.querySelector('.cof-results-view-options [aria-pressed=true]').textContent.includes('Chart') && document.querySelector('.cof-results-bar-panel') && !document.querySelector('.cof-results-curve-panel')", 'The chart view never returned.');
					await waitForExpr(page, "[...document.querySelectorAll('.cof-results-svg')].every(n => Math.abs(n.viewBox.baseVal.width - n.getBoundingClientRect().width) < 2)", 'CoF chart SVGs never matched their viewBox.');
					await check(page, `document.querySelector('.cof-results').dataset.metric === '${metric}' && document.querySelector('.cof-results').dataset.nfe === '16' && document.querySelector('.cof-results').dataset.dataset === '${dataset}' && document.querySelectorAll('.cof-results-metric-label').length === 5 && !document.querySelector('.cof-results-metric-option') && document.querySelector('.cof-results-nfe-control') && document.querySelector('.cof-results-budget-trigger strong').textContent === '16 NFE'`, 'Chart view switch lost the selected dataset or NFE, retained a metric-selection control, or failed to restore the selector.');
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
					await waitForExpr(page, "!document.querySelector('.cof-results-resizing')", 'The chart switch transition never settled.');
					await page.evaluate(`(async () => { await document.fonts.ready; document.documentElement.style.scrollBehavior = 'auto'; document.querySelectorAll('.cof-results-metric-label')[${metricIndex}].scrollIntoView({block:'center',behavior:'auto'}); return true; })()`);
					await page.waitForTimeout(200);
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
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'curves' && document.querySelectorAll('.cof-results-metric-option').length === 5", 'The curve view never reopened.');
			await page.evaluate("document.querySelectorAll('.cof-results-metric-option')[2].click(); true");
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.metric === 'SI-SDR' && document.querySelector('.cof-results-metric-option[aria-pressed=true]').textContent.includes('SI-SDR')", 'Selecting SI-SDR failed.');
				await page.evaluate("document.querySelectorAll('.cof-results-metric-option')[4].click(); true");
				await waitForExpr(page, "document.querySelector('.cof-results').dataset.metric === 'WER'", 'Selecting WER failed.');
				// Hovering a Curves legend entry focuses its curve and dims the rest.
				const curveLegendPoint = await page.evaluate<{ x: number; y: number }>(`(() => { const li = document.querySelectorAll('.cof-results-curve-panel .cof-results-bar-key li')[5]; li.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = li.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
				await page.mouse.move(curveLegendPoint.x, curveLegendPoint.y);
				await check(page, "(() => { const groups = [...document.querySelectorAll('.cof-results-curve-panel g[data-series-name]')]; const focused = groups.find(g => g.style.opacity !== '0.3'); return groups.length === 4 && groups.filter(g => g.style.opacity === '0.3').length === 3 && focused?.dataset.seriesName === 'OT-CFM' && [...document.querySelectorAll('.cof-results-curve-panel .cof-results-reference-line')].every(g => g.style.opacity === '0.3'); })()", 'Hovering a Curves legend entry should focus its curve and dim references and other curves.');
				await page.mouse.move(4, 4);
				await waitForExpr(page, "[...document.querySelectorAll('.cof-results-curve-panel g[data-series-name]')].every(g => g.style.opacity !== '0.3')", 'Leaving the Curves legend never cleared the focus.');
			await page.evaluate("document.querySelector('.cof-results-view-options [aria-pressed=false]').click(); true");
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'bars'", 'The chart view never reopened.');
			await page.evaluate("document.querySelector('.cof-results-view-options [aria-pressed=false]').focus(); true");
			await page.keyboard.press('Enter');
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'curves'", 'Keyboard Enter never switched to Curves.');
			await waitForExpr(page, "document.querySelector('.cof-results-metric-control .cof-results-metric-option[aria-pressed=true]').textContent.includes('WER') && document.querySelector('.cof-results').dataset.nfe === '16' && document.querySelector('.cof-results-point') && !document.querySelector('.cof-results-fading') && !document.querySelector('.cof-results-nfe-control, .cof-results-budget-trigger')", 'Keyboard activation of the curve view failed to hide the chart-only selector.');
			await page.evaluate("[...document.querySelectorAll('.cof-results-point')][0].focus(); true");
			for (let step = 0; step < 3; step += 1) await page.keyboard.press('Tab');
				await waitForExpr(page, "document.querySelector('.cof-results').dataset.nfe === '16' && document.activeElement?.dataset?.nfe === '8'", 'Tabbing through curve points never reached NFE 8.');
			await check(page, "document.querySelector('.cof-results').dataset.nfe === '16' && !document.querySelector('.cof-results-context') && !document.querySelector('.cof-results-nfe-control')", 'Curve point inspection should retain the selected NFE while its selector stays Chart-only.');
			await page.evaluate("document.querySelector('.cof-results-view-options [aria-pressed=false]').click(); true");
			await waitForExpr(page, "document.querySelector('.cof-results').dataset.view === 'bars' && document.querySelector('.cof-results').dataset.nfe === '16' && !document.querySelector('.cof-results-point')", 'Returning to charts lost the NFE 16 selection.');
			await check(page, "document.querySelector('.cof-results-nfe-control') && document.querySelector('.cof-results-budget-trigger strong').textContent === '16 NFE'", 'Chart view did not restore its previous NFE selection.');
			await check(page, "document.querySelector('[data-bar-metric=WER] [data-bar-method=SB-VE]').dataset.barValue === '" + formatMetric('WER', valueAt(cofDatasets[1]!, 'WER', cofSeries[0]!.key, 16)) + "'", 'Chart values do not reflect the preserved NFE selection.');
			await check(page, "!document.querySelector('.cof-results-data, .cof-results-source')", 'CoF still shows the removed table or source footer.');
			await check(page, "(() => { const items = [...document.querySelectorAll('.cof-results-bar-key li')].map(li => li.querySelector('span').textContent.trim()); return items.length === 8 && items.join('|') === 'Unprocessed|Clean reference|SGMSE+@100|StoRM@100+1|SB-VE@16|CoF (SB-VE)@16|OT-CFM@16|CoF (OT-CFM)@16' && document.querySelectorAll('.cof-results-bar-key li .cof-results-method-chip').length === 8; })()", 'The chart legend must be one row of chip + method@NFE entries with Clean reference second.');
			await check(page, "!document.querySelector('.cof-results-bar-short') && [...document.querySelectorAll('[data-bar-metric=PESQ] [data-bar-method]')].map(n => n.dataset.monogram).join(',') === 'Un,SG,St,SB,Co,OT,Co'", 'CoF chart bars do not carry the method monograms in reference order (CoF variants read "Co").');
			await check(page, "(() => { const groups = [...document.querySelectorAll('[data-bar-metric=PESQ] [data-bar-method]')]; const fills = groups.map(n => n.querySelector('rect').getAttribute('fill')).join(','); if (fills !== '#939eae,#bd866c,#d45d8c,#65aefc,#ff954c,#ae8df9,#ff954c') return false; const valuesAbove = groups.every(n => { const value = n.querySelector('.cof-results-value'); return !value.classList.contains('cof-results-value-inside') && Number(value.getAttribute('y')) < Number(n.querySelector('rect').getAttribute('y')); }); const tall = groups.map(n => ({ chip: n.querySelector('.cof-results-bar-badge'), rect: n.querySelector('rect') })).filter(({ rect }) => Number(rect.getAttribute('height')) >= 40); const chipsInside = tall.length > 0 && tall.every(({ chip, rect }) => { const top = Number(rect.getAttribute('y')); return Number(chip.getAttribute('y')) >= top && Number(chip.getAttribute('y')) + Number(chip.getAttribute('height')) <= top + Number(rect.getAttribute('height')); }); return valuesAbove && chipsInside && getComputedStyle(document.querySelector('[data-bar-metric=PESQ] .cof-results-value')).fill === 'rgb(37, 54, 77)'; })()", 'Bars keep the lightened theme tints, dark values above each bar, and method chips at the inner top edge of tall bars.');
			await check(page, "(() => { const chipFill = n => [...n.querySelector('.cof-results-bar-badge').querySelectorAll('circle, path, rect')].map(c => c.getAttribute('fill')).find(f => f && f !== '#fff' && f !== 'none'); const byName = {}; [...document.querySelectorAll('[data-bar-metric=PESQ] [data-bar-method]')].forEach(n => { byName[n.dataset.barMethod] = chipFill(n); }); return byName['SB-VE'] === '#238bfa' && byName['CoF (SB-VE)'] === '#ff7210' && byName['OT-CFM'] === '#8b5cf6' && byName['CoF (OT-CFM)'] === '#ff7210'; })()", 'Method chips must carry each method\'s own theme colour, with CoF variants on the shared branch orange.');
			await check(page, "(() => { const badge = name => document.querySelector(`[data-bar-metric=PESQ] [data-bar-method=\"${name}\"] .cof-results-bar-badge`); const triangle = badge('SB-VE').querySelector('path[fill=\"#238bfa\"]') && badge('CoF (SB-VE)').querySelector('path[fill=\"#ff7210\"]'); const square = badge('OT-CFM').querySelector('rect[fill=\"#8b5cf6\"]') && badge('CoF (OT-CFM)').querySelector('rect[fill=\"#ff7210\"]'); const circle = badge('Unprocessed').querySelector('circle[fill=\"#64748b\"]'); const cofText = badge('CoF (SB-VE)').querySelector('text').textContent === 'Co' && badge('CoF (OT-CFM)').querySelector('text').textContent === 'Co'; return Boolean(triangle && square && circle && cofText); })()", 'Chips must use circle for references, triangle for the SB-VE family, square for the OT-CFM family, with CoF variants reading "Co".');
			await check(page, "[...document.querySelectorAll('.cof-results-bar-key li')].some(li => li.querySelector('span').textContent.trim() === 'Clean reference' && li.querySelector('.cof-results-method-chip circle')) && !document.querySelector('.cof-results-clean-reference') && document.querySelector('[data-bar-metric=WER] [data-bar-method=\"Clean reference\"]').getAttribute('aria-label').includes('Clean reference')", 'CoF WER is missing the clean reference legend entry or bar.');
			await check(page, "(() => { if (innerWidth <= 560) return true; const groups = [...document.querySelectorAll('.cof-results-bar-group')]; if (groups.length !== 5) return false; const offsets = groups.map(g => { const svg = g.querySelector('.cof-results-bars').getBoundingClientRect(); return svg.top - g.getBoundingClientRect().top; }); return Math.max(...offsets) - Math.min(...offsets) < 2; })()", 'CoF chart x-axes with their method badges are not horizontally aligned across the five plots.');
			// Keyboard focus reveals the in-chart method@NFE name once (real
			// Shift+Tab; programmatic focus fires no events in headless
			// Chromium), then hover moves it in place for every bar while the
			// other bars dim.
			await page.evaluate("document.querySelectorAll('[data-bar-metric=PESQ] [data-bar-method]')[1].focus(); true");
			await page.keyboard.press('Shift+Tab');
			await waitForExpr(page, "(() => { const name = document.querySelector('[data-bar-metric=PESQ] .cof-results-bar-name'); const dimmed = [...document.querySelectorAll('[data-bar-metric=PESQ] .cof-results-bar')].filter(n => n.getAttribute('opacity') === '0.35').length; return name?.textContent === 'Unprocessed' && dimmed === 6; })()", 'Keyboard focus never revealed the bar name with dimmed siblings.');
			const barNames = ['Unprocessed', 'SGMSE+@100', 'StoRM@100+1', 'SB-VE@16', 'CoF (SB-VE)@16', 'OT-CFM@16', 'CoF (OT-CFM)@16'];
			for (let methodIndex = 0; methodIndex < 7; methodIndex++) {
				await page.evaluate(`document.querySelectorAll('[data-bar-metric=PESQ] [data-bar-method]')[${methodIndex}].focus(); true`);
				const barPoint = await page.evaluate<{ x: number; y: number }>(`(() => { const rect = document.querySelectorAll('[data-bar-metric=PESQ] [data-bar-method] > rect:first-child')[${methodIndex}]; rect.scrollIntoView({block:'center',behavior:'instant'}); const r = rect.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2}; })()`);
				await page.mouse.move(barPoint.x, barPoint.y);
				await waitForExpr(page, `[...document.querySelectorAll('[data-bar-metric=PESQ] .cof-results-bar-name')].some(n => n.textContent === '${barNames[methodIndex]}')`, `Hovering bar ${methodIndex} never showed its method@NFE name.`);
			}
			// Hovering a legend entry focuses that method's bar in every chart.
			const legendItem = page.locator('.cof-results-bar-key li', { hasText: 'SGMSE+' });
			if ((await legendItem.count()) !== 1) throw new Error('SGMSE+ legend entry is not unique.');
			await legendItem.hover();
			await check(page, "[...document.querySelectorAll('[data-bar-metric]')].every(chart => { const bars = [...chart.querySelectorAll('[data-bar-method]')]; const active = bars.find(n => n.dataset.active !== undefined); return Boolean(active) && active.dataset.barMethod === 'SGMSE+' && bars.filter(n => n.getAttribute('opacity') === '0.35').length === bars.length - 1; })", 'Hovering a legend entry should focus its bar in every chart and dim the rest.');
			await page.hover('.cof-results-plot-header h3');
			await waitForExpr(page, "[...document.querySelectorAll('[data-bar-metric] [data-bar-method]')].every(n => n.dataset.active === undefined && n.getAttribute('opacity') !== '0.35')", 'Leaving the legend never cleared the bar focus.');
			// Hovering a variant pair focuses both bars in every chart.
			const pairLegendPoint = await page.evaluate<{ x: number; y: number }>("(() => { const li = document.querySelectorAll('.cof-results-bar-key li')[4]; li.scrollIntoView({ block: 'center', behavior: 'instant' }); const r = li.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()");
			await page.mouse.move(pairLegendPoint.x, pairLegendPoint.y);
			await check(page, "[...document.querySelectorAll('[data-bar-metric]')].every(chart => { const bars = [...chart.querySelectorAll('[data-bar-method]')]; const active = bars.filter(n => n.dataset.active !== undefined); return active.length === 2 && active[0].dataset.barMethod === 'SB-VE' && active[1].dataset.barMethod === 'CoF (SB-VE)' && bars.filter(n => n.getAttribute('opacity') === '0.35').length === bars.length - 2; })", 'Hovering a variant pair should focus both bars and dim the rest in every chart.');
			await page.hover('.cof-results-plot-header h3');
			await waitForExpr(page, "!document.querySelector('.cof-results-gain-arrow') && [...document.querySelectorAll('[data-bar-metric] [data-bar-method]')].every(n => n.dataset.active === undefined && n.getAttribute('opacity') !== '0.35')", 'Leaving the variant pair never cleared the focus.');
			if (process.env.SCREENSHOT_DIR) {
				await page.screenshot({ path: `${process.env.SCREENSHOT_DIR}/CoF-results-${width}x${height}.png` });
			}
		});
	}

	test('audio samples: lazy hydration, budget switch, methods and playback', async ({ page }) => {
		test.setTimeout(300_000);
		const requests = trackRequests(page);
		await page.goto('/CoF/');
		await waitForExpr(page, "!document.documentElement.classList.contains('is-loading')", 'CoF never finished loading.');
		await check(page, `(() => {
			const section = document.querySelector('#cof-audio-heading')?.closest('section');
			if (!section) return false;
			const groups = [...section.querySelectorAll('.audio-group')];
			const names = groups.map(group => group.querySelector('.dataset-title')?.textContent.trim());
			const counts = groups.map(group => group.querySelector('.dataset-count')?.textContent.trim());
			const chips = [...groups[0].querySelectorAll('.wave-compare .method-chip')].map(node => node.querySelector('.chip-label').textContent.trim() + '=' + node.style.getPropertyValue('--method-color'));
			const intro = section.querySelector('.cof-results-intro')?.textContent || '';
			return names.join('|') === 'WSJ0+WHAM|WSJ0+REVERB' && counts.join('|') === '5 samples|5 samples' &&
				chips.join('|') === 'Unprocessed=#64748b|Clean reference=#3a3a3c|SB-VE=#238bfa|CoF (SB-VE)=#ff7210|OT-CFM=#8b5cf6|CoF (OT-CFM)=#ff7210' &&
				intro.includes('1 NFE') && intro.includes('4 NFE');
		})()`, 'The audio section should use the Results chip names and colors for its methods and name both sampling budgets.');
		expect(requests.some(url => url.includes('AudioDemoIsland')), 'Audio island loaded before the section became visible.').toBe(false);
		expect(requests.some(url => url.endsWith('.opus')), 'Audio loaded before the section became visible.').toBe(false);

		await page.evaluate("document.querySelector('#cof-audio-heading')?.scrollIntoView({ block: 'center' }); true");
		await waitForRequest(requests, url => url.includes('AudioDemoIsland'), 'The audio island did not hydrate after scrolling.');
		await waitForRequest(requests, url => url.includes('waveform.worker'), 'The default waveform view did not load the waveform Worker.');
		await check(page, "(() => { const island = document.querySelector('.audio-demo-island'); const fields = [...document.querySelectorAll('.wave-compare .budget-toggle')]; const active = [...document.querySelectorAll('.wave-compare .budget-toggle .segmented-option.active')]; const fieldLabels = fields.map(node => node.querySelector('.segmented-field-label')?.textContent.trim()); const tracks = fields.map(node => getComputedStyle(node.querySelector('.segmented-toggle'))); return [...document.querySelectorAll('.audio-group')].every(group => group.dataset.budget === 'nfe4') && fields.length === 2 && fieldLabels.every(label => label === 'Sampling budget') && active.length === 2 && active.every(node => node.textContent.trim() === '4 NFE' && getComputedStyle(node).backgroundColor === 'rgba(0, 0, 0, 0)') && fields.every(field => { const thumb = field.querySelector('.segmented-thumb'); return thumb && getComputedStyle(thumb).backgroundColor === 'rgb(255, 255, 255)' && parseInt(thumb.style.width, 10) > 0 && getComputedStyle(thumb).transitionDuration !== '0s'; }) && tracks.every(track => track.borderRadius === '999px' && track.backgroundColor !== 'rgba(0, 0, 0, 0)'); })()", 'Each sample card should carry a segmented sampling-budget switch reading 4 NFE by default, scoped per dataset.');
		const initialOpus = [...new Set(requests.filter(url => url.endsWith('.opus')))];
		expect(initialOpus.length, 'Initial Opus request count').toBe(4);
		expect(initialOpus.every(url => url.startsWith('http') && /\/audio\/CoF\/nfe4\/(Measurement|Ground_Truth)\//.test(new URL(url).pathname)), 'An unselected method loaded during initial hydration.').toBe(true);
		expect(requests.some(url => url.endsWith('.wav')), 'A WAV file was requested without a download action.').toBe(false);
		await check(page, "(() => { const card = document.querySelector('.wave-compare'); const sample = card.querySelector('.wave-desc-value')?.textContent || ''; const meta = [...card.querySelectorAll('.wave-desc-value')].map(n => n.textContent); return /_(snr|t60)=/.test(sample) && meta.some(value => / dB$/.test(value) || / s$/.test(value)); })()", 'CoF sample names should embed the mixture tag and surface it as the SNR/T60 chip.');

		await page.locator('.wave-compare').first().locator('.method-chip', { hasText: 'CoF (SB-VE)' }).click();
		await waitForExpr(page, "(() => { const audio = document.querySelector('.wave-audio'); return audio && !audio.paused && audio.currentSrc.startsWith('blob:'); })()",
			'Selecting a CoF method did not start the cached Opus audio.', 20_000);
		const afterSelection = [...new Set(requests.filter(url => url.endsWith('.opus')))];
		expect(afterSelection.filter(url => url.includes('/nfe4/SB-VE_cof/')).length, 'On-demand SB-VE_cof request count').toBe(1);
		await check(page, "(() => { const download = document.querySelector('.wave-compare .wave-download'); const meta = document.querySelector('.wave-compare .wave-desc-value'); return decodeURIComponent(new URL(download.href).pathname) === `/audio/CoF/nfe4/SB-VE_cof/${meta.textContent}` && download.hasAttribute('download'); })()", 'The download link should point at the direct WAV under /audio/CoF/nfe4/SB-VE_cof/.');

		await page.locator('.wave-compare').first().locator('.view-toggle-btn', { hasText: 'Spectrogram' }).click();
		await waitForRequest(requests, url => url.endsWith('.spectrogram.avif'), 'The spectrogram view did not load its pre-generated AVIF resources.');
		await waitForExpr(page, "(() => { const images = [...document.querySelectorAll('.spectrogram-canvas')]; return images.length === 2 && images.every(img => img.complete && img.naturalWidth > 0); })()", 'The spectrogram view should show both static AVIF spectrograms.', 20_000);
		await check(page, "(() => { const images = [...document.querySelectorAll('.spectrogram-canvas')]; return images.length === 2 && images.every(img => img.src.includes('/audio/CoF/nfe4/')); })()", 'The spectrogram view should show the static AVIF pair from /audio/CoF/nfe4/.');

		await page.locator('.budget-toggle').first().locator('.segmented-option', { hasText: '1 NFE' }).click();
		await waitForExpr(page, "document.querySelectorAll('.audio-group')[0].dataset.budget === 'nfe1' && document.querySelectorAll('.audio-group')[1].dataset.budget === 'nfe4'", 'The WHAM budget toggle never selected 1 NFE (or REVERB drifted with it).');
		await waitForExpr(page, "performance.getEntriesByType('resource').filter(entry => /\\/audio\\/CoF\\/nfe1\\/.+\\.opus$/.test(entry.name)).length >= 3", 'Switching WHAM to 1 NFE never loaded its Measurement/Ground Truth audio.', 20_000);
		await check(page, "(() => { const groups = [...document.querySelectorAll('.audio-group')]; const active = [...document.querySelectorAll('.wave-compare .budget-toggle .segmented-option.active')]; const states = groups.map(group => ({ budget: group.dataset.budget, chip: group.querySelector('.method-chip.active')?.textContent.trim(), spec: Boolean(group.querySelector('.spectrogram-block')) })); return active.length === 2 && active[0].textContent.trim() === '1 NFE' && active[1].textContent.trim() === '4 NFE' && states[0].budget === 'nfe1' && states[0].chip === 'CoF (SB-VE)' && states[0].spec && states[1].budget === 'nfe4' && states[1].chip === 'Unprocessed' && states[1].spec === false; })()", 'Switching budgets must stay scoped to one dataset: WHAM fades onto 1 NFE keeping its selection while REVERB remains untouched on 4 NFE.');
		const nfe1Opus = [...new Set(requests.filter(url => /\/audio\/CoF\/nfe1\/.+\.opus$/.test(url)))];
		expect(nfe1Opus.length, '1 NFE soft-swap Opus request count').toBe(3);
		await page.locator('.wave-compare').first().locator('.method-chip', { hasText: 'CoF (OT-CFM)' }).click();
		await waitForExpr(page, "(() => { const audio = document.querySelector('.wave-audio'); return audio && !audio.paused && audio.currentSrc.startsWith('blob:'); })()",
			'Selecting a 1 NFE method did not start the cached Opus audio.', 20_000);
		await check(page, "(() => { const download = document.querySelector('.wave-compare .wave-download'); const meta = document.querySelector('.wave-compare .wave-desc-value'); return decodeURIComponent(new URL(download.href).pathname) === `/audio/CoF/nfe1/OT-CFM_cof/${meta.textContent}`; })()", 'The 1 NFE download link should point under /audio/CoF/nfe1/OT-CFM_cof/.');
	});

	test('CoF CSV download is available', async ({ page }) => {
		expect((await page.request.get('/CoF/results.csv')).ok(), 'CoF CSV download is unavailable.').toBe(true);
	});
});
