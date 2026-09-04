/**
 * Dot bloom: a halftone dot matrix with patches of light drifting across it.
 *
 * Canvas 2D, not WebGL. The whole effect is a grid of dots whose radius and
 * opacity are driven by two layers of value noise sliding in different
 * directions, so light gathers, spreads and moves on without ever repeating.
 * At this dot count that is a few hundred fills a frame, which costs less than
 * standing up a second WebGL context beside the structure scene.
 *
 * It draws in the element's own `color`, so the palette stays in CSS.
 *
 * Rules it keeps to (see CLAUDE.md §5): it stops when off-screen and when the
 * tab is hidden, it caps the pixel ratio, and under prefers-reduced-motion it
 * paints one frame and never animates.
 */

interface Options {
  /** Distance between dots, in CSS pixels. */
  gap?: number;
  /** Drift rate. 1 is the reference speed. */
  speed?: number;
}

/** 32-bit hash of a lattice point, returned as 0..1. */
function hash(x: number, y: number): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

/** Value noise with a smoothstep fade: smooth, cheap, and good enough for cloud. */
function noise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return (a + (b - a) * u) * (1 - v) + (c + (d - c) * u) * v;
}

export function dotBloom(host: HTMLElement, { gap = 26, speed = 1 }: Options = {}): () => void {
  const canvas = host.querySelector('canvas');
  const ctx = canvas?.getContext('2d', { alpha: true });
  if (!canvas || !ctx) return () => {};

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let w = 0;
  let h = 0;
  let cols = 0;
  let rows = 0;
  let originX = 0;
  let originY = 0;
  let colour = '#26251e';
  let raf = 0;
  let visible = false;
  let last = 0;

  const measure = (): void => {
    const rect = host.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // A whole number of cells, centred, so the grid never crops unevenly.
    cols = Math.ceil(w / gap) + 1;
    rows = Math.ceil(h / gap) + 1;
    originX = (w - (cols - 1) * gap) / 2;
    originY = (h - (rows - 1) * gap) / 2;
    colour = getComputedStyle(host).color || colour;
  };

  const draw = (time: number): void => {
    const t = time / 1000;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = colour;

    // Two layers, sliding in different directions: the coarse one decides
    // where the weather is (a patch is roughly 300px across), the finer one
    // breaks up its edges so nothing reads as a circle.
    const s1 = 0.0034;
    const s2 = s1 * 2.4;

    for (let j = 0; j < rows; j++) {
      const y = originY + j * gap;
      for (let i = 0; i < cols; i++) {
        const x = originX + i * gap;
        // The rates are in noise units: at s1 one unit is ~300px, so the
        // coarse layer crosses the screen at roughly 65px a second. Slow
        // enough to read as weather, fast enough to be obviously moving.
        const n =
          noise(x * s1 + t * 0.22 * speed, y * s1 + t * 0.12 * speed) * 0.62 +
          noise(x * s2 - t * 0.16 * speed, y * s2 + t * 0.26 * speed) * 0.38;

        // smoothstep(0.42, 0.86): most of the grid stays a faint matrix, and
        // only the crests of the noise bloom.
        const e = Math.min(1, Math.max(0, (n - 0.42) / 0.44));
        const bloom = e * e * (3 - 2 * e);

        // Capped deliberately. The dots are ink on the canvas, so the worst
        // case is body copy read against a dot at full bloom: at 0.15 that
        // pair is 4.9:1, and by a fifth it has dropped under AA. Size carries
        // the bloom instead — which is what a halftone does anyway.
        ctx.globalAlpha = 0.04 + bloom * 0.11;
        const r = 0.6 + bloom * (gap * 0.22);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  const frame = (time: number): void => {
    // ~36fps is plenty for weather this slow, and it halves the cost.
    if (time - last > 27) {
      last = time;
      draw(time);
    }
    raf = requestAnimationFrame(frame);
  };

  const run = (): void => {
    if (raf || !visible || document.hidden) return;
    if (still) {
      draw(0);
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  const stop = (): void => {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  measure();

  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
      if (visible) run();
      else stop();
    },
    { rootMargin: '120px' },
  );
  io.observe(host);

  const onVisibility = (): void => (document.hidden ? stop() : run());
  document.addEventListener('visibilitychange', onVisibility);

  const ro = new ResizeObserver(() => {
    measure();
    if (still && visible) draw(0);
  });
  ro.observe(host);

  return () => {
    stop();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
