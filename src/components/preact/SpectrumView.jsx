import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { getDecodeContext, loadOpus } from './AudioDemoShared.jsx';
import { spectrumFrequencyPosition } from '../../lib/spectrum.js';
import '../../styles/spectrum.css';
import SpectrumInfo from './SpectrumInfo.jsx';

const FREQUENCY_TICKS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

const blendSpectra = (from, to, progress) => {
  if (progress <= 0) return from;
  if (progress >= 1) return to;
  if (!from || !to || from.frequencies.length !== to.frequencies.length ||
    from.sampleRate !== to.sampleRate || from.fftSize !== to.fftSize) return to;
  const count = from.frequencies.length;
  const frequencies = new Float32Array(count);
  const energies = new Float32Array(count);
  for (let index = 0; index < count; index += 1) {
    frequencies[index] = from.frequencies[index] + (to.frequencies[index] - from.frequencies[index]) * progress;
    energies[index] = from.energies[index] + (to.energies[index] - from.energies[index]) * progress;
  }
  return { ...to, frequencies, energies, time: from.time + (to.time - from.time) * progress };
};

export default function SpectrumView({ tracks, time = 0, playing = false, audioRef, highlightedTrack = null }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const latestRef = useRef(null);
  const sessionRef = useRef(null);
  const framesRef = useRef([]);
  const renderedRef = useRef(null);
  const visibleRef = useRef(false);
  const reducedRef = useRef(false);
  const samplerAnimationRef = useRef(0);
  const transitionAnimationRef = useRef(0);
  const requestRef = useRef(() => {});
  const drawRef = useRef(() => {});
  const syncRef = useRef(() => {});
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [metadata, setMetadata] = useState(null);
  latestRef.current = { tracks, time, playing, audioRef, highlightedTrack };
  const identity = JSON.stringify(tracks.map(track => track.url));

  const readTime = useCallback(() => {
    const latest = latestRef.current;
    const audio = latest.audioRef?.current;
    const expected = sessionRef.current?.audioUrl;
    return audio && expected && (audio.src === expected || audio.currentSrc === expected) ? audio.currentTime : latest.time;
  }, []);

  drawRef.current = () => {
    const canvas = canvasRef.current;
    const frames = framesRef.current;
    if (!canvas || !frames.length || !visibleRef.current || document.hidden) return;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    const context = canvas.getContext('2d');
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    const left = 48, right = 16, top = 28, bottom = 42;
    const plotWidth = width - left - right, plotHeight = height - top - bottom;
    const font = getComputedStyle(canvas).fontFamily;
    context.font = `380 13px ${font}`;
    context.textBaseline = 'middle';
    context.fillStyle = '#5e6e84';
    context.textAlign = 'left';
    context.fillText('Energy (dBFS)', 0, 12);
    const baselineY = top + plotHeight;
    for (const level of [-100, -80, -60, -40, -20, 0]) {
      const y = top + (-level / 100) * plotHeight;
      context.strokeStyle = '#dce6f2';
      context.lineWidth = 1;
      context.beginPath(); context.moveTo(left, y); context.lineTo(width - right, y); context.stroke();
      context.textAlign = 'right'; context.fillText(String(level), left - 8, y);
    }
    const ticks = plotWidth < 300 ? [20, 200, 2000, 20000]
      : plotWidth < 500 ? [20, 100, 500, 2000, 20000]
        : FREQUENCY_TICKS;
    for (const frequency of ticks) {
      const x = left + spectrumFrequencyPosition(frequency) * plotWidth;
      context.strokeStyle = '#e7edf5';
      context.beginPath(); context.moveTo(x, top); context.lineTo(x, height - bottom); context.stroke();
      context.textAlign = frequency === 20 ? 'left' : frequency === 20000 ? 'right' : 'center';
      context.fillText(frequency >= 1000 ? `${frequency / 1000}k` : String(frequency), x, height - bottom + 15);
    }
    context.textAlign = 'center'; context.fillText('Frequency (Hz)', left + plotWidth / 2, height - 7);
    const target = renderedRef.current;
    // from/to are arrays of track frames, not individual frames with a time.
    if (target?.from && target?.to && target.progress < 1) {
      const elapsed = performance.now() - target.startedAt;
      target.progress = Math.min(1, elapsed / target.duration);
      target.rendered = target.from.map((from, index) => blendSpectra(from, target.to[index], target.progress));
      if (target.progress < 1) {
        cancelAnimationFrame(transitionAnimationRef.current);
        transitionAnimationRef.current = requestAnimationFrame(drawRef.current);
      }
    }
    context.save(); context.beginPath(); context.rect(left - 2, top - 2, plotWidth + 4, plotHeight + 4); context.clip();
    frames.forEach((frame, index) => {
      const track = latestRef.current.tracks[index];
      if (!track) return;
      const rendered = target?.rendered?.[index] || frame;
      const { frequencies, energies } = rendered;
      const nyquist = Math.min(20000, frame.sampleRate / 2);
      let first = 0;
      while (first < frequencies.length && frequencies[first] < 20) first += 1;
      let last = first - 1;
      while (last + 1 < frequencies.length && frequencies[last + 1] <= nyquist) last += 1;
      const x = bin => left + spectrumFrequencyPosition(frequencies[bin]) * plotWidth;
      const y = bin => top + (-Math.min(0, Math.max(-100, energies[bin])) / 100) * plotHeight;
      if (first > last) return;
      context.globalAlpha = latestRef.current.highlightedTrack == null || latestRef.current.highlightedTrack === index ? 1 : .18;
      const dimming = context.globalAlpha;
      const lineColor = track.lineColor || '#2f68c4';
      context.strokeStyle = lineColor; context.lineWidth = 1.5;
      context.globalAlpha = dimming * .09;
      context.fillStyle = lineColor;
      context.beginPath();
      context.moveTo(x(first), y(first));
      for (let bin = first + 1; bin <= last; bin += 1) context.lineTo(x(bin), y(bin));
      context.lineTo(x(last), baselineY); context.lineTo(x(first), baselineY); context.closePath(); context.fill();
      context.globalAlpha = dimming;
      context.strokeStyle = lineColor;
      context.lineJoin = 'round'; context.lineCap = 'round';
      context.beginPath();
      context.moveTo(x(first), y(first));
      for (let bin = first + 1; bin < last; bin += 1) {
        const previous = bin - 1, next = bin + 1;
        const controlX = (x(previous) + x(next)) / 2;
        const controlY = (y(previous) + y(next)) / 2;
        context.quadraticCurveTo(x(bin), y(bin), controlX, controlY);
      }
      if (last > first) {
        context.quadraticCurveTo(x(last - 1), y(last - 1), x(last), y(last));
      }
      context.stroke();
    });
    context.restore();
    const frame = frames[0];
    canvas.dataset.time = String(frame.time);
  };

  useEffect(() => {
    let cancelled = false;
    const currentTracks = latestRef.current.tracks.slice(0, 2);
    const session = { workers: [], ready: currentTracks.map(() => false), received: [], id: 0, inFlight: false, pending: null, lastSent: -Infinity, disposed: false, audioUrl: null, metadataSent: false };
    sessionRef.current = session;
    framesRef.current = [];
    renderedRef.current = null;
    setMetadata(null);
    setStatus('loading'); setError('');
    const fail = () => {
      if (cancelled || session.disposed) return;
      session.disposed = true;
      session.workers.forEach(worker => worker?.terminate());
      cancelAnimationFrame(samplerAnimationRef.current);
      samplerAnimationRef.current = 0;
      cancelAnimationFrame(transitionAnimationRef.current);
      transitionAnimationRef.current = 0;
      setError('Spectrum unavailable. Audio playback is still available.'); setStatus('error');
    };
    requestRef.current = (nextTime, force = false) => {
      if (cancelled || session.disposed || !session.ready.length || !session.ready.every(Boolean) || !visibleRef.current || document.hidden) return;
      if (session.inFlight) { session.pending = { time: nextTime, force }; return; }
      if (!force && performance.now() - session.lastSent < (reducedRef.current ? 250 : 50)) return;
      session.lastSent = performance.now(); session.inFlight = true; session.received = [];
      const id = ++session.id;
      session.workers.forEach(worker => worker.postMessage({ type: 'frame', id, time: nextTime }));
    };
    currentTracks.forEach((track, index) => {
      (async () => {
        const resource = await loadOpus(track.url);
        if (cancelled || session.disposed) return;
        if (index === currentTracks.length - 1) session.audioUrl = resource.objectUrl;
        const decoded = await getDecodeContext().decodeAudioData(resource.buffer.slice(0));
        if (cancelled || session.disposed) return;
        const worker = new Worker(new URL('../../workers/spectrum.worker.js', import.meta.url), { type: 'module' });
        session.workers[index] = worker;
        worker.onerror = event => { event.preventDefault(); fail(); };
        worker.onmessage = ({ data }) => {
          if (cancelled || session.disposed) return;
          if (data.type === 'error') { fail(); return; }
          if (data.type === 'ready') {
            session.ready[index] = true;
            if (session.ready.every(Boolean)) { requestRef.current(readTime(), true); syncRef.current(); }
            return;
          }
          if (data.type !== 'frame' || data.id !== session.id) return;
          session.received[index] = data;
          if (currentTracks.every((_, position) => session.received[position])) {
            session.inFlight = false;
            const previous = renderedRef.current?.rendered || framesRef.current;
            framesRef.current = session.received.slice();
            if (!session.metadataSent) {
              session.metadataSent = true;
              const { sampleRate, fftSize, windowSize } = framesRef.current[0];
              setMetadata({ sampleRate, fftSize, windowSize });
            }
            const active = latestRef.current.playing && !reducedRef.current && visibleRef.current && !document.hidden;
            renderedRef.current = active ? {
              from: previous.length ? previous : framesRef.current,
              to: framesRef.current,
              rendered: previous.length ? previous : framesRef.current,
              progress: 0,
              duration: reducedRef.current ? 0 : 160,
              startedAt: performance.now()
            } : null;
            drawRef.current(); setStatus(current => current === 'ready' ? current : 'ready');
            const pending = session.pending; session.pending = null;
            if (pending) requestRef.current(pending.time, pending.force);
          }
        };
        const samples = decoded.getChannelData(0).slice();
        worker.postMessage({ type: 'init', samples: samples.buffer, sampleRate: decoded.sampleRate }, [samples.buffer]);
      })().catch(fail);
    });
    return () => {
      cancelled = true; session.disposed = true;
      session.workers.forEach(worker => worker?.terminate());
      if (sessionRef.current === session) sessionRef.current = null;
      cancelAnimationFrame(samplerAnimationRef.current);
      samplerAnimationRef.current = 0;
      cancelAnimationFrame(transitionAnimationRef.current);
      transitionAnimationRef.current = 0;
    };
  }, [identity, attempt, readTime]);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    reducedRef.current = media.matches;
    const stop = () => {
      cancelAnimationFrame(samplerAnimationRef.current);
      samplerAnimationRef.current = 0;
    };
    const update = () => {
      samplerAnimationRef.current = 0;
      const session = sessionRef.current;
      if (!latestRef.current.playing || reducedRef.current || !visibleRef.current || document.hidden || session?.disposed) return;
      requestRef.current(readTime());
      samplerAnimationRef.current = requestAnimationFrame(update);
    };
    syncRef.current = () => {
      stop();
      if (latestRef.current.playing && !reducedRef.current && visibleRef.current && !document.hidden && !sessionRef.current?.disposed) samplerAnimationRef.current = requestAnimationFrame(update);
    };
    const refresh = () => {
      syncRef.current();
      if (!document.hidden && visibleRef.current) { requestRef.current(readTime(), true); drawRef.current(); }
    };
    const motion = () => { reducedRef.current = media.matches; refresh(); };
    const observer = new IntersectionObserver(entries => {
      visibleRef.current = entries.some(entry => entry.isIntersecting);
      refresh();
    });
    observer.observe(rootRef.current);
    const resize = new ResizeObserver(() => drawRef.current()); resize.observe(canvasRef.current);
    document.addEventListener('visibilitychange', refresh);
    media.addEventListener('change', motion);
    return () => {
      stop(); observer.disconnect(); resize.disconnect();
      cancelAnimationFrame(transitionAnimationRef.current);
      transitionAnimationRef.current = 0;
      document.removeEventListener('visibilitychange', refresh); media.removeEventListener('change', motion);
      syncRef.current = () => {};
    };
  }, [readTime]);

  useEffect(() => {
    requestRef.current(readTime(), !playing);
    if (!playing) renderedRef.current = null;
    drawRef.current();
  }, [time, playing, readTime]);

  useEffect(() => { syncRef.current(); }, [playing]);

  useEffect(() => {
    renderedRef.current = null;
    drawRef.current();
  }, [highlightedTrack, tracks]);

  return <figure class="spectrum-view" ref={rootRef} aria-busy={status === 'loading'}>
    <canvas ref={canvasRef} class="spectrum-canvas" role="img" aria-label={`Experimental frequency energy spectrum for ${tracks.map(track => track.label).join(' and ')}. Frequency from 20 Hz to 20 kHz on a logarithmic scale, energy in dBFS. Use playback controls to inspect a time.`} />
    <SpectrumInfo metadata={metadata} />
    {status === 'loading' && <p class="spectrum-status" role="status">Loading spectrum...</p>}
    {status === 'error' && <div class="spectrum-status spectrum-error" role="status"><p>{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Retry spectrum</button></div>}
  </figure>;
}
