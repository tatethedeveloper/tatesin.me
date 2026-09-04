/**
 * The page's motion, on GSAP + ScrollTrigger with Lenis driving scroll.
 *
 *  1. Lenis smooth scroll, ticked by GSAP so ScrollTrigger and Lenis agree
 *     on every frame (the integration Lenis documents).
 *  2. The hero intro itself is CSS (Hero.astro), so it starts at first paint.
 *  3. Scroll: the statement's words brighten in reading order; project images
 *     uncover as they arrive; display headings rise once as they arrive.
 *     The work gallery's own behaviour lives in scripts/gallery.ts, because
 *     it answers input rather than scroll position.
 *  4. The nav hides on scroll down and returns on scroll up.
 *
 * Skipped entirely under prefers-reduced-motion; CSS shows finished states.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

const EASE = 'expo.out';

export function start(): void {
  const root = document.documentElement;
  if (root.classList.contains('reduced')) return;
  gsap.registerPlugin(ScrollTrigger);

  // 1. Lenis, ticked by GSAP.
  const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -16 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // 4. Nav direction.
  const nav = document.querySelector<HTMLElement>('[data-nav]');
  if (nav) {
    let hidden = false;
    lenis.on('scroll', ({ direction, scroll }: { direction: number; scroll: number }) => {
      const shouldHide = direction === 1 && scroll > 120;
      if (shouldHide === hidden) return;
      hidden = shouldHide;
      gsap.to(nav, { yPercent: hidden ? -100 : 0, duration: 0.4, ease: EASE, overwrite: true });
    });
  }

  // 2. The hero intro is CSS keyframes (see Hero.astro) so it starts at first
  // paint and never depends on this module.

  // Display headings elsewhere rise once, the same way, when they arrive.
  // Hand the hidden state from CSS to GSAP in one synchronous step: drop the
  // CSS rule, then set the same offset inline, so nothing paints in between
  // and GSAP starts from an untransformed element.
  const risers = gsap.utils.toArray<HTMLElement>('[data-rise]');
  root.classList.add('rise-ready');
  gsap.set(risers, { yPercent: 110 });
  risers.forEach((el) => {
    gsap.fromTo(
      el,
      { yPercent: 110 },
      {
        yPercent: 0,
        duration: 1,
        ease: EASE,
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
      },
    );
  });

  // 3a. Statement words.
  const statement = document.querySelector<HTMLElement>('[data-words]');
  if (statement) {
    const words = statement.querySelectorAll<HTMLElement>('.w');
    let lit = -1;
    ScrollTrigger.create({
      trigger: statement,
      start: 'top 85%',
      end: 'bottom 45%',
      scrub: true,
      onUpdate: (self) => {
        const count = Math.round(self.progress * words.length);
        if (count === lit) return;
        lit = count;
        words.forEach((w, i) => w.classList.toggle('on', i < count));
      },
    });
  }

  // 3b. Project images uncover once, from the bottom, as they arrive.
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => el.classList.add('in') });
  });
}
