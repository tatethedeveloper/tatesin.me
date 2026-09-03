# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

Astro 7 + TypeScript, vanilla CSS, one Three.js island, plus `lenis` (smooth
scroll) and `motion` (scroll-driven animation). Deploys to GitHub Pages via
`.github/workflows/deploy.yml` on push to `main`; the custom domain is
`public/CNAME`.

**Direction (v2, Sep 2026):** Tate chose a full creative-studio redesign
(Lusion's ambition, Auxility's engineering credibility) over the v1 blueprint
direction. That supersedes the light-theme and low-motion constraints in §3
and §5 below; everything else in the brief (honesty, no invented facts,
placeholders, quality floor, budgets) still applies. The plan is
`docs/design-plan.md`; v1 is kept as `docs/design-plan-v1.md`.

### Commands

- `npm run dev` / `npm run build` / `npm run preview` (preview serves `dist/` on :4321)
- `npx astro check` for types across `.astro` files
- Playwright CLI is configured in `.playwright/cli.config.json` (Chromium, isolated).
  `playwright-cli open http://localhost:4321/`, then `resize`, `screenshot`, `press Tab`, `eval`.
  Reduced motion: open a session with a config whose `contextOptions` has `reducedMotion: "reduce"`.
- Lighthouse: `CHROME_PATH=<playwright chrome-headless-shell> npx lighthouse http://localhost:4321/ --form-factor=mobile --screenEmulation.mobile --only-categories=performance,accessibility,best-practices,seo --chrome-flags="--headless=new"`
- OG image: build, preview, then screenshot `/og/` at 1200x630 into `public/og.png`.
  **TODO(tate): regenerate it; the committed `og.png` is still the v1 light image.**

### How it fits together

- `src/lib/git.ts` reads `git log` at build time; `src/lib/lattice.ts` is the pure growth
  rule that turns commits into struts. The build-time SVG fallback in
  `src/components/Structure.astro` and the lazily loaded scene in
  `src/scripts/structure-scene.ts` draw from the same struts, so they are the same drawing.
  CI checks out with `fetch-depth: 0` for this reason.
- `src/scripts/motion.ts` owns scroll behaviour: Lenis (fine pointers only), the
  statement's word-by-word brightening, and the project visual clip reveal. All of it
  is skipped under `prefers-reduced-motion`; CSS shows the finished state instead.
- `src/content/projects/*.md` is the typed collection (`src/content.config.ts`). Adding a
  project is one file. `placeholder: true` in frontmatter shows a visible mark on the site.
  `src/lib/projects.ts` owns status order and copy.
- Facts that are not in the repo are `null` in `src/lib/site.ts`, empty in
  `src/lib/skills.ts`, or `placeholder` entries in `src/lib/about.ts`, and render through
  `src/components/Placeholder.astro` as `[ADD: ...]`. Fill the value in to replace it.
- Tokens and type roles live in `src/styles/global.css`; components use them, never raw hex.
- Everything Tate still has to supply is marked `TODO(tate)` in source (`grep -rn "TODO(tate)" src`).

# Portfolio site — Tate Sinclair

This file is the brief and the working agreement for this repo. Read it fully before writing code.

---

## 1. Who this is for

**Tate Sinclair — software engineer.** Early career. Based in Scotland.

The honest situation, which shapes everything below: Tate does not yet have a body of shipped projects. The site is being built *before* the work, not after it. Do not paper over this. A portfolio that pretends to a career that hasn't happened yet is transparent to anyone hiring, and it's the single most common failure mode of an early-career portfolio.

Instead, treat the absence as the design problem. The site's job is to make a hiring manager or a collaborator think: *this person is serious, has taste, and is actively building.* A well-made site that says "here's what I'm building next, and here's how I think" beats a generic template padded with three tutorial to-do apps.

**Never invent, on Tate's behalf:** employers, job titles, dates, client work, testimonials, metrics ("50k users"), or GitHub stats. Where real content is missing, use clearly-marked placeholder content and leave a `TODO(tate):` comment in the source at that spot.

---

## 2. Stack — Astro

Use **Astro** with TypeScript. Vanilla CSS, no Tailwind. Reasoning, since you asked me to justify it:

- **Ships zero JavaScript by default.** A portfolio is 95% static content. Astro renders to plain HTML and only hydrates the specific components that need interactivity (Astro islands). This gets a near-perfect Lighthouse score almost for free — which matters here, because a slow portfolio undermines the claim being made.
- **Content collections are the right shape for this.** Projects live as markdown files in `src/content/projects/` with a typed frontmatter schema. When Tate finishes a real project, adding it is one new `.md` file — no touching components, no redeploy config. Given the site is being built ahead of the work, low friction to add work later is the most important property it can have.
- **Not Next.js:** there is no server, no auth, no data fetching, no API routes. Next brings a React runtime, a build system, and a mental model that this site never uses. It's the wrong weight class.
- **Not plain HTML/CSS/JS:** the moment there are more than about three projects, you're hand-copying markup between pages, and the nav and layout drift out of sync. Components and layouts are worth having.
- **Not Tailwind:** the design direction below depends on a bespoke type scale, non-standard spacing, and custom animation. Tailwind's value is speed at conventional defaults, and conventional defaults are exactly what this brief is trying to avoid. Write real CSS with custom properties for the token system.

### On "static"

Astro being a static site generator constrains *how the HTML is produced*, not *how interactive the page is*. Everything below — WebGL, physics, cursor-reactive 3D, live filtering — runs client-side exactly as it would in any other framework. The difference is that the 3D bundle loads only on the island that needs it, instead of being bundled with the whole site. For a page where one section is heavy and the rest is text, that's an advantage, not a limitation.

### 3D

Use **Three.js directly**, in a single `client:visible` Astro island. Not React Three Fiber: pulling in React, `@react-three/fiber` and `@react-three/drei` to render one scene costs 150kB+ before a single triangle, on a site that otherwise ships no React at all.

Model pipeline: **glTF/GLB only**, compressed with **Draco** or **Meshopt**, loaded lazily. Budget below in §8. If Tate has no models yet, prefer **procedural geometry generated in code** over sourcing stock models — it's smaller, it's arguably itself a work sample, and it avoids a portfolio whose centrepiece is someone else's asset.

Deploy target: **Netlify or Vercel**, free tier, connected to the GitHub repo, auto-deploy on push to `main`. Custom domain optional and left to Tate.

---

## 3. Design brief

### The subject

Read `/mnt/skills/public/frontend-design/SKILL.md` if it's available to you, and follow its two-pass process: produce a written design plan first, review it against this brief for genericness, revise, *then* build.

The subject matter is not "software engineering" in the abstract. It's **a person early in their craft, building in the open.** That's more specific and more interesting. The visual language should feel technical and precise — but precision is not the same thing as the dark-terminal aesthetic every engineer portfolio reaches for.

### Hard constraints — do not produce these

These are the current defaults of AI-generated design. They will read as templated:

- Near-black background (`#0B0B0B`, `#111`) with a single acid-green or vermilion accent. This is *the* engineer-portfolio default. Avoid it.
- Warm cream background (`#F4F1EA`) with a high-contrast serif and a terracotta accent.
- Content chopped into identical rounded cards, same border-radius on everything, same soft grey shadow under each.
- Tracked-out ALL-CAPS eyebrow labels above every section heading.
- A `→` appended to every link and button label.
- Meta strings joined with middle dots (`React · TypeScript · 2025`).
- `01 / 02 / 03` numbered markers on things that are not actually a sequence.
- One word of the headline in a different colour or italic.
- Fade-and-slide-up on every section as it scrolls into view. See §5.
- Gradient washes used as decoration rather than as information.

### What to do instead

Choose the palette, typefaces and layout yourself, and **justify each choice in writing in your design plan** with reference to this specific brief. A few directions worth exploring before you settle — these are prompts, not a menu to pick from:

- **Blueprint / schematic.** Measured, annotated, dimensioned. Technical without being a terminal. Hairlines and precise alignment carry the personality; colour stays restrained.
- **Instrument panel.** Legible under pressure. High-contrast, functional typography, information-dense but calm. Think aviation or lab equipment, not a SaaS dashboard.
- **Version-controlled.** The site's structure mirrors how software actually gets made — the project list *is* a changelog, status is a first-class visual element, history is visible rather than hidden.

Whatever you land on, **spend your boldness in one place.** One memorable element; everything around it quiet and disciplined. If the hero is loud, the project list is plain. If the project list is the striking thing, the hero is restrained.

### Typography

One or two families. If two, make them unmistakably distinct in role. Set a real type scale with intentional weights and spacing — not `1rem / 1.5rem / 2rem / 3rem`. Body line length under 80 characters. Do not use a monospace face for small data labels purely because the subject is software; use it only if it's carrying actual meaning (code, commit hashes, versions).

---

## 3b. Available skills — and how to use them

You have access to several design resources. They are not equally weighted, and two of them pull against this brief. Read this before invoking any of them.

**Use for craft, not for aesthetics:**

- **Vercel Web Design Guidelines** and **Design System Analysis: ClickHouse.** Excellent on the mechanical layer: contrast ratios, focus states, spacing rhythm, motion timing and easing, disabled states, form affordances, dark-mode token structure. Take all of that.

  But note the trap. Both describe a *specific house style* — dark surfaces, geometric grotesque type, tight radii, restrained accent on near-black — and that house style is precisely the engineer-portfolio default §3 rules out. Following them as an aesthetic gets you a site that looks like Vercel's marketing pages, which is a look thousands of developer portfolios already have. **Take the rules, leave the look.** If you find yourself reaching for Geist or Inter on `#0A0A0A`, you've imported the aesthetic rather than the craft — stop and revisit your design plan.

- **Awesome Design.md.** Use as a reference index when you need a specific technique. Do not use it as a source of visual direction; a curated list of admired sites is a fast route to pastiche.

**Use as the primary steer:**

- **Taste Skill** and the `frontend-design` skill. These are about arriving at a point of view specific to *this* brief. Where any resource conflicts with these, or with §3 of this file, these win.

**Use as tooling:**

- **Image to code.** Only if Tate supplies a reference or a sketch. Do not feed it a screenshot of an existing portfolio and reproduce it.
- **Playwright CLI.** This is the most valuable one here and it's underused by default. Use it throughout, not just at the end:
  - Screenshot at 320 / 768 / 1440 after each section and actually look at the result before moving on.
  - Verify the 3D island renders, and capture the fallback path with WebGL disabled.
  - Test keyboard traversal — tab through the whole page and confirm focus is visible at every stop.
  - Emulate `prefers-reduced-motion: reduce` and confirm the page is still coherent.
  - Throttle CPU and network to check the 3D scene doesn't lock up a mid-range phone.

  A screenshot you looked at is worth more than a page you reasoned about.

---

## 4. Structure

Single-page scroll with anchored nav, plus dedicated routes for individual project case studies. Rationale: there isn't enough content yet to justify separate About and Contact pages, and empty pages read as empty.

```
/                      Home — hero, work, about, contact
/projects/[slug]       Individual case study
/uses          (opt.)  Tools and setup
/404                   Custom, in the site's voice
```

**Section order and job of each:**

1. **Hero.** Name, and what Tate does, in a form that isn't a big centered headline with a gradient. This is where the one memorable moment lives — see §5. Must state clearly: Tate Sinclair, software engineer. Must not overclaim.
2. **Work.** The core of the site. See §6 for the content model. Handles the empty and near-empty states gracefully.
3. **About.** Short. First person. What Tate is drawn to in software, what he's currently learning, where he's based. Two or three paragraphs at most, no life story.
4. **Skills / stack.** Only if it earns its place visually. A wall of technology logos is filler. If included, group by honest proficiency ("working in", "learning") rather than fake percentage bars — never use skill percentage bars or star ratings.
5. **Contact.** Email, GitHub, LinkedIn. A `mailto:` link is fine; a contact form needs a backend and isn't worth it. Make the email copyable.

Persistent: nav with scroll-aware active state, and a footer with the year and a link to the site's own source on GitHub — a portfolio whose own repo is public is itself a work sample.

---

## 5. Motion and interaction

This is where the brief asks for real attention, so be deliberate rather than generous.

**One orchestrated moment, not scattered effects.** A single page-load sequence or a single reveal lands harder than animation on every section. Scroll-triggered fade-ups on each block are the generic default and will undercut everything else.

**Motion that responds to the user is always welcome.** Hover, focus, expand, copy, filter, toggle — anything that shows the person what changed. That's interaction design. Ambient motion that plays regardless of what the user does needs to justify itself.

### The 3D element

3D is the memorable thing on this site. That means **one 3D moment, done properly** — not a scene in the hero and another behind the projects and a third in the footer.

The cliché to avoid: an abstract floating shape that rotates forever and means nothing. A slowly-spinning torus knot, a particle sphere, a distorted blob with an iridescent shader. These are decoration, and they're as templated as any of the tells in §3. Every visitor has seen them.

**Make the 3D carry information.** It should be about something. Directions worth prototyping:

- An object the user can genuinely manipulate — orbit, disassemble, inspect — where the interaction *is* the point and the thing being inspected relates to the work.
- Geometry that responds to real input: cursor, scroll position, viewport, time of day. Reactive beats ambient.
- 3D as navigation or structure rather than as backdrop — the project list existing in space, and moving through it being the interaction.
- Something generated from data rather than modelled by hand.

Pick one direction, prototype it early and cheaply, and be willing to throw it away. A restrained 2D site beats a mediocre 3D one.

**Non-negotiable for the 3D:**
- Never blocks content. Text is readable and the page is usable before the scene loads.
- Full fallback: a static image or a CSS treatment when WebGL is unavailable, when the device is low-powered, or under `prefers-reduced-motion`.
- The render loop pauses when the canvas is off-screen (`IntersectionObserver`) and when the tab is hidden. A portfolio that drains a laptop battery while sitting in a background tab is a bad work sample.
- Cap the pixel ratio (`Math.min(devicePixelRatio, 2)`) — uncapped DPR on a 3× phone is the usual cause of a scene tanking to 10fps.
- Dispose geometries, materials and textures on unmount.
- Keyboard-accessible if it's interactive, or `aria-hidden` and skippable if it's decorative. Pick one and be honest about which it is.

**Non-negotiable:**
- Respect `prefers-reduced-motion: reduce` — not by disabling everything into jankiness, but by replacing motion with instant state changes.
- Animate `transform` and `opacity` only. No animating `width`, `height`, `top`, or `left`.
- Nothing that blocks reading. No delay before content is legible.
- Visible keyboard focus everywhere, and it must not be a browser default outline slapped on a dark background where it's invisible.
- Interactive islands hydrate with `client:visible` or `client:idle`, not `client:load`, unless they're above the fold.

---

## 6. Content model — the important part

Projects are a typed Astro content collection at `src/content/projects/`. Schema:

```ts
{
  title: string
  summary: string          // one sentence, plain language
  status: 'shipped' | 'building' | 'planned'
  role: string             // "solo", "coursework", "team of 4"
  stack: string[]
  year: number
  repo?: string
  demo?: string
  cover?: image
  featured: boolean
}
```

**`status` is the mechanism that makes an empty portfolio honest and interesting.** Render it as a genuine visual distinction — not three coloured pills. A `planned` project displayed as a stated intention with a clear visual difference from a shipped one reads as a roadmap, and a roadmap reads as someone with direction. The same project faked as complete reads as dishonest.

Seed the repo with **four placeholder projects** — one `building`, three `planned`. Write them as realistic things an early-career engineer would actually build, not "E-commerce Platform" and "Social Media Dashboard". Make them specific and small enough to be believable. Mark every one with a `TODO(tate):` comment at the top of the file saying it's a placeholder to replace.

**Empty and sparse states matter here more than usual.** Design the zero-project and one-project cases explicitly. An empty section should be an invitation, not a gap. Do not build a grid that only looks correct with six items in it.

Case study pages: problem, approach, what was hard, what he'd do differently. That last section is the one that signals engineering maturity, and it's the one most portfolios skip.

---

## 7. Copy

Write it in Tate's voice: plain, direct, first person, sentence case. No "passionate about leveraging cutting-edge technologies". No "I turn coffee into code". No third-person self-description.

Being early-career is a fact, not an apology. Write it plainly and move on. Confidence about direction reads better than either false seniority or self-deprecation.

Every button says what happens. Errors say what went wrong and how to fix it. The 404 page should be in the site's voice and give the person somewhere to go.

---

## 8. Quality floor

Build to this without announcing it in the UI:

- Responsive from 320px up. Test the actual breakpoints, don't assume.
- WCAG AA contrast on every text/background pair, including hover and focus states.
- Semantic HTML. One `h1`. Landmarks. Alt text on every image.
- Fully keyboard navigable, with a skip link.
- Open Graph and Twitter card meta, with a generated OG image.
- `sitemap.xml`, `robots.txt`, favicon set.
- Fonts self-hosted and subset, `font-display: swap`, preloaded.
- Images via Astro's `<Image />`, modern formats, explicit dimensions to prevent layout shift.
- Lighthouse ≥ 95 across all four categories on mobile. Actually run it via Playwright.

**Payload budget, enforced:**

| | Budget |
|---|---|
| Initial HTML + CSS + fonts | < 100kB |
| JS before the 3D island | < 30kB |
| Three.js island (gzipped, tree-shaken) | < 180kB |
| All 3D assets combined (Draco/Meshopt) | < 1.5MB |
| Time to readable hero text | < 1.5s on 4G |
| Sustained framerate, mid-range mobile | ≥ 50fps |

Import from `three` selectively — never `import * as THREE`. If the scene can't be brought inside these numbers, simplify the scene rather than raising the budget.

---

## 9. Build order

1. Scaffold Astro + TypeScript, set up the repo, get a blank page deploying to Netlify/Vercel. Confirm the pipeline works before building anything.
2. **Write the design plan.** Tokens (4–6 named hex values, type roles, layout concept with ASCII wireframes, principles). Review it against §3 for genericness. Revise, stating what changed and why. Show this to Tate before proceeding.
3. Token system in CSS custom properties, base layout, nav, footer.
4. Content collection, schema, four placeholder projects, project card and case study page.
5. Home page sections in order.
6. The hero moment. Last, deliberately — so it's designed against a real page rather than the page being built around it.
7. Accessibility and performance pass. Screenshot at 320 / 768 / 1440 and critique your own work.

Commit at each step with meaningful messages. This repo is public and is itself a work sample; the git history is part of the portfolio.

---

## 10. Open — Tate to decide

- `TODO(tate):` real email address, GitHub URL, LinkedIn URL
- `TODO(tate):` replace the four placeholder projects
- `TODO(tate):` about section — what he's actually drawn to and currently learning
- `TODO(tate):` custom domain, or use the platform subdomain
- `TODO(tate):` whether to include a writing/notes section later — worth leaving room for, not worth building empty
