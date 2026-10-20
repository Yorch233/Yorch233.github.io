import { useEffect, useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import '../../styles/yo-actions.css';

const actions = [
	['idle', 'Just relax'], ['thinking', 'Have a thought'], ['studying', 'Read a little'],
	['writing-paper', 'Write a paper'], ['coding', 'Write some code'],
	['hungry', 'Have a burger'], ['drink-coffee', 'Coffee break'],
	['happy', 'A little joy'], ['boring', 'Feeling bored'], ['daydreaming', 'Daydream'],
	['embarrassed', 'A shy smile']
];
// A freshly entered state may not be flipped again immediately.
const SWITCH_LOCK = 1200;
export default function YoActions({ triggerVisible = false, onAction }) {
	const id = 'yo-actions-' + useId().replace(/:/g, '');
	const [open, setOpen] = useState(false);
	const [locked, setLocked] = useState(false);
	const root = useRef(null);
	const returnFocus = useRef(false);
	const openState = useRef(open);
	const lockUntil = useRef(0);
	const lockTimer = useRef(0);
	const choose = mood => {
		if (Date.now() < lockUntil.current) return;
		close();
		onAction(mood);
		lockUntil.current = Date.now() + SWITCH_LOCK;
		setLocked(true);
		clearTimeout(lockTimer.current);
		lockTimer.current = setTimeout(() => setLocked(false), SWITCH_LOCK);
	};
	useEffect(() => () => clearTimeout(lockTimer.current), []);
	const close = () => { returnFocus.current = true; setOpen(false); };
	const toggle = () => {
		if (openState.current) { close(); return; }
		returnFocus.current = false;
		setOpen(true);
		requestAnimationFrame(() => root.current?.querySelector('.yo-actions-panel:not([hidden]) button')?.focus({ preventScroll: true }));
	};
	useLayoutEffect(() => {
		openState.current = open;
		if (open) root.current?.querySelector('.yo-actions-panel button')?.focus({ preventScroll: true });
		else if (returnFocus.current) {
			returnFocus.current = false;
			root.current?.parentElement?.querySelector('.yo-cloud')?.focus({ preventScroll: true });
		}
	}, [open]);
	useEffect(() => {
		const focusFirstAction = () => requestAnimationFrame(() => {
			root.current?.querySelector('.yo-actions-panel:not([hidden]) button')?.focus({ preventScroll: true });
		});
		const openFromYo = event => {
			if (!(event.target instanceof Element) || !event.target.closest('.yo-cloud')) return;
			event.preventDefault();
			setOpen(true);
			focusFirstAction();
		};
		const openFromKeyboard = event => {
			if (event.key === 'Escape' && openState.current) {
				event.stopPropagation();
				close();
				return;
			}
			if (!(event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10'))) return;
			if (!(event.target instanceof Element) || !event.target.closest('.yo-cloud')) return;
			event.preventDefault();
			setOpen(true);
			focusFirstAction();
		};
		document.addEventListener('contextmenu', openFromYo);
		document.addEventListener('keydown', openFromKeyboard);
		return () => {
			document.removeEventListener('contextmenu', openFromYo);
			document.removeEventListener('keydown', openFromKeyboard);
		};
	}, []);
	useEffect(() => {
		if (!open) return;
		const outside = event => { if (!root.current?.contains(event.target)) setOpen(false); };
		const visibility = () => { if (document.hidden) setOpen(false); };
		document.addEventListener('pointerdown', outside);
		document.addEventListener('visibilitychange', visibility);
		return () => {
			document.removeEventListener('pointerdown', outside);
			document.removeEventListener('visibilitychange', visibility);
		};
	}, [open]);
	return <div class="yo-actions" ref={root}>
		{triggerVisible && <button class="yo-actions-trigger" type="button" aria-label="Yo's action menu" aria-expanded={open} aria-controls={id} onClick={toggle}>
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
				<rect x="3.6" y="3.6" width="7.2" height="7.2" rx="1.8" />
				<rect x="13.2" y="3.6" width="7.2" height="7.2" rx="1.8" />
				<rect x="3.6" y="13.2" width="7.2" height="7.2" rx="1.8" />
				<circle cx="16.8" cy="16.8" r="3.6" />
			</svg>
		</button>}
		<div class="yo-actions-panel" id={id} hidden={!open}>
			<p>Yo’s little day</p>
			<div class="yo-actions-grid">{actions.map(([mood, label]) => <button type="button" key={mood} data-yo-action={mood} aria-disabled={locked || undefined} onClick={() => choose(mood)}>{label}</button>)}</div>
		</div>
	</div>;
}
