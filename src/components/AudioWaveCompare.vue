<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, getCurrentInstance } from 'vue';

const globalVolume = ref(100);

const props = defineProps({
	sampleName: {
		type: String,
		required: true
	},
	sampleIndex: {
		type: Number,
		default: null
	},
	methods: {
		type: Array,
		default: () => []
	},
	defaultMethod: {
		type: String,
		default: 'Measurement'
	},
	cleanKey: {
		type: String,
		default: 'Ground_Truth'
	},
	measurementKey: {
		type: String,
		default: 'Measurement'
	}
});

const defaultMethods = [
	{ key: 'Ground_Truth', label: 'Ground Truth (Clean)' },
	{ key: 'Measurement', label: 'Measurement (Noisy/Reverb)' },
	{ key: 'NCSN+M', label: 'NCSN+M' },
	{ key: 'SB', label: 'SB' },
	{ key: 'StoRM', label: 'StoRM' },
	{ key: 'RSB', label: 'RSB (Ours)' }
];

const normalizedMethods = computed(() => (props.methods?.length ? props.methods : defaultMethods));
const orderedMethods = computed(() => {
	const methods = [...normalizedMethods.value];
	const measurement = methods.find((item) => item.key === props.measurementKey);
	const groundTruth = methods.find((item) => item.key === props.cleanKey);
	const middle = methods.filter((item) => item.key !== props.measurementKey && item.key !== props.cleanKey);
	return [measurement, ...middle, groundTruth].filter(Boolean);
});
const selectedMethod = ref(props.defaultMethod);

const containerRef = ref(null);
const combinedCanvasRef = ref(null);
const spectrogramLeftRef = ref(null);
const spectrogramRightRef = ref(null);
const spectrogramZoomLeftRef = ref(null);
const spectrogramZoomRightRef = ref(null);
const audioRef = ref(null);

const cleanBuffer = ref(null);
const methodBuffer = ref(null);
const measurementBuffer = ref(null);
const measurementScale = ref(1);
const currentTime = ref(0);
const duration = ref(0);
const hasEnded = ref(false);
const hoverTime = ref(0);
const isHovering = ref(false);
const hoverLeft = ref(0);
const hoveredLegend = ref(null);
const pinnedLegend = ref(null);
const isVisible = ref(false);
const hasLoaded = ref(false);
const viewMode = ref('waveform');
const isWaveformRendering = ref(false);
const isSpectrogramRendering = ref(false);
const isSpectrogramHover = ref(false);
const spectrogramHover = ref({ x: 0, y: 0 });
const isPlayheadHover = ref(false);

const cleanLoading = ref(true);
const methodLoading = ref(true);
const cleanError = ref('');
const methodError = ref('');
const isPlaying = ref(false);
const playingMethod = ref('');
const methodStatus = ref({});

const cleanUrl = computed(() => buildUrl(props.cleanKey));
const methodUrl = computed(() => buildUrl(selectedMethod.value));
const measurementUrl = computed(() => buildUrl(props.measurementKey));

const cleanLabel = computed(() => normalizedMethods.value.find((item) => item.key === props.cleanKey)?.label || 'Ground Truth');
const methodLabel = computed(() => normalizedMethods.value.find((item) => item.key === selectedMethod.value)?.label || selectedMethod.value);
const measurementLabel = computed(() => normalizedMethods.value.find((item) => item.key === props.measurementKey)?.label || 'Measurement');
const isComparing = computed(() => selectedMethod.value !== props.measurementKey);
const measurementColor = computed(() => methodColors[props.measurementKey] || '#ef4444');
const compareColor = computed(() => methodColors[selectedMethod.value] || '#0a84ff');
const progressPercent = computed(() => (duration.value ? (currentTime.value / duration.value) * 100 : 0));
const progressStyle = computed(() => ({
	background: `linear-gradient(90deg, #0a84ff 0%, #0a84ff ${progressPercent.value}%, #e2e8f0 ${progressPercent.value}%, #e2e8f0 100%)`
}));
const remainingTime = computed(() => Math.max(0, duration.value - currentTime.value));
const hoverTimeLabel = computed(() => formatTime(hoverTime.value));
const playheadPercent = computed(() => (duration.value ? (currentTime.value / duration.value) * 100 : 0));
const timeTicks = computed(() => {
	if (!duration.value || duration.value <= 0) {
		return [];
	}
	const ticks = [];
	for (let t = 0; t <= Math.floor(duration.value); t += 1) {
		ticks.push(t);
	}
	return ticks;
});
const lastTimeTick = computed(() => (timeTicks.value.length ? timeTicks.value[timeTicks.value.length - 1] : 0));
const spectrogramTicks = computed(() => [0, 2, 4, 6, 8]);
const playIconSrc = computed(() => {
	if (hasEnded.value) {
		return '/logo/reload.svg';
	}
	return isPlaying.value ? '/logo/player-pause.svg' : '/logo/player-play.svg';
});
const playIconLabel = computed(() => {
	if (hasEnded.value) {
		return 'Replay';
	}
	return isPlaying.value ? 'Pause' : 'Play';
});
const sampleDisplayName = computed(() => props.sampleName);
const sampleIndexLabel = computed(() => (Number.isFinite(props.sampleIndex) && props.sampleIndex > 0 ? `#${props.sampleIndex}` : ''));
const sampleMeta = computed(() => {
	const snrMatch = props.sampleName.match(/snr=([\-\d]+(?:\.\d+)?)/i);
	if (snrMatch) {
		return {
			label: 'SNR',
			value: `${snrMatch[1]} dB`,
			tooltip: 'Signal-to-noise ratio (SNR) measures speech strength relative to background noise. Higher is cleaner.'
		};
	}
	const t60Match = props.sampleName.match(/t60=([\-\d]+(?:\.\d+)?)/i);
	if (t60Match) {
		return {
			label: 'T60',
			value: `${t60Match[1]} s`,
			tooltip: 'Reverberation time (T60) is the time for sound to decay by 60 dB. Lower means less reverberation.'
		};
	}
	return { label: 'Metric', value: '—', tooltip: '' };
});
const volumePercent = computed(() => Math.round(globalVolume.value));
const volumeIconSrc = computed(() => {
	if (globalVolume.value <= 0) {
		return '/logo/volume-off.svg';
	}
	if (globalVolume.value < 100) {
		return '/logo/volume-2.svg';
	}
	return '/logo/volume.svg';
});
const volumeIconLabel = computed(() => (globalVolume.value <= 0 ? 'Mute' : 'Volume'));
const activeLegend = computed(() => pinnedLegend.value ?? hoveredLegend.value);
const measurementLegendOpacity = computed(() => (activeLegend.value === 'compare' ? 0.1 : 1));
const compareLegendOpacity = computed(() => (activeLegend.value === 'measurement' ? 0.1 : 1));
const measurementWaveAlpha = computed(() => {
	const base = isComparing.value ? 0.45 : 1;
	if (activeLegend.value === 'compare') {
		return 0.1;
	}
	if (pinnedLegend.value === 'measurement') {
		return 1;
	}
	return base;
});
const compareWaveAlpha = computed(() => (activeLegend.value === 'measurement' ? 0.1 : 0.9));
const statusText = computed(() => {
	if (cleanError.value || methodError.value) {
		return cleanError.value || methodError.value;
	}
	return '';
});
const isVisualizationLoading = computed(() => isWaveformRendering.value || isSpectrogramRendering.value);

const audioContextState = { instance: null, decodeContext: null };
const audioBufferCache = new Map();
const renderCache = new Map();
const maxCacheEntries = 40;
const spectrogramQuality = ref(1);
const spectrogramScale = computed(() => {
	const qualityMap = {
		1: 1,
		2: 1.6,
		3: 2.2,
		4: 3,
		5: 4
	};
	return qualityMap[spectrogramQuality.value] ?? 2.2;
});

const messageBox = getCurrentInstance()?.appContext.config.globalProperties.$messageBox;

const handleQualitySelect = async (value) => {
	if (value === spectrogramQuality.value) {
		return;
	}
	if (!messageBox?.confirm) {
		spectrogramQuality.value = value;
		return;
	}
	try {
		await messageBox.confirm({
			title: 'Spectrogram Quality',
			message:
				'Notice: Higher quality means longer rendering time. <span style="color:#ef4444;font-weight:600;">It may even cause the browser to crash. Please save any unsaved work in other tabs first.</span>',
			closeOnClickOverlay: true
		});
		spectrogramQuality.value = value;
	} catch (error) {
		// cancelled
	}
};

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

const setMethodStatus = (methodKey, status) => {
	methodStatus.value = {
		...methodStatus.value,
		[methodKey]: status
	};
};

const isMethodReady = (methodKey) => methodStatus.value[methodKey] === 'ready';

const buildUrl = (folderName) => new URL(`../assets/RSB/audio/${folderName}/${props.sampleName}`, import.meta.url).href;

const getAudioContext = () => {
	if (!audioContextState.instance) {
		const AudioContextClass = window.AudioContext || window.webkitAudioContext;
		audioContextState.instance = new AudioContextClass();
	}
	return audioContextState.instance;
};

const getDecodeContext = () => {
	if (!audioContextState.decodeContext) {
		const OfflineAudioContextClass = window.OfflineAudioContext || window.webkitOfflineAudioContext;
		if (OfflineAudioContextClass) {
			audioContextState.decodeContext = new OfflineAudioContextClass(1, 1, 44100);
		} else {
			audioContextState.decodeContext = getAudioContext();
		}
	}
	return audioContextState.decodeContext;
};

const loadAudioBuffer = async (url) => {
	if (audioBufferCache.has(url)) {
		return audioBufferCache.get(url);
	}
	const response = await fetch(url);
	if (!response.ok) {
		throw new Error(`Failed to fetch audio: ${response.status}`);
	}
	const arrayBuffer = await response.arrayBuffer();
	const decodeContext = getDecodeContext();
	try {
		const audioBuffer = await decodeContext.decodeAudioData(arrayBuffer.slice(0));
		audioBufferCache.set(url, audioBuffer);
		return audioBuffer;
	} catch (error) {
		const context = getAudioContext();
		if (context.state === 'suspended') {
			try {
				await context.resume();
			} catch (resumeError) {
				// ignore resume errors
			}
		}
		const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
		audioBufferCache.set(url, audioBuffer);
		return audioBuffer;
	}
};

const getScaleFactor = (audioBuffer) => {
	const channelData = audioBuffer.getChannelData(0);
	let maxAbs = 0;
	for (let i = 0; i < channelData.length; i += 1) {
		const abs = Math.abs(channelData[i]);
		if (abs > maxAbs) maxAbs = abs;
	}
	if (maxAbs === 0) {
		return 1;
	}
	return 0.95 / maxAbs;
};

const getFallbackDuration = () => {
	if (selectedMethod.value === props.measurementKey) {
		return measurementBuffer.value?.duration ?? methodBuffer.value?.duration ?? cleanBuffer.value?.duration ?? 0;
	}
	if (selectedMethod.value === props.cleanKey) {
		return cleanBuffer.value?.duration ?? methodBuffer.value?.duration ?? measurementBuffer.value?.duration ?? 0;
	}
	return methodBuffer.value?.duration ?? measurementBuffer.value?.duration ?? cleanBuffer.value?.duration ?? 0;
};

const drawWaveform = (ctx, audioBuffer, width, height, options = {}) => {
	if (!ctx || !audioBuffer) {
		return;
	}
	const { color = '#2563eb', alpha = 1, scale = 1 } = options;
	const channelData = audioBuffer.getChannelData(0);
	const samplesPerPixel = Math.max(1, Math.floor(channelData.length / width));
	const amplitude = height / 2;

	ctx.strokeStyle = color;
	ctx.globalAlpha = alpha;
	ctx.lineWidth = 1;
	ctx.beginPath();
	for (let x = 0; x < width; x += 1) {
		const start = x * samplesPerPixel;
		let min = 1;
		let max = -1;
		for (let i = 0; i < samplesPerPixel; i += 1) {
			const sample = channelData[start + i] ?? 0;
			if (sample < min) min = sample;
			if (sample > max) max = sample;
		}
		const minScaled = Math.max(-1, Math.min(1, min * scale));
		const maxScaled = Math.max(-1, Math.min(1, max * scale));
		ctx.moveTo(x, (1 + minScaled) * amplitude);
		ctx.lineTo(x, (1 + maxScaled) * amplitude);
	}
	ctx.stroke();
	ctx.globalAlpha = 1;
};

const buildRenderKey = (parts) => parts.join('|');

const setRenderCache = (key, canvas) => {
	if (renderCache.size >= maxCacheEntries) {
		renderCache.clear();
	}
	renderCache.set(key, canvas);
};

const hexToRgb = (hex) => {
	const normalized = hex.replace('#', '');
	if (normalized.length !== 6) {
		return { r: 15, g: 23, b: 42 };
	}
	const value = Number.parseInt(normalized, 16);
	return {
		r: (value >> 16) & 255,
		g: (value >> 8) & 255,
		b: value & 255
	};
};

const mixColor = (hex, targetHex, ratio) => {
	const a = hexToRgb(hex);
	const b = hexToRgb(targetHex);
	const t = Math.min(1, Math.max(0, ratio));
	const r = Math.round(a.r + (b.r - a.r) * t);
	const g = Math.round(a.g + (b.g - a.g) * t);
	const bC = Math.round(a.b + (b.b - a.b) * t);
	return `rgb(${r}, ${g}, ${bC})`;
};

const drawWaveformsOnContext = (ctx, width, height, drawableWidth, topPad, areaHeight, colorMode) => {
	const drawMeasurement = () => {
		if (!measurementBuffer.value) {
			return;
		}
		ctx.save();
		ctx.beginPath();
		ctx.rect(0, topPad, drawableWidth, areaHeight);
		ctx.clip();
		ctx.save();
		ctx.translate(0, topPad);
		const measurementColorValue = colorMode === 'muted' ? mixColor(measurementColor.value, '#f8fafc', 0.65) : measurementColor.value;
		drawWaveform(ctx, measurementBuffer.value, drawableWidth, areaHeight, {
			color: measurementColorValue,
			alpha: measurementWaveAlpha.value,
			scale: measurementScale.value
		});
		ctx.restore();
		ctx.restore();
	};

	const drawCompare = () => {
		if (!methodBuffer.value || !isComparing.value) {
			return;
		}
		ctx.save();
		ctx.beginPath();
		ctx.rect(0, topPad, drawableWidth, areaHeight);
		ctx.clip();
		ctx.save();
		ctx.translate(0, topPad);
		const compareColorValue = colorMode === 'muted' ? mixColor(compareColor.value, '#f8fafc', 0.65) : compareColor.value;
		drawWaveform(ctx, methodBuffer.value, drawableWidth, areaHeight, {
			color: compareColorValue,
			alpha: compareWaveAlpha.value,
			scale: measurementScale.value
		});
		ctx.restore();
		ctx.restore();
	};

	if (activeLegend.value === 'measurement') {
		drawCompare();
		drawMeasurement();
	} else if (activeLegend.value === 'compare') {
		drawMeasurement();
		drawCompare();
	} else {
		drawMeasurement();
		drawCompare();
	}
};

const drawReferenceLines = (ctx, width, height, drawableWidth, topPad, areaHeight) => {
	const centerY = topPad + areaHeight / 2;
	const amplitude = areaHeight / 2;
	const levels = [1, 0.5, 0, -0.5, -1];
	levels.forEach((level) => {
		const y = centerY - level * amplitude;
		ctx.beginPath();
		ctx.lineWidth = level === 0 ? 1.4 : 1;
		ctx.strokeStyle = level === 0 ? 'rgba(148, 163, 184, 0.55)' : 'rgba(148, 163, 184, 0.25)';
		ctx.moveTo(0, y);
		ctx.lineTo(drawableWidth, y);
		ctx.stroke();
	});
};

const drawReferenceLabels = (ctx, width, height, topPad, areaHeight) => {
	const centerY = topPad + areaHeight / 2;
	const amplitude = areaHeight / 2;
	const levels = [1, 0.5, 0, -0.5, -1];
	const labelX = width - 6;
	ctx.font = '10px "Times New Roman", serif';
	ctx.textAlign = 'right';
	ctx.textBaseline = 'middle';
	ctx.fillStyle = 'rgba(100, 116, 139, 0.9)';
	levels.forEach((level) => {
		const y = centerY - level * amplitude;
		ctx.fillText(level.toFixed(1), labelX, y);
	});
};

const drawPlayhead = (ctx, width, height, progressX) => {
	if (!Number.isFinite(progressX)) {
		return;
	}
	const pulse = isPlaying.value ? 0.6 + 0.4 * Math.sin(performance.now() * 0.008) : 1;
	ctx.beginPath();
	ctx.lineWidth = isPlayheadHover.value ? 2.6 : 1.3;
	ctx.strokeStyle = `rgba(148, 163, 184, ${0.8 * pulse})`;
	ctx.moveTo(progressX, 0);
	ctx.lineTo(progressX, height);
	ctx.stroke();
};

const drawCombinedWaveforms = () => {
	if (viewMode.value === 'spectrogram') {
		isSpectrogramRendering.value = true;
		drawCombinedSpectrogram();
		isWaveformRendering.value = false;
		return;
	}
	const canvas = combinedCanvasRef.value;
	if (!canvas) {
		isWaveformRendering.value = false;
		return;
	}
	const rect = canvas.getBoundingClientRect();
	const height = rect.height || 110;
	const width = rect.width || 480;
	const dpr = window.devicePixelRatio || 1;
	canvas.width = width * dpr;
	canvas.height = height * dpr;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		isWaveformRendering.value = false;
		return;
	}
	const baseKey = buildRenderKey([
		'waveform',
		props.sampleName,
		selectedMethod.value,
		activeLegend.value ?? 'none',
		isComparing.value ? '1' : '0',
		measurementBuffer.value ? 'm1' : 'm0',
		methodBuffer.value ? 'c1' : 'c0',
		measurementScale.value,
		measurementColor.value,
		compareColor.value,
		measurementWaveAlpha.value,
		compareWaveAlpha.value,
		width,
		height,
		dpr
	]);
	const leftKey = `${baseKey}|normal`;
	const mutedKey = `${baseKey}|muted`;
	const cached = renderCache.get(leftKey);
	const cachedMuted = renderCache.get(mutedKey);
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.clearRect(0, 0, width, height);
	const labelPad = 28;
	const topPad = 10;
	const bottomPad = 10;
	const drawableWidth = Math.max(0, width - labelPad);
	const areaHeight = Math.max(0, height - topPad - bottomPad);
	const progressX = duration.value ? (currentTime.value / duration.value) * drawableWidth : 0;
	if (cached && cachedMuted) {
		isWaveformRendering.value = false;
		drawReferenceLines(ctx, width, height, drawableWidth, topPad, areaHeight);
		ctx.save();
		ctx.globalAlpha = 1;
		ctx.beginPath();
		ctx.rect(0, 0, Math.max(0, Math.min(drawableWidth, progressX)), height);
		ctx.clip();
		ctx.drawImage(cached, 0, 0, width, height);
		ctx.restore();
		ctx.save();
		ctx.beginPath();
		ctx.rect(Math.max(0, Math.min(drawableWidth, progressX)), 0, drawableWidth, height);
		ctx.clip();
		ctx.drawImage(cachedMuted, 0, 0, width, height);
		ctx.restore();
		drawReferenceLabels(ctx, width, height, topPad, areaHeight);
		drawPlayhead(ctx, drawableWidth, height, progressX);
		canvas.style.opacity = '1';
		return;
	}
	canvas.style.opacity = '0';
	isWaveformRendering.value = true;
	const offscreen = document.createElement('canvas');
	offscreen.width = width * dpr;
	offscreen.height = height * dpr;
	const offCtx = offscreen.getContext('2d');
	if (!offCtx) {
		isWaveformRendering.value = false;
		return;
	}
	offCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
	drawWaveformsOnContext(offCtx, width, height, drawableWidth, topPad, areaHeight, 'normal');
	setRenderCache(leftKey, offscreen);
	const offscreenMuted = document.createElement('canvas');
	offscreenMuted.width = width * dpr;
	offscreenMuted.height = height * dpr;
	const offCtxMuted = offscreenMuted.getContext('2d');
	if (offCtxMuted) {
		offCtxMuted.setTransform(dpr, 0, 0, dpr, 0, 0);
		drawWaveformsOnContext(offCtxMuted, width, height, drawableWidth, topPad, areaHeight, 'muted');
		setRenderCache(mutedKey, offscreenMuted);
	}
	drawReferenceLines(ctx, width, height, drawableWidth, topPad, areaHeight);
	ctx.save();
	ctx.globalAlpha = 1;
	ctx.beginPath();
	ctx.rect(0, 0, Math.max(0, Math.min(drawableWidth, progressX)), height);
	ctx.clip();
	ctx.drawImage(offscreen, 0, 0, width, height);
	ctx.restore();
	ctx.save();
	ctx.beginPath();
	ctx.rect(Math.max(0, Math.min(drawableWidth, progressX)), 0, drawableWidth, height);
	ctx.clip();
	ctx.drawImage(offscreenMuted, 0, 0, width, height);
	ctx.restore();
	drawReferenceLabels(ctx, width, height, topPad, areaHeight);
	drawPlayhead(ctx, drawableWidth, height, progressX);
	requestAnimationFrame(() => {
		canvas.style.opacity = '1';
		isWaveformRendering.value = false;
	});
};

const magmaStops = [
	[0.0, 0, 0, 4],
	[0.1, 25, 6, 64],
	[0.2, 53, 11, 99],
	[0.3, 84, 21, 117],
	[0.4, 113, 31, 126],
	[0.5, 142, 41, 122],
	[0.6, 170, 54, 99],
	[0.7, 198, 72, 70],
	[0.8, 225, 101, 40],
	[0.9, 246, 136, 22],
	[1.0, 252, 181, 20]
];

const getSpectrogramParams = () => {
	switch (spectrogramQuality.value) {
		case 1:
			return { fftSize: 512, hopLength: 256 };
		case 2:
			return { fftSize: 512, hopLength: 128 };
		case 3:
			return { fftSize: 1024, hopLength: 128 };
		case 4:
			return { fftSize: 1024, hopLength: 64 };
		case 5:
			return { fftSize: 2048, hopLength: 64 };
		default:
			return { fftSize: 1024, hopLength: 128 };
	}
};

const getMagmaColor = (value) => {
	const v = Math.min(1, Math.max(0, value));
	for (let i = 0; i < magmaStops.length - 1; i += 1) {
		const [p0, r0, g0, b0] = magmaStops[i];
		const [p1, r1, g1, b1] = magmaStops[i + 1];
		if (v >= p0 && v <= p1) {
			const t = (v - p0) / (p1 - p0);
			return {
				r: Math.round(r0 + (r1 - r0) * t),
				g: Math.round(g0 + (g1 - g0) * t),
				b: Math.round(b0 + (b1 - b0) * t)
			};
		}
	}
	const last = magmaStops[magmaStops.length - 1];
	return { r: last[1], g: last[2], b: last[3] };
};

const renderSpectrogram = (ctx, audioBuffer, width, height, alpha) => {
	const data = audioBuffer.getChannelData(0);
	const { fftSize, hopLength } = getSpectrogramParams();
	const bins = fftSize / 2;
	const frameCount = Math.max(1, Math.floor((data.length - fftSize) / hopLength) + 1);
	const window = new Float32Array(fftSize);
	for (let i = 0; i < fftSize; i += 1) {
		window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (fftSize - 1));
	}
	const minDb = -60;
	const maxDb = 0;
	const eps = 1e-10;
	const nyquist = audioBuffer.sampleRate / 2;
	const maxFreq = 10000;
	const activeBins = Math.min(bins, Math.max(8, Math.floor((maxFreq / nyquist) * bins)));

	for (let x = 0; x < width; x += 1) {
		const frameIndex = Math.min(frameCount - 1, Math.floor((x / width) * frameCount));
		const start = Math.min(frameIndex * hopLength, Math.max(0, data.length - fftSize));
		const magnitudes = new Float32Array(bins);
		for (let k = 0; k < bins; k += 1) {
			let real = 0;
			let imag = 0;
			for (let n = 0; n < fftSize; n += 1) {
				const sample = (data[start + n] || 0) * window[n];
				const angle = (2 * Math.PI * k * n) / fftSize;
				real += sample * Math.cos(angle);
				imag -= sample * Math.sin(angle);
			}
			const magnitude = Math.sqrt(real * real + imag * imag);
			const db = 20 * Math.log10(0.1 * magnitude + eps);
			magnitudes[k] = Math.min(1, Math.max(0, (db - minDb) / (maxDb - minDb)));
		}
		for (let y = 0; y < height; y += 1) {
			const binIndex = Math.floor((y / height) * activeBins);
			const intensity = magnitudes[binIndex] || 0;
			if (intensity <= 0) {
				continue;
			}
			const heat = getMagmaColor(intensity);
			ctx.fillStyle = `rgb(${heat.r}, ${heat.g}, ${heat.b})`;
			ctx.fillRect(x, height - y - 1, 1, 1);
		}
	}
};

const drawSpectrogramSide = (canvas, audioBuffer, cacheKey, alpha) => {
	if (!canvas || !audioBuffer) {
		return;
	}
	const rect = canvas.getBoundingClientRect();
	const height = rect.height || 110;
	const width = rect.width || 240;
	const dpr = (window.devicePixelRatio || 1) * spectrogramScale.value;
	const pixelWidth = Math.max(1, Math.floor(width * dpr));
	const pixelHeight = Math.max(1, Math.floor(height * dpr));
	const sizedKey = `${cacheKey}|${width}|${height}|${dpr}`;
	canvas.width = pixelWidth;
	canvas.height = pixelHeight;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		return;
	}
	const cached = renderCache.get(sizedKey);
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, pixelWidth, pixelHeight);
	if (cached) {
		ctx.drawImage(cached, 0, 0, pixelWidth, pixelHeight);
		return;
	}
	const offscreen = document.createElement('canvas');
	offscreen.width = pixelWidth;
	offscreen.height = pixelHeight;
	const offCtx = offscreen.getContext('2d');
	if (!offCtx) {
		return;
	}
	offCtx.setTransform(1, 0, 0, 1, 0, 0);
	offCtx.clearRect(0, 0, pixelWidth, pixelHeight);
	offCtx.fillStyle = '#0b0f16';
	offCtx.fillRect(0, 0, pixelWidth, pixelHeight);
	renderSpectrogram(offCtx, audioBuffer, pixelWidth, pixelHeight, alpha);
	setRenderCache(sizedKey, offscreen);
	ctx.drawImage(offscreen, 0, 0, pixelWidth, pixelHeight);
};

const drawSpectrogramMagnifier = (baseCanvas, overlayCanvas) => {
	if (!baseCanvas || !overlayCanvas || !isSpectrogramHover.value) {
		return;
	}
	const rect = baseCanvas.getBoundingClientRect();
	const width = rect.width || 0;
	const height = rect.height || 0;
	if (!width || !height) {
		return;
	}
	const dpr = window.devicePixelRatio || 1;
	overlayCanvas.width = width * dpr;
	overlayCanvas.height = height * dpr;
	const ctx = overlayCanvas.getContext('2d');
	if (!ctx) {
		return;
	}
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.clearRect(0, 0, width, height);
	const zoom = 2.2;
	const rectWidth = 140;
	const rectHeight = 90;
	const normX = Math.min(1, Math.max(0, spectrogramHover.value.x));
	const normY = Math.min(1, Math.max(0, spectrogramHover.value.y));
	let rectLeft = normX * width - rectWidth / 2;
	let rectTop = normY * height - rectHeight / 2;
	rectLeft = Math.min(Math.max(0, rectLeft), width - rectWidth);
	rectTop = Math.min(Math.max(0, rectTop), height - rectHeight);
	const sourceX = rectLeft * (baseCanvas.width / width);
	const sourceY = rectTop * (baseCanvas.height / height);
	const sourceW = (rectWidth / zoom) * (baseCanvas.width / width);
	const sourceH = (rectHeight / zoom) * (baseCanvas.height / height);
	ctx.imageSmoothingEnabled = true;
	ctx.drawImage(baseCanvas, sourceX, sourceY, sourceW, sourceH, rectLeft, rectTop, rectWidth, rectHeight);
	ctx.lineWidth = 1.5;
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
	ctx.strokeRect(rectLeft + 0.5, rectTop + 0.5, rectWidth - 1, rectHeight - 1);
};

const clearSpectrogramMagnifier = (overlayCanvas) => {
	if (!overlayCanvas) {
		return;
	}
	const rect = overlayCanvas.getBoundingClientRect();
	const width = rect.width || 0;
	const height = rect.height || 0;
	const dpr = window.devicePixelRatio || 1;
	overlayCanvas.width = width * dpr;
	overlayCanvas.height = height * dpr;
	const ctx = overlayCanvas.getContext('2d');
	if (!ctx) {
		return;
	}
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	ctx.clearRect(0, 0, width, height);
};

const drawSpectrogramMagnifiers = () => {
	drawSpectrogramMagnifier(spectrogramLeftRef.value, spectrogramZoomLeftRef.value);
	if (isComparing.value) {
		drawSpectrogramMagnifier(spectrogramRightRef.value, spectrogramZoomRightRef.value);
	} else {
		clearSpectrogramMagnifier(spectrogramZoomRightRef.value);
	}
};

const clearSpectrogramCanvas = (canvas) => {
	if (!canvas) {
		return;
	}
	const rect = canvas.getBoundingClientRect();
	const height = rect.height || 110;
	const width = rect.width || 240;
	const dpr = (window.devicePixelRatio || 1) * spectrogramScale.value;
	const pixelWidth = Math.max(1, Math.floor(width * dpr));
	const pixelHeight = Math.max(1, Math.floor(height * dpr));
	canvas.width = pixelWidth;
	canvas.height = pixelHeight;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		return;
	}
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.clearRect(0, 0, pixelWidth, pixelHeight);
	ctx.fillStyle = '#0b0f16';
	ctx.fillRect(0, 0, pixelWidth, pixelHeight);
};

const drawCombinedSpectrogram = () => {
	const leftCanvas = spectrogramLeftRef.value;
	const rightCanvas = spectrogramRightRef.value;
	if (!leftCanvas || !rightCanvas) {
		isSpectrogramRendering.value = false;
		return;
	}
	const commonKey = buildRenderKey(['spectrogram', props.sampleName, selectedMethod.value, measurementWaveAlpha.value, compareWaveAlpha.value]);
	const getSizedKey = (canvas, keySuffix) => {
		const rect = canvas.getBoundingClientRect();
		const height = rect.height || 110;
		const width = rect.width || 240;
		const dpr = (window.devicePixelRatio || 1) * spectrogramScale.value;
		return `${commonKey}${keySuffix}|${width}|${height}|${dpr}`;
	};
	const leftKey = getSizedKey(leftCanvas, '|left');
	const rightKey = getSizedKey(rightCanvas, '|right');
	const leftCached = renderCache.has(leftKey);
	const rightCached = !isComparing.value || renderCache.has(rightKey);
	if (leftCached && rightCached) {
		drawSpectrogramSide(leftCanvas, measurementBuffer.value, `${commonKey}|left`, 1);
		if (methodBuffer.value && isComparing.value) {
			drawSpectrogramSide(rightCanvas, methodBuffer.value, `${commonKey}|right`, 1);
		} else {
			clearSpectrogramCanvas(rightCanvas);
		}
		isSpectrogramRendering.value = false;
		return;
	}
	isSpectrogramRendering.value = true;
	clearSpectrogramCanvas(leftCanvas);
	clearSpectrogramCanvas(rightCanvas);
	requestAnimationFrame(() => {
		window.setTimeout(() => {
			if (measurementBuffer.value) {
				drawSpectrogramSide(leftCanvas, measurementBuffer.value, `${commonKey}|left`, 1);
			}
			if (methodBuffer.value && isComparing.value) {
				drawSpectrogramSide(rightCanvas, methodBuffer.value, `${commonKey}|right`, 1);
			} else {
				clearSpectrogramCanvas(rightCanvas);
			}
			requestAnimationFrame(() => {
				isSpectrogramRendering.value = false;
				if (isSpectrogramHover.value) {
					drawSpectrogramMagnifiers();
				}
			});
		}, 0);
	});
};

const renderMeasurement = async () => {
	try {
		const buffer = await loadAudioBuffer(measurementUrl.value);
		measurementBuffer.value = buffer;
		measurementScale.value = getScaleFactor(buffer);
		setMethodStatus(props.measurementKey, 'ready');
		drawCombinedWaveforms();
	} catch (error) {
		measurementBuffer.value = null;
		measurementScale.value = 1;
		setMethodStatus(props.measurementKey, 'error');
	}
};

const renderClean = async () => {
	cleanLoading.value = true;
	cleanError.value = '';
	try {
		const buffer = await loadAudioBuffer(cleanUrl.value);
		cleanBuffer.value = buffer;
		setMethodStatus(props.cleanKey, 'ready');
		drawCombinedWaveforms();
	} catch (error) {
		cleanError.value = 'Load failed';
		setMethodStatus(props.cleanKey, 'error');
	} finally {
		cleanLoading.value = false;
	}
};

const renderMethod = async () => {
	methodLoading.value = true;
	methodError.value = '';
	try {
		const buffer = await loadAudioBuffer(methodUrl.value);
		methodBuffer.value = buffer;
		setMethodStatus(selectedMethod.value, 'ready');
		if (selectedMethod.value === props.measurementKey && !measurementBuffer.value) {
			measurementBuffer.value = buffer;
			measurementScale.value = getScaleFactor(buffer);
		}
		if (!Number.isFinite(duration.value) || duration.value <= 0) {
			duration.value = buffer.duration || 0;
		}
		drawCombinedWaveforms();
	} catch (error) {
		methodError.value = 'Load failed';
		setMethodStatus(selectedMethod.value, 'error');
	} finally {
		methodLoading.value = false;
	}
};

const redrawAll = () => {
	drawCombinedWaveforms();
};

const togglePlay = async (methodKey) => {
	const audio = audioRef.value;
	if (!audio) {
		return;
	}
	if (!isMethodReady(methodKey)) {
		return;
	}
	setupAudioPipeline();
	const context = getAudioContext();
	if (context.state === 'suspended') {
		try {
			await context.resume();
		} catch (error) {
			// ignore resume errors
		}
	}
	const nextUrl = buildUrl(methodKey);
	const isSame = playingMethod.value === methodKey;
	if (isSame && !audio.paused) {
		audio.pause();
		return;
	}
	if (audio.src !== nextUrl) {
		audio.src = nextUrl;
	}
	try {
		await audio.play();
		playingMethod.value = methodKey;
	} catch (error) {
		// ignore autoplay errors
	}
};

const handleMethodClick = (methodKey) => {
	if (!isMethodReady(methodKey)) {
		return;
	}
	selectedMethod.value = methodKey;
	togglePlay(methodKey);
};

const handlePlayToggle = () => {
	const audio = audioRef.value;
	if (!audio) {
		return;
	}
	if (!isMethodReady(selectedMethod.value)) {
		return;
	}
	setupAudioPipeline();
	const context = getAudioContext();
	if (context.state === 'suspended') {
		context.resume().catch(() => {
			// ignore resume errors
		});
	}
	if (audio.src !== methodUrl.value) {
		audio.src = methodUrl.value;
	}
	if (hasEnded.value) {
		audio.currentTime = 0;
	}
	if (audio.paused) {
		audio.play();
	} else {
		audio.pause();
	}
};

const getMethodRole = (methodKey) => {
	if (methodKey === props.measurementKey) {
		return 'measurement';
	}
	if (methodKey === props.cleanKey) {
		return 'ground-truth';
	}
	return 'method';
};

const primaryMethods = computed(() => orderedMethods.value.filter((item) => item.key === props.measurementKey || item.key === props.cleanKey));
const otherMethods = computed(() => orderedMethods.value.filter((item) => item.key !== props.measurementKey && item.key !== props.cleanKey));

const getMethodStyle = (methodKey) => ({
	'--method-color': methodColors[methodKey] || '#94a3b8'
});

const getMethodIcon = (methodKey) => (isPlaying.value && playingMethod.value === methodKey ? '/logo/player-pause.svg' : '/logo/player-play.svg');

const methodTooltipState = ref({ text: '', x: 0, y: 0, visible: false });
let methodTooltipTimer = 0;

const handleMethodHover = (event, methodKey) => {
	const tooltip = methodTooltips[methodKey];
	if (!tooltip) {
		return;
	}
	window.clearTimeout(methodTooltipTimer);
	const rect = event.currentTarget.getBoundingClientRect();
	methodTooltipTimer = window.setTimeout(() => {
		methodTooltipState.value = {
			text: tooltip,
			x: rect.left,
			y: rect.bottom + 10,
			visible: true
		};
	}, 1000);
};

const handleMethodLeave = () => {
	window.clearTimeout(methodTooltipTimer);
	methodTooltipState.value = { text: '', x: 0, y: 0, visible: false };
};

const handleLegendClick = (legendKey) => {
	if (pinnedLegend.value) {
		pinnedLegend.value = null;
		return;
	}
	pinnedLegend.value = legendKey;
};

let mediaElementSource = null;
let gainNode = null;

const applyAudioVolume = (value) => {
	const audio = audioRef.value;
	if (!audio) {
		return;
	}
	const normalized = Math.min(2, Math.max(0, value / 100));
	if (gainNode) {
		gainNode.gain.value = normalized;
		return;
	}
	audio.volume = Math.min(1, normalized);
};

const setupAudioPipeline = () => {
	const audio = audioRef.value;
	if (!audio || mediaElementSource) {
		return;
	}
	const context = getAudioContext();
	mediaElementSource = context.createMediaElementSource(audio);
	gainNode = context.createGain();
	gainNode.gain.value = Math.min(2, Math.max(0, globalVolume.value / 100));
	mediaElementSource.connect(gainNode);
	gainNode.connect(context.destination);
	audio.volume = 1;
};

const handleVolumeInput = (event) => {
	const nextValue = Number(event.target.value);
	if (!Number.isFinite(nextValue)) {
		return;
	}
	globalVolume.value = Math.min(200, Math.max(0, nextValue));
};

const preloadMethods = () => {
	orderedMethods.value.forEach((method) => {
		if (!method?.key) {
			return;
		}
		setMethodStatus(method.key, 'loading');
		const url = buildUrl(method.key);
		loadAudioBuffer(url)
			.then(() => {
				setMethodStatus(method.key, 'ready');
			})
			.catch(() => {
				setMethodStatus(method.key, 'error');
			});
	});
};

const handleSeek = (event) => {
	const audio = audioRef.value;
	if (!audio || !duration.value) {
		return;
	}
	const nextValue = Number(event.target.value);
	audio.currentTime = (nextValue / 100) * duration.value;
};

const handleProgressMove = (event) => {
	const audio = audioRef.value;
	if (!audio || !duration.value) {
		return;
	}
	const rect = event.currentTarget.getBoundingClientRect();
	const offsetX = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
	const percent = rect.width ? offsetX / rect.width : 0;
	hoverTime.value = percent * duration.value;
	hoverLeft.value = offsetX;
	isHovering.value = true;
};

const handleProgressLeave = () => {
	isHovering.value = false;
};

const handleSpectrogramMove = (event, side) => {
	if (viewMode.value !== 'spectrogram') {
		return;
	}
	const canvas = side === 'right' ? spectrogramRightRef.value : spectrogramLeftRef.value;
	if (!canvas) {
		return;
	}
	const rect = canvas.getBoundingClientRect();
	const x = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
	const y = Math.min(Math.max(0, event.clientY - rect.top), rect.height);
	spectrogramHover.value = {
		x: rect.width ? x / rect.width : 0,
		y: rect.height ? y / rect.height : 0
	};
	isSpectrogramHover.value = true;
	drawSpectrogramMagnifiers();
};

const handleSpectrogramLeave = () => {
	isSpectrogramHover.value = false;
	clearSpectrogramMagnifier(spectrogramZoomLeftRef.value);
	clearSpectrogramMagnifier(spectrogramZoomRightRef.value);
};

const formatTime = (timeValue, showMs = false) => {
	if (!Number.isFinite(timeValue)) {
		return '00:00';
	}
	const minutes = Math.floor(timeValue / 60);
	const seconds = Math.floor(timeValue % 60);
	if (!showMs) {
		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
	}
	const ms = Math.floor((timeValue - Math.floor(timeValue)) * 1000);
	return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
};

let rafId = 0;
let lastUpdate = 0;

const updateTimeState = () => {
	const audio = audioRef.value;
	if (!audio) {
		return;
	}
	const now = performance.now();
	if (now - lastUpdate < 10) {
		return;
	}
	lastUpdate = now;
	currentTime.value = audio.currentTime || 0;
	const nextDuration = Number.isFinite(audio.duration) && audio.duration > 0 ? audio.duration : getFallbackDuration();
	duration.value = nextDuration || 0;
	if (viewMode.value === 'waveform') {
		drawCombinedWaveforms();
	}
};

const startProgressLoop = () => {
	const loop = () => {
		updateTimeState();
		rafId = requestAnimationFrame(loop);
	};
	cancelAnimationFrame(rafId);
	rafId = requestAnimationFrame(loop);
};

const stopProgressLoop = () => {
	cancelAnimationFrame(rafId);
	rafId = 0;
};

let resizeObserver;
let intersectionObserver;

const ensureAudioLoaded = () => {
	if (hasLoaded.value || !isVisible.value) {
		return;
	}
	hasLoaded.value = true;
	preloadMethods();
	renderMeasurement();
	renderClean();
	renderMethod();
};

onMounted(() => {
	const methodKeys = normalizedMethods.value.map((item) => item.key);
	if (!methodKeys.includes(selectedMethod.value)) {
		selectedMethod.value = props.measurementKey;
	}
	resizeObserver = new ResizeObserver(() => {
		redrawAll();
	});
	if (containerRef.value) {
		resizeObserver.observe(containerRef.value);
	}
	if (containerRef.value) {
		intersectionObserver = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				isVisible.value = Boolean(entry?.isIntersecting);
				if (isVisible.value) {
					ensureAudioLoaded();
				}
			},
			{ root: null, threshold: 0.15 }
		);
		intersectionObserver.observe(containerRef.value);
	}
	if (audioRef.value) {
		applyAudioVolume(globalVolume.value);
		audioRef.value.addEventListener('play', () => {
			isPlaying.value = true;
			hasEnded.value = false;
			startProgressLoop();
		});
		audioRef.value.addEventListener('pause', () => {
			isPlaying.value = false;
			stopProgressLoop();
		});
		audioRef.value.addEventListener('ended', () => {
			isPlaying.value = false;
			hasEnded.value = true;
			stopProgressLoop();
		});
		audioRef.value.addEventListener('loadedmetadata', () => {
			updateTimeState();
		});
		audioRef.value.addEventListener('timeupdate', () => {
			updateTimeState();
		});
	}
	if (combinedCanvasRef.value) {
		const canvas = combinedCanvasRef.value;
		const handleMove = (event) => {
			if (viewMode.value !== 'waveform') {
				isPlayheadHover.value = false;
				return;
			}
			if (!duration.value) {
				isPlayheadHover.value = false;
				return;
			}
			const rect = canvas.getBoundingClientRect();
			const x = Math.min(Math.max(0, event.clientX - rect.left), rect.width);
			const labelPad = 28;
			const drawableWidth = Math.max(0, rect.width - labelPad);
			const progressX = (currentTime.value / duration.value) * drawableWidth;
			const nextPlayheadHover = Math.abs(x - progressX) <= 4;
			if (nextPlayheadHover !== isPlayheadHover.value) {
				isPlayheadHover.value = nextPlayheadHover;
				drawCombinedWaveforms();
			}
		};
		const handleLeave = () => {
			if (isPlayheadHover.value) {
				isPlayheadHover.value = false;
				drawCombinedWaveforms();
			}
		};
		canvas.addEventListener('mousemove', handleMove);
		canvas.addEventListener('mouseleave', handleLeave);
		onBeforeUnmount(() => {
			canvas.removeEventListener('mousemove', handleMove);
			canvas.removeEventListener('mouseleave', handleLeave);
		});
	}
});

onBeforeUnmount(() => {
	resizeObserver?.disconnect();
	intersectionObserver?.disconnect();
	stopProgressLoop();
	renderCache.clear();
});

watch(
	() => props.sampleName,
	() => {
		methodStatus.value = {};
		renderCache.clear();
		hasLoaded.value = false;
		if (isVisible.value) {
			ensureAudioLoaded();
		}
	}
);

watch(
	() => selectedMethod.value,
	() => {
		hasEnded.value = false;
		isPlaying.value = false;
		playingMethod.value = '';
		renderMethod();
	}
);

watch(
	() => hoveredLegend.value,
	() => {
		drawCombinedWaveforms();
	}
);

watch(
	() => pinnedLegend.value,
	() => {
		drawCombinedWaveforms();
	}
);

watch(
	() => viewMode.value,
	() => {
		if (viewMode.value === 'spectrogram') {
			isSpectrogramRendering.value = true;
		}
		if (viewMode.value !== 'spectrogram') {
			isSpectrogramHover.value = false;
			clearSpectrogramMagnifier(spectrogramZoomLeftRef.value);
			clearSpectrogramMagnifier(spectrogramZoomRightRef.value);
		}
		drawCombinedWaveforms();
	}
);

watch(
	() => props.defaultMethod,
	(newValue) => {
		selectedMethod.value = newValue;
	}
);

watch(
	() => globalVolume.value,
	(value) => {
		applyAudioVolume(value);
	}
);

watch(
	() => spectrogramQuality.value,
	() => {
		renderCache.clear();
		if (viewMode.value === 'spectrogram') {
			drawCombinedSpectrogram();
		}
	}
);
</script>

<template>
	<section ref="containerRef" class="wave-compare">
		<header class="wave-header">
			<div class="wave-description">
				<span class="wave-desc-item">
					<span v-if="sampleIndexLabel" class="wave-desc-index">{{ sampleIndexLabel }}</span>
				</span>
				<span class="wave-desc-item">
					<span class="wave-desc-label">Sample name</span>
					<span class="wave-desc-value">
						{{ sampleDisplayName }}
					</span>
				</span>
				<span class="wave-desc-divider" aria-hidden="true"></span>
				<span class="wave-desc-item wave-desc-tooltip">
					<span class="wave-desc-label">{{ sampleMeta.label }}</span>
					<span class="wave-desc-value">{{ sampleMeta.value }}</span>
					<span v-if="sampleMeta.tooltip" class="wave-desc-tip">{{ sampleMeta.tooltip }}</span>
				</span>
			</div>
		</header>

		<div class="method-list">
			<div class="method-group method-group-primary">
				<div v-for="method in primaryMethods" :key="method.key" class="method-chip-wrap" @mouseenter="handleMethodHover($event, method.key)" @mouseleave="handleMethodLeave">
					<button
						class="method-chip"
						:class="[
							`method-chip-${getMethodRole(method.key)}`,
							{
								active: selectedMethod === method.key,
								playing: isPlaying && playingMethod === method.key
							}
						]"
						:style="getMethodStyle(method.key)"
						:disabled="!isMethodReady(method.key) || isVisualizationLoading"
						@click="handleMethodClick(method.key)"
						type="button"
					>
						<span class="chip-dot" aria-hidden="true"></span>
						<span class="chip-label">{{ method.label }}</span>
						<span v-if="!isMethodReady(method.key)" class="chip-spinner" aria-hidden="true"></span>
						<span v-else class="chip-action" aria-hidden="true">
							<img class="icon-img" :src="getMethodIcon(method.key)" alt="" />
						</span>
					</button>
				</div>
			</div>
			<div v-if="otherMethods.length" class="method-group method-group-secondary">
				<span class="method-group-label">Methods</span>
				<div class="method-group-scroll">
					<div v-for="method in otherMethods" :key="method.key" class="method-chip-wrap" @mouseenter="handleMethodHover($event, method.key)" @mouseleave="handleMethodLeave">
						<button
							class="method-chip method-chip-secondary"
							:class="{
								active: selectedMethod === method.key,
								playing: isPlaying && playingMethod === method.key
							}"
							:style="getMethodStyle(method.key)"
							:disabled="!isMethodReady(method.key) || isVisualizationLoading"
							@click="handleMethodClick(method.key)"
							type="button"
						>
							<span class="chip-dot" aria-hidden="true"></span>
							<span class="chip-label">{{ method.label }}</span>
							<span v-if="!isMethodReady(method.key)" class="chip-spinner" aria-hidden="true"></span>
							<span v-else class="chip-action" aria-hidden="true">
								<img class="icon-img" :src="getMethodIcon(method.key)" alt="" />
							</span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<teleport to="body">
			<div v-if="methodTooltipState.visible" class="method-tip-global" :style="{ left: `${methodTooltipState.x}px`, top: `${methodTooltipState.y}px` }">
				{{ methodTooltipState.text }}
			</div>
		</teleport>

		<div class="wave-panel">
			<div class="wave-panel-header">
				<div class="wave-panel-title">
					<span
						class="legend-item"
						:style="{ opacity: measurementLegendOpacity }"
						@mouseenter="hoveredLegend = 'measurement'"
						@mouseleave="hoveredLegend = null"
						@click="handleLegendClick('measurement')"
					>
						<span class="legend-swatch legend-measurement" aria-hidden="true" :style="{ background: measurementColor }"></span>
						{{ measurementLabel }}
					</span>
					<span
						v-if="isComparing"
						class="legend-item"
						:style="{ opacity: compareLegendOpacity }"
						@mouseenter="hoveredLegend = 'compare'"
						@mouseleave="hoveredLegend = null"
						@click="handleLegendClick('compare')"
					>
						<span class="legend-swatch legend-compare" aria-hidden="true" :style="{ background: compareColor }"></span>
						{{ methodLabel }}
					</span>
				</div>
				<div class="wave-panel-actions">
					<div class="view-toggle" role="group" aria-label="Visualization mode">
						<button class="view-toggle-btn" :class="{ active: viewMode === 'waveform' }" @click="viewMode = 'waveform'" type="button">Waveform</button>
						<button class="view-toggle-btn" :class="{ active: viewMode === 'spectrogram' }" @click="viewMode = 'spectrogram'" type="button">Spectrogram</button>
					</div>
					<span v-if="statusText" class="wave-status" :class="{ 'wave-status-error': cleanError || methodError }">{{ statusText }}</span>
				</div>
			</div>
			<div v-show="viewMode === 'waveform'" class="wave-canvas-wrap" aria-hidden="true">
				<canvas ref="combinedCanvasRef" class="wave-canvas"></canvas>
				<div v-if="isWaveformRendering" class="canvas-loading wave-loading">Loading...</div>
			</div>
			<div v-show="viewMode === 'waveform'" class="wave-time-axis" aria-hidden="true">
				<div class="time-axis-track">
					<span
						v-for="tick in timeTicks"
						:key="tick"
						class="time-axis-tick"
						:class="{ 'is-major': tick % 2 === 0, 'is-start': tick === 0, 'is-end': tick === lastTimeTick }"
						:style="{ left: `${duration ? (tick / duration) * 100 : 0}%` }"
					>
						<span class="time-axis-line"></span>
						<span class="time-axis-label">{{ tick % 2 === 0 ? formatTime(tick) : '' }}</span>
					</span>
					<div v-if="isPlayheadHover" class="time-axis-caret" :style="{ left: `${playheadPercent}%` }">
						<span class="time-axis-caret-label">{{ formatTime(currentTime, true) }}</span>
					</div>
				</div>
			</div>
			<div v-show="viewMode === 'spectrogram'" class="spectrogram-block" aria-hidden="true">
				<div class="spectrogram-labels">
					<span class="spectrogram-label">{{ measurementLabel }}</span>
					<span class="spectrogram-gap"></span>
					<span class="spectrogram-label">{{ isComparing ? methodLabel : '' }}</span>
				</div>
				<div class="spectrogram-row">
					<div class="spectrogram-side" :class="{ 'spectrogram-hovering': isSpectrogramHover }" @mousemove="handleSpectrogramMove($event, 'left')" @mouseleave="handleSpectrogramLeave">
						<canvas ref="spectrogramLeftRef" class="spectrogram-canvas"></canvas>
						<canvas v-show="isSpectrogramHover" ref="spectrogramZoomLeftRef" class="spectrogram-zoom-canvas"></canvas>
						<div class="spectrogram-axis spectrogram-axis-y">
							<span class="spectrogram-axis-title">Frequency[kHz]</span>
							<span v-for="tick in spectrogramTicks" :key="`y-${tick}`" class="spectrogram-axis-tick" :style="{ top: `${100 - (tick / 8) * 100}%` }">
								<span class="spectrogram-axis-line"></span>
								<span class="spectrogram-axis-label">{{ tick }}</span>
							</span>
						</div>
						<div class="spectrogram-axis spectrogram-axis-x">
							<span
								v-for="tick in timeTicks"
								:key="`x-left-${tick}`"
								class="spectrogram-axis-tick"
								:class="{ 'is-major': tick % 2 === 0 }"
								:style="{ left: `${duration ? (tick / duration) * 100 : 0}%` }"
							>
								<span class="spectrogram-axis-line"></span>
								<span class="spectrogram-axis-label">{{ tick % 2 === 0 ? formatTime(tick) : '' }}</span>
							</span>
						</div>
						<div v-if="isSpectrogramRendering" class="canvas-loading spectrogram-loading">Loading...</div>
					</div>
					<div class="spectrogram-gap"></div>
					<div class="spectrogram-side" :class="{ 'spectrogram-hovering': isSpectrogramHover }" @mousemove="handleSpectrogramMove($event, 'right')" @mouseleave="handleSpectrogramLeave">
						<canvas ref="spectrogramRightRef" class="spectrogram-canvas"></canvas>
						<canvas v-show="isSpectrogramHover && isComparing" ref="spectrogramZoomRightRef" class="spectrogram-zoom-canvas"></canvas>
						<div class="spectrogram-axis spectrogram-axis-y">
							<span class="spectrogram-axis-title">Frequency[kHz]</span>
							<span v-for="tick in spectrogramTicks" :key="`y2-${tick}`" class="spectrogram-axis-tick" :style="{ top: `${100 - (tick / 8) * 100}%` }">
								<span class="spectrogram-axis-line"></span>
								<span class="spectrogram-axis-label">{{ tick }}</span>
							</span>
						</div>
						<div class="spectrogram-axis spectrogram-axis-x">
							<span
								v-for="tick in timeTicks"
								:key="`x-right-${tick}`"
								class="spectrogram-axis-tick"
								:class="{ 'is-major': tick % 2 === 0 }"
								:style="{ left: `${duration ? (tick / duration) * 100 : 0}%` }"
							>
								<span class="spectrogram-axis-line"></span>
								<span class="spectrogram-axis-label">{{ tick % 2 === 0 ? formatTime(tick) : '' }}</span>
							</span>
						</div>
						<span v-if="!isComparing" class="spectrogram-placeholder">Select a method</span>
						<div v-if="isSpectrogramRendering && isComparing" class="canvas-loading spectrogram-loading">Loading...</div>
					</div>
				</div>
			</div>
			<div v-show="viewMode === 'spectrogram'" class="spectrogram-controls" aria-hidden="true">
				<div class="spectrogram-colorbar-wrap" aria-label="Spectrogram energy scale">
					<span class="spectrogram-colorbar-label">0 dB</span>
					<div class="spectrogram-colorbar"></div>
					<span class="spectrogram-colorbar-label">-60 dB</span>
				</div>
				<div class="spectrogram-quality">
					<span class="spectrogram-quality-label">Quality</span>
					<div class="spectrogram-quality-options" role="group" aria-label="Spectrogram quality">
						<button
							v-for="value in [1, 2, 3, 4, 5]"
							:key="`quality-${value}`"
							class="spectrogram-quality-option"
							:class="{ active: spectrogramQuality === value }"
							@click="handleQualitySelect(value)"
							type="button"
						>
							{{ value }}
						</button>
					</div>
				</div>
			</div>
			<div class="progress-row">
				<button class="progress-play" type="button" @click="handlePlayToggle" :aria-label="playIconLabel">
					<img class="icon-img" :src="playIconSrc" :alt="playIconLabel" />
				</button>
				<span class="time-label">{{ formatTime(currentTime) }}</span>
				<div class="progress-track" :class="{ 'progress-track-hover': isHovering }" @mousemove="handleProgressMove" @mouseleave="handleProgressLeave">
					<input class="progress-bar" type="range" min="0" max="100" step="0.1" :value="progressPercent" :style="progressStyle" @input="handleSeek" />
					<div v-if="isHovering" class="progress-tooltip" :style="{ left: `${hoverLeft}px` }">
						{{ hoverTimeLabel }}
					</div>
				</div>
				<span class="time-label">-{{ formatTime(remainingTime) }}</span>
				<div class="volume-control">
					<button class="volume-button" type="button" :aria-label="volumeIconLabel">
						<img class="icon-img" :src="volumeIconSrc" :alt="volumeIconLabel" />
					</button>
					<div class="volume-popover">
						<div class="volume-label">{{ volumePercent }}</div>
						<div class="volume-slider-wrap">
							<input class="volume-slider" type="range" min="0" max="200" step="1" :value="volumePercent" @input="handleVolumeInput" />
						</div>
						<div class="volume-scale">0–200</div>
					</div>
				</div>
			</div>
			<audio ref="audioRef" class="wave-audio" :src="methodUrl" preload="metadata"></audio>
		</div>
	</section>
</template>

<style scoped>
.wave-compare {
	background: #ffffff;
	border-radius: 20px;
	padding: 22px 24px 24px;
	box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08);
	border: 1px solid rgba(148, 163, 184, 0.25);
	display: flex;
	flex-direction: column;
	gap: 18px;
	transition:
		box-shadow 0.25s ease,
		transform 0.25s ease;
}

.wave-compare:hover {
	box-shadow: 0 22px 56px rgba(15, 23, 42, 0.12);
}

.wave-header {
	display: flex;
	justify-content: space-between;
	gap: 18px;
	align-items: center;
	flex-wrap: wrap;
}

.wave-description {
	display: flex;
	align-items: center;
	gap: 12px;
	flex-wrap: wrap;
	font-size: 0.95rem;
	color: #1f2937;
	font-weight: 600;
}

.wave-desc-item {
	display: inline-flex;
	align-items: baseline;
	gap: 8px;
}

.wave-desc-tooltip {
	position: relative;
	cursor: help;
}

.wave-desc-tip {
	position: absolute;
	top: calc(100% + 8px);
	left: 0;
	background: #0f172a;
	color: #ffffff;
	font-size: 0.72rem;
	line-height: 1.4;
	padding: 8px 10px;
	border-radius: 8px;
	min-width: 280px;
	max-width: 360px;
	box-shadow: 0 12px 24px rgba(15, 23, 42, 0.2);
	opacity: 0;
	visibility: hidden;
	transform: translateY(-4px);
	transition:
		opacity 0.2s ease,
		transform 0.2s ease,
		visibility 0.2s ease;
	z-index: 8;
}

.wave-desc-tip::after {
	content: '';
	position: absolute;
	top: -6px;
	left: 12px;
	border-width: 6px;
	border-style: solid;
	border-color: transparent transparent #0f172a transparent;
}

.wave-desc-tooltip:hover .wave-desc-tip {
	opacity: 1;
	visibility: visible;
	transform: translateY(0);
}

.wave-desc-label {
	font-size: 0.72rem;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	color: #94a3b8;
	font-weight: 700;
}

.wave-desc-index {
	font-size: 2rem;
	font-weight: 800;
	color: #111111;
	letter-spacing: 0.04em;
}

.wave-desc-value {
	color: #0f172a;
	font-weight: 700;
}

.wave-desc-divider {
	width: 1px;
	height: 18px;
	background: rgba(148, 163, 184, 0.5);
}

.volume-control {
	position: relative;
	display: inline-flex;
	align-items: center;
}

.volume-button {
	width: 28px;
	height: 28px;
	border-radius: 10px;
	border: none;
	background: transparent;
	color: #0f172a;
	font-size: 0.95rem;
	cursor: pointer;
	box-shadow: none;
	transition:
		opacity 0.2s ease,
		transform 0.2s ease;
	padding: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

.volume-button:hover {
	opacity: 0.7;
}

.volume-icon {
	width: 16px;
	height: 16px;
	display: inline-flex;
	align-items: center;
	justify-content: center;
}

.icon-img {
	width: 16px;
	height: 16px;
	object-fit: contain;
	display: inline-block;
}

.volume-popover {
	position: absolute;
	bottom: 40px;
	right: -6px;
	background: #ffffff;
	border-radius: 14px;
	border: 1px solid rgba(148, 163, 184, 0.25);
	box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
	padding: 10px 10px 12px;
	width: 70px;
	opacity: 0;
	visibility: hidden;
	transform: translateY(6px);
	transition:
		opacity 0.2s ease,
		transform 0.2s ease,
		visibility 0.2s ease;
	z-index: 5;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8px;
}

.volume-control:hover .volume-popover {
	opacity: 1;
	visibility: visible;
	transform: translateY(0);
}

.volume-label {
	font-size: 0.72rem;
	font-weight: 700;
	color: #64748b;
}

.volume-slider-wrap {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 110px;
	width: 36px;
}

.volume-slider {
	appearance: none;
	width: 110px;
	height: 6px;
	border-radius: 999px;
	background: #e2e8f0;
	outline: none;
	transform: rotate(-90deg);
}

.volume-slider::-webkit-slider-thumb {
	appearance: none;
	width: 14px;
	height: 14px;
	border-radius: 50%;
	background: #0f172a;
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);
	cursor: pointer;
}

.volume-slider::-moz-range-thumb {
	width: 14px;
	height: 14px;
	border-radius: 50%;
	background: #0f172a;
	border: none;
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);
	cursor: pointer;
}

.volume-scale {
	font-size: 0.68rem;
	color: #94a3b8;
}

.method-list {
	display: flex;
	align-items: center;
	gap: 16px;
	padding: 10px 4px 2px;
	overflow: visible;
}

.method-group {
	display: flex;
	align-items: center;
	gap: 10px;
	overflow: visible;
}

.method-chip-wrap {
	position: relative;
	display: inline-flex;
	align-items: center;
}

.method-tip-global {
	position: fixed;
	background: #0f172a;
	color: #ffffff;
	font-size: 0.72rem;
	line-height: 1.4;
	padding: 8px 10px;
	border-radius: 8px;
	min-width: 260px;
	max-width: 320px;
	box-shadow: 0 12px 24px rgba(15, 23, 42, 0.2);
	transform: translateY(0);
	z-index: 9999;
	pointer-events: none;
}

.method-chip:disabled {
	opacity: 0.6;
	cursor: not-allowed;
	box-shadow: none;
}

.method-group-primary {
	flex-wrap: nowrap;
}

.method-group-secondary {
	flex: 1 1 auto;
	min-width: 0;
}

.method-group-scroll {
	display: flex;
	align-items: center;
	gap: 10px;
	overflow-x: auto;
	overflow-y: visible;
	padding: 6px 2px 10px;
	max-width: 100%;
	scrollbar-width: none;
}

.method-group-scroll::-webkit-scrollbar {
	height: 0;
}

.method-group-label {
	font-size: 0.75rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	color: #9aa1ae;
	text-transform: uppercase;
	margin-right: 2px;
}

.method-chip {
	border: 1px solid rgba(148, 163, 184, 0.35);
	background: rgba(248, 250, 252, 0.92);
	padding: 8px 12px;
	border-radius: 999px;
	font-size: 0.88rem;
	font-weight: 600;
	color: #0f172a;
	cursor: pointer;
	display: inline-flex;
	align-items: center;
	gap: 8px;
	transition:
		transform 0.2s ease,
		box-shadow 0.2s ease,
		border-color 0.2s ease,
		background 0.2s ease;
}

.method-chip-secondary {
	border-color: rgba(148, 163, 184, 0.5);
	background: rgba(248, 250, 252, 0.75);
}

.method-chip:hover {
	border-color: var(--method-color, #0a84ff);
	box-shadow: none;
}

.method-chip.active {
	border-color: var(--method-color, #0a84ff);
	box-shadow: none;
}

.method-chip.playing {
	border-color: var(--method-color, #0a84ff);
	box-shadow: none;
}

.chip-dot {
	width: 8px;
	height: 8px;
	border-radius: 50%;
	background: var(--method-color, #2563eb);
}

.chip-label {
	white-space: nowrap;
}

.chip-action {
	font-size: 0.78rem;
	color: #6b7280;
	font-weight: 700;
	width: 16px;
	text-align: center;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: 0 0 16px;
}

.chip-spinner {
	width: 16px;
	height: 16px;
	border-radius: 50%;
	border: 2px solid rgba(148, 163, 184, 0.4);
	border-top-color: var(--method-color, #0a84ff);
	animation: chip-spin 0.9s linear infinite;
	box-sizing: border-box;
	display: inline-flex;
	flex: 0 0 16px;
}

@keyframes chip-spin {
	to {
		transform: rotate(360deg);
	}
}

.wave-panel {
	background: #f7f8fa;
	border-radius: 16px;
	padding: 14px 16px 16px;
	border: 1px solid rgba(148, 163, 184, 0.2);
	display: flex;
	flex-direction: column;
	gap: 12px;
	transition:
		border-color 0.2s ease,
		box-shadow 0.2s ease;
}

.wave-panel:hover {
	border-color: rgba(10, 132, 255, 0.3);
	box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
}

.wave-panel-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 12px;
}

.wave-panel-actions {
	display: inline-flex;
	align-items: center;
	gap: 12px;
}

.view-toggle {
	display: inline-flex;
	align-items: center;
	background: #eef2ff;
	border-radius: 999px;
	padding: 2px;
	gap: 2px;
}

.view-toggle-btn {
	border: none;
	background: transparent;
	color: #64748b;
	font-size: 0.72rem;
	font-weight: 700;
	padding: 4px 10px;
	border-radius: 999px;
	cursor: pointer;
	transition: all 0.2s ease;
}

.view-toggle-btn.active {
	background: #ffffff;
	color: #0f172a;
	box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
}

.wave-panel-title {
	font-size: 0.9rem;
	font-weight: 700;
	color: #0f172a;
	display: flex;
	flex-wrap: wrap;
	gap: 14px;
}

.legend-item {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	cursor: pointer;
}

.legend-swatch {
	width: 10px;
	height: 10px;
	border-radius: 4px;
}

.legend-pin {
	margin-left: 4px;
	width: 14px;
	height: 14px;
	color: #0a84ff;
	display: inline-block;
}

.wave-status {
	font-size: 0.8rem;
	color: #64748b;
}

.wave-status-error {
	color: #e11d48;
}

.wave-canvas-wrap {
	position: relative;
	padding: 0 20px 4px;
	overflow: visible;
	z-index: 1;
}

.wave-canvas {
	width: 100%;
	height: 160px;
	display: block;
	border-radius: 12px;
	opacity: 1;
	transition: opacity 0.25s ease;
}

.wave-time-axis {
	position: relative;
	margin-top: 6px;
	width: calc(100% - 40px);
	margin-left: 20px;
	overflow: visible;
	z-index: 3;
}

.time-axis-track {
	position: relative;
	height: 26px;
	width: 100%;
}

.time-axis-tick {
	position: absolute;
	transform: translateX(0);
	display: block;
	top: 0;
}

.time-axis-line {
	position: absolute;
	left: 0;
	top: 0;
	width: 1px;
	height: 6px;
	background: rgba(148, 163, 184, 0.55);
	transform: translateX(-50%);
}

.time-axis-tick.is-major .time-axis-line {
	height: 8px;
	background: rgba(100, 116, 139, 0.8);
}

.time-axis-label {
	position: absolute;
	left: 0;
	top: 8px;
	transform: translateX(-50%);
	font-size: 0.7rem;
	color: #64748b;
	font-variant-numeric: tabular-nums;
}

.time-axis-caret {
	position: absolute;
	transform: translateX(-50%);
	bottom: 0;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	pointer-events: none;
	z-index: 4;
}

.time-axis-caret-label {
	font-size: 0.7rem;
	font-weight: 700;
	color: #0f172a;
	background: #ffffff;
	border: 1px solid rgba(148, 163, 184, 0.35);
	border-radius: 6px;
	padding: 2px 6px;
	box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
}

.spectrogram-block {
	display: flex;
	flex-direction: column;
	gap: 8px;
	position: relative;
}

.spectrogram-labels {
	display: grid;
	grid-template-columns: 1fr 12px 1fr;
	align-items: center;
	text-align: center;
	gap: 8px;
	padding-left: 40px;
}

.spectrogram-label {
	font-size: 0.75rem;
	font-weight: 700;
	color: #0f172a;
	background: transparent;
	padding: 0;
	border-radius: 0;
	justify-self: center;
}

.spectrogram-row {
	display: grid;
	grid-template-columns: 1fr 12px 1fr;
	gap: 8px;
	align-items: stretch;
}

.spectrogram-side {
	position: relative;
	min-width: 0;
	padding-left: 40px;
	padding-bottom: 26px;
	box-sizing: border-box;
}

.spectrogram-side.spectrogram-hovering {
	cursor: none;
}

.spectrogram-axis {
	position: absolute;
	pointer-events: none;
	font-size: 0.7rem;
	color: #64748b;
}

.spectrogram-axis-y {
	left: 0;
	top: 0;
	bottom: 26px;
	width: 40px;
}

.spectrogram-axis-x {
	left: 40px;
	right: 0;
	bottom: 0;
	height: 18px;
}

.spectrogram-axis .spectrogram-axis-tick {
	position: absolute;
	transform: translateX(-50%);
}

.spectrogram-axis-y .spectrogram-axis-tick {
	left: 100%;
	transform: translate(-100%, -50%);
}

.spectrogram-axis-line {
	width: 1px;
	height: 6px;
	background: rgba(148, 163, 184, 0.55);
	display: block;
}

.spectrogram-axis-y .spectrogram-axis-line {
	width: 6px;
	height: 1px;
	margin-left: 0;
	margin-right: 0;
}

.spectrogram-axis-x .spectrogram-axis-line {
	margin: 0 auto;
}

.spectrogram-axis-label {
	margin-top: 4px;
	display: block;
	font-variant-numeric: tabular-nums;
}

.spectrogram-axis-y .spectrogram-axis-label {
	position: absolute;
	right: 8px;
	top: 50%;
	transform: translateY(-50%);
	margin-top: 0;
	text-align: right;
	width: 16px;
}

.spectrogram-axis-title {
	position: absolute;
	left: 7px;
	top: 50%;
	transform: translate(-50%, -50%) rotate(-90deg);
	transform-origin: center;
	font-size: 0.7rem;
	font-weight: 600;
	color: #64748b;
	white-space: nowrap;
}

.spectrogram-axis-x .spectrogram-axis-label {
	text-align: center;
}

.spectrogram-axis-x .spectrogram-axis-tick.is-major .spectrogram-axis-line {
	height: 8px;
	background: rgba(100, 116, 139, 0.8);
}

.spectrogram-gap {
	width: 12px;
}

.spectrogram-controls {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding-left: 40px;
	padding-right: 0;
	margin-top: 10px;
}

.spectrogram-colorbar-wrap {
	flex: 1 1 auto;
	display: flex;
	align-items: center;
	gap: 8px;
}

.spectrogram-colorbar-label {
	font-size: 0.7rem;
	color: #64748b;
	font-variant-numeric: tabular-nums;
	white-space: nowrap;
}

.spectrogram-colorbar {
	flex: 1 1 auto;
	height: 10px;
	border-radius: 999px;
	background: linear-gradient(
		90deg,
		rgb(0, 0, 4),
		rgb(25, 6, 64),
		rgb(53, 11, 99),
		rgb(84, 21, 117),
		rgb(113, 31, 126),
		rgb(142, 41, 122),
		rgb(170, 54, 99),
		rgb(198, 72, 70),
		rgb(225, 101, 40),
		rgb(246, 136, 22),
		rgb(252, 181, 20)
	);
}

.spectrogram-quality {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	min-width: 220px;
}

.spectrogram-quality-label {
	font-size: 0.72rem;
	font-weight: 700;
	color: #64748b;
	letter-spacing: 0.08em;
	text-transform: uppercase;
}

.spectrogram-quality-options {
	display: inline-flex;
	align-items: center;
	gap: 6px;
	padding: 4px;
	border-radius: 999px;
	background: #eef2ff;
}

.spectrogram-quality-option {
	border: none;
	background: transparent;
	color: #64748b;
	font-size: 0.75rem;
	font-weight: 700;
	width: 26px;
	height: 26px;
	border-radius: 50%;
	cursor: pointer;
	transition: all 0.2s ease;
}

.spectrogram-quality-option.active {
	background: #ffffff;
	color: #0f172a;
	box-shadow: 0 4px 10px rgba(15, 23, 42, 0.12);
}

.spectrogram-canvas {
	width: 100%;
	height: 360px;
	border-radius: 0;
	display: block;
	background: #000000;
}

.spectrogram-zoom-canvas {
	position: absolute;
	left: 40px;
	top: 0;
	right: 0;
	bottom: 26px;
	width: calc(100% - 40px);
	height: calc(100% - 26px);
	pointer-events: none;
}

.canvas-loading {
	position: absolute;
	left: 0;
	right: 0;
	top: 0;
	bottom: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 0.85rem;
	font-weight: 700;
	letter-spacing: 0.08em;
	text-transform: uppercase;
	border-radius: 12px;
	pointer-events: none;
}

.wave-loading {
	color: #0f172a;
	background: rgba(255, 255, 255, 0.7);
}

.spectrogram-loading {
	color: #ffffff;
	background: transparent;
	left: 40px;
	right: 0;
	top: 0;
	bottom: 26px;
}

.spectrogram-placeholder {
	position: absolute;
	left: calc(50% + 20px);
	top: 50%;
	transform: translate(-50%, -50%);
	color: #ffffff;
	font-size: 0.75rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	pointer-events: none;
}

.progress-row {
	display: grid;
	grid-template-columns: auto auto 1fr auto auto;
	align-items: center;
	gap: 10px;
	padding: 4px 4px 0;
}

.progress-play {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	border: none;
	background: transparent;
	color: #0a84ff;
	font-size: 0.85rem;
	font-weight: 700;
	cursor: pointer;
	box-shadow: none;
	transition:
		transform 0.15s ease,
		opacity 0.15s ease;
}

.progress-play:hover {
	opacity: 0.7;
}

.progress-track {
	position: relative;
	width: 100%;
	display: flex;
	align-items: center;
}

.progress-track-hover .progress-bar {
	box-shadow:
		0 0 0 4px rgba(0, 122, 255, 0.18),
		0 0 16px rgba(0, 122, 255, 0.12);
}

.progress-track-hover .progress-bar::-webkit-slider-thumb {
	box-shadow:
		0 0 0 6px rgba(0, 122, 255, 0.2),
		0 2px 6px rgba(15, 23, 42, 0.25);
}

.progress-track-hover .progress-bar::-moz-range-thumb {
	box-shadow:
		0 0 0 6px rgba(0, 122, 255, 0.2),
		0 2px 6px rgba(15, 23, 42, 0.25);
}

.time-label {
	font-size: 0.78rem;
	color: #64748b;
	font-variant-numeric: tabular-nums;
}

.progress-bar {
	width: 100%;
	appearance: none;
	height: 6px;
	border-radius: 999px;
	background: #dfe3ea;
	outline: none;
	transition: box-shadow 0.2s ease;
}

.progress-bar::-webkit-slider-thumb {
	appearance: none;
	width: 14px;
	height: 14px;
	border-radius: 50%;
	background: #0f172a;
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);
	cursor: pointer;
}

.progress-bar::-moz-range-thumb {
	width: 14px;
	height: 14px;
	border-radius: 50%;
	background: #0f172a;
	border: none;
	box-shadow: 0 2px 6px rgba(15, 23, 42, 0.25);
	cursor: pointer;
}

.progress-tooltip {
	position: absolute;
	top: -28px;
	transform: translateX(-50%);
	background: #0f172a;
	color: #ffffff;
	font-size: 0.7rem;
	padding: 2px 6px;
	border-radius: 6px;
	white-space: nowrap;
	pointer-events: none;
}

.progress-tooltip::after {
	content: '';
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	top: 100%;
	border-width: 4px;
	border-style: solid;
	border-color: #0f172a transparent transparent transparent;
}

.wave-audio {
	width: 0;
	height: 0;
	opacity: 0;
}

@media (max-width: 720px) {
	.wave-compare {
		padding: 18px 18px 20px;
	}

	.wave-header {
		flex-direction: column;
		align-items: flex-start;
	}
}
</style>
