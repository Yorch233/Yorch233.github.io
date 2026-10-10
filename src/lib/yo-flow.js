const smooth = (value) => {
	const x = Math.max(0, Math.min(1, value));
	return x * x * (3 - 2 * x);
};

// The body stays joined while one little tail drifts away and melts back in.
export function bluePuffMotion(time, index, freedom = 1, dispersion = freedom) {
	if (freedom === 0) return { x: 0, y: 0, scale: 1, stretch: 0, spread: 0 };
	const phase = index * 1.83;
	const cycle = ((time % 16) + 16) % 16;
	const spread = index === 4 ? smooth((cycle - 4.5) / 2)
		* smooth((11.5 - cycle) / 2.5) * dispersion : 0;
	const outX = .85, outY = .53;
	const distance = 29;
	const eddy = Math.sin(time * 1.7 + phase) * 5 * spread;
	return {
		x: (Math.sin(time * 1.31 + phase) * 4.8 + Math.sin(time * .61 - phase)) * freedom + outX * distance * spread - outY * eddy,
		y: Math.cos(time * 1.63 + phase) * 4.6 * freedom + outY * distance * spread + outX * eddy,
		scale: 1 + Math.sin(time * 1.47 + phase) * .065 * freedom - spread * .08,
		stretch: Math.sin(time * 1.72 + phase) * .03 * freedom,
		spread
	};
}
