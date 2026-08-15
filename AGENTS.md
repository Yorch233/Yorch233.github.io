# AGENTS.md

Repository guidance for `Yorch233.github.io`.

@/Users/yo/.codex/RTK.md

## Architecture

This is an Astro static site built through Astro's Vite pipeline. Static pages
and content use `.astro` components. Interactive audio demos use native Preact
Islands; do not introduce React compatibility mode.

Active routes:

- `/` — personal introduction (includes the publications list).
- `/RSB/` — RSB paper and interactive audio demo.

Important files:

- `astro.config.mjs` — Astro, Vite, Preact, and static output configuration.
- `src/pages/` — file-based static routes.
- `src/layouts/BaseLayout.astro` — shared HTML document.
- `src/components/preact/AudioDemoIsland.jsx` — interactive audio UI.
- `src/workers/waveform.worker.js` — runtime waveform downsampling only.
- `src/data/rsb.js` — samples, methods, and public audio base path.
- `public/audio/RSB/` — Opus listening files and original WAV downloads.
- `scripts/encode-audio.sh` — deterministic WAV-to-Opus and spectrogram
  generation.

## Commands

```bash
npm install
npm run dev
npm run check
npm run build
npm run preview
npm run audio:build
npm run verify:runtime
```

Use RTK for supported shell commands. A normal code change must pass
`npm run build`.

## Audio invariants

- Every `<audio>` element must use `preload="none"`.
- The Island hydrates with `client:visible`.
- Initial network loading is limited to the selected method, Measurement, and
  Ground Truth for the current sample.
- A method not in that initial set loads only after selection.
- Use Opus for playback and retain a direct WAV download.
- Waveforms are generated at runtime only after explicit user action.
- Do not decode audio merely because the Island mounted.
- Waveform downsampling must remain in `waveform.worker.js`.
- Spectrograms must use pre-generated `.spectrogram.jpg` resources.
- Do not add browser-side FFT or spectrogram generation code.
- Do not eagerly process every sample or method.
- Clean up Workers, event listeners, and other browser resources.

## Content and style

- Profile data lives in `src/data/profile.json`.
- Publication data lives in `src/data/publications.js`.
- RSB sample and method metadata lives in `src/data/rsb.js`.
- Preserve the blue-white academic glassmorphism style unless redesign is in
  scope.
- Preserve keyboard access, useful labels, reduced-motion support, and narrow
  screen layouts.

## Validation

After changes:

1. Run `npm run build`.
2. Confirm `dist/index.html` and `dist/RSB/index.html` exist.
3. Confirm no SPA `404.html` fallback is required.
4. Verify the RSB Island chunk is not loaded before the audio section is near
   the viewport.
5. Verify initial audio requests cover only RSB, Measurement, and Ground Truth.
6. Verify selecting another method causes its first request.
7. Verify waveform decoding and Worker analysis begin only after user action.
8. Verify Worker-backed real-time waveform and static spectrogram requests.
9. Verify Opus playback and WAV download URLs.

<!-- CODEGRAPH_START -->
## CodeGraph

Prefer CodeGraph for structural questions and native search for literal text.
Use `codegraph_context` followed by one `codegraph_explore` call for architecture
questions. Use `codegraph_trace` followed by `codegraph_explore` for flows.
Trust structural results and account for the watcher delay after edits.

If CodeGraph reports that this repository is not initialized, ask the user
before running:

```bash
codegraph init -i
```
<!-- CODEGRAPH_END -->
