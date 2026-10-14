# Repository guide

## Git workflow

- `gitea` (`https://gitea-yorch233.iepose.cn/yorch233/Yorch233.github.io.git`) is
  the private development repository. Local `main` tracks `gitea/main`, and
  the default push remote is `gitea`.
- When the user asks to save or submit development code, commit locally and
  push to `gitea`.
- `origin` (`https://github.com/Yorch233/Yorch233.github.io.git`) is the GitHub
  Pages deployment repository; its workflow deploys the site automatically.
- Push to `origin` only when the user explicitly requests deployment. Routine
  development saves must not push to GitHub.

## 协作与独立判断

1. 先检查是否存在错误前提、逻辑跳跃或信息缺失。
2. 不要迎合用户的观点，保持独立判断。
3. 涉及数据、人物与结论，尽量核实信息来源。
4. 如果用户的表述有误，直接指出，说明依据与潜在风险。
5. 主动提醒用户遗漏的变量、成本与认知偏差。

## Scope and sources of truth

Astro static site with native Preact islands; keep the existing stack.
Routes: `/` is Qing Yao’s personal homepage; `/RSB/` is the interactive
Demo; `/CoF/` is the CoF Demo with interactive results and model resources.
Use “Demo” consistently for both pages in News and resource entry points;
both page kickers read “Paper Demo”.
Do not describe CoF as an unpublished teaser or promise audio it does not host.

- `src/data/profile.json`: identity, biography, news, awards and contact.
- `src/data/publications.js`: publication metadata, links and citations.
- `src/data/cof-results.json`: author-supplied CoF evaluations, kept at original precision.
- `src/data/cof-audio.js`: CoF 4 NFE audio sample groups and methods for the shared `AudioDemoIsland` card.
- `src/data/demo-guide.js`: demo section destinations and labels.
- `design.md`: visual principles and interaction behavior.
- `src/components/preact/MeetYo.jsx`: homepage navigation and composition.
- `src/components/preact/HomeCards.jsx`: section content.
- `src/lib/yo-state.js`: pure mascot transitions, legal random chains and cooldowns.
- `src/components/preact/yoMachine.js`: lifecycle events and discrete scheduling.
- `src/lib/yo-pose.js`: continuous interpolation of approved state keyframes.
- `src/components/preact/YoCloud.jsx`: illustration and continuous motion.
- `src/lib/yo-logo.js`: shared static artwork and branding.
- `src/lib/site-logo.js`: transparent Yo page/browser logo and app tile for the touch icon.

Keep instructions about durable behavior here; keep detailed visual choices
in `design.md`. Check source before documenting current implementation.
Do not turn a previous implementation detail into a permanent requirement.

## Product and design

The personal introduction is the homepage priority: all About Me content is
visible on the welcome page, with Publications still easy to reach. Yo is a small
companion, introduced as Qing's Bot. Content must be immediately reachable
without interacting with him.
Use direct labels and accurate destination descriptions.
Write Yo's speech as friendly, conversational English with short natural
sentences. Avoid semicolons and reciting formal publication summaries.
Yo defaults to peeking from the right edge with one visible eye and a small “Hi” greeting on the homepage. Activate him before contextual narration; closing his explanation returns him to the edge. Right-clicking him opens his action menu; the focused mascot also responds to the context-menu key and Shift+F10. Do not show a separate ellipsis trigger. Keep a small “Bring Yo back” control only when he has been intentionally dismissed.
Give meaningful homepage content contextual Yo text on hover after activation, and interactive
controls equivalent hints on keyboard focus. Keep hover narration transient and
out of live announcements; direct-action feedback takes priority.

Use the established ice-white/blue palette and the system font stack
`-apple-system, "system-ui", "SF Pro Text", "Helvetica Neue", Arial, sans-serif`
for headings, prose and controls. Keep soft toy depth, achromatic glass floating
header capsules and rounded reading cards.
Use three glass tiers: clear optical glass for floating header and return capsules, translucent tinted glass for body buttons, and native frosted glass on compact screens. Keep labels and focus outside the filtered layer; support white, blue, green (#31D73F) and custom tints. Each tier has a sharp upper highlight and soft lower reflection, with subtle colored spill.
Use opacity and translucent gradient layers for softening backgrounds, scrims, dialogs and ordinary glass; do not add blur unless frosted glass is explicitly requested. On narrow screens the Homepage header capsules, the bottom navigation bar and its white selection go frosted (light 12px blur); at desktop size the Homepage Header capsules retain their clear optical refraction without backdrop blur. Compact demo capsules and body buttons keep their explicitly frosted tier.
Keep the background minimal and low contrast so content remains the focus.
Default to light mode; preserve an explicitly saved theme. The welcome page follows the selected light reference: a large portrait
left of the complete introduction, full-width interest and action rows,
and Yo floating at the bottom-right on desktop. Phones hide the homepage companion
and skip its automatic welcome dialog. Stack the portrait and introduction on phones. Keep hierarchy
and spacing consistent. Scope homepage styles under `.home-ref`; academic
pages keep their own typography and layout.

### Readable type hierarchy

Use six semantic type levels on the web. Mobile typography follows common
role-based sizes and does not need six levels. Adapt layout and wrapping before
reducing text size.

| Token | Web role | Size (>720px) |
|---|---|---|
| `--text-1` | Metadata, captions, navigation and control labels | 13px |
| `--text-2` | Body copy, descriptions and reading text | 16px |
| `--text-3` | Lead text, component headings | 20px |
| `--text-4` | Section headings | 28px |
| `--text-5` | Page titles | 36px |
| `--text-6` | Display names and major hero headings | 52px |

On phones (≤720px), every page shares one compact scale — 15px body copy,
13px secondary text and control labels, 12px nonessential captions, 16px
component headings, 20px section headings and 22–26px page titles; a short
display name may use 26–30px. Choose
only the roles a screen needs; do not create extra levels to fill a scale.

Use the system font stack for every text role and keep code in monospace.
Headings use weight 700–800, prose 400–500 and controls 500–600. Body
line-height is 1.65–1.8; headings use 1.15–1.3; metadata and
controls use 1.4–1.6. Keep essential labels at least 13px and body copy at
least 15px; do not shrink below the shared phone scale on mobile. Hero typography may vary
fluidly between title/display sizes, but retain a clear hierarchy. Let long
paper titles, method names and email addresses wrap without truncating content.
Use tabular figures for times and measurements. Aim for 60–80 characters per
line in reading passages; avoid justified prose on narrow screens. Verify at
320px width, short landscape and 200% zoom; buttons retain at least 44px touch
targets regardless of label size.

The five section hashes are `#about`, `#news`, `#publications`, `#awards` and
`#contact`; do not reintroduce the removed `#papers` alias. About Me is
the welcome page: `#about` returns there. Do not duplicate it as a reading
card or a welcome-page button. Order navigation About Me, News,
Publications, Awards, Contact. On narrow screens, keep all five destinations visible
in a bottom navigation bar, with icons above compact labels. Keep its outer
glass shell frosted on narrow screens (the desktop shell keeps its clear
optical refraction). On narrow screens the five destinations are uniform
50×50 round icon buttons (labels collapse, accessible names survive), and
the narrow-screen selection is an opaque white full-radius 64×50 pill,
centered on the active one;
desktop uses the original glass selection, 12px taller than
its shell. Center both vertically. Reserve space for content
and position Yo above it. Links,
keyboard focus and browser Back/Forward must agree. Content switches
immediately; do not add artificial loading delays to local content.
Use natural section heights and document scrolling on every screen size;
do not constrain the homepage to one viewport or add vertical card scroll panes.
Keep touch targets usable, focus visible, and primary actions reachable.
The first-visit Yo introduction is dismissible and remembers dismissal. Direct
reading links bypass it. Do not add a footer introduction link. Keep dialog focus contained
and restore it on close, with no duplicate visible mascot while it is open.

Yo uses Fluffy with round glasses and a small blue bow tie throughout the site, without an appearance
switch. Ignore legacy appearance preferences. Use the generated transparent
Yo cutout within pages and in the browser favicon; the touch icon retains the app tile.
Keep Qing Yao's portrait separate.
The loader is a plain white splash showing a small gray "Loading" word above
the gray linear track and blue indicator, with no mascot artwork; it stays
visible for at least 777ms, with a static indicator under reduced motion. Demo watermarks use native Fluffy artwork.
The animated character uses pure SVG geometry and paint, without embedded raster
textures. Match the approved Fluffy silhouette and shading; keep static branding
cutouts separate from the animated rig.
`npm run logo:build` regenerates the native logo SVGs and embeds the transparent cutout
in its favicon (and runs automatically before production builds).
Favicon SVGs must work without external resources.
Do not reintroduce individual wardrobe settings.

Use the approved Yo state references in `design/yo-states-v1/`. Keep prop rigs mutually exclusive and cancel entire automatic chains when interrupted. Give reactions explicit triggers and bounded lifetimes. Reading, reduced motion, hidden tabs and offscreen views stop continuous
motion. Returning to browsing resumes it without stale reactions. Pointer
coordinates belong in refs, not render state. Clean up timers and observers.

Use truthful copy: unavailable resources need a useful alternative, not a
fake download or dead control. The homepage footer pairs `© {current year} Qing Yao`
with `Yo has the final say.`, using a decorative gray Yo icon before his name.

## Demo boundaries

Homepage work must preserve demo behavior. Audio uses `preload="none"`,
Opus playback and direct WAV downloads. Both demos share the
`AudioDemoIsland` card (groups, methods with colors/tooltips, and a base
path come from `src/data/rsb.js` and `src/data/cof-audio.js`); each island
hydrates with `client:visible` and its current default waveform view loads
Measurement and Ground Truth for the displayed samples. Other methods load
on selection. Waveform analysis
uses `waveform.worker.js`; spectrograms are pre-generated AVIF resources
(`scripts/encode-audio.sh <RSB|CoF>` refreshes opus and spectrograms).
Do not add eager processing of all samples or browser-side spectrogram FFT.
CoF audio samples cover the 1 and 4 NFE budgets behind per-dataset
sampling-budget switches (default 4 NFE; assets live under
`public/audio/CoF/nfe1/` and `public/audio/CoF/nfe4/`).
CoF results default to the 4 NFE sampling budget, zoom curve y-axes to the
model curves, and arrange the five Chart-view plots one to four per row by
view width with underfilled rows centered. The Curves view ignores the
sampling budget: no selection line, no budget-linked labels or legend values.
On ultra-wide viewports (>= 2000px)
the RSB and CoF paper columns widen to 1520px while prose keeps an 880px
reading measure.

Demo floating title and resource capsules observe their sources separately,
share resource data through `DemoLinks.astro`, and remain inert when hidden.
Section jumps re-align the target to its landing spot when late layout
changes (lazy islands, charts) shift it; user scrolling, other navigation
or a few seconds end the correction.
RSB and CoF have no mascot companion. Keep the demos free of Yo so the
paper content stays the focus; the companion belongs to the homepage only.

## Work and verification

Prefix shell commands with `rtk`; use `rtk proxy` for unsupported commands.
Preserve existing user changes. Follow the Git workflow above for commits
and pushes: development saves go to Gitea; GitHub requires explicit deployment.

- Code changes: `npm run build` (includes `astro check`), `npm run lint`,
  `npm run test:unit`, then `git diff --check`.
- Homepage interaction or shared runtime changes: run the matching Playwright
  spec from `tests/e2e/` (rsb, welcome, home, mascot, demo-nav, cof, icons)
  with `npx playwright test tests/e2e/<file>`, and the full `npm run test:e2e`
  before considering the work done. It builds the site and exercises the
  production preview in `dist/`; `npm run test:e2e:dev` targets the dev server
  for quick iterations. Check desktop, portrait/narrow phone, short landscape
  and zoomed layouts; no horizontal overflow, usable scrolling, focus, hashes,
  Back/Forward, menu dismissal, Fluffy, floating position and reduced motion.
- Changes to discrete Yo transitions: `npx vitest run src/lib/yo-state.test.ts`.
- CoF results changes: `npx vitest run src/lib/cof-results.test.ts` and the
  CoF e2e spec (`npx playwright test tests/e2e/cof.spec.ts`).
- Audio changes: the RSB spec (`npx playwright test tests/e2e/rsb.spec.ts`)
  covers lazy hydration, on-demand methods, Worker waveforms, static
  spectrograms, playback and download URLs.
- Documentation only: consistency review and `git diff --check` suffice.

Use CodeGraph for structural discovery when available; exact text searches
use `rg`. Treat indexed context as navigation, with source/build/runtime
checks establishing actual behavior. If no index is available, inspect
known files; ask before creating a persistent index. Do not block ordinary
work on optional indexing or delegate merely to locate files.
