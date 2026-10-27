import { computeSpectrum, spectrumDisplayFrame } from '../lib/spectrum.js';

let samples, sampleRate;
const FFT_SIZE = 4096;
self.onmessage = ({ data }) => {
  try {
    if (data.type === 'init') {
      if (!(data.samples instanceof ArrayBuffer) || !Number.isFinite(data.sampleRate) || data.sampleRate <= 0) throw new Error('Invalid spectrum input');
      samples = new Float32Array(data.samples); sampleRate = data.sampleRate;
      self.postMessage({ type: 'ready' });
    } else if (data.type === 'frame') {
      if (!samples) throw new Error('Spectrum is not initialized');
      // Keep the 10 ms signal window; zero-padding only densifies display bins.
      const windowSize = Math.min(FFT_SIZE, Math.max(16, Math.round(sampleRate / 100)));
      const result = spectrumDisplayFrame(computeSpectrum(samples, sampleRate, data.time, FFT_SIZE, windowSize));
      self.postMessage({ type: 'frame', id: data.id, ...result }, [result.frequencies.buffer, result.energies.buffer]);
    }
  } catch (error) {
    self.postMessage({ type: 'error', id: data.id, error: error instanceof Error ? error.message : String(error) });
  }
};
