self.addEventListener('message', (event) => {
	const { id, samples, pointCount = 1000 } = event.data;

	try {
		const channel = new Float32Array(samples);
		const points = Math.max(1, Math.min(pointCount, channel.length));
		const waveform = new Float32Array(points * 2);
		const blockSize = channel.length / points;

		for (let point = 0; point < points; point += 1) {
			const start = Math.floor(point * blockSize);
			const end = Math.max(start + 1, Math.floor((point + 1) * blockSize));
			let minimum = 1;
			let maximum = -1;

			for (let index = start; index < end && index < channel.length; index += 1) {
				const value = channel[index];
				minimum = Math.min(minimum, value);
				maximum = Math.max(maximum, value);
			}

			waveform[point * 2] = minimum;
			waveform[point * 2 + 1] = maximum;
		}

		self.postMessage({ id, waveform }, [waveform.buffer]);
	} catch (error) {
		self.postMessage({
			id,
			error: error instanceof Error ? error.message : String(error)
		});
	}
});
