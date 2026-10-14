const root = document.documentElement;
const button = document.querySelector('.theme-toggle');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const key = 'home-theme.v1';
let busy = false;
const saved = () => { try { return localStorage.getItem(key); } catch { return null; } };
const valid = theme => theme === 'dark' || theme === 'light';
const apply = theme => {
	root.dataset.theme = theme;
	const dark = theme === 'dark';
	const label = dark ? 'Switch to light mode' : 'Switch to dark mode';
	button?.setAttribute('aria-label', label);
	button?.setAttribute('title', label);
	button?.setAttribute('aria-pressed', String(dark));
	document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111b2b' : '#f7faff');
};
const sync = () => {
	const preference = saved();
	apply(valid(preference) ? preference : 'light');
};
const toggle = async () => {
	if (busy || !button) return;
	const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
	try { localStorage.setItem(key, theme); } catch { /* Theme still works without storage. */ }
	if (reduced.matches || !document.startViewTransition) { apply(theme); return; }
	busy = true;
	root.dataset.themeTransition = 'running';
	const rect = button.getBoundingClientRect();
	const x = rect.left + rect.width / 2, y = rect.top + rect.height / 2;
	const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 10;
	const transition = document.startViewTransition(() => apply(theme));
	try {
		await transition.ready;
		await root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
			{ duration: 520, easing: 'cubic-bezier(.2,.7,.2,1)', pseudoElement: '::view-transition-new(root)' }).finished;
		await transition.finished;
	} catch { apply(theme); transition.skipTransition(); }
	finally { busy = false; delete root.dataset.themeTransition; }
};
const storage = event => { if (event.key === key || event.key === null) sync(); };
sync();
button?.addEventListener('click', toggle);
window.addEventListener('storage', storage);
window.addEventListener('pageshow', sync);
window.addEventListener('pagehide', event => {
	if (event.persisted) return;
	button?.removeEventListener('click', toggle);
	window.removeEventListener('storage', storage);
	window.removeEventListener('pageshow', sync);
}, { once: true });
