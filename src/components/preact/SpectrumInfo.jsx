import { useId, useRef, useState } from 'preact/hooks';
import UiIcon from './UiIcon.jsx';
import '../../styles/spectrum.css';

export default function SpectrumInfo({ metadata }) {
  const id = useId();
  const buttonRef = useRef(null);
  const [open, setOpen] = useState(false);
  const windowMs = metadata ? metadata.windowSize / metadata.sampleRate * 1000 : 10;
  return <span class="spectrum-info" data-open={open || undefined}
    onPointerEnter={event => { if (event.pointerType === 'mouse') setOpen(true); }}
    onPointerLeave={event => { if (event.pointerType === 'mouse' && !buttonRef.current?.matches(':focus-visible')) setOpen(false); }}>
    <button ref={buttonRef} type="button" class="spectrum-info-button" aria-label="Spectrum settings"
      aria-describedby={id} aria-expanded={open}
      onClick={() => setOpen(true)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)}
      onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); event.preventDefault(); setOpen(false); } }}>
      <UiIcon id="help-circle" />
    </button>
    <span id={id} class="spectrum-info-tooltip" role="tooltip">
      <span>Window: {windowMs.toFixed(1)} ms (Hann)</span>
      <span>FFT: {metadata?.fftSize || 4096} points, zero-padded</span>
      {metadata && <>
        <span>Bins: {(metadata.sampleRate / metadata.fftSize).toFixed(1)} Hz</span>
      </>}
    </span>
  </span>;
}
