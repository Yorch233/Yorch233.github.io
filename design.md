# Personal homepage design

## Intent

A research homepage with a small, living cloud companion named Yo, introduced
as Qing's Bot. Visitors should
understand who Qing is, what he studies, and where to find his papers within
one glance. Yo introduces the person; the person and work own the hierarchy.
Keep the existing portrait, Blue and Fluffy artwork, and academic content.

Design variance 5, motion intensity 6, visual density 3. The homepage is
intentionally light: ice-white canvas, blue actions and a native system font
stack for headings and body text: `-apple-system, "system-ui", "SF Pro Text",
"Helvetica Neue", Arial, sans-serif`. RSB and CoF use the same ice-white/blue
reading template and system typography.

## Visual language

Homepage tokens live under `body.home-ref` in `src/styles/home.css`.
Use the established background `#f7faff`, ink `#25364d`, muted `#5e6e84`,
accent `#2f68c4`, and white surfaces. Buttons and navigation are capsules;
reading cards have 28–32px corners; nested surfaces have 12–20px corners.
Spacing follows 4/8/12/16/20/24/32px. Give controls a restrained blue-tinted
underside and press response. The canvas uses the author-selected soft-focus blue-sky direction:
a locally generated cloud photograph, overlapping cloud banks and a calm reading veil.
Two overlapping sky copies crossfade half a cycle apart, while thin cloud banks
and foreground mist travel at different speeds on 26–42 second linear loops.
Clouds flow continuously in one direction and reset only while transparent;
keep enough travel to see the cloud silhouettes changing within a few seconds. Animate transforms and opacity only; do not
regenerate textures or filters per frame. Hidden tabs pause their current pose;
reduced motion keeps static clouds. Keep blue intervals and soft cloud shadows
visible behind floating glass headers, with a pale low-contrast center for prose.
Use opacity and a translucent reading veil, without spatial blur, so cloud contours and shadow pockets
remain visible; keep foreground mist thin rather than washing the sky white.
On phones use a wider cloud crop, softer detail and a slightly stronger reading veil.
Dark mode uses a separate dusk-cloud image: heavy charcoal/navy cloud banks
and restrained amber afterglow, softened over navy. Keep the center dark for
white prose, while cloud silhouettes and warm gaps remain visible. Backgrounds are fixed, decorative and inert;
keep every section naturally scrollable and body buttons in translucent tinted glass. The asset and
imagegen prompt are recorded in `design/home-clouds-v1/`. Glass
capsules use the optical treatment described below. Avoid decorative badges
and repeated heavy shadows.

## Icon system

The homepage header, RSB demo and CoF demo share one native SVG icon system.
Icons use a 24px viewBox and a compact rounded geometric silhouette. They are
code-native artwork rather than raster images, emoji or external icon fonts, so
the same geometry stays crisp at every control size and remains available to
all routes.

Icons have a quiet line state and an active filled state; standard brand
silhouettes retain their filled geometry in both states. The quiet state uses
the muted gray token. Selected controls switch to a two-tone fill: the primary plane uses `--ui-icon-active`
(`#3189f5` in light mode) and the secondary plane uses
`--ui-icon-secondary` (`#bfdfff`). Dark mode keeps the same relationship with
the dark-mode icon tokens. Use the secondary plane for a meaningful surface,
fold, highlight or data layer rather than as a decorative gradient. Keep
outlines and joins rounded, with a visual stroke around 1.7px when an outline
is needed.

The icon state follows the control state. Links with `aria-current`, buttons
with `aria-pressed="true"` or `aria-expanded="true"`, copied feedback and
explicitly active icons show the filled treatment. Focus-visible and hover may
preview the active color, while inactive controls remain restrained gray. Do
not change the silhouette between states, and do not use color alone to convey
meaning when a text label or control state is available.

Resource icons use the same system: PDF is a folded document, arXiv is an
academic document with an abstract crossed mark, GitHub and Hugging Face retain their standard Simple Icons brand silhouettes
with pale secondary detail planes, and
ModelScope is an isometric cube. Appearance controls use a sun and crescent
moon. Results controls use a stacked Dataset symbol, a bar Chart, a Curves
line with data nodes and a Sampling budget slider with clear end stops and
a central thumb. The outline track stops at the thumb rather than crossing it. Copy
uses two offset document sheets. These forms should remain recognizable at
17–20px in desktop capsules and 22px in the compact mobile navigation.
GitHub, Hugging Face and ORCID keep a 2px optical inset on the 24px grid.
Dense internal details, such as the PDF mark, use a lighter stroke so their
negative spaces stay open at 16px.

Keep icon labels outside the SVG where possible. Use the shared `UiIcon`
component and catalog so new artwork is globally available to Astro and
Preact consumers. The source artwork lives in `src/lib/ui-icon-artwork.js`,
the catalog in `src/lib/ui-icon-catalog.js`, and state styling in
`src/styles/ui-icons.css`.

The shared resource IDs are `pdf`, `arxiv`, `github`, `huggingface` and
`modelscope`. Results use `dataset`, `bar-chart`, `line-chart` and
`sampling-budget`; dataset choices use `denoising` for WSJ0+WHAM and
`dereverberation` for WSJ0+REVERB. Appearance uses `sun` and `moon`. General controls reuse
`copy`, `arrow-up`, `arrow-down`, `arrow-left`, `menu`, `home`, `refresh`
and `loading`. Loading uses an open outline arc when quiet and a static
two-plane ring when active, available to actual pending operations; the page splash keeps its existing linear indicator. All new icons
include paired SVG downloads in `/icons/` and work in Astro and Preact.

Research uses the concept-specific `speech-enhancement`, `diffusion-models`
and `masked-diffusion` icons: a clear wave with receding noise, particles
merging into a coherent form, and a tile grid with its returning tile. Their
blue, violet and warm orange two-tone planes follow the research colors.
Generic `wave`, `cube` and `layers` remain available as utility icons.

## Greeting and reading

On a first desktop visit to the welcome page, a dismissible native dialog introduces
Yo using the same animated Fluffy artwork. He is the focus of this brief hello;
the small floating instance stays hidden and quiet until it closes. The dialog
lives in the browser's top layer, so it opens only after the white splash has
faded (the `page:ready` handoff) and never covers the page loader. The greeting
expression settles after 1.8 seconds; petting gives a bounded happy response.
The homepage title is “Qing Yao - Generative Speech Enhancement”. Keep the greeting brief:
“Hi, I’m Yo.”, “I am Qing's Bot. This is Qing's academic home. His research turns noisy speech into clear, natural sound. News, publications and awards are all here.”
and Explore / Skip;
show the short petting response only after interaction. The dialog flies in
from above the viewport while growing from 72% to full size over 520ms.
Explore, Skip, the close control, Escape and backdrop all reverse that same
animation, including when dismissed mid-entrance. Keep the modal and scroll
lock active until it leaves, then restore focus. Reduced motion dismisses
immediately; a hidden tab finishes the motion. Remember dismissal locally.

The homepage, RSB and CoF share the same footer component. Pair its copyright with
“Yo has the final say.” and a small decorative gray Yo icon before his name.
Center the two footer notes as a quiet group with 65% opacity; the icon is
one em square, matching the text size. Let the notes wrap on narrow screens.
Direct links to reading sections bypass the welcome dialog. Preserve focus
containment, restore focus after dismissal, and fit short and narrow screens
with a scrollable dialog interior when needed. The homepage itself retains
normal document scrolling.

The header places a personal identity capsule on the left and three separate
capsules on the right: five navigation entries in one, CV in its own capsule,
and the theme switch in another. The entire CV and theme capsules are clickable.
Keep visible gaps between them and leave the center clear. About Me
leads the navigation, followed by News, Publications, Awards and Contact.
About Me is the welcome page; its legacy hash returns to that page rather
than opening a duplicate reading card. At widths up to 960px, the five sections
stay visible in a bottom glass navigation capsule, with 22px icons above compact
11px labels (10px at 360px and below). Reserve safe-area and document
space below content. The homepage Yo companion is hidden and inert, with its
motion stopped; fresh visits skip the automatic welcome dialog on these screens.
Skipping it does not consume the desktop introduction. Each destination retains a
60px touch target. Identity, CV and theme controls stay in the top header.
CV leads to contact with an honest availability message until a file exists.

The greeting pairs Qing’s portrait, name, affiliation and first-person
complete About Me content: full biography, location, advisor and all research
interests, using the shared AboutCard source. The welcome page is a reading
surface; it does not require an About Me button to reveal that content.
The four further-reading buttons sit below the complete introduction: Publications
is a compact blue capsule in the same action group; News, Awards and Contact use
quieter capsules that wrap naturally on phones. Yo is a small, low-contrast
companion floating at the bottom-right of the desktop viewport. Show narration only on
hover, focus or explicit feedback. Meaningful content and controls across all five
sections carry contextual Yo hints, including header links, research interests,
publication resources, news, awards and contact. Hover hints take priority over
section and idle narration; bounded direct-action feedback takes priority over hints.
Moving away clears the hover hint. Keyboard focus offers the same descriptions
without adding tab stops to static content. Hover narration is not a live announcement.
Reserve end-of-page space so actions and the
footer remain reachable. Reduce the avatar size on phones and in reading mode. Closing a section restores
focus to its welcome-page button. Show author content first in DOM and
reading order; the floating companion comes after the content in the DOM.

Further-reading links exclude About Me, since Home and the header already
return to the introduction. A topic opens a centered reading card with a heading and Home control.
Publications, News, Awards and Contact share the same 960px maximum width,
near-white with a faint cool-blue tint (#f7faff) surface that separates white glass buttons, rounded frame, shadow, blue Qing Yao eyebrow, page-title size,
inset header divider and Home button. Shared styles live in `home-cards.css`:
36px horizontal insets on desktop, 20px on phones and 16px on narrow phones.
On phones the eyebrow and Home control share a row above the full-width title.
Content entries use fine separators and 32px spacing. News uses the shared
`Timeline` component: a visible heading, dates in a left column, blue nodes
and a continuous vertical line, with the latest update emphasized. Phones
place each date above its text beside the rail. Keep the supplied dates and
newest-first order, without inventing months for year-only entries. News and Awards use
the same soft-blue, 44px expansion controls. Each section keeps its own
content structure and natural height.
Contact keeps one large rounded reading card, with an open two-column interior:
the invitation, visible email, blue glass Email Qing action and location lead on the left;
GitHub, Hugging Face and ORCID follow as full-width rows on the right, with
gray/blue brand icons, concise destination descriptions and fine separators.
A vertical rule divides the groups on desktop. On phones the groups stack,
with a horizontal separator and natural document scrolling. Keep the existing
header capsules and avoid individual cards around profile links. The generated
references and implementation notes live in `design/contact-v1/`.
All content uses normal document scrolling; neither the welcome area nor
the card body has an independent vertical scroll pane or a viewport height
limit. The header capsules stay reachable while scrolling. Yo becomes a
quiet, smaller companion in the bottom-right corner. No simulated loading state is
needed for bundled content. Preserve `#about`, `#news`, `#papers`, `#awards`,
`#contact`, and normalize `#publications` to `#papers`. The skip link targets
`#main-content`, not a content topic. History navigation restores meaningful
focus. Ordinary anchor behavior remains available for modified clicks.

Mobile layouts must preserve readable text, 44px main controls and visible
focus rings. Reading navigation can scroll horizontally. Short landscape
and heavy zoom use the same natural document flow.
Account for safe-area insets. Do not reduce controls to tiny icons to force
content into a viewport.

## Content

The homepage has a 44px theme switch in the right header capsule, including
on phones. Start in light mode until the visitor selects a
mode; persist the validated `home-theme.v1` choice before first paint.
Dark mode uses navy surfaces, light text and the same blue toy accents.
Reveal the new palette in an expanding circle centered on the switch,
covering the farthest viewport corner. Reduced motion switches immediately;
unsupported browsers also apply the palette immediately. Preserve the open
section, URL, scroll and mascot form. Theme styling stays on the homepage.

`profile.json` and `publications.js` own facts and links. Card prose uses
Qing’s first-person voice; Yo’s short narration uses third person. Do not
invent response-time promises or publication claims. The first Publications
resource button is labeled “Demo” for both RSB and CoF, preserving their URLs. News links also use “Demo”; both page kickers read “Paper Demo”. CoF is not labeled a paper overview.
News must describe those destinations
accurately. Show citation success and failure accessibly and independently
per paper. Awards and news retain their disclosure controls. Award project
details start hidden; More detail reveals the topic and key technologies,
and Less detail hides them again. Each award expands independently and its
button exposes the controlled panel and expanded state to assistive technology.
News also includes the award milestones in its timeline, reusing award records
through their IDs and linking to Awards for project details. Retain the supplied
year precision when an award has no known month.

## Yo behavior

Both forms use one SVG animation loop, with the same black bean eyes and
shared body motion and round black glasses fitted to each form's eye centers.
Blue keeps its bow; its saturated cartoon-blue material uses broad dome gradients
and soft diffuse silhouette lighting for toy-like volume. In idle, the body
flows gently while only its little right tail briefly drifts away, then melts
back in. Keep the main cloud joined and the face stable. Attention gathers the
tail; reading and reduced motion restore the resting outline. Keep the tail
motion bounded on narrow screens. The live
cloud and static branding share `yo-material.js`, keeping their shading equal; Fluffy uses the existing
white body bitmap with live eyes. Breathing, drift, irregular blinking and
small curious glances create life. Hands emerge only for gestures, then tuck
away. Gaze eases toward a fine pointer; touch scrolling does not steer it.

The shared controller now uses the approved 18-state vocabulary in
`design/yo-states-v1/`: idle, thinking, waiting, sleeping, studying, boring,
happy, hungry, eat-burger, drink-coffee, writing-paper, coding, teaching,
speaking, embarrassed, daydreaming, appearing and disappearing. `yo-state.js`
owns discrete priorities and legal chains; `yo-pose.js` interpolates five action
beats, and YoCloud animates the same live Fluffy body rather than playing the
concept PNG sheets. Book, paper/pen, laptop, burger, cup and board are mutually
exclusive. Props retract before the next rig enters; glasses and bow follow
the whole body through appearance and disappearance.

Priority: quiet environment / explicit dismissal, direct feedback, requested
teaching, real pending work, contextual speech, random life, idle. Reading uses
static studying. Petting can change an expression
without restarting ambient motion. Speaking only accompanies a visible
message and cannot override success/failure feedback. Actual clipboard events
produce happy/embarrassed; an actual pending operation is never a fake load.

After 12s without user activity, browsing may select one complete short chain:
gentle 60%, academic 25%, emotion 10%, snack 5%. Academic chains read, think,
then write a paper or code. Snack chains are hungry → burger → happy, or coffee.
Leave 18–32s of idle between chains, filter cooldowns before drawing, disallow
consecutive groups, and limit automatic chain starts to two per minute. Genuine
45s inactivity ends automatic play and selects waiting; 90s selects sleeping.
Activity cancels an automatic chain and wakes Yo. Animations never refresh the
user-activity clock. Interrupted chains never resume their remaining props.

The small “Yo’s little day” menu offers deliberate life actions, Escape/outside
dismissal and an offscreen-rest action with a reachable “Bring Yo back” control.
It keeps 44px targets on phones. There is no Pause motion button. Reduced motion
uses representative static poses, stops automatic chains and shows text at once.
Hidden tabs and offscreen views cancel stale chains and stop frames; returning
resets inactivity without replaying missed actions. No live announcements for
autonomous chatter or hover previews. Explicit hiding remains in effect across
navigation and tab restoration.

Yo's dialogue enters from 8px below with a 180ms fade, then reveals one
grapheme at a time (up to 24ms per character, capped at 2.4s for long copy).
The welcome, homepage hints and paper guides share this treatment. Reserve
the full text's height so typing does not move the bubble or its controls.
Replacing or hiding a message cancels its typing; hidden tabs stop timers.
Reduced motion displays the complete message immediately. Keep the complete
accessible copy available from the start and exclude visual typing from
announcements, so screen readers never receive a stream of partial words.

Fluffy with round glasses and a small satin-blue bow tie is the fixed public mascot.
The bow sits below the glasses and shares geometry and colors across live
and static artwork. There is no appearance
switch, and legacy `yo-form.v1` preferences are ignored. `yo-logo.js` owns
native static artwork for demo watermarks. The loader shows no
mascot artwork: the white splash centers a small gray “Loading” word above a
thin rounded gray track carrying the moving blue segment below it — no
capsule, no percentage. Keep the loader visible for at least 777ms after its initial
paint opportunity, then wait for fonts to settle (with a 1500ms deadline).
During the second phase, fade the white splash away while page content enters
in horizontal rows from top to bottom, each row rising slightly as it fades in.
On the RSB and CoF demos, each major block (hero and paper section) instead
fades in once when it first enters the viewport, through an
IntersectionObserver in `PaperLayout` that pre-reveals slightly before the
block arrives; the splash row reveal skips those blocks. Reduced motion and
non-JS visitors see everything immediately.
Reduced motion retains the same minimum, a static indicator and blue segment,
and immediate page entrances. Local section switches keep their immediate content
behavior. The retired loader-logo generation prompts and assets remain in
`design/loader-logo-v2/` for reference; no loader asset is generated at build
time.
`site-logo.js` owns
the transparent cutout for page branding and browser favicons: a close-up
Fluffy in a gentle right-facing side view, blue-white shading and a blue
upper-left `Yo` badge, complete cloud edges and no tile background or corner
clipping. The favicon embeds the alpha PNG in a self-contained SVG, without a
background rectangle or corner mask. The touch icon keeps the opaque app tile.
Keep Qing's personal portrait separate. Both logo treatments show Yo from the first paint.
Blue artwork remains an internal asset, not a user-selectable form.

## Interface icons

Use the shared `UiIcon.astro` / `UiIcon.jsx` SVG family rather than mixed
sprites, image icons or Unicode action symbols. Original imagegen-directed
drawings use a native 24px grid, restrained rounding and consistent optical padding; keep 16 / 20 / 24px display
sizes, with semantic labels on the enclosing controls. Navigation and action
icons use blue #3189f5 with pale blue #bfdfff, inactive icons use gray #8591a3 (dark mode adjusts both).
Research interests retain blue, violet and warm orange accents. Their
transparent PNG artwork follows Yo's rounded, softly shaded toy material:
clear waveform with receding noise (speech enhancement), particles merging
into a coherent form (diffusion generation), and an incomplete tile grid with its returning
tile (masked diffusion). These are visual metaphors, not scientific diagrams.
Render at 42px on desktop, using 128px PNG derivatives.
Keep full-size imagegen masters in `public/research-icons/v1/` and prompts
with provenance in `design/research-icons-v1/`.
Research interests display Speech Enhancement, Diffusion Generative Modeling
and Masked Diffusion Models. Retain the labels and contextual Yo hints.
Below 960px, show three text-only tags in one row and hide their artwork.
Use light blue, violet and warm neutral tints, subtle borders, 12px corners
and centered 13px labels. The compact phone labels are Speech Enhancement,
Generative Diffusion and Masked Diffusion, each arranged in two lines.
Retain the complete research names for assistive technology and desktop.

Offer two states: active two-tone fill and inactive gray outline. Use meaningful
body/detail planes for the second color; no decorative backplates or cloud crowns.
The Yo mascot glyph retains Fluffy's round glasses and bow tie; other original
interface symbols have no faces. Cloud silhouettes belong only to Yo, Cloud and the download tray.
Selection follows real `aria-current`, `aria-pressed` or
`aria-expanded` state; hover/focus provides a colored line without pretending
the control is selected. Primary action icons inherit the label color for
contrast. Keep authentic brand and publisher marks recognizable.
The `/icons/` gallery shows paired variants and downloadable SVG assets.
Edit `ui-icon-artwork.js` and `ui-icon-catalog.js`; `npm run icons:build` regenerates the registry,
manifest and exports before production builds.

## Validation

Review desktop, 390px/375px/320px phones, short landscape and enlarged text.
Check instant navigation, direct hashes, back/forward, same-topic selection,
focus restoration, menu dismissal, citation feedback, Fluffy, attention,
petting, sleep/wake, hidden-tab resume, reduced motion and quiet reading. Build
and runtime checks must pass. Keep screenshots out of the production bundle.

## Glass surfaces

Homepage floating header capsules at every width use transparent glass with near-clear fill and no backdrop blur,
rounded meniscus refraction, soft highlights and shadows.
All four header capsules share the same clear glass shell, moving soft highlights and
size-aware refraction. CV has no separate solid backing inside the utility capsule.
Pointer presses and focus on nested controls activate their containing capsule;
labels stay sharp and keyboard focus remains visible. Keep a single 1px rounded
meniscus outline, with white highlights and subtle neutral shade varying around
the edge. Mask its center so the underlying color refraction stays visible.
Do not stack uniform gray borders or duplicate outline layers. Preserve keyboard
focus outlines. The shared rim also applies to demo capsules and the optical
playground; dark mode reduces highlight intensity. Size-aware SVG
lenses follow Vaso’s quartic convex surface and Snell refraction profile: IOR 1.5,
bezel ratio .6, refraction factor .35, depth 1 and specular .5. Clear optical lenses apply displacement only, without a blur stage.
Strength scales with capsule height; ordinary capsule interaction changes depth by at most 20%.
The desktop homepage header uses the original segmented glass selection,
12px taller than the navigation shell and centered with a 6px overhang above
and below. Both the shell and selected pill remain clear; the selected pill uses
depth 1.4, the shared optical rim and size-aware refraction. It extends
8px beyond the active link on each side. Restore the original spring (tension
300, friction 17), with travel-based stretch capped at 36px and a brief optical
depth change. Resize stretches the cached lens during travel and regenerates
it after settling. Reduced motion snaps immediately; hidden pages stop the spring.
Below 961px use native frosted glass for demo floating capsules:
18px backdrop blur, a quiet translucent fill, a simple border and soft shadow.
Remove moving highlights, deformation and SVG refraction. Keep a sharp upper glint and a soft lower reflection, with a slightly clearer 58% white fill.
Release lens maps and interaction listeners when entering this layout, and
restore the desktop lenses when returning to a wider viewport. Respect dark
mode, reduced transparency and browsers without backdrop-filter support.
Homepage Header capsules keep their optical rim and zero-blur lenses on compact screens, with surface deformation disabled. Keep the bottom clear navigation and solid white selection, 12px
shorter than the shell and centered with 6px clearance above and below. Hide
the inner optical lens on phones. Use deep-blue text and active icons on white
in both themes, 22px icons above 11px labels (10px on the narrowest phones), and a 76px shell around 60px
touch targets. The mobile selection slides briefly without stretch or overshoot.
The navigation shell and selected pill use fully rounded capsule ends.
Keep all five labels complete; give Publications a little more width. Reserve
document and safe-area space below content. Hide the homepage companion and
his action controls on phones, and stop hidden motion. Current section, hashes, history
and card controls drive the same indicator in both layouts.
Use one achromatic pass
on the backdrop. Labels and focus outlines stay sharp. Do not add RGB
dispersion or rainbow rims. Body buttons, including welcome-page section links, paper resources and audio controls, use the middle glass tier: translucent tint gradients without backdrop blur, a fine translucent upper highlight, gentle convex shading and a soft tinted lower rim, giving a polished gemstone thickness without opaque white streaks. The lower edge is more transparent. Primary actions keep saturated blue and white labels for contrast. Colored buttons cast a small, dispersed tinted shadow. Use `data-glass-color="white|blue|green"` (green is #31D73F), or set `--glass-tint` for other colors; `--glass-opacity` and `--glass-lower-opacity` tune the fill. Compact screens use 18px frosted blur for these controls too. Highlights stay at the rim of floating capsules rather than
washing the whole pane white. The welcome page uses a 1120px composition: a 300px portrait beside the
complete biography, then full-width interest capsules and four action buttons.
Phones stack the portrait and biography, retain one row of three text-only
interest tags, and wrap the action buttons.
A small companion floats at the bottom-right on desktop. Secondary reading cards
retain their narrower column.

Dark mode uses a light navy tint without an opaque backing. Chromium uses the SVG backdrop lens;
other engines keep the homepage Header transparent with a static meniscus rim, while desktop demo capsules use translucent fill without blur. Browsers without backdrop filters and
reduced-transparency users receive opaque surfaces. Lens maps regenerate
on settled size changes, use a bounded cache, and release observers when
leaving the page. Pointer movement moves the rim highlight; hover, focus and press
briefly change refraction strength and softly deform only the glass surface,
then settle with a damped spring. Labels and hit areas remain stable. No perpetual
filter animation or per-frame canvas generation. Reduced motion and hidden tabs
stop the response immediately. Academic reading and plot surfaces remain solid.

RSB and CoF share `PaperLayout`, `PaperHero`, `PaperSection` and `PaperCitation`,
with the base reading styles in `src/styles/paper.css`. Publication titles,
authors and BibTeX come from `publications.js`; author contacts and affiliations
come from `paper-authors.js`. Preserve each page's section anchors and resource
observers. CoF follows RSB's open layout, with no enclosing article card. Its
Results remain reachable through its chapter navigation, followed by a copyable arXiv citation.

RSB and CoF show “Quick links” and its resources together in one centered, quiet line. Each resource is a full-round capsule button with a visible translucent white fill, muted control labels and a soft shadow. Keep the row on one line with local horizontal scrolling when it exceeds a narrow screen, preserving complete labels and 44px targets. Resource SVGs use
the same automatic state and palette as homepage navigation: gray outlines at
rest, blue on hover or keyboard focus, and two-tone blue fills for active controls.
Hero icons are 18px and decorative beside visible labels. Floating resources use
the same artwork at their compact size. Keep original destinations and omit the
extra Listen to the samples / Explore results hero actions. Earlier generated
PNG explorations remain in `src/assets/rsb-quick-links/v1/` as design references.

Both pages follow the homepage's ice-white/blue tokens and system typography,
32px reading cards (28px on phones), translucent resource buttons and
liquid-glass floating header capsules on desktop and frosted capsules on phones.
Their abstract, citation, sample, figure and results card surfaces use the same
near-white blue tint (`#f7faff`) as homepage reading cards; scientific plot areas
and controls retain their distinct surfaces for contrast.
Use the six web type levels and the shared compact phone scale in `AGENTS.md`: body copy
is 15px, with 13px secondary text and controls on phones. Keep the
paper title, venue and authors legible, with resources grouped under Quick links.
RSB's abstract card spans the full section width like its method
and citation cards, with prose filling the padded content width and its visible narration
control. Figure captions sit below the figures, never over scientific content;
carousel and full-screen controls remain accessible. Both demos share the same
sample card (`AudioDemoIsland`): each dataset group lists its own samples and
methods, with method colors and hover explanations supplied by the page's data.
CoF's audio section adds a sampling-budget switch inside each sample card
header (4 NFE by default); the toggles stay in sync and keep the
pretrained and CoF post-trained variants side by side; switching the budget
keeps each group's sample position and remounts the cards onto the budget's
assets. All three segmented controls (sampling budget, Visualization On/Off,
View) share one flat capsule style: a short tinted track whose solid white
thumb slides between the options, the selected label tinted blue on top. Audio uses one sample card
per displayed sample and a quiet nested plot panel. Method controls wrap, keep
their original scientific colors, and expose their selected state: no leading
dots; selecting a chip dyes the whole pill with the method's own color via a
circle sweeping in from the left edge, and the fill stays across selected,
playing and finished states, the label turning white and the badge inverting
to white with a method-colored play or pause glyph (the CoF variants
therefore stay branch orange in every highlighted state). Playback and
pause glyphs are white on the method's own colored badge (the main playback
button uses the accent blue); sample expansion uses blue glass with
white labels. The Yo action panel opens by right-clicking the mascot or by the
focused keyboard context-menu command, without a separate ellipsis trigger. Phones stack
the two spectrograms with their method labels and retain the same frequency/time
axes. Load failures surface as a single centered message over the active
canvas view. Narrow screens rework the sample card: tablets (<=960px) lay the
method chips into an aligned responsive grid with right-aligned play badges;
phones (<=720px) stack the card header, give the sampling-budget switch its
own full-width row, keep the chip grid (two columns, one at ~320px), stack the
View label above its track without in-segment icons, center the download link
under it, and drop hover tooltips. Playback, volume, downloads, method selection, plot switching and sample
pagination retain their existing behavior and lazy resource policy.

On RSB and CoF, the left floating capsule shows the complete paper title and
publication information from `publications.js`, wrapping without truncation.
The right capsule contains only full-text links: Publication when available,
plus a direct arXiv PDF. Repository and model links stay in the original resource
row. Each capsule appears after its own source passes above the unobstructed
reading area, accounting for the floating header's height. On phones,
stack the title above the right-aligned reading buttons and keep their labels
visible with 44px touch targets.

Demo pages share a quiet left-side section ruler with one tick per actual section
link and no decorative intermediate ticks: pale short ticks with a darker
current-section mark. Hover and keyboard focus extend a tick in black and reveal
its section name. Native section links preserve hash navigation and history;
anchor offsets account for the floating paper capsules. On narrow or short
screens, collapse the ruler into a bottom-left section button with a dismissible
list, usable touch targets and Escape/outside-click dismissal. Keep tracking
lightweight and responsive to content reflow, including CoF chart switches.
The floating paper identity and reading capsules use the shared achromatic
liquid-glass lens, matched to their actual size and corner radius. Keep a clear
surface, soft highlights and shadows; use translucent color layers for legibility
over academic prose, without backdrop blur. Refraction applies only to the backdrop, with readable text
and one subtle gradient rim without duplicate contours or color dispersion. Preserve explicitly frosted compact glass and reduced
transparency fallbacks.

The homepage keeps its Fluffy companion with round glasses and a blue bow tie
in the bottom-right corner; RSB and CoF render no mascot companion. Section
destinations live in `demo-guide.js` and drive the section ruler. The companion
defaults to the edge-peeking pose from `design/rsb-yo-peek-v1/`: a clipped
native SVG head with round glasses leaning in from the right edge, showing only
one eye, one small gripping hand and a blue bow tie, plus a small “Hi” bubble
within the same button. Props stay hidden while he peeks. Click, Enter or Space
brings him fully into view with a short sideways entrance, and closing, Escape
or clicking away returns him to the edge. Hover and focus keep him quiet until
invited. The existing first-visit welcome dialog remains separate, and phones
continue to hide the homepage companion. Once invited, interactive controls
offer transient hover narration and keyboard-focus hints, while deliberate
requests receive polite feedback. Use a readable 16px speech bubble with a 44px
close button, Escape/outside-click dismissal and focus return. Reading content
settles him into static studying. Respect reduced motion and hidden tabs.
Keep all Yo speech conversational, including homepage hints. Use natural short
sentences with no semicolon breaks. Preserve the scientific meaning of any
summary without reading publication metadata or abstracts verbatim.

CoF results pair a five-metric vertical bar overview (Chart view) with a
single-metric Metric vs NFE curve explorer (Curves view) inside one white
rounded workspace. One control row follows the Results heading: Dataset
pills, the View toggle, and the Chart-only sampling budget trigger; the
trigger appears in Chart view and hides in Curves, while the Curves key
legend still names the selected NFE. Controls wrap as a group on narrow
screens. The sampling budget opens a popover
with the shared `DiscreteSlider`: six equally spaced stops (1, 2, 4, 8, 16,
24) on a slim ice-blue rail with a floating white readout thumb. The native
range input announces the real budget and supports pointer, touch and
keyboard input; Chart axes use actual NFE spacing. Keep the slider component
independent of CoF. The workspace opens in Chart view at 4 NFE. Keyword tags
use a flat translucent blue fill and blue border without lighting or
reflections.
In Chart view the legend is one row of method chips with `@budget` suffixes at
the selected budget; it lists Unprocessed first, WER's ring-chipped Clean
reference second without a suffix, then the four model variants. Hovering or
keyboard-focusing a legend entry highlights that method's bar across all five
charts and dims the rest; charts that lack the method stay unchanged. Put
values outside above the bars in ink, with the method chip inside
the bar's top edge; bars too short to hold the chip stack it under the value
just above the bar. Bars render a lighter tint of the method theme colour.
Metric hint labels with a dotted-underline affordance sit below each x-axis;
hover or keyboard focus reveals a short accessible explanation. The five
chart-view plots share one size and flow into one to four columns as the view
width allows: four per row on ultra-wide screens once the paper column widens
past 2000px, three per row on wide screens, two on medium screens and one on
phones; a row that does not fill its maximum stays centered.
Keep the results workspace focused on the charts without a numerical table or
source/download footer.
Every method owns a theme colour, shown saturated on its shaped monogram
chip: circle chips for Unprocessed, SGMSE+, StoRM and the WER plot's Clean
reference, a triangle chip for SB-VE and a square chip for OT-CFM. Bars render
a lighter tint of the same theme colour. CoF variants keep the base shape and
switch the letters to "Co", and take the branch's shared orange — `#f97316`
marks on `#fb9d5c` bars, matching `statusColors.cof`/`barTints.cof` from the
2026-09-17 design. Each bar reveals
its method, budget and value on hover, keyboard focus or tap.
The top legend explains the WER plot's ring-marked clean reference bar, so
every chart group shares one structure and the five x-axes align horizontally.
Order bars: Unprocessed, SGMSE+, StoRM, SB-VE, CoF (SB-VE),
OT-CFM and CoF (OT-CFM); the legend follows that order with Clean reference
second.
Positive-only bar charts use metric-specific y-ranges with a visible axis break
and exact values above the bars; metrics whose values cross zero retain the zero
baseline, including negative SI-SDR values. The WER plot renders the clean
reference as a dashed-outline reference bar so it reads as a level, not a
competing method.
Show either the bar overview or NFE curves, selected by one sliding switch
between the two mode labels; default to bars. Its checked state means NFE curves.
Keep dataset, metric and NFE selections when switching.
In Curves view the metric selector capsules live in the controls below the
budget row. Curve y-axes zoom to the model curves so the CoF
and pretrained differences stay readable; references that fall outside the
zoomed range clamp to the plot edge with a direction arrow in their label, and
the Unprocessed reference carries no budget suffix. Curves are independent
of the sampling budget: no selection line and no permanent point labels;
every point stays hover and keyboard inspectable through tooltips and its
accessible label. The Curves panel opens with the same chip legend as Chart
view: references first (Unprocessed, SGMSE+@100, StoRM@100+1 with muted
suffixes), then the four variants. Hovering or keyboard-focusing a legend
entry, or any curve point, focuses that curve or reference line and dims the
rest. Baselines
keep their published budgets (SGMSE+ 100; StoRM 100+1); their
exact values stay reachable through the reference line tooltips and the Chart
view.
The sampling budget opens at 4 NFE.
Only the selected view is mounted. Dataset and budget controls update the
charts by fading them out fully, swapping the content, and fading back in
while the card height eases to the new content height (instant under reduced
motion); on view switches the Chart-only budget row fades out before the
Curves metric row fades in, and the metric capsules update the selected
metric through the same fade.
Preserve raw evaluation values in the data; display SI-SDR with one decimal and
every other metric (including WER percentages) with two. Keep method colors
consistent in both views. Pretrained curves are solid in each method's own
tint (blue for SB-VE, purple for OT-CFM); CoF curves are orange dashed. Every
data point renders as its method's legend chip — the shaped monogram badge —
so the chart maps to the legend without a separate marker vocabulary.
NFE uses real linear spacing.
The CSV export endpoint remains available independently. Charts resize their coordinate
systems for readable phone labels and stack on small screens.

### Yo vector rendering and occlusion

Live Yo and the welcome Yo share a pure SVG surface, rebuilt from
the approved reference using a traced silhouette and 32 smoothly interpolated
color bands. No raster images, data-URI textures or elliptical dome approximation
are used in the live character or demo watermark. The original surface
bounds (23.56, 47, 152.89, 126), glasses and bow stay unchanged. The authoring
script and fidelity evidence live in `design/yo-vector-v2/`; regeneration is
optional and separate from production builds. Static SVG paint is cached; only
the parent pose, face and props update during animation.
The transparent page/browser brand cutout remains separate. Paint body first,
then face and wardrobe, then foreground props with gripping hands: raised coffee
and food must cover the bow. Retract outgoing props before introducing another.
A single requestAnimationFrame loop updates SVG transforms at the display cadence;
no sprite-frame swapping, per-frame turbulence/displacement or component renders.
Cache prop part references, hide inactive rigs, and stop motion while quiet,
offscreen, hidden or under reduced-motion preferences.

### Publication citation cards

Each Citations button opens a native modal dialog originating at that button,
with a Y-axis turn and translation into the center; close and Escape reverse
the flight back. A solid reading surface offers BibTeX, Chicago, APA and GB/T
7714 tabs with one sliding selection pill and format-specific plain-text copy.
Citation data stays tied to the publication metadata; GB/T online entries use
the current access date. Mouse hover near a corner gently presses that corner
away, while touch, central reading and reduced motion stay steady. Native modal
focus containment and focus restoration preserve keyboard access. Narrow screens
wrap citation text and allow scrolling, retaining 44px controls.

Demo return navigation appears after scrolling down, with separate Scroll to top and Return to home optical capsules. Compact screens stack them beside the chapter toggle and hide them while its menu is open or a figure dialog is open. The shared floating header has a feathered translucent reading veil with a mild 4.5% dark tint, without blur, only while a capsule is visible. Reading cards and scientific plots retain their existing solid surfaces.
