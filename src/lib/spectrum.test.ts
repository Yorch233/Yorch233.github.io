import { describe, expect, it } from 'vitest';
import { computeSpectrum, spectrumFrequencyPosition } from './spectrum.js';

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
  });
});
