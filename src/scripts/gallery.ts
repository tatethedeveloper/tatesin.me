/**
 * The work gallery: a horizontal, snapping track of projects.
 *
 * The track scrolls natively, so with no script (or no JS at all) it is still
 * a usable gallery on touch and with a scrollbar. Script adds the things that
 * make it feel like one thing you move through: previous/next, a rail of
 * project names, arrow keys, a live position readout, and dimming of the
 * slides either side of the one being read.
 *
 * All of it is response to input, not ambient motion, so it runs under
 * prefers-reduced-motion too — only the smooth scrolling is dropped.
 */
export function initGallery(): void {
  const root = document.querySelector<HTMLElement>('[data-gallery]');
  if (!root) return;
  const track = root.querySelector<HTMLElement>('[data-track]');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll<HTMLElement>('[data-slide]'));
  if (slides.length === 0) return;
  const prev = root.querySelector<HTMLButtonElement>('[data-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-next]');
  const position = root.querySelector<HTMLElement>('[data-position]');
  const rail = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-goto]'));
  const smooth = !document.documentElement.classList.contains('reduced');

  root.classList.add('ready');

  let current = 0;

  const goTo = (i: number): void => {
    const target = slides[Math.max(0, Math.min(slides.length - 1, i))];
    if (!target) return;
    // Left edge of the slide, minus the track's own start padding, so the
    // slide lands on the page margin rather than under it.
    const pad = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
    track.scrollTo({ left: target.offsetLeft - pad, behavior: smooth ? 'smooth' : 'auto' });
  };

  const setCurrent = (i: number): void => {
    if (i === current) return;
    current = i;
    slides.forEach((s, n) => s.classList.toggle('current', n === i));
    rail.forEach((b, n) => {
      const on = n === i;
      b.classList.toggle('on', on);
      b.setAttribute('aria-current', on ? 'true' : 'false');
    });
    if (position) position.textContent = `${String(i + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  };

  // The buttons follow the scroll extent, not the index: on a wide screen the
  // last two or three slides share the view, so there is nothing left to move
  // to well before the last slide is the leading one.
  const updateEdges = (): void => {
    const max = track.scrollWidth - track.clientWidth;
    if (prev) prev.disabled = track.scrollLeft <= 1;
    if (next) next.disabled = track.scrollLeft >= max - 1;
  };

  // The current slide is whichever one sits nearest the track's start edge.
  // (Read from scroll position rather than from an observer: several slides
  // are visible at once, so "which one entered last" is not the answer.)
  const nearest = (): number => {
    const pad = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
    const x = track.scrollLeft + pad;
    let best = 0;
    let bestGap = Infinity;
    slides.forEach((s, i) => {
      const gap = Math.abs(s.offsetLeft - x);
      if (gap < bestGap) {
        bestGap = gap;
        best = i;
      }
    });
    return best;
  };

  let queued = false;
  track.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        setCurrent(nearest());
        updateEdges();
      });
    },
    { passive: true },
  );

  prev?.addEventListener('click', () => goTo(current - 1));
  next?.addEventListener('click', () => goTo(current + 1));
  rail.forEach((b, i) => b.addEventListener('click', () => goTo(i)));

  track.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') goTo(current + 1);
    else if (e.key === 'ArrowLeft') goTo(current - 1);
    else if (e.key === 'Home') goTo(0);
    else if (e.key === 'End') goTo(slides.length - 1);
    else return;
    e.preventDefault();
  });

  // Tabbing to a link inside a slide should bring that slide into view.
  slides.forEach((slide, i) => {
    slide.querySelector('a')?.addEventListener('focus', () => {
      if (i !== current) goTo(i);
    });
  });

  // A sideways trackpad gesture over the gallery moves the track. Lenis owns
  // the page's wheel handling on window, so stop the event here first.
  track.addEventListener(
    'wheel',
    (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.stopPropagation();
      track.scrollLeft += e.deltaX;
    },
    { passive: true },
  );

  window.addEventListener('resize', updateEdges, { passive: true });

  // Initial state.
  slides[0].classList.add('current');
  updateEdges();
}
