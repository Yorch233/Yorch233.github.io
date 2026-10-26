import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import UiIcon from './UiIcon.jsx';
import MobileAudioDemo from './MobileAudioDemo.jsx';
import SpectrumView from './SpectrumView.jsx';
import { assetUrl, loadOpus, getDecodeContext, formatTime, sampleMeta, mixColor, getSpectrumTracks, useGlobalVolume, useWaveformWorker, waveformDataCache, defaultMethodColor, measurementColor, SynchronizedSpectrogram, SegmentedToggle } from './AudioDemoShared.jsx';

function WaveCompare({ sampleName, sampleIndex, methods, basePath, budgets, budgetKey, onBudgetChange }) {
	const [selectedMethod, setSelectedMethod] = useState('Measurement');
	const [resources, setResources] = useState({});
	const [statuses, setStatuses] = useState({});
	const [viewMode, setViewMode] = useState('waveform');
	const [waveforms, setWaveforms] = useState({});
	const [waveformStatus, setWaveformStatus] = useState('idle');
	const [waveformError, setWaveformError] = useState('');
	const [isPlaying, setIsPlaying] = useState(false);
	const [playingMethod, setPlayingMethod] = useState('');
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [hasEnded, setHasEnded] = useState(false);
	const [hoveredLegend, setHoveredLegend] = useState(null);
	const [pinnedLegend, setPinnedLegend] = useState(null);
	const [isPlayheadHover, setIsPlayheadHover] = useState(false);
	const [progressHover, setProgressHover] = useState(null);
	const [tooltip, setTooltip] = useState(null);
	const [fading, setFading] = useState(false);
	const viewRef = useRef(null);
	const prevViewRef = useRef(viewMode);
	const viewTimersRef = useRef([]);
	const identityRef = useRef({ basePath, sampleName });
	const generationRef = useRef(0);
	const mountedRef = useRef(true);
	const selectedMethodRef = useRef(selectedMethod);
	const [volume, setVolume] = useGlobalVolume();
	const audioRef = useRef(null);
	const canvasRef = useRef(null);
	const gainRef = useRef(null);
	const mediaSourceRef = useRef(null);
	const animationRef = useRef(0);
	const pendingPlayRef = useRef(false);
	const playbackIntentRef = useRef(0);
	const tooltipTimerRef = useRef(0);
	const analyzeWaveform = useWaveformWorker();
	if (identityRef.current.basePath !== basePath || identityRef.current.sampleName !== sampleName) {
		identityRef.current = { basePath, sampleName };
	}
	selectedMethodRef.current = selectedMethod;

	// Requests capture the branch identity at start. Effects that change
	// budget or sample advance the generation, so late responses can be
	// discarded without placing component validity in the shared cache.
	const isCurrentAudio = useCallback((identity, generation) => Boolean(
		mountedRef.current &&
		identity === identityRef.current &&
		generation === generationRef.current
	), []);

	const orderedMethods = useMemo(() => {
		const measurement = methods.find((method) => method.key === 'Measurement');
		const groundTruth = methods.find((method) => method.key === 'Ground_Truth');
		const middle = methods.filter((method) => method.key !== 'Measurement' && method.key !== 'Ground_Truth');
		return [measurement, ...middle, groundTruth].filter(Boolean);
	}, [methods]);
	const methodColors = useMemo(() => Object.fromEntries(methods.filter((method) => method.color).map((method) => [method.key, method.color])), [methods]);
	const colorFor = useCallback((key) => methodColors[key] || (key === 'Measurement' ? measurementColor : defaultMethodColor), [methodColors]);
	const primaryMethods = orderedMethods.filter((method) => ['Measurement', 'Ground_Truth'].includes(method.key));
	const otherMethods = orderedMethods.filter((method) => !['Measurement', 'Ground_Truth'].includes(method.key));
	const selectedLabel = methods.find((method) => method.key === selectedMethod)?.label || selectedMethod;
	const measurementLabel = methods.find((method) => method.key === 'Measurement')?.label || 'Measurement';
	const comparing = selectedMethod !== 'Measurement';
	const spectrumTracks = useMemo(() => getSpectrumTracks(basePath, sampleName, methods, selectedMethod), [basePath, sampleName, methods, selectedMethod]);
	const meta = sampleMeta(sampleName);
	const activeLegend = pinnedLegend ?? hoveredLegend;
	const progressPercent = duration ? (currentTime / duration) * 100 : 0;
	const remainingTime = Math.max(0, duration - currentTime);
	const timeTicks = [];
	for (let tick = 0; tick <= Math.floor(duration || 0); tick += 1) timeTicks.push(tick);

	const ensureMethod = useCallback(
		async (method) => {
            // SSR keeps the desktop markup; a phone swaps it before paint.
            if (window.matchMedia('(max-width: 720px)').matches) throw new Error('Compact audio layout');
			const url = assetUrl(basePath, method, sampleName, 'opus');
			const identity = identityRef.current;
			const generation = generationRef.current;
			setStatuses((current) => ({ ...current, [method]: 'loading' }));
			try {
				const resource = await loadOpus(url);
				if (isCurrentAudio(identity, generation)) {
					setResources((current) => ({ ...current, [method]: resource }));
					setStatuses((current) => ({ ...current, [method]: 'ready' }));
				}
				return resource;
			} catch (error) {
				if (isCurrentAudio(identity, generation)) {
					setStatuses((current) => ({ ...current, [method]: 'error' }));
				}
				throw error;
			}
		},
		[basePath, isCurrentAudio, sampleName]
	);

	const waveformFor = useCallback(
		async (method) => {
			const url = assetUrl(basePath, method, sampleName, 'opus');
			if (!waveformDataCache.has(url)) {
				const pending = (async () => {
					const resource = await loadOpus(url);
					const context = getDecodeContext();
					const audioBuffer = await context.decodeAudioData(resource.buffer.slice(0));
					const values = await analyzeWaveform(audioBuffer.getChannelData(0));
					return { values, duration: audioBuffer.duration };
				})();
				// Mobile and desktop share this cache. Remove only the failed
				// pending entry so an existing control can retry later.
				pending.catch(() => {
					if (waveformDataCache.get(url) === pending) waveformDataCache.delete(url);
				});
				waveformDataCache.set(url, pending);
			}
			return waveformDataCache.get(url);
		},
		[analyzeWaveform, basePath, sampleName]
	);

	const ensureWaveforms = useCallback(async () => {
        if (window.matchMedia('(max-width: 720px)').matches) return;
		const key = `${sampleName}|${selectedMethod}`;
		if (waveforms[key]) {
			setWaveformStatus('ready');
			setWaveformError('');
			return;
		}
		const request = { identity: identityRef.current, generation: generationRef.current, method: selectedMethod };
		const isCurrentWaveView = () => request.method === selectedMethodRef.current && isCurrentAudio(request.identity, request.generation);
		setWaveformStatus('loading');
		setWaveformError('');
		try {
			const [measurement, selected] = await Promise.all([
				waveformFor('Measurement'),
				selectedMethod === 'Measurement' ? waveformFor('Measurement') : waveformFor(selectedMethod)
			]);
			if (!isCurrentWaveView()) return;
			setWaveforms((current) => ({ ...current, [key]: { measurement, selected } }));
			setDuration((current) => current || selected.duration || measurement.duration);
			setWaveformStatus('ready');
		} catch (error) {
			if (!isCurrentWaveView()) return;
			setWaveformStatus('error');
			setWaveformError(error instanceof Error ? error.message : String(error));
		}
	}, [isCurrentAudio, sampleName, selectedMethod, waveformFor, waveforms]);

	const ensureMethodRef = useRef(ensureMethod);
	ensureMethodRef.current = ensureMethod;

	// A new sample resets everything, including the selection.
	useEffect(() => {
		generationRef.current += 1;
		playbackIntentRef.current += 1;
		setSelectedMethod('Measurement');
		setResources({});
		setStatuses({});
		setWaveforms({});
		setCurrentTime(0);
		setDuration(0);
		setHasEnded(false);
		setPinnedLegend(null);
		new Set(['Measurement', 'Ground_Truth']).forEach((method) => ensureMethodRef.current(method).catch(() => {}));
	}, [sampleName]);

	// A new budget keeps the selection and view: fade the canvas, then load
	// the reference pair and the selected method from the new path.
	const prevBaseRef = useRef(basePath);
	const fadeStartRef = useRef(0);
	useEffect(() => {
		const changed = prevBaseRef.current !== basePath;
		prevBaseRef.current = basePath;
		if (!changed) return;
		generationRef.current += 1;
		playbackIntentRef.current += 1;
		audioRef.current?.pause();
		setResources({});
		setStatuses({});
		setWaveforms({});
		setWaveformStatus('idle');
		setCurrentTime(0);
		setDuration(0);
		setHasEnded(false);
		setPinnedLegend(null);
		fadeStartRef.current = performance.now();
		setFading(viewMode !== 'spectrum');
		new Set(['Measurement', 'Ground_Truth']).forEach((method) => ensureMethod(method).catch(() => {}));
		if (!['Measurement', 'Ground_Truth'].includes(selectedMethod)) ensureMethod(selectedMethod).catch(() => {});
	}, [basePath, selectedMethod, ensureMethod, viewMode]);

	// After the caches are cleared (and on the faded state itself), reload the
	// plot data; this also drives the fade end even in the spectrogram view.
	useEffect(() => {
		if (fading) ensureWaveforms();
	}, [fading, ensureWaveforms]);

	// Lift the fade once the swapped-in data is ready (or failed), holding the
	// faded state for at least 300ms so fast loads still read as a cross-fade.
	useEffect(() => {
		if (!fading || (waveformStatus !== 'ready' && waveformStatus !== 'error')) return undefined;
		const wait = Math.max(0, 300 - (performance.now() - fadeStartRef.current));
		const timer = window.setTimeout(() => setFading(false), wait);
		return () => window.clearTimeout(timer);
	}, [fading, waveformStatus]);

	useEffect(() => {
		if (viewMode === 'spectrum') setFading(false);
		if (viewMode === 'waveform') ensureWaveforms();
	}, [ensureWaveforms, viewMode]);

	const ensureAudioGraph = useCallback(async () => {
		const audio = audioRef.current;
		if (!audio) return;
		const context = getDecodeContext();
		if (!mediaSourceRef.current) {
			mediaSourceRef.current = context.createMediaElementSource(audio);
			gainRef.current = context.createGain();
			mediaSourceRef.current.connect(gainRef.current).connect(context.destination);
		}
		gainRef.current.gain.value = volume / 100;
		if (context.state === 'suspended') await context.resume();
	}, [volume]);

	useEffect(() => {
		if (gainRef.current) gainRef.current.gain.value = volume / 100;
	}, [volume]);

	useEffect(() => {
		const request = { identity: identityRef.current, generation: generationRef.current, method: selectedMethod };
		const intent = playbackIntentRef.current;
		const audio = audioRef.current;
		const source = resources[selectedMethod]?.objectUrl;
		if (!audio || !source) return;
		// Returning to a cached method can reuse the already-bound source;
		// it still needs to consume a pending play request without reloading
		// or resetting progress.
		if (audio.src !== source) {
			audio.pause();
			audio.src = source;
			audio.load();
			setCurrentTime(0);
			setDuration(0);
			setHasEnded(false);
		}
		if (pendingPlayRef.current) {
			pendingPlayRef.current = false;
			window.setTimeout(async () => {
                // Graph resume and timers can race a new method/budget; only
                // the exact resource load may trigger this autoplay.
                if (!isCurrentAudio(request.identity, request.generation) || selectedMethodRef.current !== request.method || playbackIntentRef.current !== intent) return;
				try {
					await ensureAudioGraph();
					if (!isCurrentAudio(request.identity, request.generation) || selectedMethodRef.current !== request.method || playbackIntentRef.current !== intent || audio !== audioRef.current) return;
					await audio.play();
				} catch {
					// Playback can still be blocked by a restrictive browser policy.
				}
			}, 0);
		}
	}, [ensureAudioGraph, isCurrentAudio, resources, selectedMethod]);

	const stopAnimation = () => {
		window.cancelAnimationFrame(animationRef.current);
		animationRef.current = 0;
	};

	const startAnimation = () => {
		stopAnimation();
		const update = () => {
			if (!audioRef.current || audioRef.current.paused) return;
			setCurrentTime(audioRef.current.currentTime);
			animationRef.current = window.requestAnimationFrame(update);
		};
		animationRef.current = window.requestAnimationFrame(update);
	};

	useEffect(() => {
        const audio = audioRef.current;
        return () => { mountedRef.current = false; pendingPlayRef.current = false; playbackIntentRef.current += 1; audio?.pause(); mediaSourceRef.current?.disconnect(); gainRef.current?.disconnect(); stopAnimation(); };
    }, []);

	const togglePlayback = async () => {
		const audio = audioRef.current;
		if (!audio) return;
		const request = { identity: identityRef.current, generation: generationRef.current, method: selectedMethodRef.current };
		const intent = ++playbackIntentRef.current;
		if (!resources[selectedMethod]) {
			pendingPlayRef.current = true;
			try {
				await ensureMethod(selectedMethod);
			} catch {
				if (isCurrentAudio(request.identity, request.generation) && selectedMethodRef.current === request.method) pendingPlayRef.current = false;
				return;
			}
			if (!isCurrentAudio(request.identity, request.generation) || selectedMethodRef.current !== request.method) return;
			return;
		}
		await ensureAudioGraph();
		if (!isCurrentAudio(request.identity, request.generation) || selectedMethodRef.current !== request.method || playbackIntentRef.current !== intent) return;
		const current = audioRef.current;
		if (!current) return;
		if (hasEnded) {
			current.currentTime = 0;
			setHasEnded(false);
		}
		if (current.paused) await current.play();
		else current.pause();
	};

	const handleMethodClick = async (method) => {
		if (selectedMethod === method && resources[method]) {
			await togglePlayback();
			return;
		}
		audioRef.current?.pause();
		playbackIntentRef.current += 1;
		setSelectedMethod(method);
		setPinnedLegend(null);
		pendingPlayRef.current = true;
		if (!resources[method]) {
			const request = { identity: identityRef.current, generation: generationRef.current };
			try {
				await ensureMethod(method);
			} catch {
				if (isCurrentAudio(request.identity, request.generation) && selectedMethodRef.current === method) pendingPlayRef.current = false;
				return;
			}
			return;
		}
	};

	const handleMethodHover = (event, method) => {
		window.clearTimeout(tooltipTimerRef.current);
		const rect = event.currentTarget.getBoundingClientRect();
		tooltipTimerRef.current = window.setTimeout(() => {
			setTooltip({
				text: methods.find((item) => item.key === method)?.description || '',
				x: Math.min(window.innerWidth - Math.min(320, window.innerWidth - 24) - 12, Math.max(12, rect.left)),
				y: rect.bottom + 8
			});
		}, 1000);
	};

	const handleMethodLeave = () => {
		window.clearTimeout(tooltipTimerRef.current);
		setTooltip(null);
	};

	const drawWaveform = useCallback(() => {
		const canvas = canvasRef.current;
		const data = waveforms[`${sampleName}|${selectedMethod}`];
		if (!canvas || !data) return;
		const width = canvas.clientWidth || 880;
		const height = canvas.clientHeight || 160;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		canvas.width = Math.round(width * dpr);
		canvas.height = Math.round(height * dpr);
		const context = canvas.getContext('2d');
		context.setTransform(dpr, 0, 0, dpr, 0, 0);
		context.clearRect(0, 0, width, height);

		const labelPad = 34;
		const topPad = 10;
		const bottomPad = 10;
		const drawableWidth = width - labelPad;
		const areaHeight = height - topPad - bottomPad;
		const centerY = topPad + areaHeight / 2;
		const amplitude = areaHeight / 2;

		[1, 0.5, 0, -0.5, -1].forEach((level) => {
			const y = centerY - level * amplitude;
			context.beginPath();
			context.lineWidth = level === 0 ? 1.4 : 1;
			context.strokeStyle = level === 0 ? 'rgba(148, 163, 184, 0.55)' : 'rgba(148, 163, 184, 0.25)';
			context.moveTo(0, y);
			context.lineTo(drawableWidth, y);
			context.stroke();
		});

		const measurementValues = data.measurement.values;
		let maxAbs = 0;
		for (let index = 0; index < measurementValues.length; index += 1) maxAbs = Math.max(maxAbs, Math.abs(measurementValues[index]));
		const scale = maxAbs ? 0.95 / maxAbs : 1;
		const progressX = duration ? (currentTime / duration) * drawableWidth : 0;
		const measurementAlpha = activeLegend === 'compare' ? 0.1 : comparing ? 0.45 : 1;
		const compareAlpha = activeLegend === 'measurement' ? 0.1 : 0.9;

		const render = (values, color, alpha, muted, lineWidth = 1) => {
			const points = values.length / 2;
			context.strokeStyle = muted ? mixColor(color, '#f8fafc', 0.65) : color;
			context.globalAlpha = alpha;
			context.lineWidth = lineWidth;
			context.beginPath();
			for (let point = 0; point < points; point += 1) {
				const x = (point / Math.max(1, points - 1)) * drawableWidth;
				const minimum = Math.max(-1, Math.min(1, values[point * 2] * scale));
				const maximum = Math.max(-1, Math.min(1, values[point * 2 + 1] * scale));
				context.moveTo(x, centerY + minimum * amplitude);
				context.lineTo(x, centerY + maximum * amplitude);
			}
			context.stroke();
			context.globalAlpha = 1;
		};

		const drawPair = (muted) => {
			const drawMeasurement = () => render(measurementValues, colorFor('Measurement'), measurementAlpha, muted);
			const drawCompare = () => {
				if (comparing) render(data.selected.values, colorFor(selectedMethod), compareAlpha, muted);
			};
			if (activeLegend === 'measurement') {
				drawCompare();
				drawMeasurement();
			} else {
				drawMeasurement();
				drawCompare();
			}
		};

		context.save();
		context.beginPath();
		context.rect(0, 0, Math.max(0, Math.min(drawableWidth, progressX)), height);
		context.clip();
		drawPair(false);
		context.restore();
		context.save();
		context.beginPath();
		context.rect(Math.max(0, Math.min(drawableWidth, progressX)), 0, drawableWidth, height);
		context.clip();
		drawPair(true);
		context.restore();

		const canvasStyle = getComputedStyle(canvas);
		context.font = `${canvasStyle.getPropertyValue('--text-1').trim() || '13px'} ${canvasStyle.fontFamily}`;
		context.textAlign = 'right';
		context.textBaseline = 'middle';
		context.fillStyle = 'rgba(100, 116, 139, 0.9)';
		[1, 0.5, 0, -0.5, -1].forEach((level) => context.fillText(level.toFixed(1), width - 6, centerY - level * amplitude));
		context.beginPath();
		context.lineWidth = isPlayheadHover ? 2.6 : 1.3;
		context.strokeStyle = 'rgba(148, 163, 184, 0.8)';
		context.moveTo(progressX, 0);
		context.lineTo(progressX, height);
		context.stroke();
	}, [activeLegend, colorFor, comparing, currentTime, duration, isPlayheadHover, sampleName, selectedMethod, waveforms]);

	useEffect(() => {
		drawWaveform();
	}, [drawWaveform, viewMode]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(drawWaveform);
		observer.observe(canvas);
		return () => observer.disconnect();
	}, [drawWaveform, viewMode]);

	/* Natural content height, read from the branch children: the wrapper's own
	   height is animated (WAAPI) and scrollHeight never reads below the lock,
	   but the children keep their natural layout underneath the clip. */
	const measureView = (el) => {
		const kids = el.children;
		if (!kids.length) return el.scrollHeight;
		const last = kids[kids.length - 1];
		return last.offsetTop + last.offsetHeight;
	};

	/* Phase 1 of a view switch: lock the current height and fade the plot.
	   Phase 2 (the height animation) runs in the effect below, once the new
	   content is actually in the DOM — measuring earlier reads the old view. */
	const handleViewChange = (next) => {
		if (next === viewMode) return;
		const el = viewRef.current;
		if (next === 'spectrum' || viewMode === 'spectrum') {
			for (const timer of viewTimersRef.current) window.clearTimeout(timer);
			viewTimersRef.current = [];
			if (el) {
				el.getAnimations?.().forEach(animation => animation.cancel());
				el.classList.remove('is-fading');
				el.style.height = '';
				el.style.transition = '';
			}
			setViewMode(next);
			return;
		}
		if (!el || typeof el.animate !== 'function' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			setViewMode(next);
			return;
		}
		for (const timer of viewTimersRef.current) window.clearTimeout(timer);
		viewTimersRef.current = [];
		const from = el.offsetHeight;
		el.style.transition = 'none';
		el.style.height = `${from}px`;
		el.classList.add('is-fading');
		el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease' });
		viewTimersRef.current.push(window.setTimeout(() => setViewMode(next), 200));
	};

	useEffect(() => {
		const el = viewRef.current;
		if (!el) return;
		if (prevViewRef.current === viewMode) return;
		prevViewRef.current = viewMode;
		if (typeof el.animate !== 'function' || !el.style.height) return;
		const from = el.offsetHeight;
		const target = measureView(el);
		el.classList.remove('is-fading');
		el.style.height = `${target}px`;
		const sweep = el.animate(
			[
				{ height: `${from}px`, opacity: 0 },
				{ height: `${target}px`, opacity: 1 }
			],
			{ duration: 320, easing: 'cubic-bezier(0.3, 0.7, 0.25, 1)' }
		);
		/* Track late layout changes (lazy islands, decoded resources). */
		const content = el.firstElementChild;
		const observer = new ResizeObserver(() => {
			const t2 = measureView(el);
			if (Math.abs(t2 - target) <= 1) return;
			sweep.cancel();
			el.style.height = `${t2}px`;
			el.animate(
				[{ height: `${target}px` }, { height: `${t2}px` }],
				{ duration: 180, easing: 'cubic-bezier(0.3, 0.7, 0.25, 1)' }
			);
		});
		if (content) observer.observe(content);
		sweep.onfinish = () => {
			observer.disconnect();
			el.style.transition = '';
			el.style.height = '';
		};
	}, [viewMode]);

	useEffect(() => () => {
		for (const timer of viewTimersRef.current) window.clearTimeout(timer);
	}, []);

	const seek = (value) => {
		const next = Number(value);
		if (audioRef.current) audioRef.current.currentTime = next;
		setCurrentTime(next);
		setHasEnded(false);
	};

	const handleProgressMove = (event) => {
		const track = event.currentTarget;
		const rect = track.getBoundingClientRect();
		const thumbRadius = (Number.parseFloat(getComputedStyle(track).getPropertyValue('--progress-thumb-size')) || 18) / 2;
		const travel = Math.max(1, rect.width - thumbRadius * 2);
		const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left - thumbRadius) / travel));
		/* Viewport coordinates: the tooltip renders at the document root level
		   (position: fixed), so panel edges can never clip it. */
		const x = Math.min(window.innerWidth - 44, Math.max(44, rect.left + thumbRadius + ratio * travel));
		setProgressHover({ x, y: rect.top, time: ratio * duration });
	};

	const handleLegendClick = (legend) => setPinnedLegend((current) => (current === legend ? null : legend));
	const playIcon = hasEnded ? 'replay' : isPlaying ? 'pause' : 'play';
	const volumeIcon = volume <= 0 ? 'volume-off' : volume < 100 ? 'volume-low' : 'audio';
	const statusText = waveformStatus === 'error' ? waveformError || 'Load failed' : '';

	return (
		<section class={`wave-compare${fading ? ' is-fading' : ''}`}>
			<header class="wave-header">
				<div class="wave-description">
					<span class="wave-desc-item">
						<span class="wave-desc-index">#{sampleIndex}</span>
					</span>
					<span class="wave-desc-item">
						<span class="wave-desc-label">Sample name</span>
						<span class="wave-desc-value">{sampleName}</span>
					</span>
					<span class="wave-desc-divider" aria-hidden="true" />
						<span class="wave-desc-item wave-desc-tooltip">
							<span class="wave-desc-label">{meta.label}</span>
							<span class="wave-desc-value">{meta.value}</span>
							<span class="wave-desc-tip">{meta.tooltip}</span>
						</span>
					</div>
					{budgets && (
						<SegmentedToggle
							fieldClass="budget-toggle"
							label="Sampling budget"
							icon="sampling-budget"
							value={budgetKey}
							options={budgets.map((budget) => ({ key: budget.key, label: budget.label }))}
							onChange={onBudgetChange}
						/>
					)}
				</header>

			<div class="method-list">
				<div class="method-group method-group-primary">
					{primaryMethods.map((method) => (
						<div class="method-chip-wrap" key={method.key} onMouseEnter={(event) => handleMethodHover(event, method.key)} onMouseLeave={handleMethodLeave}>
							<button
								type="button"
								class={`method-chip method-chip-${method.key === 'Measurement' ? 'measurement' : 'clean'}${selectedMethod === method.key ? ' active' : ''}${
									isPlaying && playingMethod === method.key ? ' playing' : ''
								}`}
								style={{ '--method-color': colorFor(method.key) }}
								data-family={method.family || undefined}
								aria-pressed={selectedMethod === method.key}
								onClick={() => handleMethodClick(method.key)}
							>
								<span class="chip-label">{method.label}</span>
								{statuses[method.key] === 'loading' ? (
									<span class="chip-spinner" aria-hidden="true" />
								) : (
									<span class="chip-action" aria-hidden="true">
										<UiIcon id={isPlaying && playingMethod === method.key ? 'pause' : 'play'} state="active" tone="muted" />
									</span>
								)}
							</button>
						</div>
					))}
				</div>
				<div class="method-group method-group-secondary">
					<span class="method-group-label">Methods</span>
					<div class="method-group-scroll">
						{otherMethods.map((method) => (
							<div class="method-chip-wrap" key={method.key} onMouseEnter={(event) => handleMethodHover(event, method.key)} onMouseLeave={handleMethodLeave}>
								<button
									type="button"
									class={`method-chip method-chip-secondary${selectedMethod === method.key ? ' active' : ''}${
										isPlaying && playingMethod === method.key ? ' playing' : ''
									}`}
									style={{ '--method-color': colorFor(method.key) }}
									data-family={method.family || undefined}
									aria-pressed={selectedMethod === method.key}
									onClick={() => handleMethodClick(method.key)}
								>
									<span class="chip-label">{method.label}</span>
									{statuses[method.key] === 'loading' ? (
										<span class="chip-spinner" aria-hidden="true" />
									) : (
										<span class="chip-action" aria-hidden="true">
											<UiIcon id={isPlaying && playingMethod === method.key ? 'pause' : 'play'} state="active" tone="muted" />
										</span>
									)}
								</button>
							</div>
						))}
					</div>
				</div>
			</div>

			{tooltip?.text && (
				<div class="method-tip-global" style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}>
					{tooltip.text}
				</div>
			)}

			<div class="wave-panel">
				<div class="wave-panel-header">
					<div class="wave-panel-title">
						<button type="button"
							class="legend-item"
							aria-pressed={pinnedLegend === 'measurement'}
							style={{ opacity: activeLegend === 'compare' ? 0.1 : 1 }}
							onMouseEnter={() => setHoveredLegend('measurement')}
							onMouseLeave={() => setHoveredLegend(null)}
							onClick={() => handleLegendClick('measurement')}
						>
							<span class="legend-swatch" style={{ background: colorFor('Measurement') }} />
							{measurementLabel}
						</button>
						{comparing && (
							<button type="button"
								class="legend-item"
								aria-pressed={pinnedLegend === 'compare'}
								style={{ opacity: activeLegend === 'measurement' ? 0.1 : 1 }}
								onMouseEnter={() => setHoveredLegend('compare')}
								onMouseLeave={() => setHoveredLegend(null)}
								onClick={() => handleLegendClick('compare')}
							>
								<span class="legend-swatch" style={{ background: colorFor(selectedMethod) }} />
								{selectedLabel}
							</button>
						)}
					</div>
					<div class="wave-panel-actions">
						<SegmentedToggle
							fieldClass="view-toggle"
							ariaLabel="Visualization mode"
							value={viewMode}
							options={[
								{ key: 'waveform', label: 'Waveform', icon: 'wave', buttonClass: 'view-toggle-btn' },
								{ key: 'spectrogram', label: 'Spectrogram', icon: 'spectrogram', buttonClass: 'view-toggle-btn' },
								{ key: 'spectrum', label: 'Spectrum', icon: 'line-chart', buttonClass: 'view-toggle-btn' }
							]}
							onChange={handleViewChange}
						/>
					</div>
				</div>

				<div ref={viewRef} class="wave-view">
				{viewMode === 'spectrum' && <SpectrumView
					key={`${basePath}|${sampleName}|${selectedMethod}`}
					tracks={spectrumTracks} time={currentTime} playing={isPlaying} audioRef={audioRef}
					highlightedTrack={activeLegend === 'measurement' ? 0 : comparing && activeLegend === 'compare' ? 1 : null}
				/>}
				{viewMode === 'waveform' && (
					<>
						<div class="wave-canvas-wrap" onMouseEnter={() => setIsPlayheadHover(true)} onMouseLeave={() => setIsPlayheadHover(false)}>
							<canvas ref={canvasRef} class="wave-canvas" aria-label={`${selectedLabel} waveform compared with ${measurementLabel}`} />
							{waveformStatus === 'loading' && <div class="canvas-loading wave-loading">Loading...</div>}
							{statusText && <div class="canvas-loading wave-error" role="status">{statusText}</div>}
						</div>
						<div class="wave-time-axis" aria-hidden="true">
							<div class="time-axis-track">
								{timeTicks.map((tick) => (
									<span
										key={tick}
										class={`time-axis-tick${tick % 2 === 0 ? ' is-major' : ''}`}
										style={{ left: `${duration ? (tick / duration) * 100 : 0}%` }}
									>
										<span class="time-axis-line" />
										<span class="time-axis-label">{tick % 2 === 0 ? formatTime(tick) : ''}</span>
									</span>
								))}
								{isPlayheadHover && (
									<div class="time-axis-caret" style={{ left: `${progressPercent}%` }}>
										<span class="time-axis-caret-label">{formatTime(currentTime, true)}</span>
									</div>
								)}
							</div>
						</div>
					</>
				)}

				{viewMode === 'spectrogram' && (
					<>
						<div class="spectrogram-view">
							<SynchronizedSpectrogram
								measurementSrc={assetUrl(basePath, 'Measurement', sampleName, 'spectrogram')}
								comparisonSrc={assetUrl(basePath, selectedMethod, sampleName, 'spectrogram')}
								sampleName={sampleName}
								selectedLabel={selectedLabel}
								measurementLabel={measurementLabel}
								duration={duration}
								comparing={comparing}
							/>
							{statusText && <div class="canvas-loading wave-error" role="status">{statusText}</div>}
						</div>
					</>
				)}
				</div>

				<div class="progress-row">
					<button type="button" class="progress-play" onClick={togglePlayback} aria-label={hasEnded ? 'Replay' : isPlaying ? 'Pause' : 'Play'}>
						<UiIcon id={playIcon} state="active" tone="muted" />
					</button>
					<span class="time-label">{formatTime(currentTime)}</span>
					<div class={`progress-track${progressHover ? ' progress-track-hover' : ''}`} style={{ '--playback-progress': `${progressPercent}%` }} onMouseMove={handleProgressMove} onMouseLeave={() => setProgressHover(null)}>
						<input
							class="progress-bar"
							type="range"
							min="0"
							max={duration || 0}
							step="0.01"
							value={currentTime}
							onInput={(event) => seek(event.currentTarget.value)}
							aria-label="Playback position"
						/>
						{progressHover && typeof document !== 'undefined' && createPortal(
							<div class="progress-tooltip" style={{ left: `${progressHover.x}px`, top: `${progressHover.y}px` }}>
								{formatTime(progressHover.time)}
							</div>,
							document.body
						)}
					</div>
					<span class="time-label">-{formatTime(remainingTime)}</span>
					<div class="volume-control">
						<button type="button" class="volume-button" aria-label={volume <= 0 ? 'Mute' : 'Volume'}>
							<UiIcon id={volumeIcon} />
						</button>
						<div class="volume-popover">
							<div class="volume-label">{Math.round(volume)}</div>
							<div class="volume-slider-wrap">
								<div class="volume-ticks" aria-hidden="true">
									{[0, 1, 2, 3, 4].map((tick) => (
										<span key={tick} class={`volume-tick${tick === 2 ? ' major' : ''}`} />
									))}
								</div>
								<input
									class="volume-slider"
									type="range"
									min="0"
									max="200"
									step="1"
									value={volume}
									onInput={(event) => setVolume(Number(event.currentTarget.value))}
									aria-label="Global volume"
								/>
							</div>
							<div class="volume-scale">0–200</div>
						</div>
					</div>
						<a class="wave-download" href={assetUrl(basePath, selectedMethod, sampleName, 'wav')} download aria-label={`Download ${selectedLabel} WAV`} title="Download WAV">
							<UiIcon id="download" />
						</a>
				</div>

				<audio
					ref={audioRef}
					class="wave-audio"
					preload="none"
					onPlay={() => {
						setIsPlaying(true);
						setPlayingMethod(selectedMethod);
						startAnimation();
					}}
					onPause={() => {
						setIsPlaying(false);
						stopAnimation();
					}}
					onEnded={() => {
						setIsPlaying(false);
						setHasEnded(true);
						stopAnimation();
					}}
					onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
					onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
				/>
			</div>
		</section>
	);
}

function SimpleTable({ samples, methods, basePath }) {
	return (
		<div class="simple-table-wrap">
			<table class="simple-table">
				<colgroup>
					<col style="width: 250px" />
					<col style="width: 74px" />
					{methods.map(() => (
						<col />
					))}
				</colgroup>
				<thead>
					<tr>
						<th>Sample Name</th>
						<th>SNR/T60</th>
						{methods.map((method) => (
							<th key={method.key}>{method.label}</th>
						))}
					</tr>
				</thead>
				<tbody>
					{samples.map((sample) => (
						<tr key={sample}>
							<td class="cell-sample">{sample}</td>
							<td class="cell-metric">{sampleMeta(sample).value}</td>
							{methods.map((method) => (
								<td class="cell-audio" key={`${sample}-${method.key}`}>
									<audio class="simple-audio" src={assetUrl(basePath, method.key, sample, 'opus')} controls preload="none" />
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

/* Phone-only sample navigator: five compact rows above the player card.
   The desktop pager stays untouched; on phones this list replaces the
   Show All stack as the overview of every sample in the group. */
function SampleJumpList({ samples, activeIndex, onSelect }) {
	return (
		<nav class="sample-jump" aria-label="Jump to a sample">
			{samples.map((sample, index) => {
				const meta = sampleMeta(sample);
				return (
					<button
						key={sample}
						type="button"
						class={`sample-jump-row${index === activeIndex ? ' active' : ''}`}
						aria-current={index === activeIndex ? 'true' : undefined}
						onClick={() => onSelect(index)}
					>
						<span class="sample-jump-index">{`#${index + 1}`}</span>
						<span class="sample-jump-name">{sample}</span>
						<span class="sample-jump-meta">
							<span class="sample-jump-metric">{meta.label}</span>
							{meta.value}
						</span>
					</button>
				);
			})}
		</nav>
	);
}

function DatasetGroup({ group, methods, basePath, budgets }) {
	const { id, index, name, task, description, tone, samples } = group;
	const [budgetKey, setBudgetKey] = useState(budgets?.find((budget) => budget.default)?.key ?? budgets?.[0]?.key);
	const activeBudget = budgets?.find((budget) => budget.key === budgetKey);
	const activeBasePath = activeBudget?.basePath ?? basePath;
	const [sampleIndex, setSampleIndex] = useState(0);
	const [showAll, setShowAll] = useState(false);
	const [visualization, setVisualization] = useState(true);
	const listRef = useRef(null);
	const animTimersRef = useRef([]);
	const visibleSamples = showAll ? samples : [samples[sampleIndex]];

	const measureList = (el) => {
		const kids = el.children;
		if (!kids.length) return el.scrollHeight;
		const last = kids[kids.length - 1];
		return last.offsetTop + last.offsetHeight;
	};

	useEffect(() => () => {
		for (const timer of animTimersRef.current) window.clearTimeout(timer);
	}, []);

	/* Phone sample list: switching from the list scrolls the player card
	   into view so the swap is visible; the card sits below the fold. */
	const jumpToSample = (index) => {
		setSampleIndex(index);
		const card = listRef.current?.querySelector('.wave-compare');
		if (!card) return;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
	};

	/* Sample paging: the visible card exits toward the arrow's direction and
	   the next one slides in from the opposite side. Next moves left. */
	const go = (direction) => {
		const el = listRef.current;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !el || typeof el.animate !== 'function') {
			setSampleIndex((current) => (current + direction + samples.length) % samples.length);
			return;
		}
		const card = el.querySelector('.wave-compare') || el;
		card.style.pointerEvents = 'none';
		const out = card.animate(
			[
				{ opacity: 1, transform: 'translateX(0)' },
				{ opacity: 0, transform: `translateX(${direction * -56}px)` }
			],
			{ duration: 160, easing: 'ease' }
		);
		out.onfinish = () => {
			setSampleIndex((current) => (current + direction + samples.length) % samples.length);
			requestAnimationFrame(() => {
				const next = el.querySelector('.wave-compare') || el;
				next.style.pointerEvents = '';
				next.animate(
					[
						{ opacity: 0, transform: `translateX(${direction * 56}px)` },
						{ opacity: 1, transform: 'translateX(0)' }
					],
					{ duration: 260, easing: 'cubic-bezier(0.3, 0.7, 0.25, 1)' }
				);
			});
		};
	};

	/* Group expansion: the card stack grows with an eased height sweep while
	   the additional samples fade in from below, staggered. */
	const toggleShowAll = () => {
		const el = listRef.current;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !el || typeof el.animate !== 'function') {
			setShowAll((current) => !current);
			return;
		}
		for (const timer of animTimersRef.current) window.clearTimeout(timer);
		animTimersRef.current = [];
		const ease = 'cubic-bezier(0.3, 0.7, 0.25, 1)';
		if (!showAll) {
			const from = el.offsetHeight;
			el.style.transition = 'none';
			el.style.height = `${from}px`;
			setShowAll(true);
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					const target = measureList(el);
					el.style.height = `${target}px`;
					const sweep = el.animate(
						[{ height: `${from}px` }, { height: `${target}px` }],
						{ duration: 320, easing: ease }
					);
					[...el.querySelectorAll('.wave-compare')].forEach((card, cardIndex) => {
						if (cardIndex === 0) return;
						card.animate(
							[
								{ opacity: 0, transform: 'translateY(26px)' },
								{ opacity: 1, transform: 'translateY(0)' }
							],
							{ duration: 300, delay: (cardIndex - 1) * 70, easing: ease, fill: 'backwards' }
						);
					});
					sweep.onfinish = () => {
						el.style.transition = '';
						el.style.height = '';
					};
				});
			});
		} else {
			const extras = [...el.querySelectorAll('.wave-compare')].slice(1);
			const outs = extras.map((card) => card.animate(
				[
					{ opacity: 1, transform: 'translateY(0)' },
					{ opacity: 0, transform: 'translateY(26px)' }
				],
				{ duration: 170, easing: 'ease', fill: 'forwards' }
			));
			const finish = () => {
				const from = el.offsetHeight;
				el.style.transition = 'none';
				el.style.height = `${from}px`;
				setShowAll(false);
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						/* The fade-outs hold opacity via fill: forwards — if the
						   paged-in sample was one of them, its card would stay
						   invisible. Release every held animation. */
						el.querySelectorAll('.wave-compare').forEach((node) => {
							node.getAnimations().forEach((animation) => animation.cancel());
						});
						el.style.height = `${measureList(el)}px`;
						const sweep = el.animate(
							[{ height: `${from}px` }, { height: `${measureList(el)}px` }],
							{ duration: 300, easing: ease }
						);
						el.querySelector('.wave-compare')?.animate(
							[{ opacity: 0.6, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }],
							{ duration: 240, easing: 'ease' }
						);
						sweep.onfinish = () => {
							el.style.transition = '';
							el.style.height = '';
						};
					});
				});
			};
			if (outs.length) outs[outs.length - 1].onfinish = finish;
			else finish();
		}
	};

	return (
		<section class={`audio-group audio-group-${tone}`} data-budget={budgetKey ?? 'single'} aria-labelledby={`${id}-heading`}>
			<div class="audio-group-header">
				<div class="dataset-heading">
					<span class="dataset-index" aria-hidden="true">
						{index}
					</span>
					<div class="dataset-heading-copy">
						<div class="dataset-title-row">
							<h3 id={`${id}-heading`} class="dataset-title">
								{name}
							</h3>
							<span class="dataset-task"><UiIcon id={task === 'Denoising' ? 'denoising' : 'dereverberation'} state="active" />{task}</span>
							<span class="dataset-count">{samples.length} samples</span>
						</div>
						<p class="dataset-description">{description}</p>
					</div>
				</div>
				<div class="audio-group-controls">
					<SegmentedToggle
						fieldClass="visual-toggle"
						label="Visualization"
						icon="layers"
						value={visualization ? 'on' : 'off'}
						options={[
							{ key: 'on', label: 'On' },
							{ key: 'off', label: 'Off' }
						]}
						onChange={(key) => setVisualization(key === 'on')}
					/>
				</div>
			</div>
			<div ref={listRef} class={`audio-list${visualization ? '' : ' audio-list-simple'}`}>
				<SampleJumpList samples={samples} activeIndex={sampleIndex} onSelect={jumpToSample} />
				{visualization ? (
					visibleSamples.map((sample, index) => (
						<WaveCompare
							key={sample}
							sampleName={sample}
							sampleIndex={showAll ? index + 1 : sampleIndex + 1}
							methods={methods}
							basePath={activeBasePath}
							budgets={budgets}
							budgetKey={budgetKey}
							onBudgetChange={setBudgetKey}
						/>
					))
				) : (
					<SimpleTable samples={samples} methods={methods} basePath={activeBasePath} />
				)}
			</div>
			{visualization && (
				<div class="audio-actions">
					<button type="button" class="audio-nav-btn" disabled={showAll} onClick={() => go(-1)} aria-label="Previous sample">
						<UiIcon id="arrow-left" />
					</button>
					<button type="button" class="audio-show-more" data-glass-color="blue" aria-expanded={showAll} onClick={toggleShowAll}>
						{showAll ? 'Hide' : 'Show All'}
					</button>
					<button type="button" class="audio-nav-btn" disabled={showAll} onClick={() => go(1)} aria-label="Next sample">
						<UiIcon id="arrow-right" />
					</button>
				</div>
			)}
		</section>
	);
}

/**
 * @param {object} props
 * @param {Array<object>} props.groups Dataset groups with samples.
 * @param {Array<object>} props.methods Methods with key/label/color/description.
 * @param {string} [props.basePath] Asset base path for single-budget demos.
 * @param {Array<object>} [props.budgets] Budgets with key/label/basePath for the budget switch.
 */
function DesktopAudioDemo({ groups, methods, basePath = null, budgets = null }) {
	const budgetList = Array.isArray(budgets) && budgets.length > 1 ? budgets : null;

	return (
		<div class="audio-demo-island">
			{groups.map((group) => (
				<DatasetGroup
					key={group.id}
					group={group}
					methods={methods}
					basePath={basePath}
					budgets={budgetList}
				/>
			))}
		</div>
	);
}

// Only one interactive tree is mounted: phone hydration never starts desktop
// sample decodes, and leaving the phone layout disposes its single player.
export default function AudioDemoIsland(props) {
  const [compact, setCompact] = useState(false);
  useLayoutEffect(() => {
    const media = window.matchMedia('(max-width: 720px)');
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return compact ? <MobileAudioDemo {...props} /> : <DesktopAudioDemo {...props} />;
}
