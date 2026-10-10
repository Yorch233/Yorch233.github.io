import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import { CITATION_FORMATS, formatCitation } from '../../lib/citations.js';
import '../../styles/citation-dialog.css';

export default function CitationDialog({ paper, trigger, onClose }) {
  const dialog = useRef(null), flight = useRef(null), card = useRef(null), tabs = useRef(null);
  const lifecycle = useRef({ closing: false, animation: null, request: 0, frame: 0 });
  const [format, setFormat] = useState('bib');
  const [status, setStatus] = useState('');
  const text = formatCitation(paper, format);
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const origin = () => {
    const target = flight.current.getBoundingClientRect();
    const source = trigger.getBoundingClientRect();
    return `translate(${source.left + source.width / 2 - target.left - target.width / 2}px, ${source.top + source.height / 2 - target.top - target.height / 2}px) rotateY(-78deg) rotateZ(-6deg) scale(.16)`;
  };
  const close = () => {
    const state = lifecycle.current;
    if (state.closing) return;
    state.closing = true;
    state.request++;
    resetTilt();
    const currentTransform = getComputedStyle(flight.current).transform;
    const currentOpacity = getComputedStyle(flight.current).opacity;
    state.animation?.cancel();
    dialog.current.dataset.closing = 'true';
    const finish = () => { dialog.current?.close(); onClose(); };
    if (reduced()) return finish();
    state.animation = flight.current.animate([
      { transform: currentTransform, opacity: currentOpacity },
      { transform: origin(), opacity: 0 }
    ], { duration: 420, easing: 'cubic-bezier(.55,0,.8,.35)', fill: 'forwards' });
    state.animation.finished.then(finish).catch(() => {});
  };
  useEffect(() => {
    const node = dialog.current;
    const state = lifecycle.current;
    const oldOverflow = document.documentElement.style.overflow;
    node.showModal();
    document.documentElement.style.overflow = 'hidden';
    if (!reduced()) {
      state.animation = flight.current.animate([
        { transform: origin(), opacity: 0 },
        { transform: 'none', opacity: 1 }
      ], { duration: 560, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
    return () => {
      state.request++;
      state.animation?.cancel();
      cancelAnimationFrame(state.frame);
      node.close();
      document.documentElement.style.overflow = oldOverflow;
      if (trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);
  useLayoutEffect(() => {
    const node = tabs.current;
    const update = () => {
      const selected = node.querySelector('[aria-selected="true"]');
      node.style.setProperty('--tab-x', selected.offsetLeft + 'px');
      node.style.setProperty('--tab-width', selected.offsetWidth + 'px');
    };
    update();
    const resize = new ResizeObserver(update);
    resize.observe(node);
    return () => resize.disconnect();
  }, [format]);
  const select = id => { lifecycle.current.request++; setFormat(id); setStatus(''); };
  const keyTabs = event => {
    const index = CITATION_FORMATS.findIndex(item => item.id === format);
    const next = { ArrowRight: (index + 1) % 4, ArrowLeft: (index + 3) % 4, Home: 0, End: 3 }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    select(CITATION_FORMATS[next].id);
    tabs.current.querySelectorAll('[role="tab"]')[next].focus();
  };
  const resetTilt = () => {
    cancelAnimationFrame(lifecycle.current.frame);
    card.current?.style.setProperty('--tilt-x', '0deg');
    card.current?.style.setProperty('--tilt-y', '0deg');
  };
  const tilt = event => {
    if (event.pointerType !== 'mouse' || reduced() || lifecycle.current.closing || lifecycle.current.animation?.playState === 'running') return;
    const rect = flight.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 2 - 1;
    const y = (event.clientY - rect.top) / rect.height * 2 - 1;
    // Only press near a corner; reading and clicking the center stays steady.
    const weight = Math.max(0, (Math.min(Math.abs(x), Math.abs(y)) - .45) / .55);
    cancelAnimationFrame(lifecycle.current.frame);
    lifecycle.current.frame = requestAnimationFrame(() => {
      card.current?.style.setProperty('--tilt-x', `${y * weight * 5}deg`);
      card.current?.style.setProperty('--tilt-y', `${-x * weight * 5}deg`);
    });
  };
  const copy = async () => {
    const request = ++lifecycle.current.request;
    setStatus('Copying…');
    try {
      await navigator.clipboard.writeText(text);
      if (request !== lifecycle.current.request) return;
      setStatus('Copied!');
      document.dispatchEvent(new CustomEvent('copy:done'));
    } catch {
      if (request !== lifecycle.current.request) return;
      setStatus('Copy unavailable. Select the citation below and copy it manually.');
    }
  };
  return <dialog ref={dialog} class="citation-dialog" aria-labelledby="citation-title" aria-describedby="citation-paper"
    onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === dialog.current) close(); }}>
    <div ref={flight} class="citation-flight" onPointerMove={tilt} onPointerLeave={resetTilt}>
      <section ref={card} class="citation-card">
        <header class="citation-header"><div><span class="citation-kicker">{paper.slug} · {paper.year}</span><h2 id="citation-title">Cite this paper</h2></div>
          <button type="button" class="citation-close" aria-label="Close citations" onClick={close} autoFocus>×</button></header>
        <p id="citation-paper" class="citation-paper">{paper.title}</p>
        <div class="citation-tabs" ref={tabs} role="tablist" aria-label="Citation format" onKeyDown={keyTabs}>
          <span class="citation-slider" aria-hidden="true" />
          {CITATION_FORMATS.map(item => <button key={item.id} id={'cite-tab-' + item.id} type="button" role="tab" aria-selected={format === item.id}
            aria-controls="citation-panel" tabIndex={format === item.id ? 0 : -1} onClick={() => select(item.id)}>{item.label}</button>)}
        </div>
        <div id="citation-panel" role="tabpanel" aria-labelledby={'cite-tab-' + format} tabIndex={0} class="citation-panel">
          <pre class={format === 'bib' ? 'citation-code' : 'citation-prose'}>{text}</pre>
        </div>
        <footer class="citation-footer"><span role="status" class="citation-status">{status}</span>
          <button type="button" class="citation-copy" data-glass-color="blue" disabled={status === 'Copying…'} onClick={copy}>{status === 'Copied!' ? 'Copied!' : 'Copy ' + CITATION_FORMATS.find(item => item.id === format).label}</button></footer>
      </section>
    </div>
  </dialog>;
}
