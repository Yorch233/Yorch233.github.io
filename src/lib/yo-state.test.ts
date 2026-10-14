import { expect, test } from 'vitest';
import { advanceYo, initialYoState, transitionYo, yoMood, selectYoChain, YO_STATES } from './yo-state.js';
import { yoPose, YO_PROPS } from './yo-pose.js';

const draws = (...values: number[]) => {
	let i = 0;
	return () => values[i++ % values.length];
};

test('waiting at 45s and sleeping at 90s depend on real user activity', () => {
	const state = initialYoState(1000);
	for (const [age, expected] of [[0, 'idle'], [44999, 'idle'], [45000, 'waiting'], [89999, 'waiting'], [90000, 'sleeping']] as const) {
		expect(yoMood(state, 1000 + age)).toBe(expected);
	}
	expect(yoMood(transitionYo(state, { type: 'activity' }, 91000), 91000)).toBe('idle');
});

test('real pending uses a 300ms threshold and never falls asleep', () => {
	const state = transitionYo(initialYoState(), { type: 'pending', active: true }, 100);
	expect(yoMood(state, 399)).toBe('idle');
	expect(yoMood(state, 400)).toBe('waiting');
	expect(yoMood(state, 190000)).toBe('waiting');
});

test('pending completion preserves actual success feedback', () => {
	let state = transitionYo(initialYoState(), { type: 'pending', active: true }, 100);
	state = transitionYo(state, { type: 'react', mood: 'happy' }, 400);
	state = transitionYo(state, { type: 'pending', active: false }, 401);
	expect(yoMood(state, 402)).toBe('happy');
});

test('reading and audio stop automatic chains and retain truthful static context', () => {
	let state = advanceYo(initialYoState(), 12000, {}, draws(.7, .1));
	expect(state.group).toBe('work');
	state = advanceYo(state, 13000, { reading: true });
	expect(state.chain.length).toBe(0);
	expect(yoMood(state, 13000, { reading: true })).toBe('studying');
	expect(yoMood(state, 13000, { audio: true })).toBe('waiting');
	state = transitionYo(state, { type: 'react', mood: 'happy' }, 14000);
	expect(yoMood(state, 14001, { reading: true })).toBe('happy');
	expect(yoMood(state, 14001, { audio: true })).toBe('waiting');
});

test('academic chain is study then think then write, with no activity reset', () => {
	let state = advanceYo(initialYoState(), 12000, {}, draws(.7, .1));
	expect(state.reaction).toBe('studying');
	state = advanceYo(state, state.until, {}, () => .5);
	expect(state.reaction).toBe('thinking');
	state = advanceYo(state, state.until, {}, () => .5);
	expect(state.reaction).toBe('writing-paper');
	state = advanceYo(state, state.until, {}, () => .5);
	expect(state.reaction).toBeNull();
	expect(state.lastActivity).toBe(0);
	expect(state.nextDraw).toBeGreaterThan(30000);
});

test('automatic snack must be hungry, burger, happy; activity cancels the whole chain', () => {
	let state = advanceYo(initialYoState(), 12000, {}, draws(.99, .1));
	expect(state.reaction).toBe('hungry');
	expect(state.chain).toEqual(['eat-burger', 'happy']);
	const canceled = transitionYo(state, { type: 'activity' }, 12001);
	expect(canceled.reaction).toBeNull();
	expect(canceled.chain.length).toBe(0);
	state = advanceYo(state, state.until, {}, () => .5);
	expect(state.reaction).toBe('eat-burger');
	state = advanceYo(state, state.until, {}, () => .5);
	expect(state.reaction).toBe('happy');
});

test('direct feedback wins over narration and never resumes a canceled prop chain', () => {
	let state = advanceYo(initialYoState(), 12000, {}, draws(.99, .1));
	state = transitionYo(state, { type: 'react', mood: 'happy', duration: 2200 }, 12001);
	state = transitionYo(state, { type: 'react', mood: 'speaking', priority: 2 }, 12002);
	expect(yoMood(state, 12003)).toBe('happy');
	state = advanceYo(state, 14201, {}, () => .5);
	expect(state.chain.length).toBe(0);
	expect(state.reaction).toBeNull();
});

test('group and state cooldowns filter before renormalizing', () => {
	const state = { ...initialYoState(), lastGroup: 'work', cooldowns: { 'eat-burger': 1000, 'drink-coffee': 1000, boring: 1000 } };
	for (let i = 0; i < 100; i++) {
		const chosen = selectYoChain(state, 2000, () => i / 100)!;
		expect(chosen.group).not.toBe('work');
		expect(chosen.chain.every(mood => !['eat-burger', 'drink-coffee', 'boring'].includes(mood))).toBe(true);
	}
});

test('all quiet environments prohibit autonomous draws; two starts per minute maximum', () => {
	for (const context of [{ reading: true }, { audio: true }, { paused: true }, { reducedMotion: true }, { attentive: true }, { suspended: true }]) {
		expect(advanceYo(initialYoState(), 12000, context, () => .99).reaction).toBeNull();
	}
	const state = { ...initialYoState(), starts: [1000, 5000] };
	expect(advanceYo(state, 12000, {}, () => .99).reaction).toBeNull();
});

test('absence, reset and explicit hiding cannot revive stale reactions', () => {
	let state = transitionYo(initialYoState(), { type: 'react', mood: 'coding' }, 1000);
	state = transitionYo(state, { type: 'presence', visible: false }, 1001);
	expect(yoMood(state, 1002)).toBe('disappearing');
	state = advanceYo(state, 1700);
	expect(yoMood(state, 1700)).toBe('hidden');
	state = transitionYo(state, { type: 'reset' }, 500000);
	expect(yoMood(state, 500000)).toBe('hidden');
	state = transitionYo(state, { type: 'presence', visible: true }, 500001);
	expect(yoMood(state, 500001)).toBe('appearing');
	state = advanceYo(state, 500800);
	expect(yoMood(state, 500800)).toBe('idle');
	expect(state.chain).toEqual([]);
});

test('an idle deadline preempts a long automatic action without postponing sleep', () => {
	let state = { ...initialYoState(), reaction: 'coding', until: 48000, chain: ['thinking'], group: 'work', priority: 1 };
	state = advanceYo(state, 45000);
	expect(yoMood(state, 45000)).toBe('waiting');
	expect(yoMood(state, 90000)).toBe('sleeping');
});

test('five-beat loops close and all 18 state poses remain finite', () => {
	expect(Object.keys(YO_STATES).length).toBe(18);
	expect(new Set(YO_PROPS).size).toBe(6);
	for (const [mood, duration] of Object.entries(YO_STATES)) {
		for (const age of [0, duration / 4, duration / 2, duration * .75, duration]) {
			for (const value of Object.values(yoPose(mood, age))) {
				expect(Number.isFinite(value), mood).toBe(true);
			}
		}
	}
	for (const mood of ['idle', 'waiting', 'sleeping', 'studying', 'writing-paper', 'coding']) {
		expect(yoPose(mood, 0)).toEqual(yoPose(mood, (YO_STATES as Record<string, number>)[mood]!));
	}
	expect(yoPose('appearing', 0).opacity).toBe(0);
	expect(yoPose('appearing', 750).opacity).toBe(1);
	expect(yoPose('disappearing', 650).opacity).toBe(0);
	expect(yoPose('hidden', 100).opacity).toBe(0);
});
