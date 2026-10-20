import results from '../data/cof-results.json' with { type: 'json' };

export { results };
export const datasets = Object.keys(results.curves);
export const metrics = ['PESQ', 'ESTOI', 'SI-SDR', 'UTMOS', 'WER'];
export const budgets = [1, 2, 4, 8, 16, 24];
// Every method owns a theme colour: chips render it saturated and bars render
// a lighter tint of it. Curves keep the training-status encoding — solid tint
// (blue for SB-VE, purple for OT-CFM) for pretrained, orange dashed for CoF.
// A CoF variant inherits its pretrained base theme; its chip adds the shared
// orange ring.
export const series = [
	{ key: 'sb', label: 'SB-VE', color: '#65aefc', barColor: '#65aefc', theme: '#238bfa', chipShape: 'triangle', monogram: 'SB', marker: 'circle' },
	{ key: 'cof_sb', label: 'CoF (SB-VE)', color: '#ff7210', barColor: '#ff954c', theme: '#ff7210', chipShape: 'triangle', monogram: 'Co', marker: 'circleDot', dashed: true },
	{ key: 'cfm', label: 'OT-CFM', color: '#ae8df9', barColor: '#ae8df9', theme: '#8b5cf6', chipShape: 'square', monogram: 'OT', marker: 'triangle' },
	{ key: 'cof_cfm', label: 'CoF (OT-CFM)', color: '#ff7210', barColor: '#ff954c', theme: '#ff7210', chipShape: 'square', monogram: 'Co', marker: 'triangleDot', dashed: true }
];
export const baselineStyles = [
	{ label: 'SGMSE+ (NFE=100)', short: 'SGMSE+', budget: '100', color: '#a6adb6', barColor: '#bd866c', theme: '#a0522d', marker: 'square', dash: '8 4' },
	{ label: 'StoRM (NFE=100+1)', short: 'StoRM', budget: '100+1', color: '#c4c8ce', barColor: '#d45d8c', theme: '#c2185b', marker: 'diamond', dash: '8 3 2 3' }
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
		{ label: 'Unprocessed', budget: '—', color: '#939eae', theme: '#64748b', marker: 'cross', value: results.unprocessed[dataset][metric] },
		...baselineStyles.map(item => ({ ...item, label: item.short, value: results.baselines[dataset][item.label][metric] })),
		...series.map(item => ({ ...item, budget: String(nfe), value: valueAt(dataset, metric, item.key, nfe) })),
		...(metric === 'WER' ? [{ label: 'Clean reference', budget: '', reference: true, color: '#c3c7cd', theme: '#a9afb8', marker: 'ring', value: results.clean[dataset].WER }] : [])
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
