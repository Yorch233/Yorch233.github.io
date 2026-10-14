import { YO_STATES } from './yo-state.js';

export const YO_PROPS = ['studying', 'eat-burger', 'drink-coffee', 'writing-paper', 'coding', 'teaching'];
const loops = new Set(['idle', 'waiting', 'sleeping', 'studying', 'writing-paper', 'coding']);
const clamp = value => Math.max(0, Math.min(1, value));
const ease = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
// Five authored action beats, interpolated without per-frame component renders.
const samples = {
	idle: [[0,0,0,0],[-1,0,-1,0],[0,0,-2,0],[1,0,-1,0],[0,0,0,0]],
	thinking: [[0,0,0,0],[-2,-2,0,-3],[-2,-2,0,-4],[0,-1,-1,-1],[0,0,0,0]],
	waiting: [[0,0,0,0],[-2,0,0,-1],[0,0,0,0],[2,0,0,1],[0,0,0,0]],
	sleeping: [[0,0,2,0],[0,0,1,0],[0,0,0,0],[0,0,1,0],[0,0,2,0]],
	studying: [[0,2,0,0],[-2,2,0,-1],[0,2,-1,0],[2,2,0,1],[0,2,0,0]],
	boring: [[0,1,0,0],[-2,1,2,3],[-2,2,3,4],[1,1,2,3],[0,0,0,0]],
	happy: [[0,0,0,0],[0,0,2,0],[0,0,-9,0],[0,0,2,0],[0,0,0,0]],
	hungry: [[0,2,0,0],[0,2,1,1],[2,0,0,-2],[2,0,-1,-1],[0,0,0,0]],
	'eat-burger': [[0,2,0,0],[0,2,-1,0],[0,1,0,0],[0,1,1,-1],[0,0,0,0]],
	'drink-coffee': [[1,2,0,0],[2,1,0,-1],[2,0,-1,-2],[0,0,0,0],[0,0,0,0]],
	'writing-paper': [[-2,2,0,0],[0,2,0,-1],[2,2,0,-1],[1,-2,-1,-2],[-2,2,0,0]],
	coding: [[0,1,0,0],[-1,2,0,-1],[1,2,0,1],[0,1,-1,0],[0,1,0,0]],
	teaching: [[0,0,0,0],[1,0,0,-2],[2,0,-1,-1],[3,0,0,1],[0,0,0,0]],
	speaking: [[0,0,0,0],[0,0,-1,-1],[0,0,0,1],[0,0,-1,-1],[0,0,0,0]],
	embarrassed: [[0,0,0,0],[-2,1,0,3],[-2,1,1,3],[0,0,0,1],[0,0,0,0]],
	daydreaming: [[0,0,0,0],[2,-2,0,2],[2,-2,1,3],[1,-1,0,1],[0,0,0,0]]
};
export function yoPose(mood, age, still = false) {
	const duration = YO_STATES[mood] || 7000;
	const phase = still ? .5 : loops.has(mood) ? (Math.max(0, age) % duration) / duration : clamp(age / duration);
	const beat = phase * 4, index = Math.min(3, Math.floor(beat)), blend = ease(beat - index);
	const frames = samples[mood] || samples.idle;
	const [x,y,lift,tilt] = frames[index].map((value, i) => value + (frames[index + 1][i] - value) * blend);
	const gesture = Math.sin(phase * Math.PI);
	let opacity = 1, scale = 1;
	if (mood === 'appearing') { opacity = still ? 1 : ease(phase * 1.5); scale = still ? 1 : .8 + .2 * ease(phase * 1.3) + .035 * Math.sin(phase * Math.PI); }
	if (mood === 'disappearing') { opacity = still ? 0 : 1 - ease(phase); scale = 1 - .25 * ease(phase); }
	if (mood === 'hidden') opacity = 0;
	return { phase, x, y, lift, tilt, gesture, opacity, scale,
		blush: mood === 'embarrassed' ? gesture * .65 : mood === 'happy' ? .35 : 0,
		mouth: ['speaking','eat-burger','drink-coffee','hungry'].includes(mood) ? gesture : 0 };
}
