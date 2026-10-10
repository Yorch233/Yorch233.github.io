// Discrete lifecycle and scheduling; animation never changes lastActivity.
export const YO_STATES = {
	idle: 7000, thinking: 5000, waiting: 9000, sleeping: 10000,
	studying: 7000, boring: 6000, happy: 2400, hungry: 4500,
	'eat-burger': 7000, 'drink-coffee': 5500, 'writing-paper': 7000,
	coding: 6000, teaching: 7000, speaking: 3000, embarrassed: 3500,
	daydreaming: 7000, appearing: 750, disappearing: 650
};
export const YO_GROUPS = [
	{ id: 'gentle', weight: 60, cooldown: 0, chains: [[50, []], [30, ['daydreaming']], [20, ['thinking']]] },
	{ id: 'work', weight: 25, cooldown: 90000, chains: [[50, ['studying', 'thinking', 'writing-paper']], [50, ['studying', 'thinking', 'coding']]] },
	{ id: 'emotion', weight: 10, cooldown: 0, chains: [[70, ['boring', 'daydreaming']], [30, ['happy']]] },
	{ id: 'snack', weight: 5, cooldown: 240000, chains: [[60, ['hungry', 'eat-burger', 'happy']], [40, ['drink-coffee']]] }
];
const cooldown = { boring: 120000, 'eat-burger': 360000, 'drink-coffee': 180000, happy: 5000, embarrassed: 20000 };
const aliases = { spacey: 'daydreaming', sleepy: 'waiting', surprised: 'happy', listening: 'waiting' };
export const normalizeYoMood = mood => aliases[mood] || mood;
export const initialYoState = (now = 0) => ({
	lastActivity: now, reaction: null, until: 0, priority: 0,
	chain: [], group: null, lastGroup: null, cooldowns: {}, starts: [],
	nextDraw: now + 12000, lastChainEnd: -Infinity, daydreamed: false, pendingAt: null,
	presence: 'visible', presenceUntil: 0
});
const pick = (items, weight, random) => {
	let draw = Math.min(.999999, Math.max(0, random())) * items.reduce((sum, item) => sum + weight(item), 0);
	return items.find(item => (draw -= weight(item)) < 0) || items.at(-1);
};
function finishChain(state, now, random) {
	const cooldowns = { ...state.cooldowns };
	if (state.group) cooldowns['group:' + state.group] = now;
	if (state.reaction) cooldowns[state.reaction] = now;
	for (const mood of state.chain) cooldowns[mood] = now;
	return { ...state, reaction: null, until: 0, priority: 0, chain: [], group: null,
		lastGroup: state.group || state.lastGroup, cooldowns, lastChainEnd: now, nextDraw: now + 18000 + random() * 14000 };
}
export function selectYoChain(state, now, random = Math.random) {
	const legal = YO_GROUPS.map(group => ({ ...group, chains: group.chains.filter(([, chain]) =>
		chain.every(mood => now - (state.cooldowns[mood] ?? -Infinity) >= Math.max(cooldown[mood] || 0, 45000))) }))
		.filter(group => group.chains.length && group.id !== state.lastGroup && now - (state.cooldowns['group:' + group.id] ?? -Infinity) >= group.cooldown);
	if (!legal.length) return null;
	const group = pick(legal, item => item.weight, random);
	return { group: group.id, chain: [...pick(group.chains, item => item[0], random)[1]] };
}
export function transitionYo(state, event, now) {
	if (event.type === 'reset') return { ...initialYoState(now), cooldowns: state.cooldowns, lastGroup: state.lastGroup, starts: state.starts,
		...(state.presence === 'hidden' || state.presence === 'disappearing' ? { presence: state.presence, presenceUntil: state.presenceUntil } : {}) };
	if (event.type === 'presence') return { ...finishChain(state, now, () => .5), presence: event.visible ? 'appearing' : 'disappearing', presenceUntil: now + (event.visible ? 750 : 650), lastActivity: now };
	if (event.type === 'pending') return event.active
		? { ...(state.priority < 3 ? finishChain(state, now, () => .5) : state), pendingAt: now }
		: { ...state, pendingAt: null };
	if (event.type === 'react') {
		const mood = normalizeYoMood(event.mood);
		if (!(mood in YO_STATES)) return state;
		const priority = event.priority ?? 4;
		if (now < state.until && priority < state.priority) return state;
		if (mood === state.reaction && now < state.until) return state;
		if (['happy', 'embarrassed'].includes(mood) && now - (state.cooldowns[mood] ?? -Infinity) < cooldown[mood]) return state;
		const clean = finishChain(state, now, () => .5);
		const chain = mood === 'hungry' ? ['eat-burger', 'happy'] : mood === 'eat-burger' ? ['happy'] : [];
		return { ...clean, lastActivity: event.passive ? state.lastActivity : now, reaction: mood,
			until: now + Math.min(10000, event.duration ?? YO_STATES[mood]), priority, chain };
	}
	if (event.type === 'cancel') return finishChain(state, now, () => .5);
	if (event.type === 'activity') {
		const clean = state.group || state.priority === 1 ? finishChain(state, now, () => .5) : state;
		return { ...clean, lastActivity: now, daydreamed: false };
	}
	return state;
}
export function advanceYo(state, now, context = {}, random = Math.random) {
	if (context.suspended) return state;
	if (state.presence === 'hidden') return state;
	if (state.presence !== 'visible') return now >= state.presenceUntil
		? { ...state, presence: state.presence === 'appearing' ? 'visible' : 'hidden' } : state;
	if (context.reading || context.paused || context.audio || context.reducedMotion || context.attentive) {
		if (state.group) return finishChain(state, now, random);
	}
	if (state.reaction && now >= state.until) {
		const cooldowns = { ...state.cooldowns, [state.reaction]: now };
		if (state.chain.length && (!state.group || now - state.lastActivity < 45000)) {
			const [reaction, ...chain] = state.chain;
			return { ...state, reaction, chain, cooldowns, until: now + YO_STATES[reaction] + 300 };
		}
		state = finishChain({ ...state, cooldowns }, now, random);
	}
	const elapsed = now - state.lastActivity;
	if (state.group && elapsed >= 45000) state = finishChain(state, now, random);
	if (state.reaction || context.reading || context.paused || context.audio || context.reducedMotion || context.attentive || state.pendingAt !== null || elapsed >= 45000) return state;
	if (elapsed >= 12000 && now >= state.nextDraw) {
		const starts = state.starts.filter(time => now - time < 60000);
		if (starts.length >= 2) return { ...state, nextDraw: starts[0] + 60000 };
		const selected = selectYoChain(state, now, random);
		if (!selected || !selected.chain.length) return { ...state, lastGroup: selected?.group || state.lastGroup, nextDraw: now + 18000 + random() * 14000 };
		const [reaction, ...chain] = selected.chain;
		return { ...state, reaction, chain, group: selected.group, priority: 1, until: now + YO_STATES[reaction], starts: [...starts, now] };
	}
	if (elapsed >= 25000 && !state.daydreamed && state.lastGroup !== 'gentle' && now - (state.cooldowns.daydreaming ?? -Infinity) >= 45000 && now - state.lastChainEnd >= 18000 && state.starts.filter(time => now - time < 60000).length < 2) return { ...state, reaction: 'daydreaming', until: now + 7000, priority: 1, daydreamed: true, group: 'gentle', starts: [...state.starts, now] };
	return state;
}
export function yoMood(state, now, { reading = false, paused = false, audio = false, pending = false } = {}) {
	if (state.presence !== 'visible') return state.presence;
	const reaction = now < state.until ? state.reaction : null;
	if (audio) return 'waiting';
	if (reading) return reaction && state.priority >= 3 ? reaction : pending || state.pendingAt !== null && now - state.pendingAt >= 300 ? 'waiting' : 'studying';
	if (reaction) return reaction;
	if (paused) return 'idle';
	if (pending || state.pendingAt !== null && now - state.pendingAt >= 300) return 'waiting';
	const elapsed = now - state.lastActivity;
	if (elapsed >= 90000) return 'sleeping';
	if (elapsed >= 45000) return 'waiting';
	return 'idle';
}
