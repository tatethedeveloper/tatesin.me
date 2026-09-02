# Design plan

Written before any UI code, per CLAUDE.md §9 step 2. Reviewed once against §3 for
genericness; the revisions from that pass are listed at the end so the reasoning
is visible.

## Design read

A developer portfolio for hiring managers and collaborators, for a person early
in their career, built before the body of work exists. The visual language is
technical and precise, in the register of a drawing office rather than a
terminal. Dials, in the Taste skill's terms: variance 6, motion 5, density 5.
Lower variance than a designer portfolio because the audience is scanning for
substance, not spectacle; higher density than a gallery because the content is
a roadmap and should read like one.

## Direction: version-controlled, drawn like a blueprint

Of the three prompts in §3, **version-controlled** is the structural idea and
**blueprint** is the drawing style. The two combine without fighting:

- The brief's central problem is honesty about a nearly empty portfolio, and
  `status` is the mechanism it names. "Version-controlled" makes status the
  structure of the page rather than a label on a card: the work section is a
  log read top to bottom (building now, planned, shipped), and the site's own
  commit history is the material for the hero. The absence of shipped work
  becomes a visible starting point on a timeline, not a gap.
- Blueprint supplies the craft: hairline rules that organise real content,
  measured alignment, a restrained palette, annotation-style metadata. It is
  not used as decoration. No grid lines drawn for atmosphere, no dimension
  marks on things that have no dimension.
- Instrument panel was rejected because a personal site with five sections
  and four projects does not have the information density that makes that
  style honest; forced density reads as a dashboard template.

**Boldness is spent in the hero, on the 3D structure.** Everything after the
hero is plain: a list, three short paragraphs, a contact block.

## The 3D moment: the site's own build log

A wireframe structure generated from this repository's git history. One strut
per commit, placed by a deterministic growth rule on a cubic lattice, so the
structure gets taller and wider as the site is worked on. It assembles strut
by strut on page load (the single orchestrated motion on the page), then sits
still. The visitor can orbit it by dragging, and hovering a strut shows the
commit subject and date.

Why this and not an object:
- It is generated from data, not modelled, and the data is real. There is
  nothing to invent and nothing to exaggerate.
- It is about the thing the site claims: building in the open. The structure
  is literally the record of the site being built, and it grows as Tate works.
- It carries information (commit count, cadence, what changed) rather than
  being an ambient shape.
- It looks like a blueprint drawing in three dimensions, so it belongs to the
  rest of the page instead of sitting on top of it.

Honesty rules that follow from it:
- The canvas is `aria-hidden` and skippable. A visible caption next to it
  states the same facts in text ("This site's own history: N commits since
  2 Sep 2026"). That caption is the accessible version; the canvas is an
  enhancement of it. Decorative-and-skippable is the honest classification,
  because the information is fully available without it.
- The fallback for no WebGL, low-power devices and `prefers-reduced-motion`
  is an inline SVG of the same structure, projected at build time from the
  same data. Not a different image; the same drawing, flat.
- Render loop pauses off-screen and on hidden tabs. DPR capped at 2.
  Geometry, materials and renderer disposed on teardown.
- Budget: procedural only, zero asset bytes. Three.js imported selectively.

Prototype this first at low fidelity (lines only, no hover) and judge it at
320 and 1440. If a lattice of twenty struts looks like a scribble rather than
a structure, change the growth rule; if no rule works, fall back to the SVG as
the permanent hero and spend nothing further. The brief is explicit that a
restrained 2D site beats a mediocre 3D one.

## Tokens

Light theme, locked. Not dual-mode: the direction depends on the paper, and a
dark variant of a blueprint is the near-black engineer default §3 rules out.
Contrast ratios below were computed, not estimated.

| Token      | Hex       | Role                                        | Contrast |
|------------|-----------|---------------------------------------------|----------|
| `--paper`  | `#E9EDF1` | Page background. Cool grey-blue, not cream. |          |
| `--panel`  | `#F7F9FB` | Raised plane: inputs, the copy-email block. |          |
| `--ink`    | `#16202B` | Text, strokes, nodes.                       | 13.99:1 on paper |
| `--muted`  | `#4B5665` | Secondary text, metadata.                   | 6.33:1 on paper |
| `--line`   | `#B4BDC7` | Hairlines. Never used for text.             |          |
| `--accent` | `#B8450B` | One accent: the current strut, the building status, focus rings, link underlines. | 4.58:1 on paper; light text on it 5.11:1 |

The accent is a survey-marker orange chosen because it means "in progress" in
the physical world and because warm-on-cool is uncommon among developer
portfolios, which are overwhelmingly dark with a cold accent. It is used
sparingly: a visitor should be able to count its appearances.

Corner radius: 2px everywhere, one scale. Shadows: none. Elevation is done
with the panel colour and hairlines.

## Typography

Two families, both from IBM Plex, self-hosted and subset to latin.

- **IBM Plex Sans** for everything read: display, headings, body, labels,
  status words. Weights 400 and 600 only.
- **IBM Plex Mono** only where the text is a machine identifier: commit
  subjects and dates in the hero tooltip, repository URLs, the year on the
  timeline. Not for section labels, not for the nav, not for status words.

Why Plex: it was designed for technical documentation, it has a drafting
quality at display sizes without being a geometric grotesque, and having the
mono in the same superfamily means the two roles are related without a third
face. Why not Geist or Inter: per §3b, that is the Vercel house look.

Scale, hand-set rather than a ratio. Base 17px, body line-height 1.55, body
measure 62ch.

| Role     | Size                          | Weight | Line | Tracking |
|----------|-------------------------------|--------|------|----------|
| display  | clamp(2.375rem, 5.5vw, 4rem)  | 600    | 1.04 | -0.02em  |
| h2       | 1.75rem                       | 600    | 1.2  | -0.01em  |
| h3       | 1.1875rem                     | 600    | 1.3  | 0        |
| body     | 1.0625rem                     | 400    | 1.55 | 0        |
| small    | 0.9375rem                     | 400    | 1.5  | 0        |
| mono     | 0.875rem                      | 400    | 1.5  | 0        |

No tracked-out caps. No mono micro-labels. Emphasis inside a heading, if ever
needed, is weight in the same face.

## Layout

12-column grid at 1024 and up, 24px gutters, max content width 1200px. Section
headings hang in columns 1-3; section content sits in columns 4-10 and never
exceeds the body measure. Below 1024 everything is one column with the
heading above its content. Vertical rhythm is on an 8px base; section spacing
is 96px at desktop, 64px at mobile.

### Hero (min-height 100dvh minus nav)

```
┌──────────────────────────────────────────────────────────────────┐
│ Tate Sinclair            Work   About   Contact          GitHub  │  nav, 64px
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Tate Sinclair                     ╱╲    ╱╲                      │
│  Software engineer in Scotland.   ╱  ╲__╱  ╲___                  │
│  Early career, building in       ╱╲  ╱╲ ╱╲ ╱  ╲                  │
│  the open.                      ╱  ╲╱  ╳  ╲╱    ╲                │
│                                ╱___╱╲_╱ ╲__╲_____╲               │
│  [ See what I'm building ]         ╲╱     ╲╱                     │
│                                                                  │
│                                   This site's own history:       │
│                                   14 commits since 2 Sep 2026    │
│                                   Drag to orbit                  │
└──────────────────────────────────────────────────────────────────┘
   cols 1-5: text                    cols 6-12: structure + caption
```

Text is static HTML and readable before any script runs. One CTA. The
headline is two short lines at most. Mobile: text first, then the structure at
a fixed 60vw height, caption beneath.

### Work

```
┌──────────────┬───────────────────────────────────────────────────┐
│ Work         │  Building now                                     │
│              │  ●─ 2026   Project title                          │
│ Four things  │  │         One sentence summary.                  │
│ in progress. │  │         Solo. TypeScript, Astro.  Read more    │
│ One is being │  │                                                │
│ built, three │  Planned                                          │
│ are planned. │  ○  2026   Project title                          │
│              │  ┆         One sentence summary.                  │
│              │  ○  2026   Project title                          │
│              │  ┆         ...                                    │
│              │                                                   │
│              │  Shipped                                          │
│              │  Nothing shipped yet. The first is at the top.    │
└──────────────┴───────────────────────────────────────────────────┘
```

Status is rendered as the node and the rule beside it, not as a pill:
`building` is a filled node in accent with a solid rule; `planned` is an
outlined node in ink with a dashed rule; `shipped` is a filled node in ink
with a solid rule. The status word appears once in plain sans in the row
metadata for screen readers and for anyone who does not read the symbol.
Groups are ordered building, planned, shipped because that is the order a
visitor cares about. An empty group is a sentence, not a hidden section, and
an empty collection is a single paragraph with a link to GitHub.

Each row links to `/projects/[slug]`.

### Case study page

Title, status, role, stack, year, then repo and demo links if present. Body
sections depend on status so the page never pretends:

- shipped: Problem, Approach, What was hard, What I'd do differently
- building: Problem, Approach, What's hard so far, Open questions
- planned: Problem, Intended approach, What I expect to be hard, Open questions

"Evidence" (screenshots, recordings, links) is a section that renders only
when the markdown provides it.

### About, Skills, Contact

About: three paragraphs maximum in the content column. Skills: two short
groups, "Working in" and "Learning", as plain inline lists with no bars, no
logos, no ratings; dropped entirely if Tate does not supply them. Contact: the
email in a panel with a "Copy email" button whose label changes to "Copied"
for two seconds; GitHub and LinkedIn as plain links. Footer: the year and
"Source on GitHub".

## Motion

One orchestrated moment: the structure assembling in the hero, roughly 1.2s,
each strut placed in commit order with a short ease-out. Nothing else on the
page animates on its own. Everything else is a response to the user: nav
active state, link underline on hover and focus, the copy button's label,
orbiting the structure by dragging, the hover tooltip on a strut.

Reduced motion: the structure renders fully assembled, orbit is still
available by dragging, tooltip still works, no transition on any state change.
Only `transform` and `opacity` are ever animated. Focus rings are a 2px accent
outline offset 2px, visible on the paper, on the panel and on the ink button.

## Principles

1. Nothing on the page claims more than the content behind it. Status is
   visible, and the empty state is written, not hidden.
2. One family per job: sans reads, mono identifies. Colour means something
   (in progress, focus, current) or is not used.
3. Lines organise, they do not decorate. Every rule sits between two things.
4. The 3D is a drawing of real data. If it stops being that, remove it.
5. Text before script. The page is complete with JavaScript off.

## Genericness review against §3, and what changed

Checked the first draft of this plan against the hard constraints and the
Taste skill's tell list. Revisions:

- **Accent.** The first draft used `#CC4E00`, which fails AA for small text
  on the paper (3.83:1) and would have needed a second darker shade for links,
  making two accents. Replaced with `#B8450B` (4.58:1) so one hex does every
  job.
- **Status typography.** The first draft set the status word in Plex Mono
  because it is "technical". §3 forbids mono for labels that carry no machine
  meaning. Status is now sans; mono is left for commit refs, dates and URLs.
- **Section headings.** The first draft used a sticky left-column heading
  that follows the scroll, a pattern common enough in developer portfolios to
  read as borrowed. The heading now hangs statically at the top of its
  section in the left columns.
- **Hero caption.** The first draft had "Drag to orbit · 14 commits · main"
  as a mono strip under the canvas. That is the middle-dot metadata string
  and the fake-version-footer tell in one line. It is now two short sentences
  in sans.
- **Timeline rules.** The first draft drew a continuous vertical hairline
  the full height of the section. Between groups it connected nothing, so it
  was decoration. The rule now only runs between nodes within a group.
- **Dark mode.** The Taste skill defaults to dual-mode. Rejected here on
  purpose: a dark blueprint is the near-black default and the palette above
  is the point. Noted as a possible later addition with its own tokens.
- **Photography.** The Taste skill asks for real images even on minimal
  sites. This site has no product to photograph and the brief says not to
  source stock. The visual is the generated structure and, later, real project
  evidence on case study pages.

## Open questions for Tate

See the end of the conversation in which this plan was written; they are
tracked as `TODO(tate)` in the source once the page exists.
