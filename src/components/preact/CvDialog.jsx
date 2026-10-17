import { useCallback, useEffect, useRef } from 'preact/hooks';
import UiIcon from './UiIcon.jsx';
import profile from '../../data/profile.json';
import { WELCOME_FRAMES } from './YoWelcome.jsx';

export default function CvDialog({ onOpenChange }) {
  const dialog = useRef(null);
  const closeButton = useRef(null);
  const trigger = useRef(null);
  const motion = useRef(null);
  const closing = useRef(false);
  const overflow = useRef(null);
  const reduced = useRef(null);

  const closed = useCallback(() => {
    motion.current?.cancel();
    motion.current = null;
    closing.current = false;
    if (overflow.current !== null) document.body.style.overflow = overflow.current;
    overflow.current = null;
    onOpenChange(false);
    if (trigger.current?.isConnected) trigger.current.focus({ preventScroll: true });
  }, [onOpenChange]);

  const close = useCallback(() => {
    if (!dialog.current?.open || closing.current) return;
    closing.current = true;
    if (!motion.current || reduced.current?.matches || document.hidden) {
      dialog.current.close();
      return;
    }
    motion.current.reverse();
    motion.current.finished.then(() => {
      if (closing.current && dialog.current?.open) dialog.current.close();
    }).catch(() => { /* Cleanup cancels the animation. */ });
  }, []);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = media;
    const open = event => {
      const button = event.target.closest?.('[data-cv-open]');
      if (!button || dialog.current?.open) return;
      event.preventDefault();
      trigger.current = button;
      overflow.current = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.current.showModal();
      closing.current = false;
      motion.current?.cancel();
      motion.current = media.matches || document.hidden || !dialog.current.animate ? null
        : dialog.current.animate(WELCOME_FRAMES, { duration: 520, easing: 'cubic-bezier(.22, 1, .36, 1)', fill: 'both' });
      onOpenChange(true);
      closeButton.current?.focus({ preventScroll: true });
    };
    const settle = () => {
      if ((media.matches || document.hidden) && motion.current?.playState === 'running') motion.current.finish();
    };
    document.addEventListener('click', open);
    media.addEventListener('change', settle);
    document.addEventListener('visibilitychange', settle);
    return () => {
      closing.current = false;
      motion.current?.cancel();
      document.removeEventListener('click', open);
      media.removeEventListener('change', settle);
      document.removeEventListener('visibilitychange', settle);
      if (overflow.current !== null) document.body.style.overflow = overflow.current;
    };
  }, [onOpenChange]);

  const backdrop = event => {
    if (event.target !== dialog.current) return;
    const bounds = dialog.current.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) close();
  };

  const containFocus = event => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.current.querySelectorAll('button:not(:disabled), a[href]')].filter(element => element.getClientRects().length);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault(); first?.focus();
    }
  };

  return <dialog id="cv-dialog" class="yo-welcome cv-dialog" ref={dialog} aria-labelledby="cv-dialog-title" aria-describedby="cv-dialog-description" onClose={closed} onCancel={event => { event.preventDefault(); close(); }} onClick={backdrop} onKeyDown={containFocus}>
    <div class="yo-welcome-scroll cv-dialog-content">
      <span class="cv-dialog-art" aria-hidden="true"><UiIcon id="cv" state="active" /></span>
      <h2 id="cv-dialog-title">My CV</h2>
      <p id="cv-dialog-description">{profile.name}’s curriculum vitae.</p>
      <p id="cv-dialog-availability" class="cv-dialog-availability">{profile.cv ? 'PDF download' : 'Temporarily missing.'}</p>
      <div class="cv-dialog-actions">
        {profile.cv
          ? <a class="topic-pill topic-pill--primary cv-dialog-download" href={profile.cv} download="Qing-Yao-CV.pdf"><UiIcon id="download" />Download CV</a>
          : <button class="topic-pill topic-pill--primary cv-dialog-download" type="button" disabled aria-describedby="cv-dialog-availability"><UiIcon id="download" />Download CV</button>}
        <button class="cv-dialog-close" ref={closeButton} type="button" onClick={close}><UiIcon id="close" />Close</button>
      </div>
    </div>
  </dialog>;
}
