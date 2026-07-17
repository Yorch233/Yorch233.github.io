import { spawn } from 'node:child_process';

const rootUrl = 'http://127.0.0.1:4323';
const chromeExecutable = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const waitForHttp = async (url, attempts = 80) => {
	for (let attempt = 0; attempt < attempts; attempt += 1) {
		try {
			const response = await fetch(url);
			if (response.ok) return response;
		} catch {
			// Server is still starting.
		}
		await delay(125);
	}
	throw new Error(`Timed out waiting for ${url}`);
};

const assert = (condition, message) => {
	if (!condition) throw new Error(message);
};

const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', '4323'], {
	stdio: ['ignore', 'pipe', 'pipe']
});

let chrome;
let socket;

try {
	await waitForHttp(`${rootUrl}/RSB/`);

	chrome = spawn(
		chromeExecutable,
		[
			'--headless=new',
			'--disable-gpu',
			'--no-first-run',
			'--no-default-browser-check',
			'--autoplay-policy=no-user-gesture-required',
			'--remote-debugging-port=9333',
			`--user-data-dir=/tmp/yorch233-astro-runtime-${process.pid}`,
			'about:blank'
		],
		{ stdio: 'ignore' }
	);

	await waitForHttp('http://127.0.0.1:9333/json/version');
	const tabResponse = await fetch('http://127.0.0.1:9333/json/new?about:blank', { method: 'PUT' });
	const tab = await tabResponse.json();
	socket = new WebSocket(tab.webSocketDebuggerUrl);
	await new Promise((resolve, reject) => {
		socket.addEventListener('open', resolve, { once: true });
		socket.addEventListener('error', reject, { once: true });
	});

	let commandId = 0;
	const pending = new Map();
	const eventWaiters = new Map();
	const requests = [];
	const runtimeErrors = [];

	socket.addEventListener('message', ({ data }) => {
		const message = JSON.parse(data);
		if (message.id) {
			const handler = pending.get(message.id);
			if (!handler) return;
			pending.delete(message.id);
			if (message.error) handler.reject(new Error(message.error.message));
			else handler.resolve(message.result);
			return;
		}

		if (message.method === 'Network.requestWillBeSent') {
			requests.push(message.params.request.url);
		}
		if (message.method === 'Runtime.exceptionThrown') {
			runtimeErrors.push(message.params.exceptionDetails.text);
		}

		const waiters = eventWaiters.get(message.method);
		if (waiters?.length) {
			eventWaiters.delete(message.method);
			waiters.forEach((resolve) => resolve(message.params));
		}
	});

	const send = (method, params = {}) =>
		new Promise((resolve, reject) => {
			const id = ++commandId;
			pending.set(id, { resolve, reject });
			socket.send(JSON.stringify({ id, method, params }));
		});

	const nextEvent = (method) =>
		new Promise((resolve) => {
			eventWaiters.set(method, [...(eventWaiters.get(method) || []), resolve]);
		});

	await Promise.all([send('Network.enable'), send('Page.enable'), send('Runtime.enable')]);
	const loaded = nextEvent('Page.loadEventFired');
	await send('Page.navigate', { url: `${rootUrl}/RSB/` });
	await loaded;
	await delay(700);

	assert(!requests.some((url) => url.includes('AudioDemoIsland')), 'Preact Island loaded before becoming visible.');
	assert(!requests.some((url) => url.endsWith('.opus')), 'Audio loaded before the Island became visible.');

	await send('Runtime.evaluate', {
		expression: 'window.scrollTo(0, document.body.scrollHeight); true',
		awaitPromise: true
	});
	await delay(2500);

	assert(requests.some((url) => url.includes('AudioDemoIsland')), 'Preact Island did not hydrate after scrolling.');
	const initialOpus = [...new Set(requests.filter((url) => url.endsWith('.opus')))];
	assert(initialOpus.length === 4, `Expected 4 initial Opus requests, received ${initialOpus.length}.`);
	assert(initialOpus.every((url) => /\/(Measurement|Ground_Truth)\//.test(url)), 'An unselected method loaded during initial hydration.');
	assert(!requests.some((url) => url.endsWith('.wav')), 'A WAV file was requested without a download action.');
	assert(!requests.some((url) => url.endsWith('.spectrogram.avif')), 'A spectrogram loaded before the spectrogram view was selected.');
	assert(requests.some((url) => url.includes('waveform.worker')), 'Default waveform view did not load the waveform Worker.');

	await send('Runtime.evaluate', {
		expression: `
			[...[...document.querySelectorAll('.wave-compare')][0]
				.querySelectorAll('.method-chip')]
				.find((button) => button.textContent.includes('NCSN++M'))
				.click();
			true;
		`,
		awaitPromise: true
	});
	await delay(1200);

	const afterSelection = [...new Set(requests.filter((url) => url.endsWith('.opus')))];
	const ncsnRequests = afterSelection.filter((url) => url.includes('/NCSN++M/'));
	assert(ncsnRequests.length === 1, `Expected one on-demand NCSN++M request, received ${ncsnRequests.length}.`);
	const playbackResult = await send('Runtime.evaluate', {
		expression: `JSON.stringify({
			active: [...document.querySelectorAll('.wave-compare')][0].querySelector('.method-chip.active')?.textContent.trim(),
			paused: [...document.querySelectorAll('.wave-audio')][0].paused,
			currentSrc: [...document.querySelectorAll('.wave-audio')][0].currentSrc
		})`,
		returnByValue: true
	});
	const playback = JSON.parse(playbackResult.result.value);
	assert(playback.active.includes('NCSN++M'), `Selected method did not become active: ${playback.active}`);
	assert(playback.paused === false && playback.currentSrc.startsWith('blob:'), 'Method selection did not automatically start the cached Opus audio.');

	await send('Runtime.evaluate', {
		expression: `
			[...document.querySelectorAll('.wave-compare')][0]
				.querySelector('.method-chip.active')
				.click();
			const slider = [...document.querySelectorAll('.volume-slider')][0];
			slider.value = '150';
			slider.dispatchEvent(new Event('input', { bubbles: true }));
			true;
		`,
		awaitPromise: true
	});
	await delay(300);
	const sharedControlResult = await send('Runtime.evaluate', {
		expression: `JSON.stringify({
			paused: [...document.querySelectorAll('.wave-audio')][0].paused,
			volumes: [...document.querySelectorAll('.volume-slider')].map((node) => node.value)
		})`,
		returnByValue: true
	});
	const sharedControl = JSON.parse(sharedControlResult.result.value);
	assert(sharedControl.paused, 'Clicking the active method did not pause playback.');
	assert(sharedControl.volumes.length === 2 && sharedControl.volumes.every((value) => value === '150'), 'Global volume did not synchronize between components.');

	const waveformStateResult = await send('Runtime.evaluate', {
		expression: `JSON.stringify({
			preloads: [...document.querySelectorAll('audio')].map((audio) => audio.preload),
			canvas: [...document.querySelectorAll('canvas')].map((canvas) => ({ width: canvas.width, height: canvas.height })),
			cards: document.querySelectorAll('.wave-compare').length,
			methods: [...document.querySelectorAll('.wave-compare')][0].querySelectorAll('.method-chip').length,
			actions: [...document.querySelectorAll('.rsb-audio-actions')].map((node) => node.querySelectorAll('button').length),
			views: [...document.querySelectorAll('.wave-compare')][0].querySelectorAll('.view-toggle-btn').length
		})`,
		returnByValue: true
	});
	const waveformState = JSON.parse(waveformStateResult.result.value);
	assert(waveformState.preloads.length === 2 && waveformState.preloads.every((value) => value === 'none'), 'Audio preload policy is not "none".');
	assert(waveformState.canvas.some((canvas) => canvas.width > 0 && canvas.height > 0), 'Real-time waveform canvas was not rendered.');
	assert(waveformState.cards === 2, `Expected two visible comparison cards, received ${waveformState.cards}.`);
	assert(waveformState.methods === 6, `Expected six method chips, received ${waveformState.methods}.`);
	assert(waveformState.actions.every((count) => count === 3), 'Dataset navigation controls do not match the original layout.');
	assert(waveformState.views === 2, 'Waveform/Spectrogram toggle is incomplete.');
	assert(!requests.some((url) => url.endsWith('.spectrogram.avif')), 'Waveform view unexpectedly loaded a spectrogram.');

	await send('Runtime.evaluate', {
		expression: `
			[...document.querySelectorAll('.wave-compare')][0]
				.querySelectorAll('.view-toggle-btn')[1]
				.click();
			true;
		`,
		awaitPromise: true
	});
	await delay(1000);

	const spectrogramRequests = [...new Set(requests.filter((url) => url.endsWith('.spectrogram.avif')))];
	assert(spectrogramRequests.length === 2, `Expected two static spectrogram requests, received ${spectrogramRequests.length}.`);
	assert(!requests.some((url) => url.includes('audioAnalysis.worker')), 'Legacy spectrogram Worker was requested.');

	await send('Runtime.evaluate', {
		expression: `
			const comparison = [...document.querySelectorAll('.wave-compare')][0];
			const frame = comparison.querySelector('.spectrogram-image-frame');
			const rect = frame.getBoundingClientRect();
			frame.dispatchEvent(new MouseEvent('mousemove', {
				bubbles: true,
				clientX: rect.left + rect.width * 0.42,
				clientY: rect.top + rect.height * 0.58
			}));
			true;
		`,
		awaitPromise: true
	});
	await delay(100);
	const magnifierResult = await send('Runtime.evaluate', {
		expression: `(() => {
			const comparison = [...document.querySelectorAll('.wave-compare')][0];
			const lenses = [...comparison.querySelectorAll('.spectrogram-magnifier')];
			return JSON.stringify({
				options: comparison.querySelectorAll('.spectrogram-magnification-option').length,
				magnifiers: lenses.length,
				positions: lenses.map((node) => [node.style.left, node.style.top])
			});
		})()`,
		returnByValue: true
	});
	const magnifier = JSON.parse(magnifierResult.result.value);
	assert(magnifier.options === 4, `Expected four magnification options, received ${magnifier.options}.`);
	assert(magnifier.magnifiers === 2, `Expected two synchronized magnifiers, received ${magnifier.magnifiers}.`);
	assert(magnifier.positions[0].join('|') === magnifier.positions[1].join('|'), 'Spectrogram magnifier positions are not synchronized.');

	await send('Runtime.evaluate', {
		expression: `
			[...document.querySelectorAll('.wave-compare')][0]
				.querySelectorAll('.spectrogram-magnification-option')[3]
				.click();
			true;
		`,
		awaitPromise: true
	});
	await delay(100);
	const zoomResult = await send('Runtime.evaluate', {
		expression: `(() => {
			const comparison = [...document.querySelectorAll('.wave-compare')][0];
			const lenses = [...comparison.querySelectorAll('.spectrogram-magnifier')];
			return JSON.stringify({
				active: comparison.querySelector('.spectrogram-magnification-option.active')?.textContent.trim(),
				lenses: lenses.map((node) => ({
					backgroundSize: node.style.backgroundSize,
					frameWidth: node.parentElement.getBoundingClientRect().width,
					frameHeight: node.parentElement.getBoundingClientRect().height
				}))
			});
		})()`,
		returnByValue: true
	});
	const zoom = JSON.parse(zoomResult.result.value);
	assert(zoom.active === '2×', `Expected 2× magnification to be active, received ${zoom.active}.`);
	assert(
		zoom.lenses.every((lens) => {
			const [backgroundWidth, backgroundHeight] = lens.backgroundSize.split(' ').map(Number.parseFloat);
			return Math.abs(backgroundWidth - lens.frameWidth * 2) < 1 && Math.abs(backgroundHeight - lens.frameHeight * 2) < 1;
		}),
		'Magnifier background is not rendered at 2× the spectrogram canvas size.'
	);
	assert([...new Set(requests.filter((url) => url.endsWith('.spectrogram.avif')))].length === 2, 'Changing magnification requested another spectrogram asset.');

	await send('Runtime.evaluate', {
		expression: `
			[...document.querySelectorAll('.rsb-visual-toggle input')][0].click();
			true;
		`,
		awaitPromise: true
	});
	await delay(500);
	const simpleModeResult = await send('Runtime.evaluate', {
		expression: `JSON.stringify({
			rows: [...document.querySelectorAll('.rsb-simple-table')][0]?.querySelectorAll('tbody tr').length || 0,
			audio: [...document.querySelectorAll('.rsb-simple-table audio')].map((node) => node.preload),
			downloads: [...document.querySelectorAll('.rsb-simple-table .rsb-simple-download')].length
		})`,
		returnByValue: true
	});
	const simpleMode = JSON.parse(simpleModeResult.result.value);
	assert(simpleMode.rows === 5, `Expected five simple-mode rows, received ${simpleMode.rows}.`);
	assert(simpleMode.audio.length === 30 && simpleMode.audio.every((value) => value === 'none'), 'Simple-mode audio preload policy is not "none".');
	assert(simpleMode.downloads === 0, `Expected no WAV download links in simple mode, received ${simpleMode.downloads}.`);

	const wavResponse = await fetch(`${rootUrl}/audio/RSB/RSB/051o020a_c1_454_snr=5.2.wav`);
	assert(wavResponse.ok, 'WAV download URL is not available.');
	assert(runtimeErrors.length === 0, `Runtime exceptions were reported: ${runtimeErrors.join(' | ')}`);

	console.log(
		JSON.stringify(
			{
				beforeVisible: {
					islandChunk: false,
					audioRequests: 0
				},
				afterVisible: {
					initialOpusRequests: initialOpus.length,
					methods: ['Measurement', 'Ground_Truth'],
					defaultView: 'waveform'
				},
				afterMethodSelection: {
					ncsnRequests: ncsnRequests.length,
					autoPlayback: true,
					activeMethodPause: true,
					globalVolumeSync: true
				},
				visualization: {
					waveformWorker: true,
					waveformCanvasRendered: true,
					staticSpectrogramRequests: spectrogramRequests.length,
					qualityFiveRequests: qualityFiveRequests.length,
					onlineSpectrogramGeneration: false
				},
				originalLayout: {
					methodChips: waveformState.methods,
					datasetActions: waveformState.actions,
					simpleModeRows: simpleMode.rows
				},
				wavDownload: wavResponse.status
			},
			null,
			2
		)
	);
} finally {
	socket?.close();
	chrome?.kill('SIGTERM');
	preview.kill('SIGTERM');
}
