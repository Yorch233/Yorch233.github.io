import UiIcon from './UiIcon.jsx';
import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { results, datasets, metrics, budgets, series, baselineStyles, metricUnit, formatMetric, benchmarkRows } from '../../lib/cof-results.js';
import DiscreteSlider from './DiscreteSlider.jsx';

const budgetSliderOptions = budgets.map(value => ({ value, label: String(value) }));

function useChartWidth() {
	const ref = useRef(null);
	const [width, setWidth] = useState(520);
	useEffect(() => {
		const observer = new ResizeObserver(([entry]) => setWidth(Math.max(200, Math.round(entry.contentRect.width))));
		if (ref.current) observer.observe(ref.current);
		return () => observer.disconnect();
	}, []);
	return [ref, width];
}

const chipMonograms = { Unprocessed: 'Un', 'SGMSE+': 'SG', StoRM: 'St', 'Clean reference': 'Cl' };

// NFE changes keep the charts mounted and FLIP each bar from its previous
// geometry, so values re-settle in place without the whole chart fading.
const barGeometryKey = bar => {
	const chart = bar.closest('[data-bar-metric]');
	return `${chart?.dataset.barMetric}|${bar.dataset.barMethod}`;
};

function readBarGeometry(root) {
	const map = new Map();
	root?.querySelectorAll('.cof-results-bars .cof-results-bar').forEach(bar => {
		const rect = bar.querySelector(':scope > rect');
		if (!rect) return;
		const style = getComputedStyle(rect);
		const y = parseFloat(style.y);
		const height = parseFloat(style.height);
		map.set(barGeometryKey(bar), {
			y: Number.isFinite(y) ? y : Number(rect.getAttribute('y')),
			height: Number.isFinite(height) ? height : Number(rect.getAttribute('height')),
			valueTop: bar.querySelector('.cof-results-value')?.getBoundingClientRect().top,
			badgeTop: bar.querySelector('.cof-results-bar-badge')?.getBoundingClientRect().top,
			nameTop: bar.querySelector('.cof-results-bar-name')?.getBoundingClientRect().top
		});
	});
	return map;
}

function morphBars(root, previous) {
	const options = { duration: 340, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' };
	root?.querySelectorAll('.cof-results-bars .cof-results-bar').forEach(bar => {
		const old = previous.get(barGeometryKey(bar));
		const rect = bar.querySelector(':scope > rect');
		if (!old || !rect) return;
		const y = Number(rect.getAttribute('y'));
		const height = Number(rect.getAttribute('height'));
		if (old.y !== y || old.height !== height) {
			rect.animate([{ y: `${old.y}px`, height: `${old.height}px` }, { y: `${y}px`, height: `${height}px` }], options);
		}
		const shift = (selector, oldTop) => {
			const element = bar.querySelector(selector);
			if (!element || !Number.isFinite(oldTop)) return;
			const dy = oldTop - element.getBoundingClientRect().top;
			if (Math.abs(dy) < .5) return;
			element.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], options);
		};
		shift('.cof-results-value', old.valueTop);
		shift('.cof-results-bar-badge', old.badgeTop);
		shift('.cof-results-bar-name', old.nameTop);
	});
}

// Method chip: a shaped badge in the method's own theme colour with its
// two-letter monogram inside. SB-VE renders as a triangle, OT-CFM as a
// square, every other method as a circle. A post-trained CoF variant keeps
// the base shape and theme colour and switches the letters to "Co".
function ChipShape({ item }) {
	const cof = Boolean(item.dashed);
	const shape = item.chipShape ?? 'circle';
	const monogram = cof ? 'Co' : item.monogram ?? chipMonograms[item.label] ?? item.label.slice(0, 2);
	const fill = item.theme ?? item.color;
	const label = (y, size) => <text x="11" y={y} text-anchor="middle" dominant-baseline="central" font-size={size} font-weight="700" fill="#fff">{monogram}</text>;
	if (shape === 'triangle') return <>
		<circle cx="11" cy="11" r="10.5" fill="#fff" />
		<path d="M 11 2.6 L 19.9 18.4 L 2.1 18.4 Z" fill={fill} />
		{label(14.4, 7.2)}
	</>;
	if (shape === 'square') return <>
		<circle cx="11" cy="11" r="10.5" fill="#fff" />
		<rect x="3.4" y="3.4" width="15.2" height="15.2" rx="3.4" fill={fill} />
		{label(11, 8)}
	</>;
	return <>
		<circle cx="11" cy="11" r="10.5" fill="#fff" />
		<circle cx="11" cy="11" r="8.6" fill={fill} />
		{label(11, 8)}
	</>;
}

function MethodChip({ item }) {
	return <svg class="cof-results-method-chip" viewBox="0 0 22 22" aria-hidden="true" focusable="false"><ChipShape item={item} /></svg>;
}

function CurveChart({ dataset, metric, activeLabel, onActiveLabel }) {
	const [ref, width] = useChartWidth();
	// Hover/focus tooltip for one data point: method, sampling budget and
	// metric value. The svg's viewBox tracks its CSS size, so point
	// coordinates double as wrapper-relative pixel offsets.
	const [tooltip, setTooltip] = useState(null);
	useEffect(() => setTooltip(null), [dataset, metric]);
	const height = Math.max(320, Math.min(480, width * .48));
	const plot = { left: width < 480 ? 42 : 64, right: width - 24, top: 32, bottom: height - 52 };
	const references = [
		{ label: 'Unprocessed', color: '#a9afb8', marker: 'cross', value: results.unprocessed[dataset][metric], budget: 'No processing', annotationBudget: '', dash: '5 4' },
		...baselineStyles.map(item => ({ ...item, label: item.short, value: results.baselines[dataset][item.label][metric], budget: `NFE ${item.budget}`, annotationBudget: item.budget })),
		...(metric === 'WER' ? [{ label: 'Clean reference', color: '#a9afb8', marker: 'ring', value: results.clean[dataset].WER, budget: 'Clean speech' }] : [])
	];
	const referenceLines = references.filter(item => ['Unprocessed', 'SGMSE+', 'StoRM'].includes(item.label));
	const values = series.flatMap(item => results.curves[dataset][metric][item.key].map(point => point[1]));
	const min = Math.min(...values), max = Math.max(...values);
	const margin = (max - min) * .12 || .1;
	const low = min - margin, high = max + margin;
	const x = value => plot.left + (value - 1) / 23 * (plot.right - plot.left);
	const y = value => plot.bottom - (value - low) / (high - low) * (plot.bottom - plot.top);
	const beyondRange = value => value < low ? 'below' : value > high ? 'above' : null;
	const yClamped = value => Math.min(plot.bottom, Math.max(plot.top, y(value)));
	const referenceAnnotations = referenceLines.map(item => ({ ...item, beyond: beyondRange(item.value), labelY: yClamped(item.value) })).sort((a, b) => a.labelY - b.labelY);
	for (let i = 1; i < referenceAnnotations.length; i++) referenceAnnotations[i].labelY = Math.max(referenceAnnotations[i].labelY, referenceAnnotations[i - 1].labelY + 14);
	const referenceOvershoot = Math.max(0, referenceAnnotations.at(-1).labelY - (plot.bottom - 7));
	referenceAnnotations.forEach(item => { item.labelY -= referenceOvershoot; });
	const referenceUndershoot = Math.max(0, plot.top + 7 - referenceAnnotations[0].labelY);
	referenceAnnotations.forEach(item => { item.labelY += referenceUndershoot; });
	return <div class="cof-results-curve-wrap">
		<svg ref={ref} class="cof-results-svg" viewBox={`0 0 ${width} ${height}`} role="group" aria-label={`${dataset}: ${metric} versus NFE, vertical axis zoomed to the model curves; references beyond the range clamp to the plot edge`}>
			{[0, 1, 2, 3, 4].map(i => {
				const level = low + (high - low) * i / 4;
				return <g key={i}><line x1={plot.left} x2={plot.right} y1={y(level)} y2={y(level)} class="cof-results-gridline" /><text x={plot.left - 9} y={y(level) + 4} text-anchor="end">{formatMetric(metric, level)}</text></g>;
			})}
			{budgets.map(budget => <line key={budget} x1={x(budget)} x2={x(budget)} y1={plot.top} y2={plot.bottom} class="cof-results-gridline" />)}
			<text class="cof-results-axis-title" x={plot.left} y="16">{metric}{metricUnit(metric) && ` (${metricUnit(metric)})`} {metric === 'WER' ? '↓' : '↑'}</text>
			{referenceLines.map(item => {
				const beyond = beyondRange(item.value);
				const yRef = yClamped(item.value);
				const budgetNote = item.annotationBudget ? `, budget ${item.annotationBudget}` : '';
				const shortBudget = item.annotationBudget ? `@${item.annotationBudget}` : '';
				const refActive = activeLabel === item.label;
				const refDimmed = activeLabel !== null && !refActive;
				return <g key={item.label} class="cof-results-reference-line" data-reference-name={item.label} data-reference-budget={item.annotationBudget} data-reference-value={item.value} data-beyond={beyond || undefined} style={{ opacity: refDimmed ? .3 : 1 }} role="img" aria-label={`${item.label} reference${budgetNote}: ${formatMetric(metric, item.value)}${metricUnit(metric) && ` ${metricUnit(metric)}`}${beyond ? ', beyond the displayed vertical range' : ''}`}>
					<title>{item.label}{shortBudget} · {formatMetric(metric, item.value)}{metricUnit(metric) && ` ${metricUnit(metric)}`}{beyond ? ` · beyond range (${beyond})` : ''}</title>
					<line x1={plot.left} x2={plot.right} y1={yRef} y2={yRef} stroke={item.color} stroke-width={refActive ? 2.25 : 1.5} stroke-dasharray={item.dash} />
				</g>;
			})}
			{series.map(item => {
				const seriesActive = activeLabel === item.label;
				const seriesDimmed = activeLabel !== null && !seriesActive;
				// Data points reuse the legend chips: each mark is the method's
				// own shaped monogram badge, so the chart maps to the legend
				// without a separate marker vocabulary.
				const chipSize = width < 480 ? 12 : 17;
				return <g key={item.key} class="cof-results-curve-series" data-series-name={item.label} style={{ opacity: seriesDimmed ? .3 : 1 }}>
					<path d={results.curves[dataset][metric][item.key].map(([budget, value], i) => `${i ? 'L' : 'M'} ${x(budget)} ${y(value)}`).join(' ')} fill="none" stroke={item.color} stroke-width={seriesActive ? 3 : 2} stroke-dasharray={item.dashed ? '6 4' : undefined} />
					{results.curves[dataset][metric][item.key].map(([budget, value]) => {
						// The inspected point renders a larger chip, recentered on
						// the data point; scaling by attributes (not CSS transform)
						// keeps the chip centered in every engine.
						const inspected = tooltip !== null && tooltip.item.key === item.key && tooltip.budget === budget;
						const size = inspected ? chipSize * 1.3 : chipSize;
						return <g key={budget} class="cof-results-point" data-nfe={budget} tabindex="0" role="img" aria-label={`${item.label}, NFE ${budget}: ${formatMetric(metric, value)} ${metricUnit(metric)}`}
							onPointerEnter={() => { onActiveLabel(item.label); setTooltip({ item, budget, value, px: x(budget), py: y(value) }); }} onPointerLeave={() => { onActiveLabel(null); setTooltip(null); }} onFocus={() => { onActiveLabel(item.label); setTooltip({ item, budget, value, px: x(budget), py: y(value) }); }} onBlur={() => { onActiveLabel(null); setTooltip(null); }}
							>
							<circle cx={x(budget)} cy={y(value)} r="11" fill="transparent" />
							<svg class="cof-results-point-chip" x={x(budget) - size / 2} y={y(value) - size / 2} width={size} height={size} viewBox="0 0 22 22" aria-hidden="true" pointer-events="none"><ChipShape item={item} /></svg>
						</g>;
					})}
				</g>;
			})}
			{referenceAnnotations.map(item => <text key={item.label} class="cof-results-reference-label" data-reference-name={item.label} x={plot.right - 5} y={item.labelY} text-anchor="end" dominant-baseline="middle" style={{ opacity: activeLabel !== null && activeLabel !== item.label ? .3 : 1 }}>{item.label}{item.annotationBudget ? `@${item.annotationBudget}` : ''}{item.beyond === 'below' ? ' ↓' : item.beyond === 'above' ? ' ↑' : ''}</text>)}
			{(width >= 480 ? budgets : [1, 4, 8, 16, 24]).map(budget => <text key={budget} x={x(budget)} y={plot.bottom + 22} text-anchor="middle">{budget}</text>)}
			<text x={(plot.left + plot.right) / 2} y={height - 6} text-anchor="middle">NFE</text>
		</svg>
		{tooltip && <div class="cof-results-point-tooltip" data-flip={tooltip.py < 110 || undefined} aria-hidden="true" style={{ left: `${Math.min(Math.max(tooltip.px, 84), width - 84)}px`, top: `${tooltip.py}px` }}>
			<span class="cof-results-point-tooltip-method"><MethodChip item={tooltip.item} />{tooltip.item.label}</span>
			<span>NFE {tooltip.budget}</span>
			<span>{metric}{metricUnit(metric) && ` (${metricUnit(metric)})`}: <strong>{formatMetric(metric, tooltip.value)}</strong></span>
		</div>}
	</div>;
}

function Bars({ dataset, metric, nfe, activeLabel, onActiveLabel }) {
	const [ref, width] = useChartWidth();
	const rows = benchmarkRows(dataset, metric, nfe);
	const values = rows.map(row => row.value);
	const minValue = Math.min(...values);
	const maxValue = Math.max(...values);
	const rawRange = maxValue - minValue;
	const padding = rawRange ? rawRange * .2 : Math.max(Math.abs(maxValue) * .08, .1);
	const includesZero = minValue <= 0;
	const low = includesZero ? Math.min(0, minValue - padding) : Math.max(0, minValue - padding);
	const high = includesZero ? Math.max(0, maxValue + padding) : maxValue + padding;
	const y = value => 216 - (value - low) / (high - low) * 188;
	const baseline = includesZero ? 0 : low;
	const plotLeft = 34;
	const step = (width - plotLeft - 4) / rows.length;
	const barWidth = step * .7;
	// Hovering a base variant or its CoF pair focuses both bars; other
	// methods keep the single-bar focus.
	const cofPairs = { 'SB-VE': ['SB-VE', 'CoF (SB-VE)'], 'CoF (SB-VE)': ['SB-VE', 'CoF (SB-VE)'], 'OT-CFM': ['OT-CFM', 'CoF (OT-CFM)'], 'CoF (OT-CFM)': ['OT-CFM', 'CoF (OT-CFM)'] };
	const focusLabels = activeLabel !== null ? (cofPairs[activeLabel] ?? [activeLabel]) : null;
	const chartHasActive = focusLabels !== null && rows.some(candidate => focusLabels.includes(candidate.label));
	const bestValue = formatMetric(metric, (metric === 'WER' ? Math.min : Math.max)(...rows.filter(row => row.label !== 'Unprocessed' && !row.reference).map(row => row.value)));
	// Large enough that the white two-letter monogram inside the chip stays
	// legible at 1:1 (the chip's 22-unit viewBox maps to this pixel size).
	const badge = width < 280 ? 18 : 22;
	return <div class="cof-results-bar-chart"><svg ref={ref} class="cof-results-svg cof-results-bars" data-bar-metric={metric} viewBox={`0 0 ${width} 232`} role="group" aria-label={`${dataset}: ${metric} benchmark comparison at NFE ${nfe}. Positive-only scales are truncated and marked; zero remains visible when values cross it. Reference methods use their reported budgets.`}>
		{[0, 1, 2, 3, 4].map(i => {
			const level = low + (high - low) * i / 4;
			return <g key={i}><line x1={plotLeft} x2={width - 4} y1={y(level)} y2={y(level)} class="cof-results-gridline" /><text x={plotLeft - 6} y={y(level) + 4} text-anchor="end" class="cof-results-axis-label">{formatMetric(metric, level)}</text></g>;
		})}
		<line x1={plotLeft} x2={width - 4} y1={y(baseline)} y2={y(baseline)} class={includesZero ? 'cof-results-zero' : 'cof-results-truncated-base'} />
		{includesZero && low < 0 && <text x={plotLeft - 6} y={y(0) - 6} text-anchor="end" class="cof-results-zero-label">0</text>}
		{!includesZero && <path d={`M ${plotLeft - 3} ${y(low) - 7} l 5 3 l -5 3 l 5 3`} class="cof-results-axis-break" aria-hidden="true" />}
		{rows.map((row, i) => {
			const center = plotLeft + step * (i + .5);
			const barTop = Math.min(y(baseline), y(row.value));
			const barHeight = Math.abs(y(row.value) - y(baseline));
			// Values always sit outside above the bar in ink; the method chip
			// lives at the bar's inner top edge when the bar can hold it,
			// otherwise it stacks under the value just above the bar.
			const chipInside = barHeight >= badge + 16;
			const badgeY = chipInside ? barTop + 7 + badge / 2 : barTop - 9 - badge / 2;
			const valueY = chipInside ? barTop - 9 : barTop - 12 - badge - 7;
			const active = focusLabels !== null && focusLabels.includes(row.label);
			const dimmed = chartHasActive && !active;
			const best = !row.reference && row.label !== 'Unprocessed' && formatMetric(metric, row.value) === bestValue;
			const nameY = valueY - 15;
			const nameSuffix = row.budget && row.budget !== '—' ? `@${row.budget}` : '';
			return <g key={row.label} class="cof-results-bar" data-bar-method={row.label} data-bar-value={formatMetric(metric, row.value)} data-monogram={row.monogram ?? chipMonograms[row.label] ?? row.label.slice(0, 2)} data-cof={row.dashed || undefined} data-active={active || undefined} opacity={dimmed ? .35 : 1} tabindex="0" role="img" aria-label={`${row.label} · ${row.label === 'Unprocessed' ? 'No processing' : row.budget ? `NFE ${row.budget}` : 'reference'} · ${metric}: ${formatMetric(metric, row.value)} ${metricUnit(metric)}`}
				onPointerEnter={() => onActiveLabel(row.label)} onPointerLeave={() => onActiveLabel(null)} onFocus={() => onActiveLabel(row.label)} onBlur={() => onActiveLabel(null)} onKeyDown={event => { if (event.key === 'Escape') onActiveLabel(null); }}>
			<rect x={center - barWidth / 2} y={barTop} width={barWidth} height={barHeight} rx="3" fill={row.reference ? '#fff' : row.barColor ?? row.color} stroke={row.reference ? '#98a2b0' : undefined} stroke-width={row.reference ? 1.25 : undefined} stroke-dasharray={row.reference ? '4 3' : undefined} />
			<text x={center} y={valueY} text-anchor="middle" class={`cof-results-value${row.dashed ? ' cof-results-highlight' : ''}${best ? ' cof-results-best' : ''}`} style={{ fontSize: width < 280 ? '10px' : '12px' }}>{formatMetric(metric, row.value)}</text>
			<svg class="cof-results-bar-badge" x={center - badge / 2} y={badgeY - badge / 2} width={badge} height={badge} viewBox="0 0 22 22" aria-hidden="true" pointer-events="none"><ChipShape item={row} /></svg>
			{active && <text class="cof-results-bar-name" x={center} y={nameY} text-anchor="middle">{row.label}{nameSuffix && <tspan class="cof-results-bar-name-nfe">{nameSuffix}</tspan>}</text>}
			<title>{row.label}, NFE {row.budget}: {formatMetric(metric, row.value)} {metricUnit(metric)}</title>
		</g>;
		})}
	</svg>
	</div>;
}

const metricDescriptions = {
	PESQ: 'Perceived quality vs. clean speech. Higher is better.',
	ESTOI: 'Intelligibility vs. clean speech. Higher is better.',
	'SI-SDR': 'Signal fidelity vs. clean speech in dB. Higher is better.',
	UTMOS: 'Predicted quality without a reference. Higher is better.',
	WER: 'Word errors vs. reference transcript. Lower is better.'
};

function MetricHint({ name }) {
	const id = `cof-metric-help-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
	const [open, setOpen] = useState(false);
	return <div class="cof-results-metric-selector" data-tooltip-open={open || undefined} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
		<span class="cof-results-metric-label" tabindex="0" aria-describedby={id} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>{name}{metricUnit(name) && ` (${metricUnit(name)})`} <span aria-hidden="true">{name === 'WER' ? '↓' : '↑'}</span></span>
		<span id={id} class="cof-results-metric-tooltip" role="tooltip">{metricDescriptions[name]}</span>
	</div>;
}

function MetricSelector({ name, selected, onSelect }) {
	const id = `cof-metric-help-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
	const [open, setOpen] = useState(false);
	return <div class="cof-results-metric-selector" data-tooltip-open={open || undefined} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
		<button type="button" class="cof-results-metric-option" aria-pressed={selected} aria-label={`Select ${name}${metricUnit(name) ? ` (${metricUnit(name)})` : ''} metric`} aria-describedby={id} onClick={onSelect} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}>{name}{metricUnit(name) && ` (${metricUnit(name)})`} <span aria-hidden="true">{name === 'WER' ? '↓' : '↑'}</span></button>
		<span id={id} class="cof-results-metric-tooltip" role="tooltip">{metricDescriptions[name]}</span>
	</div>;
}

export default function CoFResults() {
	const [dataset, setDataset] = useState(datasets[0]);
	const [metric, setMetric] = useState(metrics[0]);
	const [nfe, setNfe] = useState(4);
	const [view, setView] = useState('bars');
	const [budgetOpen, setBudgetOpen] = useState(false);
	// Method highlighted through the legend or any bar; shared across the
	// five Chart-view plots so one hover focuses the method everywhere.
	const [activeMethod, setActiveMethod] = useState(null);
	const [shown, setShown] = useState({ dataset, metric, nfe, view });
	const shownRef = useRef(shown);
	// NFE-only changes update immediately and morph the bars; everything else
	// keeps the fade-out/swap/fade-in transition.
	const fading = shown.dataset !== dataset || shown.metric !== metric || shown.view !== view;
	const switchingView = shown.view !== view;
	const [settling, setSettling] = useState(false);
	const [viewSettling, setViewSettling] = useState(false);
	const flipRef = useRef(null);
	const workspaceRef = useRef(null);
	const budgetControlRef = useRef(null);
	const budgetTriggerRef = useRef(null);
	// Lock the whole Benchmark-comparison card at its current height before a
	// control mutates the layout, so the later content swap eases the card to
	// its new height instead of snapping.
	const lockCard = () => {
		const card = workspaceRef.current;
		if (!card || card.style.height || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
		card.style.height = `${card.offsetHeight}px`;
		setSettling(true);
	};
	useEffect(() => {
		setActiveMethod(null);
	}, [view]);
	useEffect(() => {
		const next = { dataset, metric, nfe, view };
		const cur = shownRef.current;
		const unchanged = cur.dataset === next.dataset && cur.metric === next.metric && cur.nfe === next.nfe && cur.view === next.view;
		if (unchanged || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			if (!unchanged) {
				shownRef.current = next;
				setShown(next);
				setSettling(false);
				setViewSettling(false);
			}
			return;
		}
		const nfeOnly = cur.dataset === next.dataset && cur.metric === next.metric && cur.view === next.view && cur.nfe !== next.nfe;
		if (nfeOnly) {
			flipRef.current = readBarGeometry(workspaceRef.current);
			shownRef.current = next;
			setShown(next);
			setSettling(false);
			setViewSettling(false);
			return;
		}
		const viewChange = cur.view !== next.view;
		setViewSettling(viewChange);
		const timers = [];
		// Swap only after the fade-out has fully finished (200ms transition,
		// 230ms swap timer), then fade the new charts in while the card eases
		// from its locked height to the new natural height (read through a
		// momentary auto measure that never paints).
		timers.push(setTimeout(() => {
			shownRef.current = next;
			setShown(next);
			const card = workspaceRef.current;
			if (!card) return;
			// Read the new natural height without painting and without the auto
			// detour triggering its own transition. Charts refine their size for
			// a few frames after mounting (ResizeObserver viewBox pass), so the
			// read is polled until it holds steady before easing the card.
			let natural = 0;
			let last = -1;
			let stable = 0;
			let checks = 0;
			const step = () => {
				const locked = card.style.height;
				card.style.transition = 'none';
				card.style.height = 'auto';
				natural = card.offsetHeight;
				card.style.height = locked;
				card.style.transition = '';
				if (natural > 0 && natural === last) stable += 1;
				else stable = 0;
				last = natural;
				if (stable >= 2 || checks > 14) {
					requestAnimationFrame(() => {
						card.style.height = `${natural}px`;
						timers.push(setTimeout(() => {
							card.style.height = '';
							setSettling(false);
							setViewSettling(false);
						}, 380));
					});
					return;
				}
				checks += 1;
				timers.push(setTimeout(step, 45));
			};
			step();
		}, 230));
		return () => timers.forEach(timer => clearTimeout(timer));
	}, [dataset, metric, nfe, view]);
	useLayoutEffect(() => {
		const previous = flipRef.current;
		if (!previous) return;
		flipRef.current = null;
		morphBars(workspaceRef.current, previous);
	}, [shown]);
	useEffect(() => {
		const closeOnOutsidePointer = event => {
			if (budgetTriggerRef.current?.getAttribute('aria-expanded') === 'true' && !budgetControlRef.current?.contains(event.target)) setBudgetOpen(false);
		};
		const closeOnEscape = event => {
			if (event.key !== 'Escape' || budgetTriggerRef.current?.getAttribute('aria-expanded') !== 'true') return;
			setBudgetOpen(false);
			budgetTriggerRef.current?.focus();
		};
		document.addEventListener('pointerdown', closeOnOutsidePointer);
		document.addEventListener('keydown', closeOnEscape);
		return () => {
			document.removeEventListener('pointerdown', closeOnOutsidePointer);
			document.removeEventListener('keydown', closeOnEscape);
		};
	}, []);
	return <div class="cof-results" data-dataset={dataset} data-metric={metric} data-nfe={nfe} data-view={view}>
		<div ref={workspaceRef} class={`cof-results-workspace${settling ? ' cof-results-resizing' : ''}`} data-view-change={viewSettling ? 'true' : undefined}>
		<div class="cof-results-plot-header">
			<div><h3 id={view === 'bars' ? 'cof-bars-heading' : 'cof-curves-heading'}>Benchmark comparison</h3></div>
			<div class={`cof-results-controls${fading ? ' cof-results-fading' : ''}`} data-view={shown.view} role="group" aria-label={view === 'bars' ? 'Results filters and sampling budget' : 'Results filters'}>
				<div class="cof-results-filter-panel" role="group" aria-label={view === 'bars' ? 'Dataset, view, and sampling budget' : 'Dataset and view'}>
					<div class="cof-results-filter-rows" data-view={shown.view}>
						<div class="cof-results-filter-row" role="group" aria-label="Results dataset">
							<span class="cof-results-option-label">Dataset</span>
							<div class="cof-results-filter-options cof-results-dataset-options" role="group" aria-label="Results dataset">
								<button type="button" class={`cof-results-filter-choice method-chip method-chip-secondary${dataset === datasets[0] ? ' active' : ''}`} aria-pressed={dataset === datasets[0]} aria-label="WSJ0+WHAM · Denoising" title="WSJ0+WHAM · Denoising" onClick={() => { lockCard(); setDataset(datasets[0]); }}><UiIcon id="denoising" tone={dataset === datasets[0] ? 'inverse' : undefined} /><span>WSJ0+WHAM</span></button>
								<button type="button" class={`cof-results-filter-choice method-chip method-chip-secondary${dataset === datasets[1] ? ' active' : ''}`} aria-pressed={dataset === datasets[1]} aria-label="WSJ0+REVERB · Dereverberation" title="WSJ0+REVERB · Dereverberation" onClick={() => { lockCard(); setDataset(datasets[1]); }}><UiIcon id="dereverberation" tone={dataset === datasets[1] ? 'inverse' : undefined} /><span>WSJ0+REVERB</span></button>
							</div>
						</div>
						<div class="cof-results-filter-row" role="group" aria-label="Chart view">
							<span class="cof-results-option-label">View</span>
							<div class="cof-results-filter-options cof-results-view-options" role="group" aria-label="Chart view">
								<button type="button" class="cof-results-filter-choice" aria-pressed={view === 'bars'} onClick={() => { lockCard(); setView('bars'); }}><UiIcon id="bar-chart" tone={view === 'bars' ? 'inverse' : undefined} /><span>Chart</span></button>
								<button type="button" class="cof-results-filter-choice" aria-pressed={view === 'curves'} onClick={() => { lockCard(); setView('curves'); setBudgetOpen(false); }}><UiIcon id="line-chart" tone={view === 'curves' ? 'inverse' : undefined} /><span>Curves</span></button>
							</div>
						</div>
						{shown.view === 'bars' && <div class={`cof-results-nfe-control${switchingView ? ' cof-results-fading' : ''}`} ref={budgetControlRef}>
							<span class="cof-results-option-label">Sampling</span>
							<button
								ref={budgetTriggerRef}
								type="button"
								class="cof-results-budget-trigger"
								aria-label={`Sampling, current value ${nfe} NFE`}
								aria-haspopup="dialog"
								aria-expanded={budgetOpen}
								aria-controls="cof-results-budget-popover"
								onClick={() => setBudgetOpen(open => !open)}
							>
								<strong>{nfe} NFE</strong>
								<UiIcon id="arrow-down" tone={budgetOpen ? 'inverse' : undefined} class="cof-results-budget-chevron" />
							</button>
								<div id="cof-results-budget-popover" class="cof-results-budget-popover" role="dialog" aria-label="Choose sampling budget (NFE)" hidden={!budgetOpen}>
									<DiscreteSlider
										id="cof-results-budget-slider"
										class="cof-results-budget-slider"
										options={budgetSliderOptions}
										value={nfe}
										onChange={setNfe}
										ariaLabel="NFE"
										formatValue={value => `${value} NFE`}
										caption="NFE"
										celebrateMax
									/>
								</div>
							</div>}
						</div>
					</div>
				{shown.view === 'curves' && <div class={`cof-results-explorer-controls${fading ? ' cof-results-fading' : ''}`}>
					<div class="cof-results-metric-control" role="group" aria-label="Results metric"><span class="cof-results-option-label">Metric</span>{metrics.map(name => <MetricSelector key={name} name={name} selected={metric === name} onSelect={() => { lockCard(); setMetric(name); }} />)}</div>
				</div>}
			</div>
		</div>
		<div class={`cof-results-charts${fading ? ' cof-results-fading' : ''}`} id="cof-results-chart">
			{shown.view === 'bars' ? <section key="bars" class="cof-results-panel cof-results-bar-panel" aria-labelledby="cof-bars-heading">
				<div class="cof-results-legend-groups">
					<ul class="cof-results-bar-key">{[...benchmarkRows(shown.dataset, metrics[0], shown.nfe).slice(0, 1), { label: 'Clean reference', budget: '', reference: true, color: '#a9afb8', theme: '#a9afb8', marker: 'ring' }, ...benchmarkRows(shown.dataset, metrics[0], shown.nfe).slice(1)].map(row => {
						const suffix = row.budget === '—' || row.budget === '' ? '' : `@${row.budget}`;
						return <li key={row.label} tabIndex="0" onMouseEnter={() => setActiveMethod(row.label)} onMouseLeave={() => setActiveMethod(null)} onFocus={() => setActiveMethod(row.label)} onBlur={() => setActiveMethod(null)}><MethodChip item={row} /><span>{row.label}{suffix && <span class="cof-results-key-budget">{suffix}</span>}</span></li>;
					})}</ul>
				</div>
					<div class="cof-results-bar-grid">{metrics.map(name => <div class="cof-results-bar-group" key={name}>
						<Bars dataset={shown.dataset} metric={name} nfe={shown.nfe} activeLabel={activeMethod} onActiveLabel={setActiveMethod} />
						<MetricHint name={name} />
					</div>)}</div>
			</section> : <section key="curves" class="cof-results-panel cof-results-curve-panel" aria-labelledby="cof-curves-heading">
				<div class="cof-results-legend-groups">
					<ul class="cof-results-bar-key">{[
						{ label: 'Unprocessed', budget: '', theme: '#64748b' },
						...baselineStyles.map(item => ({ label: item.short, budget: item.budget, theme: item.theme })),
						...series.map(item => ({ label: item.label, budget: '', theme: item.theme, chipShape: item.chipShape, monogram: item.monogram, dashed: item.dashed }))
					].map(row => {
						const suffix = row.budget ? `@${row.budget}` : '';
						return <li key={row.label} tabIndex="0" onMouseEnter={() => setActiveMethod(row.label)} onMouseLeave={() => setActiveMethod(null)} onFocus={() => setActiveMethod(row.label)} onBlur={() => setActiveMethod(null)}><MethodChip item={row} /><span>{row.label}{suffix && <span class="cof-results-key-budget">{suffix}</span>}</span></li>;
					})}</ul>
				</div>
				<CurveChart dataset={shown.dataset} metric={shown.metric} activeLabel={activeMethod} onActiveLabel={setActiveMethod} />
			</section>}
		</div>
		</div>
	</div>;
}
