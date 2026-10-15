# Qing Yao · Academic Website

Source code for [Qing Yao’s academic website](https://yorch233.github.io),
featuring a research profile, publications, news, awards, contact information,
and interactive speech enhancement demos.

## Pages and research projects

| Page | Content | Research code |
| --- | --- | --- |
| [Homepage](https://yorch233.github.io/) | Biography, research interests, publications and contact | — |
| [RSB demo](https://yorch233.github.io/RSB/) | Regularized Schrödinger Bridge: paper overview and audio comparisons | [Yorch233/RSB](https://github.com/Yorch233/RSB) |
| [CoF demo](https://yorch233.github.io/CoF/) | Corrective Forcing: interactive results, audio comparisons and model resources | [Yorch233/CoF](https://github.com/Yorch233/CoF) |

This repository contains the website and demo interfaces. Training and inference
implementations are maintained in the linked research repositories. Paper links
and citation exports are available on the website.

## Run locally

Use Node.js 22.12 or newer and npm. From the repository root:

```bash
npm ci
npm run dev
```

Open the local URL printed by Astro. To check the production build:

```bash
npm run build
npm run preview
```

The site uses Astro for static pages and Preact islands for interactive features.
The production output is written to `dist/`.

## Update content

| File or directory | Purpose |
| --- | --- |
| `src/data/profile.json` | Biography, interests, news, education, awards, contact and CV link |
| `src/data/publications.js` | Publication metadata, resource links and citations |
| `src/data/rsb.js` | RSB audio sample groups and methods |
| `src/data/cof-audio.js` | CoF audio sample groups, methods and sampling budgets |
| `src/data/cof-results.json` | CoF evaluation values, preserved at their supplied precision |
| `src/data/demo-guide.js` | Demo section labels and destinations |
| `src/pages/` | Homepage and paper demo routes |
| `src/components/` | Shared page components and interactive islands |
| `src/styles/` | Shared and page-specific styles |
| `public/` | Portrait, figures, audio, icons and other static assets |
| `tests/e2e/` | Browser interaction and responsive layout checks |

The optional `cv` field in `profile.json` accepts a document URL. When it is
`null`, the CV dialog displays an unavailable message and disables downloading.
Visual and interaction conventions are documented in [design.md](design.md).

## Audio and artwork

Audio comparisons use Opus for playback and original WAV files for downloading.
Waveform analysis runs in a Web Worker; spectrograms are pre-generated AVIF
images. On phones, expandable sample rows share a floating player. Wider
screens retain the comparison cards.

After adding or replacing WAV files, regenerate the corresponding assets with
FFmpeg, including its Opus and AVIF encoders:

```bash
npm run audio:build -- RSB
npm run audio:build -- CoF
```

The logo and native SVG icon registry are regenerated automatically before a
production build. They can also be refreshed separately:

```bash
npm run logo:build
npm run icons:build
```

Local design references, GUI screenshots and editor metadata are excluded from
version control. Keep production assets in `public/` and source artwork in the
shared source modules.

## Validation

```bash
npm run check
npm run lint
npm run test:unit
npx playwright install chromium
npm run test:e2e
```

The browser suite builds the site and tests its production preview, including
navigation, dialogs, responsive layouts, audio playback and visualizations.
`npm run test:e2e:dev` runs against the development server for faster iteration.

## Deployment

[The deployment workflow](.github/workflows/deploy.yml) builds the site and
publishes it to GitHub Pages when `main` is updated, or when manually triggered.
The site URL is configured in `astro.config.mjs`.

## License

[Apache License 2.0](LICENSE).
