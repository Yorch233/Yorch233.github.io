# Yorch233.github.io

Qing Yao's personal academic website and interactive paper demos.

## Architecture

- Astro static site generation
- Vite-based build pipeline provided by Astro
- Preact Islands for interactive audio demos
- Web Worker waveform analysis
- Pre-generated static spectrograms
- Opus previews with original WAV downloads

All pages are emitted as real static routes. The RSB paper page is static HTML
except for its audio section, which hydrates only when it enters the viewport.

## Development

Requirements:

- Node.js 22 or newer
- npm
- FFmpeg with `libopus` when regenerating audio previews and spectrograms

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview
npm run verify:runtime
```

Regenerate Opus previews and static spectrograms after adding or replacing WAV
files:

```bash
npm run audio:build
```

## Audio loading policy

- Audio elements use `preload="none"`.
- When an audio card activates, it fetches only RSB, Measurement, and Ground
  Truth for the current sample.
- Other methods are requested only when selected.
- Audio decoding begins only after the user requests a waveform.
- Waveforms are analyzed in a Web Worker after that delayed decode.
- Spectrograms are pre-generated static assets with no browser-side spectral
  computation.
- Listening uses `.opus`; the original `.wav` remains downloadable.

## Deployment

The site is statically built to `dist/` and deployed to GitHub Pages using the
official Astro GitHub Action in `.github/workflows/deploy.yml`.

## License

Apache-2.0. See `LICENSE`.
