import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import UiIcon from './UiIcon.jsx';
import { assetUrl, loadOpus, getDecodeContext, formatTime, sampleMeta, useGlobalVolume, useWaveformWorker, waveformDataCache, SynchronizedSpectrogram, SegmentedToggle } from './AudioDemoShared.jsx';
import '../../styles/mobile-audio.css';

const sameTrack = (a, b) => a && b && a.basePath === b.basePath && a.sample === b.sample && a.method.key === b.method.key;

function MobileDataset({ group, methods, basePath, budgets, active, playing, loading, onSelect, onBudgetChange }) {
  const [openSample, setOpenSample] = useState(null);
  const [budgetKey, setBudgetKey] = useState(budgets?.find(b => b.default)?.key ?? budgets?.[0]?.key);
  const budget = budgets?.find(b => b.key === budgetKey);
  const path = budget?.basePath ?? basePath;
  const ordered = [...methods.filter(m => ['Measurement', 'Ground_Truth'].includes(m.key)), ...methods.filter(m => !['Measurement', 'Ground_Truth'].includes(m.key))];
  const changeBudget = key => {
    setBudgetKey(key);
    onBudgetChange(group.id, budgets.find(b => b.key === key));
  };
  return <section class={`audio-group mobile-audio-group audio-group-${group.tone}`} data-budget={budgetKey ?? 'single'} aria-labelledby={`${group.id}-mobile-heading`}>
    <div class="audio-group-header">
      <div class="dataset-heading">
        <span class="dataset-index" aria-hidden="true">{group.index}</span>
        <div class="dataset-heading-copy">
          <div class="dataset-title-row"><h3 id={`${group.id}-mobile-heading`} class="dataset-title">{group.name}</h3><span class="dataset-task"><UiIcon id={group.task === 'Denoising' ? 'denoising' : 'dereverberation'} />{group.task}</span></div>
          <p class="dataset-description">{group.samples.length} samples · {group.description}</p>
        </div>
      </div>
      {budgets?.length > 1 && <SegmentedToggle fieldClass="budget-toggle" label="Sampling budget" icon="sampling-budget" value={budgetKey} options={budgets} onChange={changeBudget} />}
    </div>
    <div class="mobile-sample-list">
      {group.samples.map((sample, index) => {
        const expanded = openSample === sample;
        const meta = sampleMeta(sample);
        const panelId = `${group.id}-methods-${index}`;
        const current = active?.group.id === group.id && active.sample === sample;
        return <div class={`mobile-sample${current ? ' is-current' : ''}`} key={sample}>
          <button class="mobile-sample-trigger" type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setOpenSample(expanded ? null : sample)}>
            <span class="mobile-sample-number">{String(index + 1).padStart(2, '0')}</span>
            <span class="mobile-sample-copy"><span class="mobile-sample-id">{sample.replace(/_(snr|t60)=.*$/, '')}</span><span class="mobile-sample-meta">{meta.label} {meta.value}{current && <> · <span class="mobile-track-status">{loading ? 'Loading' : playing ? 'Playing' : 'Selected'}</span></>}</span></span>
            <UiIcon id="arrow-down" class="mobile-sample-chevron" />
          </button>
          <div id={panelId} class="mobile-method-panel" hidden={!expanded}>
            <p class="mobile-method-hint">Choose a method to listen</p>
            <div class="mobile-methods">
              {ordered.map(method => {
                const selection = { group, sample, method, basePath: path, budgetLabel: budget?.label };
                const selected = sameTrack(active, selection);
                return <button key={method.key} type="button" class={`method-chip${selected ? ' active' : ''}`} style={{ '--method-color': method.color }} title={method.description} aria-pressed={Boolean(selected)} aria-label={`${method.label}${selected && playing ? ', pause' : ', play'}`} onClick={event => onSelect(selection, event.currentTarget)}>
                  <span class="chip-label">{method.label}</span><UiIcon id={selected && loading ? 'loading' : selected && playing ? 'pause' : 'play'} />
                </button>;
              })}
            </div>
          </div>
        </div>;
      })}
    </div>
  </section>;
}

function MobileWaveform({ active, time, duration }) {
  const canvasRef = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [size, setSize] = useState(0);
  const analyze = useWaveformWorker();
  useEffect(() => {
    let cancelled = false;
    setData(null); setError('');
    const waveform = method => {
      const url = assetUrl(active.basePath, method, active.sample, 'opus');
      if (!waveformDataCache.has(url)) {
        const pending = loadOpus(url).then(async resource => {
          const decoded = await getDecodeContext().decodeAudioData(resource.buffer.slice(0));
          return { values: await analyze(decoded.getChannelData(0)), duration: decoded.duration };
        }).catch(error => { waveformDataCache.delete(url); throw error; });
        waveformDataCache.set(url, pending);
      }
      return waveformDataCache.get(url);
    };
    Promise.all([waveform('Measurement'), waveform(active.method.key)])
      .then(pair => { if (!cancelled) setData(pair); })
      .catch(() => { if (!cancelled) setError('Waveform unavailable. Audio playback is still available.'); });
    return () => { cancelled = true; };
  }, [active.basePath, active.sample, active.method.key, analyze]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const observer = new ResizeObserver(() => setSize(canvas.clientWidth));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = width * dpr; canvas.height = height * dpr;
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#dbe5f1'; ctx.lineWidth = 1;
    for (const level of [.25, .5, .75]) { ctx.beginPath(); ctx.moveTo(0, height * level); ctx.lineTo(width, height * level); ctx.stroke(); }
    const draw = (values, color, alpha) => {
      ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.beginPath();
      for (let i = 0; i < values.length / 2; i++) {
        const x = i / (values.length / 2 - 1) * width;
        ctx.moveTo(x, height / 2 + values[i * 2] * height * .46);
        ctx.lineTo(x, height / 2 + values[i * 2 + 1] * height * .46);
      }
      ctx.stroke(); ctx.globalAlpha = 1;
    };
    draw(data[0].values, '#ff9d00', active.method.key === 'Measurement' ? 1 : .4);
    if (active.method.key !== 'Measurement') draw(data[1].values, active.method.color, .9);
    const progress = time / (duration || data[1].duration) * width;
    ctx.strokeStyle = '#526780'; ctx.beginPath(); ctx.moveTo(progress, 0); ctx.lineTo(progress, height); ctx.stroke();
  }, [active.method.color, active.method.key, data, duration, size, time]);
  return <div class="mobile-waveform">
    <div class="mobile-waveform-legend"><span><i style={{ background: '#ff9d00' }} />Unprocessed</span>{active.method.key !== 'Measurement' && <span><i style={{ background: active.method.color }} />{active.method.label}</span>}</div>
    <div class="mobile-waveform-canvas"><canvas ref={canvasRef} class="wave-canvas" aria-label={`${active.method.label} waveform compared with Unprocessed`} />{!data && <p role="status">{error || 'Loading waveform…'}</p>}</div>
    <div class="mobile-waveform-axis" aria-hidden="true"><span>0:00</span><span>{formatTime(duration)}</span></div>
  </div>;
}

function FloatingPlayer({ active, playing, loading, error, time, duration, volume, setVolume, onToggle, onSeek, onClose }) {
  const [minimized, setMinimized] = useState(false);
  const [view, setView] = useState(null);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const playerRef = useRef(null);
  const volumeRef = useRef(null);
  const minimizeRef = useRef(null);
  const expandRef = useRef(null);
  const waveformButton = useRef(null);
  const spectrogramButton = useRef(null);
  const collapseView = () => {
    const trigger = view === 'waveform' ? waveformButton.current : spectrogramButton.current;
    setView(null); trigger?.focus();
  };
  useEffect(() => {
    if (!volumeOpen) return undefined;
    const outside = event => { if (!volumeRef.current?.contains(event.target)) setVolumeOpen(false); };
    const key = event => { if (event.key === 'Escape') { setVolumeOpen(false); volumeRef.current?.querySelector('button')?.focus(); } };
    document.addEventListener('pointerdown', outside); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', key); };
  }, [volumeOpen]);
  useEffect(() => {
    document.body.classList.add('has-mobile-audio-player');
    const resources = document.querySelector('.demo-resources-capsule');
    const observer = new ResizeObserver(() => {
      document.body.style.setProperty('--mobile-player-space', `${playerRef.current?.offsetHeight + 32}px`);
      if (resources) document.body.style.setProperty('--mobile-resource-width', `${resources.getBoundingClientRect().width}px`);
    });
    observer.observe(playerRef.current);
    if (resources) observer.observe(resources);
    return () => { observer.disconnect(); document.body.classList.remove('has-mobile-audio-player'); document.body.style.removeProperty('--mobile-player-space'); document.body.style.removeProperty('--mobile-resource-width'); };
  }, []);
  const changeSize = small => {
    setMinimized(small); setVolumeOpen(false);
    requestAnimationFrame(() => (small ? expandRef.current : minimizeRef.current)?.focus());
  };
  const toggleView = mode => { setView(current => current === mode ? null : mode); setVolumeOpen(false); };
  const control = (id, label, action, extra = {}) => <button type="button" class="mobile-player-button" aria-label={label} title={label} onClick={action} {...extra}><UiIcon id={id} /></button>;
  const playButton = control(loading ? 'loading' : playing ? 'pause' : 'play', loading ? 'Loading audio' : error ? 'Retry playback' : playing ? 'Pause' : 'Play', onToggle, { class: 'mobile-player-button mobile-player-play', disabled: loading });
  return createPortal(<aside ref={playerRef} class={`audio-demo-island floating-audio-player${minimized ? ' is-minimized' : ''}`} aria-label="Audio player" data-method={active.method.key} data-sample={active.sample} data-budget={active.budgetLabel}>
    {minimized ? <div class="mobile-player-mini">{playButton}{control('maximize', 'Expand player', () => changeSize(false), { ref: expandRef })}</div> : <>
      <div class="mobile-player-identity">
        <div><span class="mobile-player-context">{active.group.name}{active.budgetLabel && ` · ${active.budgetLabel}`}</span><p class="mobile-player-track">{active.sample.replace(/_(snr|t60)=.*$/, '')}</p><span class="mobile-player-method" style={{ color: active.method.color }}>{active.method.label}</span></div>
        {control('close', 'Close player', onClose)}
      </div>
      {view && <div class="mobile-player-visualization" id="mobile-player-visualization" onKeyDown={event => { if (event.key === 'Escape') { event.stopPropagation(); collapseView(); } }}>
        <div class="mobile-visualization-header"><span>{view === 'waveform' ? 'Waveform' : 'Spectrogram'}</span>{control('arrow-down', 'Collapse visualization', collapseView)}</div>
        <div class="mobile-visualization-content">
          {view === 'waveform' ? <MobileWaveform active={active} time={time} duration={duration} /> : <SynchronizedSpectrogram measurementSrc={assetUrl(active.basePath, 'Measurement', active.sample, 'spectrogram')} comparisonSrc={assetUrl(active.basePath, active.method.key, active.sample, 'spectrogram')} sampleName={active.sample} selectedLabel={active.method.label} measurementLabel="Unprocessed" duration={duration} comparing={active.method.key !== 'Measurement'} />}
        </div>
      </div>}
      <div class="mobile-player-transport">
        <div class="mobile-player-progress"><input class="mobile-progress-bar" type="range" min="0" max={duration || 0} step="0.01" value={Math.min(time, duration || 0)} onInput={event => onSeek(Number(event.currentTarget.value))} aria-label="Playback position" style={{ '--progress': `${duration ? time / duration * 100 : 0}%` }} /><div class="mobile-player-times"><span>{formatTime(time)}</span><span>{formatTime(duration)}</span></div></div>
        <div class="mobile-player-controls">
          {playButton}
          <div class="mobile-player-volume" ref={volumeRef}>
            {control(volume === 0 ? 'volume-off' : volume < 100 ? 'volume-low' : 'audio', 'Volume', () => setVolumeOpen(current => !current), { 'aria-expanded': volumeOpen, 'aria-controls': 'mobile-volume-panel' })}
            {volumeOpen && <div class="mobile-volume-panel" id="mobile-volume-panel"><label for="mobile-audio-volume">Volume <output>{volume}%</output></label><input id="mobile-audio-volume" type="range" min="0" max="200" value={volume} onInput={event => setVolume(Number(event.currentTarget.value))} aria-label="Global volume" /></div>}
          </div>
          {control('spectrogram', 'Spectrogram', () => toggleView('spectrogram'), { ref: spectrogramButton, 'aria-pressed': view === 'spectrogram', 'aria-expanded': view === 'spectrogram', 'aria-controls': view ? 'mobile-player-visualization' : undefined })}
          {control('wave', 'Waveform', () => toggleView('waveform'), { ref: waveformButton, 'aria-pressed': view === 'waveform', 'aria-expanded': view === 'waveform', 'aria-controls': view ? 'mobile-player-visualization' : undefined })}
          <a class="mobile-player-button mobile-player-download" href={assetUrl(active.basePath, active.method.key, active.sample, 'wav')} download aria-label={`Download ${active.method.label} WAV`} title="Download WAV"><UiIcon id="download" /></a>
          {control('minimize', 'Minimize player', () => changeSize(true), { ref: minimizeRef })}
        </div>
      </div>
    </>}
    {error && !minimized && <p class="mobile-player-error" role="status">{error} <button type="button" onClick={onToggle}>Try again</button></p>}
  </aside>, document.body);
}

export default function MobileAudioDemo({ groups, methods, basePath = null, budgets = null }) {
  const [active, setActive] = useState(null);
  const selectionTrigger = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useGlobalVolume();
  const audioRef = useRef(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const activeRef = useRef(null);
  const graphRef = useRef(null);
  const requestRef = useRef(0);
  const mountedRef = useRef(true);
  const frameRef = useRef(0);
  activeRef.current = active;

  const start = useCallback(async selection => {
    const id = ++requestRef.current;
    audioRef.current?.pause(); setPlaying(false); setLoading(true); setError(''); setTime(0); setDuration(0);
    // Resume in the originating gesture; fetch/decode can finish later.
    const context = getDecodeContext();
    const resumed = context.resume();
    setActive(selection);
    try {
      await resumed;
      const resource = await loadOpus(assetUrl(selection.basePath, selection.method.key, selection.sample, 'opus'));
      if (requestRef.current !== id || !mountedRef.current) return;
      const audio = audioRef.current;
      if (!audio) return;
      if (!graphRef.current) {
        const source = context.createMediaElementSource(audio), gain = context.createGain();
        source.connect(gain).connect(context.destination); graphRef.current = { source, gain };
      }
      graphRef.current.gain.gain.value = volumeRef.current / 100;
      audio.src = resource.objectUrl; audio.load();
      await audio.play();
      if (id === requestRef.current) setLoading(false);
    } catch {
      if (id === requestRef.current && mountedRef.current) { setLoading(false); setPlaying(false); setError('Audio could not play. Please try again.'); }
    }
  }, []);

  const toggle = () => {
    const audio = audioRef.current;
    if (!active || loading) return;
    if (error || !audio?.src) { start(active); return; }
    if (!audio.paused) audio.pause();
    else {
      const id = requestRef.current;
      getDecodeContext().resume().then(() => { if (id === requestRef.current && activeRef.current) return audio.play(); }).catch(() => { if (id === requestRef.current && mountedRef.current) setError('Audio could not play. Please try again.'); });
    }
  };
  const select = (selection, trigger) => {
    selectionTrigger.current = trigger;
    if (sameTrack(activeRef.current, selection)) { toggle(); return; }
    start(selection);
  };
  const changeBudget = (groupId, budget) => {
    if (activeRef.current?.group.id !== groupId) return;
    start({ ...activeRef.current, basePath: budget.basePath, budgetLabel: budget.label });
  };
  const close = () => { ++requestRef.current; audioRef.current?.pause(); setActive(null); setPlaying(false); setLoading(false); setError(''); const trigger = selectionTrigger.current; if (trigger?.isConnected) { if (trigger.getClientRects().length) trigger.focus(); else trigger.closest('.mobile-sample')?.querySelector('.mobile-sample-trigger')?.focus(); } };
  useEffect(() => {
    if (graphRef.current) graphRef.current.gain.gain.value = volume / 100;
  }, [volume]);
  useEffect(() => {
    if (!playing || document.hidden) return undefined;
    const update = () => { if (audioRef.current && !document.hidden) { setTime(audioRef.current.currentTime); frameRef.current = requestAnimationFrame(update); } };
    frameRef.current = requestAnimationFrame(update);
    const visibility = () => {
      cancelAnimationFrame(frameRef.current);
      if (!document.hidden && !audioRef.current?.paused) frameRef.current = requestAnimationFrame(update);
    };
    document.addEventListener('visibilitychange', visibility);
    return () => { cancelAnimationFrame(frameRef.current); document.removeEventListener('visibilitychange', visibility); };
  }, [playing]);
  useEffect(() => {
    const audio = audioRef.current;
    return () => { mountedRef.current = false; audio?.pause(); graphRef.current?.source.disconnect(); graphRef.current?.gain.disconnect(); };
  }, []);
  return <div class="audio-demo-island mobile-audio-demo">
    <audio ref={audioRef} class="wave-audio" preload="none" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onLoadedMetadata={event => setDuration(event.currentTarget.duration)} onTimeUpdate={event => setTime(event.currentTarget.currentTime)} onError={() => { setLoading(false); setPlaying(false); setError('Audio could not load. Please try again.'); }} />
    {groups.map(group => <MobileDataset key={group.id} group={group} methods={methods} basePath={basePath} budgets={budgets} active={active} playing={playing} loading={loading} onSelect={select} onBudgetChange={changeBudget} />)}
    {active && <FloatingPlayer active={active} playing={playing} loading={loading} error={error} time={time} duration={duration} volume={volume} setVolume={setVolume} onToggle={toggle} onSeek={value => { if (audioRef.current) { audioRef.current.currentTime = value; setTime(value); } }} onClose={close} />}
  </div>;
}
