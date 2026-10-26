import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { getDecodeContext, loadOpus } from './AudioDemoShared.jsx';
import { spectrumFrequencyPosition } from '../../lib/spectrum.js';
import '../../styles/spectrum.css';

const FFT_SIZE = 2048;
const FREQUENCY_TICKS = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

export default function SpectrumView({ tracks, time = 0, playing = false, audioRef, highlightedTrack = null }) {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const timeLabelRef = useRef(null);
  const windowLabelRef = useRef(null);
  const latestRef = useRef(null);
  const sessionRef = useRef(null);
  const framesRef = useRef([]);
  const visibleRef = useRef(false);
  const reducedRef = useRef(false);
  const animationRef = useRef(0);
  const requestRef = useRef(() => {});
  const drawRef = useRef(() => {});
  const syncRef = useRef(() => {});
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
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
    context.save(); context.beginPath(); context.rect(left - 2, top - 2, plotWidth + 4, plotHeight + 4); context.clip();
    frames.forEach((frame, index) => {
      const track = latestRef.current.tracks[index];
      if (!track) return;
      const { frequencies, energies } = frame;
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
      context.beginPath();
      context.moveTo(x(first), y(first));
      for (let bin = first + 1; bin <= last; bin += 1) context.lineTo(x(bin), y(bin));
      context.stroke(); context.fillStyle = track.pointColor || '#d97706';
      let markedX = x(first);
      for (let bin = first; bin <= last; bin += 1) {
        const nextX = x(bin);
        if (bin !== first && nextX - markedX < 12) continue;
        markedX = nextX;
        context.beginPath(); context.arc(nextX, y(bin), 2, 0, Math.PI * 2); context.fill();
      }
    });
    context.restore();
    const frame = frames[0];
    canvas.dataset.time = String(frame.time);
    if (timeLabelRef.current) timeLabelRef.current.textContent = `t = ${frame.time.toFixed(2)} s`;
    if (windowLabelRef.current) windowLabelRef.current.textContent = `${(frame.fftSize / frame.sampleRate * 1000).toFixed(1)} ms window`;
  };

  useEffect(() => {
    let cancelled = false;
    const currentTracks = latestRef.current.tracks.slice(0, 2);
    const session = { workers: [], ready: currentTracks.map(() => false), received: [], id: 0, inFlight: false, pending: null, lastSent: -Infinity, disposed: false, audioUrl: null };
    sessionRef.current = session;
    framesRef.current = [];
    setStatus('loading'); setError('');
    const fail = () => {
      if (cancelled || session.disposed) return;
      session.disposed = true;
      session.workers.forEach(worker => worker?.terminate());
      cancelAnimationFrame(animationRef.current);
      setError('Spectrum unavailable. Audio playback is still available.'); setStatus('error');
    };
    requestRef.current = (nextTime, force = false) => {
      if (cancelled || session.disposed || !session.ready.length || !session.ready.every(Boolean) || !visibleRef.current || document.hidden) return;
      if (session.inFlight) { session.pending = { time: nextTime, force }; return; }
      if (!force && performance.now() - session.lastSent < (reducedRef.current ? 250 : 50)) return;
      session.lastSent = performance.now(); session.inFlight = true; session.received = [];
      const id = ++session.id;
      session.workers.forEach(worker => worker.postMessage({ type: 'frame', id, time: nextTime, fftSize: FFT_SIZE }));
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
            framesRef.current = session.received.slice();
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
      cancelAnimationFrame(animationRef.current);
    };
  }, [identity, attempt, readTime]);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    reducedRef.current = media.matches;
    const stop = () => { cancelAnimationFrame(animationRef.current); animationRef.current = 0; };
    const update = () => {
      animationRef.current = 0;
      const session = sessionRef.current;
      if (!latestRef.current.playing || reducedRef.current || !visibleRef.current || document.hidden || session?.disposed) return;
      requestRef.current(readTime());
      animationRef.current = requestAnimationFrame(update);
    };
    syncRef.current = () => {
      stop();
      if (latestRef.current.playing && !reducedRef.current && visibleRef.current && !document.hidden && !sessionRef.current?.disposed) animationRef.current = requestAnimationFrame(update);
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
      document.removeEventListener('visibilitychange', refresh); media.removeEventListener('change', motion);
      syncRef.current = () => {};
    };
  }, [readTime]);

  useEffect(() => {
    requestRef.current(readTime(), !playing);
  }, [time, playing, readTime]);

  useEffect(() => { syncRef.current(); }, [playing]);

  useEffect(() => { drawRef.current(); }, [highlightedTrack, tracks]);

  return <figure class="spectrum-view" ref={rootRef} aria-busy={status === 'loading'}>
    <div class="spectrum-legend">{tracks.map(track => <span key={track.url}>
      <i style={{ background: track.lineColor }} /><b style={{ background: track.pointColor }} />{track.label}
    </span>)}</div>
    <canvas ref={canvasRef} class="spectrum-canvas" role="img" aria-label={`Experimental frequency energy spectrum for ${tracks.map(track => track.label).join(' and ')}. Frequency from 20 Hz to 20 kHz on a logarithmic scale, energy in dBFS. Use playback controls to inspect a time.`} />
    <figcaption class="spectrum-meta"><span>Experimental</span><span ref={windowLabelRef} /><output ref={timeLabelRef} aria-label="Spectrum time" /></figcaption>
    {status === 'loading' && <p class="spectrum-status" role="status">Loading spectrum...</p>}
    {status === 'error' && <div class="spectrum-status spectrum-error" role="status"><p>{error}</p><button type="button" onClick={() => setAttempt(value => value + 1)}>Retry spectrum</button></div>}
  </figure>;
}
