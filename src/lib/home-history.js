// History entries contain only lightweight reading state. Copy the nested
// flags so later interactions cannot mutate an earlier entry's snapshot.
const key = 'qing-home.v1';

export function copyReadingState(value = {}) {
	value = value && typeof value === 'object' ? value : {};
	return { news: value.news === true, abstracts: { ...value.abstracts } };
}

export function readHomeEntry(state) {
	const entry = state?.[key];
	if (!entry || typeof entry.id !== 'string' || typeof entry.hash !== 'string') return null;
	if (![null, 'news', 'publications', 'awards', 'contact'].includes(entry.topic)) return null;
	return {
		id: entry.id,
		hash: entry.hash,
		topic: entry.topic,
		returnTopic: ['news', 'publications', 'awards', 'contact'].includes(entry.returnTopic) ? entry.returnTopic : 'publications',
		scrollY: Number.isFinite(entry.scrollY) ? Math.max(0, entry.scrollY) : 0,
		focus: typeof entry.focus === 'string' ? entry.focus : null,
		reading: copyReadingState(entry.reading)
	};
}

export function withHomeEntry(state, entry) {
	return {
		...(state && typeof state === 'object' ? state : {}),
		[key]: { ...entry, reading: copyReadingState(entry.reading) }
	};
}
