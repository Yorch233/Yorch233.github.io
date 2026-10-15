import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import YoCloud from './YoCloud.jsx';
import YoDialogue from './YoDialogue.jsx';

const SEEN_KEY = 'yo-welcome.v1';
export const WELCOME_FRAMES = [
	{ opacity: 0, transform: 'translateY(calc(-50vh - 50%)) scale(.72)' },
	{ opacity: 1, transform: 'translateY(0) scale(1)' }
];

export default function YoWelcome({ onOpenChange }) {
	const dialog = useRef(null);
	const explore = useRef(null);
	const timer = useRef(0);
	const restoreOverflow = useRef(null);
	const entrance = useRef(null);
	const closing = useRef(false);
	const reducedMotion = useRef(null);
	const [visible, setVisible] = useState(false);
	const [mood, setMood] = useState('idle');
	const [petted, setPetted] = useState(false);
	const greet = useCallback(() => {
		clearTimeout(timer.current);
		setMood('happy');
		timer.current = setTimeout(() => { setMood('idle'); setPetted(false); }, 1800);
	}, []);
	const open = useCallback(() => {
		if (dialog.current.open) return;
		restoreOverflow.current = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		dialog.current.showModal();
		closing.current = false;
		entrance.current?.cancel();
		entrance.current = reducedMotion.current?.matches || document.hidden || !dialog.current.animate ? null
			: dialog.current.animate(WELCOME_FRAMES, { duration: 520, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' });
		setVisible(true);
		onOpenChange(true);
		greet();
		explore.current.focus({ preventScroll: true });
	}, [greet, onOpenChange]);
	const closed = useCallback(() => {
		closing.current = false;
		entrance.current?.cancel();
		entrance.current = null;
		clearTimeout(timer.current);
		setMood('idle');
		setPetted(false);
		setVisible(false);
		onOpenChange(false);
		if (restoreOverflow.current !== null) {
			document.body.style.overflow = restoreOverflow.current;
			restoreOverflow.current = null;
		}
		try { localStorage.setItem(SEEN_KEY, 'seen'); } catch { /* Storage may be unavailable. */ }
		document.querySelector('.hero-name, #section-heading')?.focus({ preventScroll: true });
	}, [onOpenChange]);
	const close = () => {
		if (!dialog.current?.open || closing.current) return;
		closing.current = true;
		const motion = entrance.current;
		if (reducedMotion.current?.matches || !motion) {
			dialog.current.close();
			return;
		}
		// Reverse the same animation, including an interrupted entrance.
		motion.reverse();
		motion.finished.then(() => {
			if (closing.current && dialog.current?.open) dialog.current.close();
		}).catch(() => { /* Unmounting cancels the animation and its completion. */ });
	};
	useEffect(() => {
		const reduced = matchMedia('(prefers-reduced-motion: reduce)');
		reducedMotion.current = reduced;
		const settle = () => {
			if ((reduced.matches || document.hidden) && entrance.current?.playState === 'running') entrance.current.finish();
		};
		reduced.addEventListener('change', settle);
		document.addEventListener('visibilitychange', settle);
		let seen = false;
		try { seen = localStorage.getItem(SEEN_KEY) === 'seen'; } catch { /* Still offer the introduction. */ }
		// Direct links go straight to the requested reading section. The modal
		// lives in the browser's top layer, so it must wait for the page loader
		// to hand off (page:ready) instead of covering the white splash.
		let waiting = false;
		if (!seen && !matchMedia('(max-width: 960px)').matches && (!location.hash || location.hash === '#about')) {
			if (document.documentElement.classList.contains('is-revealed')) open();
			else {
				window.addEventListener('page:ready', open, { once: true });
				waiting = true;
			}
		}
		return () => {
			clearTimeout(timer.current);
			closing.current = false;
			entrance.current?.cancel();
			entrance.current = null;
			reduced.removeEventListener('change', settle);
			document.removeEventListener('visibilitychange', settle);
			if (waiting) window.removeEventListener('page:ready', open);
			if (restoreOverflow.current !== null) document.body.style.overflow = restoreOverflow.current;
			restoreOverflow.current = null;
		};
	}, [open]);
	const backdrop = event => {
		if (event.target !== dialog.current) return;
		const bounds = dialog.current.getBoundingClientRect();
		if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
	};
	return <dialog class="yo-welcome" ref={dialog} aria-labelledby="yo-welcome-title" aria-describedby="yo-welcome-description" onClose={closed} onCancel={event => { event.preventDefault(); close(); }} onClick={backdrop}>
		<button class="yo-welcome-close" type="button" aria-label="Close introduction" onClick={close}><span aria-hidden="true">×</span></button>
		<div class="yo-welcome-scroll">
			<div class="yo-welcome-cloud">
				{visible && <YoCloud label="Give Yo a gentle pat" mood={mood} onPet={() => { setPetted(true); greet(); }} />}
			</div>
			<div class="yo-welcome-copy">
				<h2 id="yo-welcome-title">Hi, I’m Yo.</h2>
				<p id="yo-welcome-description"><YoDialogue active={visible} text="I am Qing's Bot. This is Qing's academic home. His research turns noisy speech into clear, natural sound. News, publications and awards are all here." /></p>
				<p class="yo-welcome-note" aria-live="polite"><YoDialogue active={visible && petted} text={petted ? 'Hehe. That tickles!' : ''} /></p>
				<button ref={explore} class="topic-pill topic-pill--primary yo-welcome-explore" type="button" onClick={close}>Explore <span aria-hidden="true">→</span></button>
				<button class="yo-welcome-skip" type="button" onClick={close}>Skip</button>
			</div>
		</div>
	</dialog>;
}
