# Qing UI icons

42 original glyphs × 2 states = 84 transparent standalone SVGs.
Preview and download at /icons/.

- *-active-filled.svg: two-tone filled body/detail planes.
- *-inactive.svg: gray outline (#8591a3), lighter in filled mass.
- Native 24 × 24 viewBox, display at 16, 20 or 24 CSS pixels.
- Blue #3189f5 / pale blue #bfdfff. Research pairs: violet #7363d9 / #e1dcff,
  teal #219ca4 / #c6ece9, orange #c38247 / #f5dfc6.
- Professional system-symbol style. No gradients, shadows or cartoon faces.
  Cloud silhouettes appear only in Cloud and the Download tray.

Use UiIcon.astro or preact/UiIcon.jsx with id and state=auto|active|inactive.
Auto follows the enclosing control's aria-current, aria-pressed or aria-expanded.
Hover/focus colors the outline; selection activates two-tone fill.
Tone=inverse keeps primary actions readable. Keep visible labels or aria-labels.
Inactive means unselected, not disabled. Dark mode adjusts the palette.

Eight PNG sheets in references/ were generated with built-in imagegen first,
then interpreted as original small-size native SVG drawings. Reference sheets
are design material, not bitmap icons used by controls. Full prompts and mode:
design/icon-references/apple-prompts.json. GitHub and publisher marks keep
recognizable authentic geometry; GitHub uses the Simple Icons CC0 glyph.

Edit src/lib/ui-icon-artwork.js and src/lib/ui-icon-catalog.js, then run
npm run icons:build. Production prebuild regenerates registry, manifest and
exports. Individual icons use no external resources or SVG IDs.
