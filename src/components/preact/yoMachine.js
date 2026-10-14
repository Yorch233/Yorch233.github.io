import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { advanceYo, initialYoState, transitionYo, yoMood } from '../../lib/yo-state.js';

// A single discrete timer; SVG interpolation and pointer gaze remain in refs.
export function useYoMachine({ reading = false, paused = false, attentive = false, audio = false, hidden = false } = {}) {
	const [mood, setMood] = useState('appearing');
	const [reducedMotion, setReducedMotion] = useState(false);
	const [waitingQuiet, setWaitingQuiet] = useState(false);
	const state = useRef(initialYoState());
	const visible = useRef(true);
	const context = useRef({ reading, paused, attentive, audio });
	const publish = useCallback(() => {
		const now = performance.now();
		state.current = advanceYo(state.current, now, { ...context.current, suspended: document.hidden || !visible.current });
		setMood(yoMood(state.current, now, context.current));
		setWaitingQuiet(state.current.pendingAt !== null && now - state.current.pendingAt >= 30000);
	}, []);
	const dispatch = useCallback(event => {
		state.current = transitionYo(state.current, event, performance.now());
		publish();
	}, [publish]);
	const react = useCallback((next, duration, priority = 4) => dispatch({ type: 'react', mood: next, duration, priority }), [dispatch]);
	const reset = useCallback(() => dispatch({ type: 'reset' }), [dispatch]);
	const cancel = useCallback(() => dispatch({ type: 'cancel' }), [dispatch]);
	const stopSpeech = useCallback(() => { if (state.current.reaction === 'speaking') cancel(); }, [cancel]);
	const onVisibilityChange = useCallback(value => {
		if (visible.current === value) return;
		visible.current = value;
		if (value) reset(); else cancel();
	}, [reset, cancel]);
	useEffect(() => {
		const previous = context.current;
		context.current = { reading, paused, attentive, audio, reducedMotion };
		if (previous.reading !== reading || previous.paused !== paused || previous.audio !== audio || previous.reducedMotion !== reducedMotion) cancel();
		publish();
	}, [reading, paused, attentive, audio, reducedMotion, cancel, publish]);
	useEffect(() => { dispatch({ type: 'presence', visible: !hidden }); }, [hidden, dispatch]);
	useEffect(() => {
		const media = matchMedia('(prefers-reduced-motion: reduce)');
		const preference = () => setReducedMotion(media.matches);
		const activity = () => { if (!document.hidden && visible.current) dispatch({ type: 'activity' }); };
		const visibility = () => { if (document.hidden) cancel(); else if (state.current.presence === 'visible') reset(); };
		const feedback = event => react(event.type === 'copy:done' ? 'happy' : 'embarrassed');
		const pending = event => dispatch({ type: 'pending', active: event.detail === true });
		const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'];
		preference();
		events.forEach(event => window.addEventListener(event, activity, { passive: true }));
		document.addEventListener('visibilitychange', visibility);
		document.addEventListener('copy:done', feedback);
		document.addEventListener('copy:error', feedback);
		document.addEventListener('yo:pending', pending);
		media.addEventListener('change', preference);
		const timer = setInterval(() => { if (!document.hidden && visible.current) publish(); }, 200);
		return () => {
			clearInterval(timer);
			events.forEach(event => window.removeEventListener(event, activity));
			document.removeEventListener('visibilitychange', visibility);
			document.removeEventListener('copy:done', feedback);
			document.removeEventListener('copy:error', feedback);
			document.removeEventListener('yo:pending', pending);
			media.removeEventListener('change', preference);
		};
	}, [dispatch, publish, reset, cancel, react]);
	return { mood, react, reset, cancel, stopSpeech, reducedMotion, waitingQuiet, onVisibilityChange };
}
