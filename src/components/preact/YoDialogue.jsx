import { useEffect, useMemo, useState } from 'preact/hooks';
import '../../styles/yo-dialogue.css';

// Keep a complete accessible copy in flow so typing never resizes the bubble
// or sends partial words to a live region. Only the visual copy is animated.
export default function YoDialogue({ text, active = true }) {
	const [typing, setTyping] = useState(null);
	const count = typing?.text === text && typing.active === active ? typing.count : 0;
	const letters = useMemo(() => typeof Intl.Segmenter === 'function'
		? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text), item => item.segment)
		: Array.from(text), [text]);
	useEffect(() => {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)');
		let timer;
		let stopped = false;
		const complete = () => {
			clearTimeout(timer);
			stopped = true;
			setTyping({ text, active, count: letters.length });
		};
		const step = Math.min(24, 2400 / Math.max(1, letters.length));
		const start = () => {
			clearTimeout(timer);
			stopped = false;
			if (!active || !letters.length || reduced.matches || document.hidden) { complete(); return; }
			setTyping({ text, active, count: 0 });
			let index = 0;
			const tick = () => {
				if (stopped) return;
				index += 1;
				setTyping({ text, active, count: index });
				if (index < letters.length) timer = setTimeout(tick, step);
			};
			// Let the gentle upward entrance settle before the first character.
			timer = setTimeout(tick, 180);
		};
		const onHidden = () => { if (document.hidden) complete(); };
		start();
		reduced.addEventListener('change', start);
		document.addEventListener('visibilitychange', onHidden);
		return () => {
			stopped = true;
			clearTimeout(timer);
			reduced.removeEventListener('change', start);
			document.removeEventListener('visibilitychange', onHidden);
		};
	}, [text, active, letters]);
	return <span key={text} class="yo-dialogue" data-active={active ? 'true' : 'false'} data-typing={active && count < letters.length ? 'true' : 'false'}>
		<span class="yo-dialogue-copy">{text}</span>
		<span class="yo-dialogue-visual" aria-hidden="true">{letters.slice(0, count).join('')}</span>
	</span>;
}
