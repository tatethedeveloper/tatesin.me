# Design plan (v2: creative-studio redesign)

Supersedes `design-plan-v1.md`. Written before UI code, reviewed once for
genericness; revisions are listed at the end.

## Design read

Reading this as: a developer portfolio, overhaul mode, for hiring managers
and collaborators, with an immersive creative-studio language (Lusion's
ambition, Auxility's engineering credibility), built on the existing Astro +
Three.js architecture. Dials: variance 8, motion 8, density 3.

The person is Tate Sinclair, software engineer, Scotland, early career,
building in the open. That last fact is the whole design problem: the site is
loud about craft and honest that the body of work is still being built.
Nothing on the page claims more than the content behind it.

## The one bold thing: the structure

The v1 idea survives because it is the only 3D object this site can honestly
own: a structure grown from this repository's own commit history,
deterministic (`src/lib/lattice.ts`). In v2 it stops being a diagram beside
the headline and becomes the centrepiece.

**The growth rule was replaced after looking at it.** v1 added one strut per
commit on a cubic lattice. Rendered at this repository's size that drew a few
sprawling arms — a scribble, which is exactly the test v1's own plan set for
throwing the rule away. The rule is now a tower: each commit adds a floor,
being a square ring of four beams plus four columns rising from the floor
below, with the twist and taper of each floor fixed by a hash of its commit.
Fourteen commits draw a hundred-odd struts that read as an engineered
structure, and the tower visibly grows as Tate works. The caption states the
mapping plainly ("14 commits since 2 Sept 2026, one floor each").

- It fills the hero, luminous on a deep ground, and assembles strut by strut
  on load. That assembly is the single self-playing animation on the page.
- Scrolling is the interaction. The camera pulls back and rises as the
  visitor scrolls out of the hero, so the structure recedes into the page
  rather than being cut off by it. Mouse position tilts it a few degrees.
  Dragging orbits it. Hovering a strut shows the commit.
- The text beside it says exactly what it is, in plain words, with the real
  count and date. The canvas is `aria-hidden`; the caption is the accessible
  version; the build-time SVG is the no-WebGL and reduced-motion fallback.

Everything else on the page is typography and space.

## Tokens

Dark ground, one theme. Chosen because the brief pins the direction to
immersive/creative-studio. The ground is a saturated deep blue, not tinted
near-black, so it reads as a colour decision rather than a default.

| Token      | Hex       | Role                                                    | Contrast on ground |
|------------|-----------|---------------------------------------------------------|--------------------|
| `--ground` | `#0A0F1E` | Page background. Deep blue, clearly not black.          |                    |
| `--panel`  | `#121A2E` | Raised plane: project panels, contact block.            |                    |
| `--line`   | `#26304A` | Rules. Never text.                                      |                    |
| `--bone`   | `#EDE9E3` | Primary text. Warm off-white, not pure white.           | 15.2:1             |
| `--mist`   | `#98A1B8` | Secondary text.                                         | 7.1:1              |
| `--pulse`  | `#FFB238` | The one accent: current strut, "building" status, focus rings, links. | 10.4:1; ground text on it 11.8:1 |

Amber on deep blue: warm-on-cool, uncommon among developer portfolios (which
run a cold accent on neutral black), and it carries the meaning the v1 accent
did: this is the thing in progress.

Corner radius: 0 on panels and frames, full pill on buttons. That is the whole
rule; nothing else is rounded. No drop shadows; depth comes from the panel
colour, hairlines and the 3D itself.

## Typography

Two families, unmistakably distinct in role.

- **Bricolage Grotesque** (variable, self-hosted, latin subset) for everything
  read. At display sizes with the optical axis high it has a drafted, slightly
  eccentric quality; at text sizes it is a clean grotesque. One family covers
  display through body without looking like a template's Inter.
- **IBM Plex Mono** (already in the repo) only for machine text: commit hashes
  and subjects, dates, stack lists, repository URLs. Never for labels.

Hand-set scale, base 18px, body line-height 1.5, measure 60ch.

| Role    | Size                          | Weight | Line | Tracking |
|---------|-------------------------------|--------|------|----------|
| display | clamp(3.5rem, 11vw, 10rem)    | 500    | 0.92 | -0.035em |
| title   | clamp(2.25rem, 5.5vw, 4.5rem) | 500    | 0.98 | -0.025em |
| h2      | clamp(1.75rem, 3vw, 2.5rem)   | 500    | 1.1  | -0.015em |
| lede    | clamp(1.25rem, 1.8vw, 1.5rem) | 400    | 1.35 | -0.005em |
| body    | 1.125rem                      | 400    | 1.5  | 0        |
| small   | 0.9375rem                     | 400    | 1.45 | 0        |
| mono    | 0.875rem                      | 400    | 1.5  | 0        |

No tracked-out caps. No eyebrows. No emphasis inside headings.

## Layout

Full-bleed, 24px page margin (40px at 1024+), 12-column grid at 1024+. Left
aligned everywhere; nothing is centred. Sections are tall and sparse.

```
HERO (100dvh)
┌──────────────────────────────────────────────────────────────────┐
│ Tate Sinclair                            Work  About  Contact    │ nav 64px
│                                                                  │
│                                  ╱╲    ╱╲                        │
│                                 ╱  ╲__╱  ╲___    (structure,     │
│                                ╱╲  ╱╲ ╱╲ ╱  ╲     luminous,      │
│                               ╱  ╲╱  ╳  ╲╱    ╲   cols 6-12)     │
│  Tate                        ╱___╱╲_╱ ╲__╲_____╲                 │
│  Sinclair                        ╲╱     ╲╱                       │
│  Software engineer in Scotland,                                  │
│  building in the open.       This site's own history:            │
│  [ See what I'm building ]   12 commits since 2 Sep 2026         │
└──────────────────────────────────────────────────────────────────┘

STATEMENT: one long line of display text, words brightening as you scroll.

WORK: one full-height panel per project; each pins as the next slides over
it (sticky stack).
┌──────────────────────────────────────────────────────────────────┐
│ Building now                                                     │
│                                                                  │
│ Munro log                          ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐    │
│ A logbook for Munro climbs...        [ADD: PROJECT SCREENSHOT]   │
│ TypeScript  SvelteKit  SQLite      └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘    │
│ Read the case study                        Placeholder project   │
└──────────────────────────────────────────────────────────────────┘

CAPABILITIES: "Working in" and "Learning" as two large lists, placeholders
until Tate supplies them.

ABOUT: heading left, [ADD: SHORT BIO] right, beside the three real facts.

CONTACT: "Say hello" at display size; email and links as placeholders.
```

Mobile (< 1024): one column, text before structure, the sticky stack becomes
a plain stack, everything left aligned at the 24px margin.

## Placeholders

Every fact not present in the repository is rendered by one component,
`Placeholder.astro`: a dashed amber frame with `[ADD: LABEL]` in mono. It
cannot be mistaken for content. The four seed projects carry
`placeholder: true` in frontmatter and show a visible "Placeholder project"
mark on the panel and the case study. Replacing content means editing one
data file (`src/lib/site.ts`, `src/lib/skills.ts`) or one markdown file.

## Motion

Stack: **Lenis** for smooth scroll, **GSAP + ScrollTrigger** for everything
scroll-driven, ticked together the way Lenis documents (`lenis.on('scroll',
ScrollTrigger.update)`, `gsap.ticker` driving `lenis.raf`). Three.js for the
one scene. Vanta.js was evaluated and not bundled: it targets Three r134,
needs the full `THREE` namespace (about 150kB gzipped on top of the scene)
and a second WebGL context. Its idea, an ambient pointer-reactive field, is
built natively inside the existing scene instead.

- Load: the headline lines rise out of a mask (CSS keyframes, so it starts at
  first paint and never waits for a module), lede and button settle after,
  while the structure assembles strut by strut. The one self-playing sequence.
- The field: points on a disc at ground level under the structure, joined
  where near, drifting slowly. It runs only while the hero is on screen and
  the tab is visible, tilts with the pointer along with the structure, and
  fades out over the first 60% of the hero's scroll so the page never pays
  for it once it is gone.
- Scroll, each carrying meaning: the camera pulls back and rises (the object
  recedes); statement words brighten in reading order (reading pace); each
  project panel scales to 0.94 and dims as the next covers it (depth in the
  stack); project visuals uncover once and drift a few percent (parallax);
  the three display headings rise out of a mask once as they arrive.
- The nav hides on scroll down and returns on scroll up.
- Page transitions: cross-document view transitions, a 320ms fade between
  home and case studies, CSS only.
- Responses to the user: nav active state, link underlines, button press
  `scale(0.97)` at 140ms ease-out, copy-email label change, orbit, hover tip.
- Easing: `expo.out` / `cubic-bezier(0.23, 1, 0.32, 1)` for entrances; UI
  under 300ms; scrubbed motion is linear to the scrollbar.
- Reduced motion: no smooth scroll, no field, structure renders assembled,
  words all bright, headings in place, panels stack plainly, no transitions.
  Only `transform`, `opacity` and `clip-path` are ever animated.

## Principles

1. Honest first. Status is structural, placeholders are loud, no invented
   facts. The site can be loud about craft because it is quiet about claims.
2. One object. The structure is the only 3D and the only self-playing motion.
3. Type does the work. Big, left-aligned, one family for reading.
4. Scroll is the interface. Motion answers the scrollbar or the pointer;
   nothing plays on its own after load.
5. Text before script. The page is complete with JavaScript off.

## Genericness review, and what changed

Checked against the frontend-design skill's tell list, the Taste skill's
pre-flight and CLAUDE.md §3.

- **Ground colour.** First draft was `#0E0E0E`, the neutral near-black the
  tell list names. Replaced with a saturated deep blue so the darkness is a
  colour and the amber has something to be warm against.
- **Accent.** First draft was electric green `#8EF0D2`, the "acid green on
  black" default. Replaced with amber.
- **Display face.** First draft reached for Space Grotesk, the creative-agency
  default. Replaced with Bricolage Grotesque, whose optical-size axis makes
  display and text genuinely different in one family.
- **Section eyebrows.** First draft had `WORK`, `ABOUT`, `CONTACT` tracked
  out above each heading. Removed. The headings are the headings.
- **Project numbering.** First draft numbered panels `01 / 02 / 03 / 04`.
  Projects are not a sequence. Removed; the status word does the ordering.
- **Scroll cue.** First draft had "Scroll" with an arrow at the hero's foot.
  Removed.
- **Middle dots.** First draft joined stack as `TypeScript · SvelteKit`.
  Now a spaced mono list.
- **Fade-up on every section.** First draft revealed each section on entry.
  Cut to three scroll-driven behaviours that each carry meaning: the camera
  (the object recedes), the statement (reading pace), the stack (projects as
  a sequence of surfaces). Nothing else animates on scroll.
- **Photography.** The Taste skill wants real images. There are none in the
  repo and the brief forbids inventing them. The image slot is an explicit
  `[ADD: PROJECT SCREENSHOT]` frame, styled as a deliberate part of the
  composition rather than a broken image.
- **Budget.** v1 held JS-before-3D under 30kB. v2 ships Lenis + GSAP +
  ScrollTrigger (about 50kB gzipped together), loaded after the HTML. Accepted
  for this direction; the scene (136kB) is still lazy and on-demand, and the
  page is readable before any of it loads.
