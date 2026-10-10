import results from '../data/cof-results.json' with { type: 'json' };

export { results };
export const datasets = Object.keys(results.curves);
export const metrics = ['PESQ', 'ESTOI', 'SI-SDR', 'UTMOS', 'WER'];
export const budgets = [1, 2, 4, 8, 16, 24];
export const series = [
	{ key: 'sb', label: 'SB-VE', color: '#b5d7fa', marker: 'circle' },
	{ key: 'cof_sb', label: 'CoF (SB-VE)', color: '#238bfa', marker: 'circle', dashed: true },
	{ key: 'cfm', label: 'OT-CFM', color: '#b5d7fa', marker: 'triangle' },
	{ key: 'cof_cfm', label: 'CoF (OT-CFM)', color: '#238bfa', marker: 'triangle', dashed: true }
];
export const baselineStyles = [
	{ label: 'SGMSE+ (NFE=100)', short: 'SGMSE+', budget: '100', color: '#a6adb6', marker: 'square', dash: '8 4' },
	{ label: 'StoRM (NFE=100+1)', short: 'StoRM', budget: '100+1', color: '#c4c8ce', marker: 'diamond', dash: '8 3 2 3' }
];
export const metricUnit = metric => metric === 'SI-SDR' ? 'dB' : metric === 'WER' ? '%' : '';
export const formatMetric = (metric, value) => new Intl.NumberFormat('en-US', {
	minimumFractionDigits: metric === 'SI-SDR' ? 1 : 2,
	maximumFractionDigits: metric === 'SI-SDR' ? 1 : 2,
	useGrouping: false
}).format(value);
export const valueAt = (dataset, metric, key, nfe) => results.curves[dataset][metric][key].find(point => point[0] === nfe)?.[1];

export function benchmarkRows(dataset, metric, nfe) {
	return [
		{ label: 'Unprocessed', budget: '—', color: '#dfe2e6', marker: 'cross', value: results.unprocessed[dataset][metric] },
		...baselineStyles.map(item => ({ ...item, label: item.short, value: results.baselines[dataset][item.label][metric] })),
		...series.map(item => ({ ...item, budget: String(nfe), value: valueAt(dataset, metric, item.key, nfe) })),
		...(metric === 'WER' ? [{ label: 'Clean reference', budget: '', color: '#a9afb8', marker: 'ring', value: results.clean[dataset].WER }] : [])
	];
}

export function resultsCsv() {
	const rows = [['Dataset', 'Method', 'NFE', 'PESQ', 'ESTOI', 'SI-SDR (dB)', 'UTMOS', 'WER (%)']];
	for (const dataset of datasets) {
		for (const item of series) {
			for (const nfe of budgets) rows.push([dataset, item.label, nfe, ...metrics.map(metric => formatMetric(metric, valueAt(dataset, metric, item.key, nfe)))]);
		}
		for (const item of baselineStyles) rows.push([dataset, item.short, item.budget, ...metrics.map(metric => formatMetric(metric, results.baselines[dataset][item.label][metric]))]);
		rows.push([dataset, 'Unprocessed', '', ...metrics.map(metric => formatMetric(metric, results.unprocessed[dataset][metric]))]);
		rows.push([dataset, 'Clean reference', '', ...metrics.map(metric => metric === 'WER' ? formatMetric(metric, results.clean[dataset][metric]) : '')]);
	}
	return rows.map(row => row.join(',')).join('\n') + '\n';
}
