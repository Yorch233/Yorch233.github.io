import UiIcon from './UiIcon.jsx';
import DiscreteSlider from './DiscreteSlider.jsx';
import { useEffect, useRef, useState } from 'preact/hooks';
import { results, datasets, metrics, budgets, series, baselineStyles, metricUnit, formatMetric, benchmarkRows } from '../../lib/cof-results.js';

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

function Marker({ item, x, y, size = 4 }) {
	const paint = { fill: item.color, stroke: 'white', 'stroke-width': 1 };
	if (item.marker === 'triangle') return <path d={`M ${x} ${y - size - 1} L ${x - size - 1} ${y + size} L ${x + size + 1} ${y + size} Z`} {...paint} />;
	if (item.marker === 'square') return <rect x={x - size} y={y - size} width={size * 2} height={size * 2} rx="1" {...paint} />;
	if (item.marker === 'diamond') return <path d={`M ${x} ${y - size - 1} L ${x + size + 1} ${y} L ${x} ${y + size + 1} L ${x - size - 1} ${y} Z`} {...paint} />;
	if (item.marker === 'ring') return <circle cx={x} cy={y} r={size} fill="white" stroke={item.color} stroke-width="2" />;
	if (item.marker === 'cross') return <path d={`M ${x - size} ${y - size} L ${x + size} ${y + size} M ${x + size} ${y - size} L ${x - size} ${y + size}`} fill="none" stroke={item.color} stroke-width="2.5" stroke-linecap="round" />;
	return <circle cx={x} cy={y} r={size} {...paint} />;
}

function MethodMarker({ item }) {
	return <svg class="cof-results-method-marker" viewBox="0 0 20 20" aria-hidden="true"><Marker item={item} x={10} y={10} size={5} /></svg>;
}

function CurveChart({ dataset, metric }) {
	const [ref, width] = useChartWidth();
	const plot = { left: 48, right: width - 16, top: 22, bottom: 280 };
	const [active, setActive] = useState(null);
	useEffect(() => setActive(null), [dataset, metric]);
	const values = series.flatMap(item => results.curves[dataset][metric][item.key].map(point => point[1]));
	const log = metric === 'UTMOS';
	const transform = value => log ? Math.log(value) : value;
	const min = Math.min(...values.map(transform)), max = Math.max(...values.map(transform));
	const margin = (max - min) * .17 || .1;
	const low = min - margin, high = max + margin;
	const x = value => plot.left + (value - 1) / 23 * (plot.right - plot.left);
	const y = value => plot.bottom - (transform(value) - low) / (high - low) * (plot.bottom - plot.top);
	const references = [
		...baselineStyles.map(item => ({ ...item, value: results.baselines[dataset][item.label][metric] })),
		{ label: 'Unprocessed', color: '#808080', value: results.unprocessed[dataset][metric], noteOnly: true },
		...(metric === 'WER' ? [{ label: 'Clean reference', color: '#25364d', value: results.clean[dataset].WER, noteOnly: true }] : [])
	];
	return <>
		<svg ref={ref} class="cof-results-svg" viewBox={`0 0 ${width} 330`} role="group" aria-label={`${dataset}: ${metric} versus NFE, ${log ? 'logarithmic' : 'linear'} vertical axis`}>
			{[0, 1, 2, 3, 4].map(i => {
				const level = low + (high - low) * i / 4;
				const value = log ? Math.exp(level) : level;
				return <g key={i}><line x1={plot.left} x2={plot.right} y1={y(value)} y2={y(value)} class="cof-results-gridline" /><text x={plot.left - 9} y={y(value) + 4} text-anchor="end">{formatMetric(metric, value)}</text></g>;
			})}
			{references.filter(item => !item.noteOnly && y(item.value) >= plot.top && y(item.value) <= plot.bottom).map(item => <line key={item.label} x1={plot.left} x2={plot.right} y1={y(item.value)} y2={y(item.value)} stroke={item.color} stroke-dasharray={item.dash} stroke-width="1.5"><title>{item.label}: {formatMetric(metric, item.value)}</title></line>)}
			{series.map(item => <g key={item.key}>
				<path d={results.curves[dataset][metric][item.key].map(([budget, value], i) => `${i ? 'L' : 'M'} ${x(budget)} ${y(value)}`).join(' ')} fill="none" stroke={item.color} stroke-width="2" stroke-dasharray={item.dashed ? '6 4' : undefined} />
				{results.curves[dataset][metric][item.key].map(([budget, value]) => <g key={budget} class="cof-results-point" data-nfe={budget} tabindex="0" role="img" aria-label={`${item.label}, NFE ${budget}: ${formatMetric(metric, value)} ${metricUnit(metric)}`}
					onPointerEnter={() => setActive({ item, budget, value })} onPointerLeave={() => setActive(null)} onFocus={() => setActive({ item, budget, value })} onBlur={() => setActive(null)}
					>
					<circle cx={x(budget)} cy={y(value)} r="10" fill="transparent" />
					<Marker item={item} x={x(budget)} y={y(value)} size={4} />
					<title>{item.label} · NFE {budget} · {formatMetric(metric, value)}</title>
				</g>)}
			</g>)}
			{[1, 4, 8, 16, 24].map(budget => <text key={budget} x={x(budget)} y={plot.bottom + 21} text-anchor="middle">{budget}</text>)}
			<line x1={x(2)} x2={x(2)} y1={plot.bottom} y2={plot.bottom + 4} stroke="#8a919c" />
			<text x={(plot.left + plot.right) / 2} y="324" text-anchor="middle">NFE (function evaluations)</text>
		</svg>
		<p class="cof-results-inspect">{active ? `${active.item.label} · NFE ${active.budget} · ${metric}: ${formatMetric(metric, active.value)} ${metricUnit(metric)}` : 'Hover or focus a point to inspect its value at that NFE.'}</p>
		<ul class="cof-results-references">{references.map(item => <li key={item.label} style={{ '--series-color': item.color }}><span>{item.label}</span><strong>{formatMetric(metric, item.value)}{metricUnit(metric) && ` ${metricUnit(metric)}`}</strong>{!item.noteOnly && <small>{y(item.value) < plot.top || y(item.value) > plot.bottom ? 'Outside curve range' : 'Horizontal reference'}</small>}</li>)}</ul>
	</>;
}

function Bars({ dataset, metric, nfe }) {
	const [ref, width] = useChartWidth();
	const [hovered, setHovered] = useState(null);
	const [focused, setFocused] = useState(null);
	const active = hovered ?? focused;
	useEffect(() => { setHovered(null); setFocused(null); }, [dataset, metric, nfe]);
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
	return <div class="cof-results-bar-chart"><svg ref={ref} class="cof-results-svg cof-results-bars" data-bar-metric={metric} viewBox={`0 0 ${width} 250`} role="group" aria-label={`${dataset}: ${metric} benchmark comparison at NFE ${nfe}. Positive-only scales are truncated and marked; zero remains visible when values cross it. Reference methods use their reported budgets.`}>
		{[0, 1, 2, 3, 4].map(i => {
			const level = low + (high - low) * i / 4;
			return <g key={i}><line x1={plotLeft} x2={width - 4} y1={y(level)} y2={y(level)} class="cof-results-gridline" /><text x={plotLeft - 6} y={y(level) + 4} text-anchor="end" class="cof-results-axis-label">{formatMetric(metric, level)}</text></g>;
		})}
		<line x1={plotLeft} x2={width - 4} y1={y(baseline)} y2={y(baseline)} class={includesZero ? 'cof-results-zero' : 'cof-results-truncated-base'} />
		{includesZero && low < 0 && <text x={plotLeft - 6} y={y(0) - 6} text-anchor="end" class="cof-results-zero-label">0</text>}
		{!includesZero && <path d={`M ${plotLeft - 3} ${y(low) - 7} l 5 3 l -5 3 l 5 3`} class="cof-results-axis-break" aria-hidden="true" />}
		{rows.map((row, i) => {
			const center = plotLeft + step * (i + .5);
			return <g key={row.label} class="cof-results-bar" data-bar-method={row.label} data-bar-value={formatMetric(metric, row.value)} data-marker={row.marker} data-active={active === i || undefined} tabindex="0" role="img" aria-label={`${row.label} · ${row.label === 'Unprocessed' ? 'No processing' : row.budget ? `NFE ${row.budget}` : 'reference'} · ${metric}: ${formatMetric(metric, row.value)} ${metricUnit(metric)}`}
				onPointerEnter={() => setHovered(i)} onPointerLeave={() => setHovered(null)} onFocus={() => { setHovered(null); setFocused(i); }} onBlur={() => setFocused(null)} onClick={() => setFocused(i)} onKeyDown={event => { if (event.key === 'Escape') { setHovered(null); setFocused(null); } }}>
			<rect x={center - barWidth / 2} y={Math.min(y(baseline), y(row.value))} width={barWidth} height={Math.abs(y(row.value) - y(baseline))} rx="3" fill={row.color} />
			<text x={center} y={row.value < 0 ? y(row.value) + 15 : y(row.value) - 8} text-anchor="middle" class={`cof-results-value ${row.dashed ? 'cof-results-highlight' : ''}`} style={{ fontSize: width < 280 ? '10px' : '12px' }}>{formatMetric(metric, row.value)}</text>
			<Marker item={row} x={center} y={239} size={4} />
			<title>{row.label}, NFE {row.budget}: {formatMetric(metric, row.value)} {metricUnit(metric)}</title>
		</g>;
		})}
	</svg>
	{active !== null && <div class="cof-results-bar-tooltip" role="tooltip" style={{ left: `${Math.max(8, Math.min(plotLeft + step * (active + .5) - 110, width - 228))}px`, top: `${Math.max(4, Math.min(y(0), y(rows[active].value)) - 76)}px` }}>
		<strong>{rows[active].label}</strong>
		<span>{rows[active].label === 'Unprocessed' ? 'No processing' : rows[active].budget ? `NFE ${rows[active].budget}` : 'Clean reference'} · {metric}: {formatMetric(metric, rows[active].value)} {metricUnit(metric)}</span>
	</div>}
	</div>;
}

const budgetOptions = budgets.map(value => ({ value, label: String(value) }));
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
	const [nfe, setNfe] = useState(1);
	const [view, setView] = useState('bars');
	return <div class="cof-results" data-dataset={dataset} data-metric={metric} data-nfe={nfe} data-view={view}>
		<div class="cof-results-workspace">
		<div class="cof-results-plot-header">
			<div><h3 id={view === 'bars' ? 'cof-bars-heading' : 'cof-curves-heading'}>{view === 'bars' ? 'Benchmark comparison' : 'Metric vs NFE'}</h3>
				<p class="cof-results-context">{dataset} · {view === 'bars' ? `${nfe} NFE` : `${metric} · across NFE`}</p>
			</div>
			<div class="cof-results-controls" data-view={view} role="group" aria-label={view === 'bars' ? 'Chart filters and NFE' : 'Curves filters'}>
				<div class="cof-results-filter-panel" role="group" aria-label="Filters">
					<div class="cof-results-filter-rows">
						<div class="cof-results-filter-row" role="group" aria-label="Results dataset">
							<span class="cof-results-option-label"><UiIcon id="layers" />Dataset</span>
							<div class="cof-results-filter-options cof-results-dataset-options" role="group" aria-label="Results dataset">
								<button type="button" class="cof-results-filter-choice" aria-pressed={dataset === datasets[0]} aria-label="WSJ0+WHAM · Denoising" title="WSJ0+WHAM · Denoising" onClick={() => setDataset(datasets[0])}><UiIcon id="layers" /><span>WSJ0+WHAM</span></button>
								<button type="button" class="cof-results-filter-choice" aria-pressed={dataset === datasets[1]} aria-label="WSJ0+REVERB · Dereverberation" title="WSJ0+REVERB · Dereverberation" onClick={() => setDataset(datasets[1])}><UiIcon id="layers" /><span>WSJ0+REVERB</span></button>
							</div>
						</div>
						<div class="cof-results-filter-row" role="group" aria-label="Chart view">
							<span class="cof-results-option-label"><UiIcon id="bar-chart" />View</span>
							<div class="cof-results-filter-options cof-results-view-options" role="group" aria-label="Chart view">
								<button type="button" class="cof-results-filter-choice" aria-pressed={view === 'bars'} onClick={() => setView('bars')}><UiIcon id="bar-chart" /><span>Chart</span></button>
								<button type="button" class="cof-results-filter-choice" aria-pressed={view === 'curves'} onClick={() => setView('curves')}><UiIcon id="line-chart" /><span>Curves</span></button>
							</div>
						</div>
					</div>
				</div>
				{view === 'bars' && <div class="cof-results-budget-control">
					<DiscreteSlider class="cof-results-budget-slider" options={budgetOptions} value={nfe} onChange={setNfe} label={<><UiIcon id="settings" />NFE</>} formatValue={value => `${value} NFE`} thumbContent={<span>{nfe} NFE</span>} />
				</div>}
			</div>
		</div>
		<div class="cof-results-charts" id="cof-results-chart">
			{view === 'bars' ? <section key="bars" class="cof-results-panel cof-results-bar-panel" aria-labelledby="cof-bars-heading">
				<div class="cof-results-legend-groups">{[0, 3].map(start => <div key={start}>
					<h4>{start === 0 ? 'References · reported budgets' : `Model variants · ${nfe} NFE`}</h4>
					<ul class="cof-results-bar-key">{benchmarkRows(dataset, metrics[0], nfe).slice(start, start === 0 ? 3 : undefined).map(row => <li key={row.label}><MethodMarker item={row} /><span><strong>{row.label}</strong><small>{` ${row.budget === '—' ? 'No processing' : `NFE ${row.budget}`}`}</small></span></li>)}</ul>
				</div>)}</div>
				<p class="cof-results-panel-note">Higher is better except WER. Positive-only bars use a marked y-axis break; labels show exact values. SI-SDR retains zero when values cross it.</p>
				<div class="cof-results-bar-grid">{metrics.map(name => <div class="cof-results-bar-group" key={name}>
					{name === 'WER' && <p class="cof-results-clean-reference"><MethodMarker item={{ marker: 'ring', color: '#a9afb8' }} />Clean reference · {formatMetric('WER', results.clean[dataset].WER)}%</p>}
					<Bars dataset={dataset} metric={name} nfe={nfe} />
					<MetricHint name={name} />
				</div>)}</div>
			</section> : <section key="curves" class="cof-results-panel cof-results-curve-panel" aria-labelledby="cof-curves-heading"><p>Raw evaluations at 1, 2, 4, 8, 16 and 24 NFE; linear horizontal spacing.</p>
				<div class="cof-results-metric-control" role="group" aria-label="Results metric">{metrics.map(name => <MetricSelector key={name} name={name} selected={metric === name} onSelect={() => setMetric(name)} />)}</div>
				<p class="cof-results-curve-context">{metric}{metricUnit(metric) && ` (${metricUnit(metric)})`} · {metric === 'WER' ? 'Lower is better.' : 'Higher is better.'} {metric === 'UTMOS' && 'Logarithmic vertical axis.'}</p>
				<div class="cof-results-key">{series.map(item => <span key={item.key}><svg viewBox="0 0 34 14" aria-hidden="true"><line x1="0" x2="34" y1="7" y2="7" stroke={item.color} stroke-width="2" stroke-dasharray={item.dashed ? '5 3' : undefined} /><Marker item={item} x={17} y={7} size={3} /></svg>{item.label}</span>)}</div>
				<p class="cof-results-encoding">Light blue / solid: pretrained; blue / dashed: CoF. Circles: SB-VE; triangles: OT-CFM.</p>
				<CurveChart dataset={dataset} metric={metric} />
			</section>}
		</div>
		</div>
	</div>;
}
