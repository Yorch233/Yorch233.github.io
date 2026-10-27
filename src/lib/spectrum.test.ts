import { describe, expect, it } from 'vitest';
import { computeSpectrum, spectrumDisplayFrame, spectrumFrequencyPosition } from './spectrum.js';

const rate = 8192, size = 1024;
const tone = (frequency: number, amplitude = 1) => Float32Array.from({ length: rate }, (_, index) => amplitude * Math.sin(2 * Math.PI * frequency * index / rate));
const peak = (samples: Float32Array, time = .5) => {
  const spectrum = computeSpectrum(samples, rate, time, size);
  const index = spectrum.energies.indexOf(Math.max(...spectrum.energies));
  return { frequency: spectrum.frequencies[index], energy: spectrum.energies[index] };
};

describe('current-time frequency energy', () => {
  it('uses a fixed 20 Hz–20 kHz logarithmic axis with equal spacing per decade', () => {
    expect(spectrumFrequencyPosition(20)).toBe(0);
    expect(spectrumFrequencyPosition(20000)).toBe(1);
    const positions = [20, 200, 2000, 20000].map(spectrumFrequencyPosition);
    expect(positions[1] - positions[0]).toBeCloseTo(positions[3] - positions[2], 10);
    expect(spectrumFrequencyPosition(Math.sqrt(20 * 20000))).toBeCloseTo(.5, 10);
  });
  it('keeps silent bins finite at the digital energy floor', () => {
    const data = computeSpectrum(new Float32Array(rate), rate, .5, size);
    expect(data.energies.length).toBe(size / 2 + 1);
    expect([...data.energies].every(value => value === -100)).toBe(true);
    expect(data.frequencies.at(-1)).toBe(rate / 2);
  });
  it('locates a known sinusoid within one frequency bin', () => {
    expect(Math.abs(peak(tone(1000)).frequency - 1000)).toBeLessThanOrEqual(rate / size);
  });
  it('selects the local signal around the requested time', () => {
    const samples = Float32Array.from({ length: rate }, (_, index) => Math.sin(2 * Math.PI * (index < rate / 2 ? 512 : 1536) * index / rate));
    expect(peak(samples, .25).frequency).toBe(512);
    expect(peak(samples, .75).frequency).toBe(1536);
  });
  it('preserves window-normalized mean-square energy across one-sided bins', () => {
    const samples = tone(1000, .7), time = .5;
    const data = computeSpectrum(samples, rate, time, size);
    let weighted = 0, weights = 0;
    for (let index = 0; index < size; index += 1) {
      const window = .5 - .5 * Math.cos(2 * Math.PI * index / size);
      const sample = samples[Math.round(time * rate) - size / 2 + index];
      weighted += sample * sample * window * window; weights += window * window;
    }
    const power = [...data.energies].reduce((sum, value) => sum + 10 ** (value / 10), 0);
    expect(power).toBeCloseTo(weighted / weights, 5);
  });
  it('represents half amplitude as a 6.02 dB reduction in power', () => {
    expect(peak(tone(1000, .5)).energy - peak(tone(1000)).energy).toBeCloseTo(20 * Math.log10(.5), 4);
  });
  it('clamps edge frames and rejects invalid transform parameters', () => {
    const samples = tone(512);
    expect(computeSpectrum(samples, rate, -1, size).time).toBe(0);
    expect(computeSpectrum(samples, rate, 10, size).time).toBe(1);
    expect(() => computeSpectrum(samples, 0, 0, size)).toThrow();
    expect(() => computeSpectrum(samples, rate, NaN, size)).toThrow();
    expect(() => computeSpectrum(samples, rate, 0, 1000)).toThrow();
    expect(() => computeSpectrum(samples, rate, 0, size, size + 2)).toThrow();
  });
  it('supports a zero-padded short data window', () => {
    const data = computeSpectrum(tone(1000), rate, .5, size, Math.round(rate / 100));
    expect(data.windowSize).toBe(Math.round(rate / 100));
    expect(data.energies.length).toBe(size / 2 + 1);
  });
  it('keeps 10 ms of signal with a 4096-point transform at common sample rates', () => {
    for (const sampleRate of [44100, 48000]) {
      const samples = Float32Array.from({ length: sampleRate }, (_, index) => Math.sin(2 * Math.PI * 1000 * index / sampleRate));
      const windowSize = Math.round(sampleRate / 100);
      const data = computeSpectrum(samples, sampleRate, .5, 4096, windowSize);
      expect(data.windowSize / sampleRate).toBeCloseTo(.01, 6);
      expect(data.fftSize).toBe(4096);
      expect(data.frequencies[1]).toBeCloseTo(sampleRate / 4096, 5);
      expect(Math.max(...data.energies)).toBeGreaterThan(-40);
      const display = spectrumDisplayFrame(data);
      expect(display.frequencies[0]).toBe(20);
      expect(display.frequencies.at(-1)).toBe(20000);
      expect(display.frequencies[1]).toBeLessThan(30);
    }
  });
  it('interpolates the display boundaries without duplicating bins or modifying analysis data', () => {
    const frame = {
      frequencies: new Float32Array([0, 10, 30, 10000, 19000, 21000, 24000]),
      energies: new Float32Array([-80, -60, -40, -20, -40, -80, -100]),
      sampleRate: 48000
    };
    const display = spectrumDisplayFrame(frame);
    expect([...display.frequencies]).toEqual([20, 30, 10000, 19000, 20000]);
    expect([...display.energies]).toEqual([-50, -40, -20, -40, -60]);
    expect(frame.frequencies[0]).toBe(0);
  });
  it('keeps exact boundary bins and stops at Nyquist for lower sample rates', () => {
    const frame = {
      frequencies: new Float32Array([0, 20, 100, 8000]),
      energies: new Float32Array([-100, -60, -40, -80]),
      sampleRate: 16000
    };
    const display = spectrumDisplayFrame(frame);
    expect([...display.frequencies]).toEqual([20, 100, 8000]);
    expect([...display.energies]).toEqual([-60, -40, -80]);
  });
});
