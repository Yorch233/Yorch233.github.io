import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import UiIcon from './UiIcon.jsx';

const audioResourceCache = new Map();
const waveformDataCache = new Map();
let decodeContext;
let waveformRequestId = 0;
let globalVolume = 100;
const volumeSubscribers = new Set();
const magnifierWidth = 140;
const magnifierHeight = 90;

const defaultMethodColor = '#0a84ff';
const measurementColor = '#ff9d00';

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
	const pending = audioResourceCache.get(url);
	pending.catch(() => { if (audioResourceCache.get(url) === pending) audioResourceCache.delete(url); });
	return pending;
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
    const disposedRef = useRef(false);
	const pendingRef = useRef(new Map());

	useEffect(
		() => () => {
            disposedRef.current = true;
			workerRef.current?.terminate();
			pendingRef.current.forEach(({ reject }) => reject(new Error('Waveform Worker terminated')));
			pendingRef.current.clear();
		},
		[]
	);

	return useCallback((samples, pointCount = 1800) => {
        if (disposedRef.current) return Promise.reject(new Error('Waveform view closed'));
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
	const imageRef = useRef(null);
	const [loaded, setLoaded] = useState(false);
	const [failed, setFailed] = useState(false);
	const [frameSize, setFrameSize] = useState({ width: 0, height: 0 });

	useEffect(() => {
		/* A local or cached image can fire load before this effect runs.
		   Read the current image instead of resetting a completed load. */
		const image = imageRef.current;
		setLoaded(Boolean(image?.complete && image.naturalWidth > 0));
		setFailed(Boolean(image?.complete && image.naturalWidth === 0));
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
				<img key={src} ref={imageRef} class="spectrogram-canvas" src={src} alt={alt} onLoad={() => { setLoaded(true); setFailed(false); }} onError={() => setFailed(true)} decoding="async" />
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
			{comparing && !loaded && <div class="canvas-loading spectrogram-loading">{failed ? 'Spectrogram unavailable' : 'Loading...'}</div>}
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

function SpectrogramSide({ src, alt, label, duration, prefix, comparing = true, magnifierEnabled = false, magnifierPosition = null, magnification = 1.5, onMagnifierMove }) {
	return (
		<div class="spectrogram-side" data-label={label}>
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

function SynchronizedSpectrogram({ measurementSrc, comparisonSrc, sampleName, selectedLabel, measurementLabel = 'Measurement', duration, comparing }) {
	const [magnifierPosition, setMagnifierPosition] = useState(null);

	useEffect(() => setMagnifierPosition(null), [measurementSrc, comparisonSrc, comparing]);

	return (
		<div class="spectrogram-block">
			<div class="spectrogram-labels">
				<span class="spectrogram-label">{measurementLabel}</span>
				<span class="spectrogram-gap" />
				<span class="spectrogram-label">{comparing ? selectedLabel : ''}</span>
			</div>
			<div class="spectrogram-row">
				<SpectrogramSide
					src={measurementSrc}
					label={measurementLabel}
					alt={`${measurementLabel} spectrogram for ${sampleName}`}
					duration={duration}
					prefix="left"
					magnifierEnabled={comparing}
					magnifierPosition={magnifierPosition}
					onMagnifierMove={setMagnifierPosition}
				/>
				<div class="spectrogram-gap" />
				<SpectrogramSide
					src={comparisonSrc}
					label={comparing ? selectedLabel : 'Select a method'}
					alt={`${selectedLabel} spectrogram for ${sampleName}`}
					duration={duration}
					prefix="right"
					comparing={comparing}
					magnifierEnabled={comparing}
					magnifierPosition={magnifierPosition}
					onMagnifierMove={setMagnifierPosition}
				/>
				</div>
				<div class="spectrogram-colorbar-wrap" aria-label="Spectrogram energy scale">
					<span class="spectrogram-colorbar-label">0 dB</span>
					<div class="spectrogram-colorbar" />
					<span class="spectrogram-colorbar-label">-60 dB</span>
				</div>
			</div>
	);
}

/* Icon + label before a flat iOS-style segmented capsule; the solid white
   thumb slides between options as the selection changes. */
function SegmentedToggle({ fieldClass, label, icon, value, options, onChange, ariaLabel }) {
	const trackRef = useRef(null);
	const [thumb, setThumb] = useState(null);

	useLayoutEffect(() => {
		const track = trackRef.current;
		if (!track) return undefined;
		const update = () => {
			const active = track.querySelector('.segmented-option.active');
			if (!active) {
				setThumb(null);
				return;
			}
			setThumb({ left: active.offsetLeft, width: active.offsetWidth });
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(track);
		return () => observer.disconnect();
	}, [value, options.length]);

	return (
		<div class={`segmented-field${fieldClass ? ` ${fieldClass}` : ''}`}>
			{label && (
				<span class="segmented-field-label">
					<UiIcon id={icon} />
					{label}
				</span>
			)}
			<div class="segmented-toggle" role="group" aria-label={ariaLabel || label} ref={trackRef}>
				{thumb && <span class="segmented-thumb" aria-hidden="true" style={{ width: `${thumb.width}px`, transform: `translateX(${thumb.left}px)` }} />}
				{options.map((option) => (
					<button
						key={option.key}
						type="button"
						class={`segmented-option${option.buttonClass ? ` ${option.buttonClass}` : ''}${option.key === value ? ' active' : ''}`}
						aria-pressed={option.key === value}
						onClick={() => onChange(option.key)}
					>
						{option.icon && <UiIcon id={option.icon} />}
						<span>{option.label}</span>
					</button>
				))}
			</div>
		</div>
	);
}


export { assetUrl, loadOpus, getDecodeContext, formatTime, sampleMeta, mixColor, useGlobalVolume, useWaveformWorker, waveformDataCache, defaultMethodColor, measurementColor, SynchronizedSpectrogram, SegmentedToggle };
