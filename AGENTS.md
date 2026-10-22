# Repository guide

## Git workflow

- Write commit subjects and bodies in English. Use Conventional Commit prefixes
  such as `feat:`, `fix:`, `docs:`, `refactor:`, `test:` and `chore:`.
- `gitea` (`https://gitea-yorch233.iepose.cn/yorch233/Yorch233.github.io.git`) is
  the private development repository. Check the actual branch tracking configuration
  before pushing; development saves belong on `gitea`.
- When the user asks to save or submit development code, commit locally and
  push to `gitea`.
- `origin` (`https://github.com/Yorch233/Yorch233.github.io.git`) is the GitHub
  Pages deployment repository; its workflow deploys the site automatically.
- Push to `origin` only when the user explicitly requests deployment. Routine
  development saves must not push to GitHub.

## Collaboration and independent judgment

1. Check for false premises, logical gaps and missing information first.
2. Exercise independent judgment rather than agreeing automatically.
3. Verify sources for data, people and conclusions whenever possible.
4. Correct inaccurate statements directly, with evidence and relevant risks.
5. Point out overlooked variables, costs and cognitive biases.
6. Write this document entirely in English, including headings and comments.

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
- `src/lib/site-logo.js`: Qing’s cartoon page/browser logo and touch icon.

Keep instructions about durable behavior here; keep detailed visual choices
in `design.md`. Check source before documenting current implementation.
Do not turn a previous implementation detail into a permanent requirement.

## Product and design

The personal introduction is the homepage priority: all About Me content is
visible on the welcome page, with Publications still easy to reach. Yo is a small
companion, introduced as Qing's Bot. Content must be immediately reachable
without interacting with him.
Use direct labels and accurate destination descriptions.
Keep additions earned: no gratuitous text, decorative labels or extra elements,
and no eyebrow/kicker lines above headings. Add something only when it carries
real information or an action, following “Less is More” by Jakub.
Write Yo's speech as friendly, conversational English with short natural
sentences. Avoid semicolons and reciting formal publication summaries.
Yo defaults to peeking from the right edge with one visible eye and a small “Hi” greeting on the homepage. Activate him before contextual narration; closing his explanation returns him to the edge. Right-clicking him opens his action menu; the focused mascot also responds to the context-menu key and Shift+F10, and the menu expands from a menu-icon trigger in the control row beneath him (the Bye control sits to its right). Choosing a menu action locks the other actions for a short moment so a fresh state cannot be flipped immediately. Yo stays on the page; there is no dismiss control.
Give meaningful homepage content contextual Yo text on hover after activation, and interactive
controls equivalent hints on keyboard focus. Keep hover narration transient and
out of live announcements; direct-action feedback takes priority.

Use the established ice-white/blue palette and the bundled official MiSans Latin
cut as the default font, followed by the system CJK and system fallback stacks
for headings, prose and controls. Keep soft toy depth, achromatic glass floating
header capsules and rounded reading cards.
Use three glass tiers: clear optical glass for floating header and return capsules, translucent tinted glass for body buttons, and native frosted glass on compact screens. Keep labels and focus outside the filtered layer; support white, blue, green (#31D73F) and custom tints. Each tier has a sharp upper highlight and soft lower reflection, with subtle colored spill.
Use opacity and translucent gradient layers for softening backgrounds, scrims, dialogs and ordinary glass; do not add blur unless frosted glass is explicitly requested. On narrow screens the Homepage header capsules, the bottom navigation bar and its white selection go frosted (light 12px blur); at desktop size the Homepage header capsules retain optical refraction with 1px backdrop blur, while the primary navigation uses 5px blur above 720px. Compact demo capsules and body buttons keep their explicitly frosted tier.
Homepage reading-card secondary actions use transparent outline capsules instead of raised glass. Publication resource pills are borderless with gray labels that turn blue on hover or focus, and their brand marks use the same color. Each paper shows a TLDR line; its abstract stays hidden until an inline Expand/Collapse text button reveals or hides it. Awards detail toggles are borderless text buttons with plus/minus icons; Contact research profiles retain their original glass rows, platform icons and right arrows, without shadows. Preserve filled blue primary actions.
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

Use the bundled official MiSans Latin cut for every text role and keep code in
monospace. Chinese award tooltips use the system CJK fallback. Do not subset or
otherwise modify MiSans; Xiaomi's license prohibits adapting the font or its
components.
With MiSans Latin, headings use native weights 520–560, prose 330–380 and controls 380–450. Body
line-height is 1.65–1.8; headings use 1.15–1.3; metadata and
controls use 1.4–1.6. Keep essential labels at least 13px, except the user-requested compact bottom-navigation labels, and body copy at
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
50×50 controls with icons above compact visible text labels, and
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
switch. Ignore legacy appearance preferences. Use one circular crop of Qing Yao’s
existing cartoon portrait for the homepage brand avatar, all browser favicons
and the touch icon. Keep Yo’s companion and demo artwork separate.
The loader is a plain white splash showing Qing’s cartoon avatar floating gently
above a small gray "Loading" word and a five-bar blue wave; it stays
visible for at least 777ms, with a static avatar and wave under reduced motion. Stop the avatar animation when the loader hides. Demo watermarks use native Fluffy artwork.
The animated character uses pure SVG geometry and paint, without embedded raster
textures. Match the approved Fluffy silhouette and shading; keep static branding
cutouts separate from the animated rig.
`npm run logo:build` regenerates the native Yo SVGs and Qing’s portrait browser
icons (and runs automatically before production builds).
Favicon SVGs must work without external resources.
Do not reintroduce individual wardrobe settings.

Use the approved Yo state definitions in `src/lib/yo-state.js` and the existing native artwork. Keep prop rigs mutually exclusive and cancel entire automatic chains when interrupted. Give reactions explicit triggers and bounded lifetimes. Reading, reduced motion, hidden tabs and offscreen views stop continuous
motion. Returning to browsing resumes it without stale reactions. Mouse activity counts only over the reading card; side whitespace and Yo himself never interrupt his state, while keyboard input always does. Pointer
coordinates belong in refs, not render state. Clean up timers and observers.

The header CV button opens a welcome-style dialog without changing sections.
`profile.json` stores its download URL in `cv`; null means the download button
is disabled with “Temporarily missing.” and a working Close button.

Use truthful copy: unavailable resources need a useful alternative, not a
fake download or dead control. The homepage footer pairs `© {current year} Qing Yao`
with `Yo has the final say.`, using a decorative gray Yo icon before his name.

## Demo boundaries

Homepage work must preserve demo behavior. Audio uses `preload="none"`,
Opus playback and direct WAV downloads. Both demos share the
`AudioDemoIsland` card (groups, methods with colors/tooltips, and a base
path come from `src/data/rsb.js` and `src/data/cof-audio.js`); each island
hydrates with `client:visible`. Above 720px, its default waveform view loads
Measurement and Ground Truth for the displayed samples. Other methods load
on selection. Waveform analysis
uses `waveform.worker.js`; spectrograms are pre-generated AVIF resources
(`scripts/encode-audio.sh <RSB|CoF>` refreshes opus and spectrograms).
Do not add eager processing of all samples or browser-side spectrogram FFT. On phones
(≤720px), use a per-dataset list with one expandable row per audio ID and
method chips that start one shared floating player. Expanding rows does not
load audio; playing loads the selected method, and opening a visualization
loads only its required data. Keep the desktop audio cards above 720px.
The phone player has a progress bar above its controls, expandable waveform
or static spectrogram views, and a bottom-right two-button minimized capsule.
Changing layouts stops the outgoing player; closing a row does not stop audio.
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

Keep the user's dev server running during incremental edits and use hot updates.
Do not stop dev for verification; run production builds alongside dev and use dev-targeted checks or a separate preview port.
Keep Vite's dev and build dependency caches separate so builds cannot invalidate
modules already referenced by an open dev page.
During iterative visual edits, apply changes and hot updates first. Defer test
runs until the user asks for verification or the work is ready to commit; run
the required checks below before committing.

Prefix shell commands with `rtk`; use `rtk proxy` for unsupported commands.
Preserve existing user changes. Before rewriting history, create a backup outside
this repository, inspect all local and remote references, preserve current work,
and protect remote updates with explicit expected commit IDs in force-with-lease.
Keep design-process files, GUI screenshots and editor metadata out of version
control. Follow `.gitignore`; do not force-add excluded local material.
Follow the Git workflow above for commits
and pushes: development saves go to Gitea; GitHub requires explicit deployment.

- Code changes: `npm run build` (includes `astro check`), `npm run lint`,
  `npm run test:unit`, then `git diff --check`.
- Homepage interaction or shared runtime changes: run the matching Playwright
  spec from `tests/e2e/` (rsb, welcome, home, mascot, demo-nav, cof)
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
