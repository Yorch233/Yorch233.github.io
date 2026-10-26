import { expect, test } from 'vitest';
import { copyReadingState, readHomeEntry, withHomeEntry } from './home-history.js';

const entry = () => ({
	id: 'entry-1', hash: '#publications', topic: 'publications', returnTopic: 'publications',
	scrollY: 650, focus: '[data-paper="CoF"] .pub-abstract-toggle',
	reading: { news: true, abstracts: { CoF: true, RSB: false } }
});

test('history snapshots preserve unrelated state and do not alias live expansion flags', () => {
	const current = entry();
	const state = withHomeEntry({ external: 'preserved' }, current);
	current.reading.abstracts.CoF = false;
	expect(state.external).toBe('preserved');
	expect(readHomeEntry(state)?.reading.abstracts.CoF).toBe(true);
	const restored = readHomeEntry(state)!;
	restored.reading.abstracts.RSB = true;
	expect(readHomeEntry(state)?.reading.abstracts.RSB).toBe(false);
});

test('independent history entries keep distinct reading positions and expansion states', () => {
	const before = withHomeEntry(null, entry());
	const later = withHomeEntry(before, { ...entry(), id: 'entry-2', scrollY: 0, reading: copyReadingState() });
	expect(readHomeEntry(before)?.scrollY).toBe(650);
	expect(readHomeEntry(before)?.reading.abstracts.CoF).toBe(true);
	expect(readHomeEntry(later)?.scrollY).toBe(0);
	expect(readHomeEntry(later)?.reading.abstracts.CoF).toBeUndefined();
});

test('foreign and incomplete history states use the normal navigation fallback', () => {
	expect(readHomeEntry(null)).toBeNull();
	expect(readHomeEntry({ external: true })).toBeNull();
	expect(readHomeEntry({ 'qing-home.v1': { id: 'x', hash: '#papers', topic: 'papers' } })).toBeNull();
});
