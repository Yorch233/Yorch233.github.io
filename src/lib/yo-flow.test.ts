import { expect, test } from 'vitest';
import { bluePuffMotion } from './yo-flow.js';

test('only the tail separates and gathers during an idle cycle', () => {
	for (let i = 0; i < 5; i++) {
		expect(bluePuffMotion(0, i).spread).toBe(0);
		if (i === 4) expect(bluePuffMotion(8, i).spread).toBeGreaterThan(.9);
		else for (let t = 0; t < 16; t += .1) expect(bluePuffMotion(t, i).spread).toBe(0);
		expect(bluePuffMotion(14, i).spread).toBe(0);
		const before = bluePuffMotion(16 - .0001, i);
		const after = bluePuffMotion(16 + .0001, i);
		expect(Math.abs(before.x - after.x)).toBeLessThan(.01);
		expect(Math.abs(before.y - after.y)).toBeLessThan(.01);
	}
});

test('quiet mode restores the resting outline at every point in the cycle', () => {
	for (let t = 0; t <= 32; t += .25) {
		for (let i = 0; i < 5; i++) {
			const pose = bluePuffMotion(t, i, 0);
			expect(pose.x).toBe(0);
			expect(pose.y).toBe(0);
			expect(pose.scale).toBe(1);
			expect(pose.stretch).toBe(0);
			expect(pose.spread).toBe(0);
		}
	}
});

test('dispersal stays bounded without inverted or collapsed puffs', () => {
	for (let t = 0; t <= 32; t += .05) {
		for (let i = 0; i < 5; i++) {
			const pose = bluePuffMotion(t, i);
			expect(Math.abs(pose.x) < 40 && Math.abs(pose.y) < 42).toBe(true);
			expect(pose.scale - Math.abs(pose.stretch)).toBeGreaterThan(.8);
			expect(pose.scale + Math.abs(pose.stretch)).toBeLessThan(1.1);
		}
	}
});
