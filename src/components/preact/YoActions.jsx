import { useEffect, useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import '../../styles/yo-actions.css';

const actions = [
	['idle', 'Just relax'], ['thinking', 'Have a thought'], ['studying', 'Read a little'],
	['writing-paper', 'Write a paper'], ['coding', 'Write some code'],
	['hungry', 'Have a burger'], ['drink-coffee', 'Coffee break'],
	['happy', 'A little joy'], ['boring', 'Feeling bored'], ['daydreaming', 'Daydream'],
	['embarrassed', 'A shy smile']
];
export default function YoActions({ hidden = false, onAction, onHide, onShow }) {
	const id = 'yo-actions-' + useId().replace(/:/g, '');
	const [open, setOpen] = useState(false);
	const root = useRef(null);
	const restoreButton = useRef(null);
	const returnFocus = useRef(false);
	const openState = useRef(open);
	const close = () => { returnFocus.current = true; setOpen(false); };
	useLayoutEffect(() => {
		openState.current = open;
		if (open) root.current?.querySelector('.yo-actions-panel button')?.focus({ preventScroll: true });
		else if (returnFocus.current) {
			returnFocus.current = false;
			const target = hidden ? restoreButton.current : root.current?.parentElement?.querySelector('.yo-cloud');
			target?.focus({ preventScroll: true });
		}
	}, [open]);
	useEffect(() => { if (hidden) setOpen(false); }, [hidden]);
	useEffect(() => {
		if (hidden) return;
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
	}, [hidden]);
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
		{hidden && <button ref={restoreButton} class="yo-actions-revive" type="button" aria-label="Bring Yo back" onClick={() => {
			onShow();
			requestAnimationFrame(() => root.current?.parentElement?.querySelector('.yo-cloud')?.focus({ preventScroll: true }));
		}}><span aria-hidden="true">Yo</span></button>}
		<div class="yo-actions-panel" id={id} hidden={!open || hidden}>
			<p>Yo’s little day</p>
			<div class="yo-actions-grid">{actions.map(([mood, label]) => <button type="button" key={mood} data-yo-action={mood} onClick={() => { close(); onAction(mood); }}>{label}</button>)}</div>
			<button class="yo-actions-hide" type="button" onClick={() => { close(); onHide(); }}>Let Yo rest offscreen</button>
		</div>
	</div>;
}
