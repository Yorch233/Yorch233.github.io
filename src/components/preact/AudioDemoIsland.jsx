import { useCallback, useEffect, useMemo, useRef, useState } from 'preact/hooks';

const audioResourceCache = new Map();
const waveformDataCache = new Map();
let decodeContext;
let waveformRequestId = 0;
let globalVolume = 100;
const volumeSubscribers = new Set();
const magnifierWidth = 140;
const magnifierHeight = 90;

const methodColors = {
	Measurement: '#ff9d00',
	Ground_Truth: '#3b82f6',
	'NCSN+M': '#22c55e',
	'NCSN++M': '#22c55e',
	SB: '#a855f7',
	StoRM: '#14b8a6',
	RSB: '#f97316'
};

const methodTooltips = {
	Measurement: 'Measurement is the degraded speech corrupted by noise and reverberation.',
	Ground_Truth: 'Ground Truth is the original clean speech.',
	'NCSN++M': 'NCSN++M is a common backbone of diffusion models used here as a purely predictive method, trained with an MSE loss to predict clean speech.',
	SB: 'SB models the transport between noisy and clean speech directly via Schrödinger Bridge. It is our baseline method.',
	StoRM: 'StoRM is a hybrid method that cascades a predictive model with a diffusion model. The diffusion model refines details from the initial predictive estimate.',
	RSB: 'RSB is the proposed method in this paper.'
};

const compressedName = (sampleName) => sampleName.replace(/\.wav$/i, '.opus');
const stemName = (sampleName) => sampleName.replace(/\.wav$/i, '');

const assetUrl = (basePath, method, sampleName, kind) => {
	let fileName = sampleName;
	if (kind === 'opus') fileName = compressedName(sampleName);
	if (kind === 'spectrogram') fileName = `${stemName(sampleName)}.spectrogram.avif`;
	return `${basePath}/${method}/${fileName}`;
};

const loadOpus = (url) => {
	if (!audioResourceCache.has(url)) {
		audioResourceCache.set(
			url,
			fetch(url, { cache: 'force-cache' }).then(async (response) => {
				if (!response.ok) throw new Error(`Audio request failed (${response.status})`);
				const buffer = await response.arrayBuffer();
				return {
					buffer,
					objectUrl: URL.createObjectURL(new Blob([buffer], { type: 'audio/ogg; codecs=opus' }))
				};
			})
		);
	}
	return audioResourceCache.get(url);
};

const getDecodeContext = () => {
	if (!decodeContext) {
		const AudioContextClass = window.AudioContext || Reflect.get(window, 'webkitAudioContext');
		decodeContext = new AudioContextClass();
	}
	return decodeContext;
};

const formatTime = (seconds, precise = false) => {
	if (!Number.isFinite(seconds)) return precise ? '0:00.0' : '0:00';
	const minutes = Math.floor(seconds / 60);
	const remainder = precise ? (seconds % 60).toFixed(1).padStart(4, '0') : Math.floor(seconds % 60).toString().padStart(2, '0');
	return `${minutes}:${remainder}`;
};

const sampleMeta = (sampleName) => {
	const snr = sampleName.match(/snr=(-?\d+(?:\.\d+)?)/i);
	if (snr) {
		return {
			label: 'SNR',
			value: `${snr[1]} dB`,
			tooltip: 'Signal-to-noise ratio (SNR) measures speech strength relative to background noise. Higher is cleaner.'
		};
	}
	const t60 = sampleName.match(/t60=(-?\d+(?:\.\d+)?)/i);
	if (t60) {
		return {
			label: 'T60',
			value: `${t60[1]} s`,
			tooltip: 'Reverberation time (T60) is the time for sound to decay by 60 dB. Lower means less reverberation.'
		};
	}
	return { label: 'Metric', value: '—', tooltip: '' };
};

const mixColor = (hex, targetHex, ratio) => {
	const parse = (value) => {
		const number = Number.parseInt(value.replace('#', ''), 16);
		return { r: (number >> 16) & 255, g: (number >> 8) & 255, b: number & 255 };
	};
	const from = parse(hex);
	const to = parse(targetHex);
	const t = Math.min(1, Math.max(0, ratio));
	return `rgb(${Math.round(from.r + (to.r - from.r) * t)}, ${Math.round(from.g + (to.g - from.g) * t)}, ${Math.round(from.b + (to.b - from.b) * t)})`;
};

const useGlobalVolume = () => {
	const [volume, setVolumeState] = useState(globalVolume);

	useEffect(() => {
		const listener = (value) => setVolumeState(value);
		volumeSubscribers.add(listener);
		return () => volumeSubscribers.delete(listener);
	}, []);

	const setVolume = useCallback((value) => {
		globalVolume = value;
		volumeSubscribers.forEach((listener) => listener(value));
	}, []);

	return [volume, setVolume];
};

const useWaveformWorker = () => {
	const workerRef = useRef(null);
	const pendingRef = useRef(new Map());

	useEffect(
		() => () => {
			workerRef.current?.terminate();
			pendingRef.current.forEach(({ reject }) => reject(new Error('Waveform Worker terminated')));
			pendingRef.current.clear();
		},
		[]
	);

	return useCallback((samples, pointCount = 1800) => {
		if (!workerRef.current) {
			const worker = new Worker(new URL('../../workers/waveform.worker.js', import.meta.url), { type: 'module' });
			worker.onmessage = ({ data }) => {
				const pending = pendingRef.current.get(data.id);
				if (!pending) return;
				pendingRef.current.delete(data.id);
				if (data.error) pending.reject(new Error(data.error));
				else pending.resolve(data.waveform);
			};
			workerRef.current = worker;
		}

		const id = ++waveformRequestId;
		const transferable = samples.slice().buffer;
		return new Promise((resolve, reject) => {
			pendingRef.current.set(id, { resolve, reject });
			workerRef.current.postMessage({ id, samples: transferable, pointCount }, [transferable]);
		});
	}, []);
};

function SpectrogramImage({ src, alt, comparing = true, magnifierEnabled = false, magnifierPosition = null, magnification = 1.5, onMagnifierMove }) {
	const frameRef = useRef(null);
	const [loaded, setLoaded] = useState(false);
	const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		setLoaded(false);
	}, [src]);

	useEffect(() => {
		const frame = frameRef.current;
		if (!frame) return undefined;
		const updateFrameSize = () => {
			const rect = frame.getBoundingClientRect();
			setFrameSize((current) =>
				current.width === rect.width && current.height === rect.height ? current : { width: rect.width, height: rect.height }
			);
		};
		updateFrameSize();
		const observer = new ResizeObserver(updateFrameSize);
		observer.observe(frame);
		return () => observer.disconnect();
	}, []);

	const handleMove = (event) => {
		if (!magnifierEnabled || !comparing) return;
		const rect = frameRef.current?.getBoundingClientRect();
		if (!rect) return;
		onMagnifierMove?.({
			x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
			y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height))
		});
	};
	const showMagnifier = magnifierEnabled && magnifierPosition && loaded && comparing && frameSize.width > 0 && frameSize.height > 0;
	const zoomedWidth = frameSize.width * magnification;
	const zoomedHeight = frameSize.height * magnification;

	return (
		<div
			ref={frameRef}
			class={`spectrogram-image-frame${showMagnifier ? ' spectrogram-hovering' : ''}`}
			onMouseMove={handleMove}
			onMouseLeave={() => onMagnifierMove?.(null)}
		>
			{comparing ? (
				<img class="spectrogram-canvas" src={src} alt={alt} onLoad={() => setLoaded(true)} decoding="async" />
			) : (
				<span class="spectrogram-placeholder">Select a method</span>
			)}
			{showMagnifier && (
				<span
					class="spectrogram-magnifier"
					aria-hidden="true"
					style={{
						left: `${magnifierPosition.x * 100}%`,
						top: `${magnifierPosition.y * 100}%`,
						backgroundImage: `url("${src}")`,
						backgroundSize: `${zoomedWidth}px ${zoomedHeight}px`,
						backgroundPosition: `${magnifierWidth / 2 - magnifierPosition.x * zoomedWidth}px ${magnifierHeight / 2 - magnifierPosition.y * zoomedHeight}px`
					}}
				/>
			)}
			{comparing && !loaded && <div class="canvas-loading spectrogram-loading">Loading...</div>}
		</div>
	);
}

function AxisTicks({ duration, prefix }) {
	const ticks = [];
	for (let tick = 0; tick <= Math.floor(duration || 0); tick += 1) ticks.push(tick);
	return (
		<div class="spectrogram-axis spectrogram-axis-x">
			{ticks.map((tick) => (
				<span
					key={`${prefix}-${tick}`}
					class={`spectrogram-axis-tick${tick % 2 === 0 ? ' is-major' : ''}`}
					style={{ left: `${duration ? (tick / duration) * 100 : 0}%` }}
				>
					<span class="spectrogram-axis-line" />
					<span class="spectrogram-axis-label">{tick % 2 === 0 ? formatTime(tick) : ''}</span>
				</span>
			))}
		</div>
	);
}

function SpectrogramSide({ src, alt, duration, prefix, comparing = true, magnifierEnabled = false, magnifierPosition = null, magnification = 1.5, onMagnifierMove }) {
	return (
		<div class="spectrogram-side">
			<SpectrogramImage
				src={src}
				alt={alt}
				comparing={comparing}
				magnifierEnabled={magnifierEnabled}
				magnifierPosition={magnifierPosition}
				magnification={magnification}
				onMagnifierMove={onMagnifierMove}
			/>
			<div class="spectrogram-axis spectrogram-axis-y">
				<span class="spectrogram-axis-title">Frequency[kHz]</span>
				{[0, 2, 4, 6, 8].map((tick) => (
					<span key={`${prefix}-y-${tick}`} class="spectrogram-axis-tick" style={{ top: `${100 - (tick / 8) * 100}%` }}>
						<span class="spectrogram-axis-line" />
						<span class="spectrogram-axis-label">{tick}</span>
					</span>
				))}
			</div>
			<AxisTicks duration={duration} prefix={prefix} />
		</div>
	);
}

function SynchronizedSpectrogram({ measurementSrc, comparisonSrc, sampleName, selectedLabel, duration, comparing, magnification }) {
	const [magnifierPosition, setMagnifierPosition] = useState(null);

	useEffect(() => setMagnifierPosition(null), [measurementSrc, comparisonSrc, comparing]);

	return (
		<div class="spectrogram-block">
			<div class="spectrogram-labels">
				<span class="spectrogram-label">Measurement</span>
				<span class="spectrogram-gap" />
				<span class="spectrogram-label">{comparing ? selectedLabel : ''}</span>
			</div>
			<div class="spectrogram-row">
				<SpectrogramSide
					src={measurementSrc}
					alt={`Measurement spectrogram for ${sampleName}`}
					duration={duration}
					prefix="left"
					magnifierEnabled={comparing}
					magnifierPosition={magnifierPosition}
					magnification={magnification}
					onMagnifierMove={setMagnifierPosition}
				/>
				<div class="spectrogram-gap" />
				<SpectrogramSide
					src={comparisonSrc}
					alt={`${selectedLabel} spectrogram for ${sampleName}`}
					duration={duration}
					prefix="right"
					comparing={comparing}
					magnifierEnabled={comparing}
					magnifierPosition={magnifierPosition}
					magnification={magnification}
					onMagnifierMove={setMagnifierPosition}
				/>
			</div>
		</div>
	);
}

function WaveCompare({ sampleName, sampleIndex, methods, basePath }) {
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
	const [spectrogramMagnification, setSpectrogramMagnification] = useState(1.5);
	const [tooltip, setTooltip] = useState(null);
	const [volume, setVolume] = useGlobalVolume();
	const currentSampleRef = useRef(sampleName);
	const audioRef = useRef(null);
	const canvasRef = useRef(null);
	const gainRef = useRef(null);
	const mediaSourceRef = useRef(null);
	const animationRef = useRef(0);
	const pendingPlayRef = useRef(false);
	const tooltipTimerRef = useRef(0);
	const analyzeWaveform = useWaveformWorker();
	currentSampleRef.current = sampleName;

	const orderedMethods = useMemo(() => {
		const measurement = methods.find((method) => method.key === 'Measurement');
		const groundTruth = methods.find((method) => method.key === 'Ground_Truth');
		const middle = methods.filter((method) => method.key !== 'Measurement' && method.key !== 'Ground_Truth');
		return [measurement, ...middle, groundTruth].filter(Boolean);
	}, [methods]);
	const primaryMethods = orderedMethods.filter((method) => ['Measurement', 'Ground_Truth'].includes(method.key));
	const otherMethods = orderedMethods.filter((method) => !['Measurement', 'Ground_Truth'].includes(method.key));
	const selectedLabel = methods.find((method) => method.key === selectedMethod)?.label || selectedMethod;
	const comparing = selectedMethod !== 'Measurement';
	const meta = sampleMeta(sampleName);
	const activeLegend = pinnedLegend ?? hoveredLegend;
	const progressPercent = duration ? (currentTime / duration) * 100 : 0;
	const remainingTime = Math.max(0, duration - currentTime);
	const timeTicks = [];
	for (let tick = 0; tick <= Math.floor(duration || 0); tick += 1) timeTicks.push(tick);

	const ensureMethod = useCallback(
		async (method) => {
			const url = assetUrl(basePath, method, sampleName, 'opus');
			setStatuses((current) => ({ ...current, [method]: 'loading' }));
			try {
				const resource = await loadOpus(url);
				if (currentSampleRef.current === sampleName) {
					setResources((current) => ({ ...current, [method]: resource }));
					setStatuses((current) => ({ ...current, [method]: 'ready' }));
				}
				return resource;
			} catch (error) {
				if (currentSampleRef.current === sampleName) {
					setStatuses((current) => ({ ...current, [method]: 'error' }));
				}
				throw error;
			}
		},
		[basePath, sampleName]
	);

	const waveformFor = useCallback(
		async (method) => {
			const url = assetUrl(basePath, method, sampleName, 'opus');
			if (!waveformDataCache.has(url)) {
				waveformDataCache.set(
					url,
					(async () => {
						const resource = await ensureMethod(method);
						const context = getDecodeContext();
						const audioBuffer = await context.decodeAudioData(resource.buffer.slice(0));
						const values = await analyzeWaveform(audioBuffer.getChannelData(0));
						return { values, duration: audioBuffer.duration };
					})()
				);
			}
			return waveformDataCache.get(url);
		},
		[analyzeWaveform, basePath, ensureMethod, sampleName]
	);

	const ensureWaveforms = useCallback(async () => {
		const key = `${sampleName}|${selectedMethod}`;
		if (waveforms[key]) return;
		setWaveformStatus('loading');
		setWaveformError('');
		try {
			const [measurement, selected] = await Promise.all([
				waveformFor('Measurement'),
				selectedMethod === 'Measurement' ? waveformFor('Measurement') : waveformFor(selectedMethod)
			]);
			if (currentSampleRef.current !== sampleName) return;
			setWaveforms((current) => ({ ...current, [key]: { measurement, selected } }));
			setDuration((current) => current || selected.duration || measurement.duration);
			setWaveformStatus('ready');
		} catch (error) {
			setWaveformStatus('error');
			setWaveformError(error instanceof Error ? error.message : String(error));
		}
	}, [sampleName, selectedMethod, waveformFor, waveforms]);

	useEffect(() => {
		setSelectedMethod('Measurement');
		setResources({});
		setStatuses({});
		setWaveforms({});
		setCurrentTime(0);
		setDuration(0);
		setHasEnded(false);
		setPinnedLegend(null);
		new Set(['Measurement', 'Ground_Truth']).forEach((method) => ensureMethod(method).catch(() => {}));
	}, [ensureMethod, sampleName]);

	useEffect(() => {
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
		const audio = audioRef.current;
		const source = resources[selectedMethod]?.objectUrl;
		if (!audio || !source) return;
		audio.pause();
		audio.src = source;
		audio.load();
		setCurrentTime(0);
		setDuration(0);
		setHasEnded(false);
		if (pendingPlayRef.current) {
			pendingPlayRef.current = false;
			window.setTimeout(async () => {
				try {
					await ensureAudioGraph();
					await audio.play();
				} catch {
					// Playback can still be blocked by a restrictive browser policy.
				}
			}, 0);
		}
	}, [ensureAudioGraph, resources, selectedMethod]);

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

	useEffect(() => () => stopAnimation(), []);

	const togglePlayback = async () => {
		const audio = audioRef.current;
		if (!audio) return;
		if (!resources[selectedMethod]) {
			pendingPlayRef.current = true;
			await ensureMethod(selectedMethod);
			return;
		}
		await ensureAudioGraph();
		if (hasEnded) {
			audio.currentTime = 0;
			setHasEnded(false);
		}
		if (audio.paused) await audio.play();
		else audio.pause();
	};

	const handleMethodClick = async (method) => {
		if (selectedMethod === method && resources[method]) {
			await togglePlayback();
			return;
		}
		audioRef.current?.pause();
		setSelectedMethod(method);
		setPinnedLegend(null);
		pendingPlayRef.current = true;
		if (!resources[method]) await ensureMethod(method);
	};

	const handleMethodHover = (event, method) => {
		window.clearTimeout(tooltipTimerRef.current);
		const rect = event.currentTarget.getBoundingClientRect();
		tooltipTimerRef.current = window.setTimeout(() => {
			setTooltip({
				text: methodTooltips[method] || methods.find((item) => item.key === method)?.description || '',
				x: Math.min(window.innerWidth - 330, Math.max(12, rect.left)),
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

		const labelPad = 28;
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
			const drawMeasurement = () => render(measurementValues, methodColors.Measurement, measurementAlpha, muted);
			const drawCompare = () => {
				if (comparing) render(data.selected.values, methodColors[selectedMethod] || '#0a84ff', compareAlpha, muted);
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

		context.font = '10px "Times New Roman", serif';
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
	}, [activeLegend, comparing, currentTime, duration, isPlayheadHover, sampleName, selectedMethod, waveforms]);

	useEffect(() => {
		drawWaveform();
	}, [drawWaveform]);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas || typeof ResizeObserver === 'undefined') return;
		const observer = new ResizeObserver(drawWaveform);
		observer.observe(canvas);
		return () => observer.disconnect();
	}, [drawWaveform]);

	const seek = (value) => {
		const next = Number(value);
		if (audioRef.current) audioRef.current.currentTime = next;
		setCurrentTime(next);
		setHasEnded(false);
	};

	const handleProgressMove = (event) => {
		const rect = event.currentTarget.getBoundingClientRect();
		const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
		setProgressHover({ left: ratio * rect.width, time: ratio * duration });
	};

	const handleLegendClick = (legend) => setPinnedLegend((current) => (current === legend ? null : legend));
	const playIcon = hasEnded ? '/logo/reload.svg' : isPlaying ? '/logo/player-pause.svg' : '/logo/player-play.svg';
	const volumeIcon = volume <= 0 ? '/logo/volume-off.svg' : volume < 100 ? '/logo/volume-2.svg' : '/logo/volume.svg';
	const statusText = waveformStatus === 'error' ? waveformError || 'Load failed' : '';

	return (
		<section class="wave-compare">
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
								style={{ '--method-color': methodColors[method.key] }}
								onClick={() => handleMethodClick(method.key)}
							>
								<span class="chip-dot" aria-hidden="true" />
								<span class="chip-label">{method.label}</span>
								{statuses[method.key] === 'loading' ? (
									<span class="chip-spinner" aria-hidden="true" />
								) : (
									<span class="chip-action" aria-hidden="true">
										<img class="icon-img" src={isPlaying && playingMethod === method.key ? '/logo/player-pause.svg' : '/logo/player-play.svg'} alt="" />
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
									style={{ '--method-color': methodColors[method.key] }}
									onClick={() => handleMethodClick(method.key)}
								>
									<span class="chip-dot" aria-hidden="true" />
									<span class="chip-label">{method.label}</span>
									{statuses[method.key] === 'loading' ? (
										<span class="chip-spinner" aria-hidden="true" />
									) : (
										<span class="chip-action" aria-hidden="true">
											<img class="icon-img" src={isPlaying && playingMethod === method.key ? '/logo/player-pause.svg' : '/logo/player-play.svg'} alt="" />
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
						<span
							class="legend-item"
							style={{ opacity: activeLegend === 'compare' ? 0.1 : 1 }}
							onMouseEnter={() => setHoveredLegend('measurement')}
							onMouseLeave={() => setHoveredLegend(null)}
							onClick={() => handleLegendClick('measurement')}
						>
							<span class="legend-swatch" style={{ background: methodColors.Measurement }} />
							Measurement
						</span>
						{comparing && (
							<span
								class="legend-item"
								style={{ opacity: activeLegend === 'measurement' ? 0.1 : 1 }}
								onMouseEnter={() => setHoveredLegend('compare')}
								onMouseLeave={() => setHoveredLegend(null)}
								onClick={() => handleLegendClick('compare')}
							>
								<span class="legend-swatch" style={{ background: methodColors[selectedMethod] || '#0a84ff' }} />
								{selectedLabel}
							</span>
						)}
					</div>
					<div class="wave-panel-actions">
						<a
							class="wave-download"
							href={assetUrl(basePath, selectedMethod, sampleName, 'wav')}
							download
							aria-label={`Download ${selectedLabel} WAV`}
							title="Download WAV"
						>
							<img src="/logo/download.svg" alt="" aria-hidden="true" />
							<span>{selectedLabel}</span>
						</a>
						<div class="view-toggle" role="group" aria-label="Visualization mode">
							<button type="button" class={`view-toggle-btn${viewMode === 'waveform' ? ' active' : ''}`} onClick={() => setViewMode('waveform')}>
								Waveform
							</button>
							<button type="button" class={`view-toggle-btn${viewMode === 'spectrogram' ? ' active' : ''}`} onClick={() => setViewMode('spectrogram')}>
								Spectrogram
							</button>
						</div>
						{statusText && <span class="wave-status wave-status-error">{statusText}</span>}
					</div>
				</div>

				{viewMode === 'waveform' && (
					<>
						<div class="wave-canvas-wrap" onMouseEnter={() => setIsPlayheadHover(true)} onMouseLeave={() => setIsPlayheadHover(false)}>
							<canvas ref={canvasRef} class="wave-canvas" aria-label={`${selectedLabel} waveform compared with Measurement`} />
							{waveformStatus === 'loading' && <div class="canvas-loading wave-loading">Loading...</div>}
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
						<SynchronizedSpectrogram
							measurementSrc={assetUrl(basePath, 'Measurement', sampleName, 'spectrogram')}
							comparisonSrc={assetUrl(basePath, selectedMethod, sampleName, 'spectrogram')}
							sampleName={sampleName}
							selectedLabel={selectedLabel}
							duration={duration}
							comparing={comparing}
							magnification={spectrogramMagnification}
						/>
						<div class="spectrogram-controls">
							<div class="spectrogram-colorbar-wrap" aria-label="Spectrogram energy scale">
								<span class="spectrogram-colorbar-label">0 dB</span>
								<div class="spectrogram-colorbar" />
								<span class="spectrogram-colorbar-label">-60 dB</span>
							</div>
							<div class="spectrogram-magnification">
								<span class="spectrogram-magnification-label">Magnification</span>
								<div class="spectrogram-magnification-options" role="group" aria-label="Spectrogram magnification">
									{[1.25, 1.5, 1.75, 2].map((value) => (
										<button
											key={value}
											type="button"
											class={`spectrogram-magnification-option${spectrogramMagnification === value ? ' active' : ''}`}
											onClick={() => setSpectrogramMagnification(value)}
										>
											{value}×
										</button>
									))}
								</div>
							</div>
						</div>
					</>
				)}

				<div class="progress-row">
					<button type="button" class="progress-play" onClick={togglePlayback} aria-label={hasEnded ? 'Replay' : isPlaying ? 'Pause' : 'Play'}>
						<img class="icon-img" src={playIcon} alt="" />
					</button>
					<span class="time-label">{formatTime(currentTime)}</span>
					<div class={`progress-track${progressHover ? ' progress-track-hover' : ''}`} onMouseMove={handleProgressMove} onMouseLeave={() => setProgressHover(null)}>
						<input
							class="progress-bar"
							type="range"
							min="0"
							max={duration || 0}
							step="0.01"
							value={currentTime}
							style={{
								background: `linear-gradient(90deg, #0a84ff 0%, #0a84ff ${progressPercent}%, #e2e8f0 ${progressPercent}%, #e2e8f0 100%)`
							}}
							onInput={(event) => seek(event.currentTarget.value)}
							aria-label="Playback position"
						/>
						{progressHover && (
							<div class="progress-tooltip" style={{ left: `${progressHover.left}px` }}>
								{formatTime(progressHover.time)}
							</div>
						)}
					</div>
					<span class="time-label">-{formatTime(remainingTime)}</span>
					<div class="volume-control">
						<button type="button" class="volume-button" aria-label={volume <= 0 ? 'Mute' : 'Volume'}>
							<img class="icon-img" src={volumeIcon} alt="" />
						</button>
						<div class="volume-popover">
							<div class="volume-label">{Math.round(volume)}</div>
							<div class="volume-slider-wrap">
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
		<div class="rsb-simple-table-wrap">
			<table class="rsb-simple-table">
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
							<td class="rsb-cell-sample">{sample}</td>
							<td class="rsb-cell-metric">{sampleMeta(sample).value}</td>
							{methods.map((method) => (
								<td class="rsb-cell-audio" key={`${sample}-${method.key}`}>
									<audio class="rsb-simple-audio" src={assetUrl(basePath, method.key, sample, 'opus')} controls preload="none" />
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function DatasetGroup({ id, index, name, task, description, tone, samples, methods, basePath }) {
	const [sampleIndex, setSampleIndex] = useState(0);
	const [showAll, setShowAll] = useState(false);
	const [visualization, setVisualization] = useState(true);
	const visibleSamples = showAll ? samples : [samples[sampleIndex]];

	const go = (direction) => {
		setSampleIndex((current) => (current + direction + samples.length) % samples.length);
	};

	return (
		<section class={`rsb-audio-group rsb-audio-group-${tone}`} aria-labelledby={`${id}-heading`}>
			<div class="rsb-audio-header">
				<div class="rsb-dataset-heading">
					<span class="rsb-dataset-index" aria-hidden="true">
						{index}
					</span>
					<div class="rsb-dataset-heading-copy">
						<div class="rsb-dataset-title-row">
							<h3 id={`${id}-heading`} class="rsb-subtitle">
								{name}
							</h3>
							<span class="rsb-dataset-task">{task}</span>
							<span class="rsb-dataset-count">{samples.length} samples</span>
						</div>
						<p class="rsb-dataset-description">{description}</p>
					</div>
				</div>
				<label class="rsb-visual-toggle">
					<span class="rsb-toggle-label">Visualization</span>
					<input type="checkbox" checked={visualization} onChange={(event) => setVisualization(event.currentTarget.checked)} />
					<span class="rsb-toggle-slider" aria-hidden="true" />
				</label>
			</div>
			<div class={`rsb-audio-list${visualization ? '' : ' rsb-audio-list-simple'}`}>
				{visualization ? (
					visibleSamples.map((sample, index) => (
						<WaveCompare
							key={sample}
							sampleName={sample}
							sampleIndex={showAll ? index + 1 : sampleIndex + 1}
							methods={methods}
							basePath={basePath}
						/>
					))
				) : (
					<SimpleTable samples={samples} methods={methods} basePath={basePath} />
				)}
			</div>
			{visualization && (
				<div class="rsb-audio-actions">
					<button type="button" class="rsb-nav-btn" disabled={showAll} onClick={() => go(-1)}>
						Previous
					</button>
					<button type="button" class="rsb-show-more" onClick={() => setShowAll((current) => !current)}>
						{showAll ? 'Hidden' : 'Show More'}
					</button>
					<button type="button" class="rsb-nav-btn" disabled={showAll} onClick={() => go(1)}>
						Next
					</button>
				</div>
			)}
		</section>
	);
}

export default function AudioDemoIsland({ denoiseSamples, dereverbSamples, methods, basePath }) {
	return (
		<div class="audio-demo-island">
			<DatasetGroup
				id="wsj0-wham"
				index="01"
				name="WSJ0+WHAM"
				task="Denoising"
				description="Speech enhancement under additive environmental noise."
				tone="denoise"
				samples={denoiseSamples}
				methods={methods}
				basePath={basePath}
			/>
			<DatasetGroup
				id="wsj0-reverb"
				index="02"
				name="WSJ0+REVERB"
				task="Dereverberation"
				description="Speech enhancement under simulated room reverberation."
				tone="dereverb"
				samples={dereverbSamples}
				methods={methods}
				basePath={basePath}
			/>
		</div>
	);
}
