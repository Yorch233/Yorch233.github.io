import { useCallback, useEffect, useRef } from 'preact/hooks';
import UiIcon from './UiIcon.jsx';

export default function DemoLink({ paper }) {
	const animations = useRef([]);
	const hovered = useRef(false);
	const focused = useRef(false);
	const reset = useCallback(() => {
		animations.current.forEach(animation => animation.cancel());
		animations.current = [];
	}, []);

	useEffect(() => {
		const cancel = () => { hovered.current = false; focused.current = false; reset(); };
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
		window.addEventListener('pagehide', cancel);
		reduced.addEventListener('change', cancel);
		return () => {
			window.removeEventListener('pagehide', cancel);
			reduced.removeEventListener('change', cancel);
			cancel();
		};
	}, [reset]);

	const play = link => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.hidden) return;
		const stars = [...link.querySelectorAll('[data-sparkle]')];
		if (!stars.length || !stars.every(star => typeof star.animate === 'function')) return;
		reset();
		// Match the opposite star's bounds: 14×16 at (9,13), 8×8 at (19,6).
		animations.current = stars.map(star => star.animate(star.dataset.sparkle === 'large' ? [
			{ transform: 'translate(0, 0) rotate(0deg) scale(1, 1)' },
			{ transform: 'translate(2px, -11px) rotate(-35deg) scale(.8, .75)' },
			{ transform: 'translate(10px, -7px) rotate(0deg) scale(.5714285714, .5)' }
		] : [
			{ transform: 'translate(0, 0) rotate(0deg) scale(1, 1)' },
			{ transform: 'translate(-2px, 11px) rotate(35deg) scale(1.375, 1.5)' },
			{ transform: 'translate(-10px, 7px) rotate(0deg) scale(1.75, 2)' }
		], { duration: 360, easing: 'cubic-bezier(.22,.7,.22,1)', fill: 'forwards' }));
	};

	return <a class="link-pill link-pill--primary pub-demo-link" href={paper.demo}
		onPointerEnter={event => { if (event.pointerType === 'touch') return; hovered.current = true; play(event.currentTarget); }}
		onPointerLeave={() => { hovered.current = false; if (!focused.current) reset(); }}
		onFocus={event => {
			if (!event.currentTarget.matches(':focus-visible')) return;
			focused.current = true;
			if (!hovered.current) play(event.currentTarget);
		}}
		onBlur={() => { focused.current = false; if (!hovered.current) reset(); }}
		data-yo-say={paper.slug === 'RSB' ? 'Want to hear the difference? Let’s try the RSB Demo.' : 'Let’s explore the CoF Demo and its results.'}>
		<UiIcon id={paper.demoIcon} />{paper.demoLabel}
	</a>;
}
