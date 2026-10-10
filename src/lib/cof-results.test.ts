import { expect, test } from 'vitest';
import { results, datasets, metrics, budgets, series, baselineStyles, formatMetric, valueAt, benchmarkRows, resultsCsv } from './cof-results.js';

const curves = results.curves as Record<string, Record<string, Record<string, number[][]>>>;
const baselines = results.baselines as Record<string, Record<string, Record<string, number>>>;

test('both datasets retain all 240 finite raw evaluations on their actual NFE grids', () => {
	expect(datasets).toEqual(['WSJ0+WHAM', 'WSJ0+REVERB']);
	let count = 0;
	for (const dataset of datasets) for (const metric of metrics) for (const item of series) {
		const points = curves[dataset]![metric]![item.key]!;
		expect(points.map(point => point[0])).toEqual(budgets);
		expect(points.every(point => Number.isFinite(point[1]))).toBe(true);
		count += points.length;
	}
	expect(count).toBe(240);
	expect(valueAt('WSJ0+WHAM', 'UTMOS', 'cof_sb', 8)).toBe(3.2693);
	expect(valueAt('WSJ0+REVERB', 'UTMOS', 'cof_sb', 8)).toBe(3.0417);
});

test('precision applies only to display, including WER and negative SI-SDR', () => {
	expect(formatMetric('PESQ', 2.7650)).toBe('2.77');
	expect(formatMetric('ESTOI', .7894)).toBe('0.79');
	expect(formatMetric('UTMOS', 3.2059)).toBe('3.21');
	expect(formatMetric('SI-SDR', -9.1059)).toBe('-9.1');
	expect(formatMetric('SI-SDR', 14.9011)).toBe('14.9');
	expect(formatMetric('WER', 11.8)).toBe('11.80');
	expect(valueAt('WSJ0+WHAM', 'PESQ', 'cof_sb', 1)).toBe(2.7629);
});

test('comparisons preserve baseline budgets and negative input references', () => {
	const rows = benchmarkRows('WSJ0+REVERB', 'SI-SDR', 24);
	expect(rows.map(row => row.budget)).toEqual(['—', '100', '100+1', '24', '24', '24', '24']);
	expect(rows.map(row => row.label)).toEqual(['Unprocessed', 'SGMSE+', 'StoRM', 'SB-VE', 'CoF (SB-VE)', 'OT-CFM', 'CoF (OT-CFM)']);
	expect(rows[0]!.value).toBe(-9.1059);
	expect(rows[1]!.value).toBe(-3.2);
	const werRows = benchmarkRows('WSJ0+REVERB', 'WER', 8);
	expect(werRows.at(-1)!.label).toBe('Clean reference');
	expect(werRows.at(-1)!.value).toBe(results.clean['WSJ0+REVERB']!.WER);
	expect(werRows.at(-1)!.budget).toBe('');
	for (const dataset of datasets) for (const metric of metrics) for (const item of baselineStyles) {
		expect(Number.isFinite(baselines[dataset]![item.label]![metric])).toBe(true);
	}
});

test('CSV includes every budget and reference with the requested precision', () => {
	const rows = resultsCsv().trim().split('\n').map(row => row.split(','));
	expect(rows.length).toBe(57);
	for (const row of rows.slice(1)) {
		expect(row.length).toBe(8);
		for (let column = 3; column < 8; column++) {
			if (row[column] !== '') expect(row[column]).toMatch(column === 5 ? /^-?\d+\.\d$/ : /^-?\d+\.\d{2}$/);
		}
	}
	expect(rows.some(row => row[1] === 'StoRM' && row[2] === '100+1')).toBe(true);
	expect(rows.some(row => row[0] === 'WSJ0+REVERB' && row[1] === 'Clean reference' && row[7] === '5.80')).toBe(true);
});
