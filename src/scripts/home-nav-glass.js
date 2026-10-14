// Desktop keeps the original glass spring; mobile uses an inset white selection.
const track = document.querySelector('.home-nav-links');
const indicator = track.querySelector('.home-nav-indicator');
const capsule = track.closest('.actions-pill');
const glass = indicator.querySelector('.home-nav-glass');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 961px)');
const abort = new AbortController();
const options = { signal: abort.signal };
const pill = { x: 0, width: 0, vx: 0, vw: 0, targetX: 0, targetWidth: 0 };
let frame, previous;
const draw = () => {
  const active = track.querySelector('.toplink[aria-current]');
  if (!active) return;
  const height = capsule.offsetHeight + 12;
  const remaining = pill.targetX - pill.x;
  const room = remaining < 0 ? pill.x + 2 : track.clientWidth + 2 - pill.x - pill.width;
  const stretch = Math.max(0, Math.min(36, Math.abs(remaining) * .35, room));
  const flatten = Math.min(6, stretch * .2);
  indicator.style.width = `${pill.width + stretch}px`;
  indicator.style.height = `${height - flatten}px`;
  indicator.style.top = `${active.offsetTop - (height - active.offsetHeight) / 2 + flatten / 2}px`;
  indicator.style.transform = `translate3d(${pill.x - (remaining < 0 ? stretch : 0)}px, 0, 0)`;
  const depth = 1.4 + stretch * .04;
  glass.dataset.glassDepth = String(depth);
  glass.dispatchEvent(new CustomEvent('glass:depth', { detail: depth }));
};
const stop = () => {
  if (frame) cancelAnimationFrame(frame);
  frame = previous = null;
  pill.x = pill.targetX; pill.width = pill.targetWidth; pill.vx = pill.vw = 0;
  if (desktop.matches) draw();
};
const tick = time => {
  const dt = Math.min((time - (previous ?? time - 16.67)) / 1000, .032);
  previous = time;
  pill.vx += ((pill.targetX - pill.x) * 300 - pill.vx * 17) * dt;
  pill.vw += ((pill.targetWidth - pill.width) * 300 - pill.vw * 17) * dt;
  pill.x += pill.vx * dt; pill.width += pill.vw * dt;
  if (Math.abs(pill.targetX - pill.x) + Math.abs(pill.targetWidth - pill.width) + Math.abs(pill.vx) + Math.abs(pill.vw) < .08) {
    stop();
  } else { draw(); frame = requestAnimationFrame(tick); }
};
const sync = (immediate = false) => {
  if (!desktop.matches) {
    stop(); pill.width = 0;
    const active = track.querySelector('.toplink[aria-current]');
    if (!active) return;
    const height = capsule.offsetHeight - 12;
    /* The five links are uniform 50×50 round icon buttons; the selection is
       a 64×50 full-radius capsule centered on the active one. */
    const width = 64;
    indicator.dataset.instant = String(immediate || reduced.matches || document.hidden);
    indicator.style.width = `${width}px`;
    indicator.style.height = `${active.offsetHeight}px`;
    indicator.style.top = `${active.offsetTop}px`;
    indicator.style.transform = `translate3d(${active.offsetLeft + (active.offsetWidth - width) / 2}px, 0, 0)`;
    return;
  }
  const active = track.querySelector('.toplink[aria-current]');
  if (!active) return;
  const x = active.offsetLeft - 8, width = active.offsetWidth + 16;
  const changed = x !== pill.targetX || width !== pill.targetWidth;
  pill.targetX = x; pill.targetWidth = width;
  if (immediate || !pill.width || reduced.matches || document.hidden) stop();
  else if (changed && !frame) frame = requestAnimationFrame(tick);
};
const selection = new MutationObserver(() => sync());
selection.observe(track, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
const resize = new ResizeObserver(() => sync(true));
resize.observe(track);
resize.observe(capsule);
track.querySelectorAll('.toplink').forEach(link => resize.observe(link));
desktop.addEventListener('change', () => sync(true), options);
reduced.addEventListener('change', () => sync(true), options);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); }, options);
document.fonts.ready.then(() => { if (!abort.signal.aborted) sync(true); });
sync(true);
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  stop(); abort.abort(); resize.disconnect(); selection.disconnect();
}, { once: true });
