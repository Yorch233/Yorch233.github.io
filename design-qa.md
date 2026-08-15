> Superseded: the homepage was rebuilt on `main` from the reference static
> site in `/Users/yo/Workspace/paper/site/` (academic indigo theme) per the
> user's goal; visual comparison was explicitly waived by the user.
> The checks below describe the previous glassmorphism design.

# Homepage Design QA

- Source visual truth: `/var/folders/x5/2gczzs351wvgcbsx_0kqjs8m0000gn/T/codex-clipboard-fcdd96d0-10ee-43e5-b9a2-460a7c615ce9.png`
- Implementation route: `http://localhost:4321/`
- Intended viewport: `1536 × 1024`
- State: desktop homepage, Home navigation item active
- Implementation screenshot: unavailable

## Full-view comparison evidence

Blocked. The reference image was opened and inspected, but the current Codex
session does not expose the in-app browser control interface required to capture
the rendered implementation at the matching viewport.

## Focused region comparison evidence

Blocked for the same reason. The intended focused regions are:

1. Profile header, avatar crop, identity typography, and quick-link icons.
2. Research-interest icon row and separators.
3. Publication timeline, resource buttons, and right sidebar boundary.
4. Education timeline, contact list, and bottom navigation.

## Static implementation checks

- The source reference is a 1536 × 1024 desktop layout.
- The implementation preserves the project-wide 1200px minimum width.
- The homepage HTML contains the profile, research interests, featured RSB
  publication, education, contact, and three-item navigation regions.
- The real project avatar is used rather than a generated substitute.
- Phosphor and Simple Icons are bundled locally through Astro Icon.
- `npm run build` completed with 0 errors, 0 warnings, and 0 hints.

## Findings

- [P1] Browser-rendered visual evidence is missing.
  - Location: full homepage.
  - Evidence: source image is available, but no implementation screenshot could
    be captured in the required browser surface.
  - Impact: typography, vertical fit, image crop, spacing, and alignment cannot
    be judged reliably from source code alone.
  - Fix: capture `http://localhost:4321/` at 1536 × 1024 in the in-app browser,
    combine it with the source reference, and complete the comparison loop.

## Required fidelity surfaces

- Fonts and typography: statically implemented; visual comparison blocked.
- Spacing and layout rhythm: statically implemented; visual comparison blocked.
- Colors and visual tokens: statically implemented; visual comparison blocked.
- Image quality and asset fidelity: real 331 × 332 profile image used; rendered
  crop and sharpness comparison blocked.
- Copy and content: verified against repository data; uncertain education dates,
  LinkedIn, Google Scholar, and sample publications were intentionally omitted.

## Primary interactions

- Static link targets were generated for email, GitHub, Hugging Face,
  publications, research anchor, RSB code, and RSB demo.
- Browser click testing and console-error inspection are blocked.

## Comparison history

- Initial pass: blocked before the first rendered comparison because no
  browser-rendered implementation screenshot is available.

## Implementation checklist

1. Capture the homepage at 1536 × 1024.
2. Compare the combined source and implementation image.
3. Fix all P0/P1/P2 differences.
4. Recapture and repeat until no actionable P0/P1/P2 findings remain.

final result: blocked
