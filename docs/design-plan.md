# Design plan (v3: DESIGN.md, editorial cream)

Supersedes `design-plan-v2.md` (dark creative-studio) and `design-plan-v1.md`
(blueprint). Written against `DESIGN.md` at the repository root, which Tate
supplied on 4 Sep 2026 and named as the source of truth for the visual system.
Where this plan departs from DESIGN.md it says so and says why; every
departure is a contrast floor.

## Decisions Tate made, 4 Sep 2026

Asked before any code was written, so nothing below is assumed:

1. **DESIGN.md wins over CLAUDE.md §3.** The cream canvas and warm accent
   that §3 banned are now the system. §3 and the v2 "Direction" note are
   amended to say so.
2. **Re-skin, not restructure.** Every section, the gallery, the case-study
   page and the 404 keep their layout and behaviour. Tokens, type roles,
   surfaces, radii and colour change everywhere.
3. **Keep the structure, the dot field and the scroll motion**, recoloured to
   ink on cream.
4. **Inter + JetBrains Mono**, self-hosted, latin subsets (DESIGN.md's own
   substitute for the licensed CursorGothic).
5. **Status is ink-only.** Shape carries it: a solid mark for shipped, an
   outlined one for building, a dashed mark and a dashed frame for planned.
   No status colour, so the accent stays scarce and the timeline pastels stay
   out of the site entirely (DESIGN.md scopes them to agent timelines, and
   there are none here).

## Tokens

Names follow DESIGN.md; values are DESIGN.md's; `src/styles/global.css` is
the only place they are written.

| Token               | Hex       | Role                                                  |
|---------------------|-----------|-------------------------------------------------------|
| `--canvas`          | `#f7f7f4` | Page floor. Warm cream, never white.                  |
| `--canvas-soft`     | `#fafaf7` | Inside frames (the image slot on a card).             |
| `--surface-card`    | `#ffffff` | Cards, the tooltip, the secondary button.             |
| `--surface-strong`  | `#e6e5e0` | Badge pills.                                          |
| `--hairline`        | `#e6e5e0` | Every divider and card outline.                       |
| `--hairline-soft`   | `#efeee8` | The nav's bottom rule.                                |
| `--hairline-strong` | `#cfcdc4` | Planned cards' dashed frame, step buttons, link underlines. |
| `--ink`             | `#26251e` | Display, titles, link text, the CTA.   15.3:1 on canvas |
| `--body`            | `#5a5852` | Running text, meta, the structure's struts.  6.9:1   |
| `--muted`           | `#807d72` | Display sizes only (see below).              3.6:1   |
| `--primary`         | `#f54e00` | The wordmark's node, the newest strut, focus rings.   |
| `--error`           | `#cf2d56` | Placeholders.                                         |

**Where this departs from DESIGN.md, and why:**

- **No orange button.** DESIGN.md's `button-primary` is white on
  `#f54e00`, which is 3.5:1; ink on it is 4.3:1. Both are under AA for a
  14px label, and the brief's quality floor is AA on every pair. The hero
  CTA is DESIGN.md's `button-download` (ink on canvas, 15:1), which is also
  the button its own hero band specifies. The orange goes where DESIGN.md
  allows it as a non-text mark: the wordmark (a 10px node beside the name,
  because orange *text* at 14px is 3.3:1), the hero accent (the newest strut),
  and the focus ring (3.3:1 clears the 3:1 non-text floor).
- **`--muted` is never running text.** At 3.6:1 it fails AA below 24px. It is
  used for the statement's unlit words (26px) and nothing smaller. Labels and
  captions that DESIGN.md would set in muted use `--body`.
- **Placeholders are `--error`.** DESIGN.md has no placeholder component. A
  fact that is missing is a defect in the page and should read as one; the
  semantic error colour is the honest choice and it keeps the accent scarce.

## Typography

Inter Variable (latin, 48kB) for everything read; JetBrains Mono 400 (latin,
21kB) for machine text: commit hashes, dates, years, stack lists, the position
readout. Together with the 17kB HTML they sit inside the brief's 100kB budget
for HTML + CSS + fonts.

Roles are DESIGN.md's, as classes named after its tokens:

| Class                | Size / weight / line / tracking          | Used for                                   |
|----------------------|------------------------------------------|--------------------------------------------|
| `.display-mega`      | 72 → 56 → 32px / 400 / 1.1 / -0.03em     | The hero h1 only                           |
| `.display-lg`        | 36 / 400 / 1.2 / -0.02em                 | Section heads, case-study h1, 404 h1       |
| `.display-md`        | 26 / 400 / 1.25 / -0.0125em              | The statement, case-study h2s              |
| `.display-sm`        | 22 / 400 / 1.3 / -0.005em                | Ledes, card titles, capability items, email |
| `.title-md`          | 18 / 600 / 1.4                           | Capability group headings                  |
| `.title-sm`          | 16 / 600 / 1.4                           | Status line                                |
| body                 | 16 / 400 / 1.5                           | Default                                    |
| `.body-sm`           | 14 / 400 / 1.5                           | Captions, meta labels, footer              |
| `.code`              | 13 / 400 / 1.5, JetBrains Mono           | Machine text                               |
| `.badge`             | 11 / 600 / 0.08em, uppercase, pill       | "Placeholder project"                      |
| nav, `.button`       | 14 / 500                                 | Nav links, CTA labels                      |

Display stays at 400. The only weight above it is 600 on titles, as DESIGN.md
has it. Tracked uppercase appears in one place, the badge pill, which is the
component DESIGN.md defines it for; there are still no section eyebrows.

## Layout

Unchanged in structure (decision 2). What changed: the container caps at
1200px; the section rhythm is 80px; spacing snaps to the 4px scale; cards
are 12px radius with a 1px hairline and no shadow; buttons are 8px; the
image slot inside a card is 8px; badges are pills. Depth is hairline-only:
white cards on the cream floor, planned cards as dashed outlines with the
floor showing through.

## The structure, the field, the motion

All kept (decision 3) and recoloured:

- Struts are `--body`, nodes `--ink`, the newest strut `--primary`. The
  additive glow pass is gone: additive blending lightens, which on a cream
  ground is invisible, and DESIGN.md has no glow anyway. That also removes
  one instanced mesh and one draw call.
- The SVG fallback lost its `drop-shadow` filter for the same reason.
- The dot field draws in ink. Its opacity is capped at 0.15 so body copy read
  against a dot at full bloom stays at 4.9:1.
- The statement's unlit words are `--muted` (3.6:1 at 26px), which also
  clears the one contrast failure Lighthouse had been reporting against the
  v2 site.

## Efficiency changes made alongside

Found in the audit Tate asked for, and applied because none of them change
behaviour:

- **Scroll motion loads after the page has.** Lenis + GSAP + ScrollTrigger
  (about 50kB gzipped) were in the eager home-page bundle. Nothing above the
  fold needs them (the hero intro is CSS), so they now load on `load` + idle,
  the way the scene already did. The gallery's controls stay eager: they are
  small and answer input.
- **`mix-blend-mode: difference` is off the nav.** It forced a compositing
  layer over the whole viewport on every frame; a canvas fill with a hairline
  is what DESIGN.md specifies and costs nothing.
- **`filter: drop-shadow` is off the SVG fallback** (a filter over a few
  hundred paths, repainted on every scroll).
- **The glow pass is out of the scene** (see above).
- **`@astrojs/check` is installed**, so `npx astro check` works as CLAUDE.md
  says it does. It found two real type errors in the idle-callback guards,
  now fixed.
- **`site.linkedin` had no scheme**, so it rendered as a relative link;
  fixed. **`site.repo` was removed** but two components still read it; those
  links now render only when it has a value.

## Genericness review

Checked against CLAUDE.md §3's tell list, which DESIGN.md now overrides
where they conflict, and the frontend-design skill's list.

- The cream ground with a warm accent is the look §3 banned. That is the
  decision Tate made; the system is DESIGN.md's, not a template's, and the
  page keeps the things a template would not have: the commit structure, the
  halftone field, the gallery, the placeholders, the honest status.
- Inter is the substitute DESIGN.md names. It is used at 400 with negative
  tracking at display sizes, which is the editorial voice the system asks
  for, not the Geist-on-black default §3 warned about.
- No eyebrows, no `→`, no middle dots, no numbered markers (the gallery's
  `01 / 04` is a position in a sequence you move through, which is what a
  counter is for), no per-section fade-ups, no gradient washes.
- No orange button, because it fails AA; see Tokens.
