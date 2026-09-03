/**
 * The page's scroll behaviour. Three things, each carrying meaning:
 *  1. Smooth scroll (Lenis) on fine-pointer devices, so the camera and the
 *     sticky stack move at a rate the eye can follow.
 *  2. The statement's words brighten in reading order with scroll progress.
 *  3. Each project visual reveals with a clip as its panel arrives.
 * Everything here is skipped under prefers-reduced-motion; the CSS then shows
 * the finished state of each.
 */
import { scroll, inView } from 'motion';

export function start(): void {
  const root = document.documentElement;
  if (root.classList.contains('reduced')) return;

  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (fine) {
    import('lenis').then(({ default: Lenis }) => {
      const lenis = new Lenis({ lerp: 0.09, anchors: { offset: -16 } });
      const raf = (t: number) => {
        lenis.raf(t);
        requestAnimationFrame(raf);
      };
      requestAnimationFrame(raf);
    });
  }

  const statement = document.querySelector<HTMLElement>('[data-words]');
  if (statement) {
    const words = [...statement.querySelectorAll<HTMLElement>('.w')];
    let lit = -1;
    scroll(
      (p: number) => {
        const count = Math.round(p * words.length);
        if (count === lit) return;
        lit = count;
        words.forEach((w, i) => w.classList.toggle('on', i < count));
      },
      { target: statement, offset: ['start 85%', 'end 45%'] },
    );
  }

  inView(
    '[data-reveal]',
    (el) => {
      el.classList.add('in');
    },
    { amount: 0.35 },
  );
}
