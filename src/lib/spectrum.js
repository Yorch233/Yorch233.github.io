/** Unclamped logarithmic coordinate on the fixed 20 Hz–20 kHz display axis. */
export const spectrumFrequencyPosition = frequency => Math.log10(frequency / 20) / 3;

/** Clip display bins to the axis and interpolate its edges in frequency/dB space. */
export function spectrumDisplayFrame(frame) {
  const { frequencies, energies } = frame;
  const maximum = Math.min(20000, frame.sampleRate / 2);
  if (!frequencies.length || maximum <= 20) {
    return { ...frame, frequencies: new Float32Array(0), energies: new Float32Array(0) };
  }
  let first = 0;
  while (first < frequencies.length && frequencies[first] <= 20) first += 1;
  let end = first;
  while (end < frequencies.length && frequencies[end] < maximum) end += 1;
  const interpolate = (frequency, upper) => {
    const right = Math.min(frequencies.length - 1, upper);
    const left = Math.max(0, right - 1);
    const span = frequencies[right] - frequencies[left];
    const progress = span ? (frequency - frequencies[left]) / span : 0;
    return energies[left] + (energies[right] - energies[left]) * progress;
  };
  const displayFrequencies = new Float32Array(end - first + 2);
  const displayEnergies = new Float32Array(displayFrequencies.length);
  displayFrequencies[0] = 20;
  displayEnergies[0] = interpolate(20, first);
  displayFrequencies.set(frequencies.subarray(first, end), 1);
  displayEnergies.set(energies.subarray(first, end), 1);
  displayFrequencies[displayFrequencies.length - 1] = maximum;
  displayEnergies[displayEnergies.length - 1] = interpolate(maximum, end);
  return { ...frame, frequencies: displayFrequencies, energies: displayEnergies };
}

/** One current-time, Hann-windowed, one-sided energy spectrum. */
export function computeSpectrum(samples, sampleRate, time, fftSize = 2048, windowSize = fftSize) {
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) throw new RangeError('Invalid sample rate');
  if (!Number.isFinite(time)) throw new RangeError('Invalid frame time');
  if (!Number.isInteger(fftSize) || fftSize < 16 || fftSize > 32768 || (fftSize & (fftSize - 1))) throw new RangeError('FFT size must be a power of two from 16 to 32768');
  if (!Number.isInteger(windowSize) || windowSize < 16 || windowSize > fftSize) throw new RangeError('Window size must be an integer from 16 to the FFT size');
  const frameTime = Math.max(0, Math.min(samples.length / sampleRate, time));
  const start = Math.round(frameTime * sampleRate - windowSize / 2);
  const real = new Float64Array(fftSize), imaginary = new Float64Array(fftSize);
  let windowEnergy = 0;
  for (let index = 0; index < windowSize; index += 1) {
    const window = .5 - .5 * Math.cos(2 * Math.PI * index / windowSize);
    const position = start + index;
    const sample = position >= 0 && position < samples.length ? samples[position] : 0;
    real[index] = (Number.isFinite(sample) ? sample : 0) * window;
    windowEnergy += window * window;
  }
  for (let index = 1, reverse = 0; index < fftSize; index += 1) {
    let bit = fftSize >> 1;
    for (; reverse & bit; bit >>= 1) reverse ^= bit;
    reverse ^= bit;
    if (index < reverse) [real[index], real[reverse]] = [real[reverse], real[index]];
  }
  for (let size = 2; size <= fftSize; size *= 2) {
    const half = size / 2, angle = -2 * Math.PI / size;
    const stepReal = Math.cos(angle), stepImaginary = Math.sin(angle);
    for (let base = 0; base < fftSize; base += size) {
      let rotationReal = 1, rotationImaginary = 0;
      for (let offset = 0; offset < half; offset += 1) {
        const even = base + offset, odd = even + half;
        const oddReal = real[odd] * rotationReal - imaginary[odd] * rotationImaginary;
        const oddImaginary = real[odd] * rotationImaginary + imaginary[odd] * rotationReal;
        real[odd] = real[even] - oddReal; imaginary[odd] = imaginary[even] - oddImaginary;
        real[even] += oddReal; imaginary[even] += oddImaginary;
        const nextReal = rotationReal * stepReal - rotationImaginary * stepImaginary;
        rotationImaginary = rotationReal * stepImaginary + rotationImaginary * stepReal;
        rotationReal = nextReal;
      }
    }
  }
  const bins = fftSize / 2 + 1;
  const frequencies = new Float32Array(bins), energies = new Float32Array(bins);
  for (let bin = 0; bin < bins; bin += 1) {
    const factor = bin === 0 || bin === fftSize / 2 ? 1 : 2;
    const power = factor * (real[bin] ** 2 + imaginary[bin] ** 2) / (fftSize * windowEnergy);
    frequencies[bin] = bin * sampleRate / fftSize;
    energies[bin] = 10 * Math.log10(Math.max(1e-10, power));
  }
  return { frequencies, energies, sampleRate, fftSize, windowSize, time: frameTime };
}
