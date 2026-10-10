// Size-aware capsule lenses, inspired by https://github.com/huozhi/vaso.
// Keep the effect on the backdrop: text and interactive controls are never filtered.
const chromium = /Chrome\/|Chromium\/|Edg\//.test(navigator.userAgent) && !/CriOS|EdgiOS/.test(navigator.userAgent);
if (chromium && CSS.supports('backdrop-filter', 'url(#lens)')) {
	const ns = 'http://www.w3.org/2000/svg';
	const svg = document.createElementNS(ns, 'svg');
	svg.classList.add('glass-defs');
	svg.setAttribute('aria-hidden', 'true');
	svg.setAttribute('width', '0');
	svg.setAttribute('height', '0');
	const defs = document.createElementNS(ns, 'defs');
	svg.append(defs);
	document.body.append(svg);
	const lenses = new Map();
	const cache = new Map();
	let counter = 0;
	let timer;
	let frame;
	const reduced = matchMedia('(prefers-reduced-motion: reduce)');
	const compact = matchMedia('(max-width: 960px)');
	const useLens = element => !compact.matches || element.matches('.home-ref .topbar .floating-capsule');
	// Vaso settings: IOR 1.5, bezel 60% of the half-height, refraction .35,
	// depth 1, no blur, dispersion disabled. Quartic convex surface + Snell's law.
	const bend = t => {
		const u = 1 - Math.min(1, Math.max(0, t));
		const slope = u ** 3 / Math.max(1e-9, 1 - u ** 4) ** .75;
		const angle = Math.atan(slope);
		return Math.tan(angle - Math.asin(Math.sin(angle) / 1.5));
	};
	const peakBend = bend(0);
	const strength = lens => lens.baseScale * (1 + lens.energy * .2);
	const tick = () => {
		frame = null;
		let moving = false;
		lenses.forEach((lens, element) => {
			if (!element.isConnected) return;
			lens.velocity = (lens.velocity + (lens.target - lens.energy) * .12) * .72;
			lens.energy += lens.velocity;
			if (Math.abs(lens.target - lens.energy) + Math.abs(lens.velocity) < .002) {
				lens.energy = lens.target;
				lens.velocity = 0;
			} else moving = true;
			lens.displacement?.setAttribute('scale', String(strength(lens)));
			element.style.setProperty('--glass-flow', String(lens.energy));
		});
		if (moving) frame = requestAnimationFrame(tick);
	};
	const energize = (lens, target) => {
		lens.target = reduced.matches || document.hidden ? 0 : target;
		if (!frame) frame = requestAnimationFrame(tick);
	};
	const primitive = (name, attrs) => {
		const node = document.createElementNS(ns, name);
		Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
		return node;
	};
	const paint = (element, lens) => {
		if (!useLens(element)) return;
		const width = Math.round(element.offsetWidth);
		const height = Math.round(element.offsetHeight);
		if (!width || !height) return;
		const radius = Math.min(Math.min(width, height) / 2, parseFloat(getComputedStyle(element).borderTopLeftRadius) || Math.min(width, height) / 2);
		const rim = radius * .6;
		lens.baseScale = 2 * rim * .35 * Number(element.dataset.glassDepth || 1);
		lens.filter.setAttribute('data-rest-scale', String(lens.baseScale));
		const key = `${width}:${height}:${radius}`;
		if (lens.key === key) return;
		lens.key = key;
		let map = cache.get(key);
		if (!map) {
			// Generate at capped resolution once per size, never on animation frames.
			const ratio = Math.min(1, Math.sqrt(160000 / (width * height)));
			const canvas = document.createElement('canvas');
			canvas.width = Math.max(1, Math.round(width * ratio));
			canvas.height = Math.max(1, Math.round(height * ratio));
			const context = canvas.getContext('2d');
			if (!context) return;
			const image = context.createImageData(canvas.width, canvas.height);
			for (let y = 0; y < canvas.height; y++) {
				for (let x = 0; x < canvas.width; x++) {
					const px = (x + .5) / ratio - width / 2;
					const py = (y + .5) / ratio - height / 2;
					const dx = px - Math.max(-width / 2 + radius, Math.min(width / 2 - radius, px));
					const dy = py - Math.max(-height / 2 + radius, Math.min(height / 2 - radius, py));
					const length = Math.hypot(dx, dy);
					const distance = radius - length;
					// Monotonic bending: strongest at the rim, smoothly flat inside.
					const amount = distance < rim ? bend(distance / rim) / peakBend : 0;
					const index = (y * canvas.width + x) * 4;
					image.data[index] = 128 - 127 * amount * dx / Math.max(length, 1);
					image.data[index + 1] = 128 - 127 * amount * dy / Math.max(length, 1);
					image.data[index + 2] = 128;
					image.data[index + 3] = 255;
				}
			}
			context.putImageData(image, 0, 0);
			map = canvas.toDataURL();
			if (cache.size >= 24) cache.delete(cache.keys().next().value);
			cache.set(key, map);
		}
		lens.filter.replaceChildren(primitive('feImage', { href: map, width, height, preserveAspectRatio: 'none', result: 'lens' }));
		lens.filter.setAttribute('width', width);
		lens.filter.setAttribute('height', height);
		// A single achromatic lens: every color channel follows the same ray.
		lens.displacement = primitive('feDisplacementMap', { in: 'SourceGraphic', in2: 'lens', scale: strength(lens), xChannelSelector: 'R', yChannelSelector: 'G' });
		lens.filter.append(lens.displacement);
		element.style.setProperty('--glass-refraction', `url(#${lens.filter.id})`);
	};
	const resize = new ResizeObserver(entries => {
		// During the spring, stretch the existing map with its surface; redraw only once settled.
		entries.forEach(({ target }) => {
			const lens = lenses.get(target);
			if (!lens || !target.matches('.home-nav-glass') || !target.offsetWidth) return;
			for (const node of [lens.filter, lens.filter.querySelector('feImage')]) {
				node?.setAttribute('width', String(target.offsetWidth));
				node?.setAttribute('height', String(target.offsetHeight));
			}
		});
		clearTimeout(timer);
		timer = setTimeout(() => lenses.forEach((lens, element) => paint(element, lens)), 100);
	});
	const release = (element, lens) => {
		resize.unobserve(element);
		lens.abort.abort();
		lens.filter.remove();
		for (const name of ['--glass-refraction', '--glass-flow', '--glass-x', '--glass-y']) element.style.removeProperty(name);
		lenses.delete(element);
	};
	const reconcile = () => {
		lenses.forEach((lens, element) => {
			if (!element.isConnected || !useLens(element)) release(element, lens);
		});
		document.querySelectorAll('.home-ref :is(.floating-capsule, .home-nav-glass), .demo-floating-header .floating-capsule, .demo-return .floating-capsule, .demo-section-toggle.floating-capsule').forEach(element => {
			if (!useLens(element) || lenses.has(element)) return;
			const filter = primitive('filter', { id: `home-lens-${++counter}`, filterUnits: 'userSpaceOnUse', primitiveUnits: 'userSpaceOnUse', x: 0, y: 0, 'color-interpolation-filters': 'sRGB' });
			defs.append(filter);
			const lens = { filter, key: null, energy: 0, velocity: 0, target: 0, abort: new AbortController() };
			const options = { signal: lens.abort.signal, passive: true };
			element.addEventListener('glass:depth', event => {
				lens.baseScale = Math.min(element.offsetWidth, element.offsetHeight) * .42 * event.detail;
				lens.displacement?.setAttribute('scale', String(strength(lens)));
			}, options);
			element.addEventListener('pointermove', event => {
				if (reduced.matches || event.pointerType === 'touch') return;
				const rect = element.getBoundingClientRect();
				element.style.setProperty('--glass-x', `${(event.clientX - rect.left) / rect.width * 100}%`);
				element.style.setProperty('--glass-y', `${(event.clientY - rect.top) / rect.height * 100}%`);
				energize(lens, .55);
			}, options);
			element.addEventListener('pointerleave', () => energize(lens, 0), options);
			element.addEventListener('pointerdown', () => energize(lens, 1), options);
			for (const type of ['pointerup', 'pointercancel']) element.addEventListener(type, () => energize(lens, 0), options);
			// Container capsules respond to their links and buttons without extra tab stops.
			element.addEventListener('focusin', () => energize(lens, .35), options);
			element.addEventListener('focusout', event => {
				if (!element.contains(event.relatedTarget)) energize(lens, 0);
			}, options);
			lenses.set(element, lens);
			paint(element, lens);
			resize.observe(element);
		});
	};
	const mutation = new MutationObserver(reconcile);
	const main = document.querySelector('.meet-main');
	// Observe the island host too: hydration may not have produced .meet-main yet.
	const host = main ?? document.querySelector('#main-content') ?? document.querySelector('.demo-floating-header');
	if (host) mutation.observe(host, { childList: true, subtree: true });
	compact.addEventListener('change', reconcile);
	reconcile();
	const settle = () => {
		if (!reduced.matches && !document.hidden) return;
		if (frame) cancelAnimationFrame(frame);
		frame = null;
		lenses.forEach((lens, element) => {
			lens.energy = lens.velocity = lens.target = 0;
			lens.displacement?.setAttribute('scale', String(lens.baseScale));
			element.style.setProperty('--glass-flow', '0');
		});
	};
	reduced.addEventListener('change', settle);
	document.addEventListener('visibilitychange', settle);
	window.addEventListener('pagehide', (event) => {
		if (event.persisted) return;
		clearTimeout(timer);
		if (frame) cancelAnimationFrame(frame);
		reduced.removeEventListener('change', settle);
		compact.removeEventListener('change', reconcile);
		document.removeEventListener('visibilitychange', settle);
		resize.disconnect();
		mutation.disconnect();
		lenses.forEach((lens, element) => {
			lens.abort.abort();
			for (const name of ['--glass-refraction', '--glass-flow', '--glass-x', '--glass-y']) element.style.removeProperty(name);
		});
		lenses.clear();
		cache.clear();
		svg.remove();
	});
}
