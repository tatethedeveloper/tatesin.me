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
 *
 * It is drawn at 1 device pixel per CSS pixel, not the display's ratio. A
 * full-viewport canvas at DPR 2 is five megapixels to clear and re-raster
 * every frame, and on a Retina display that alone cost about half the hero's
 * frame budget. The dots are soft, round and never sit against an edge, so
 * there is nothing in this drawing that a second sample per pixel improves.
 *
 * The edge fade is computed here rather than by a CSS mask over the element.
 * A mask on an animating full-screen canvas forces a separate compositing
 * layer to be re-blended every frame; folding the same falloff into each
 * dot's alpha costs one multiply per dot and none per pixel.
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
  /** Dots grouped by opacity step: x, y, r triples, filled once per step. */
  const STEPS = 24;
  let bucketXYR: Float32Array[] = [];
  let bucketN = new Uint16Array(STEPS);
  /** Reciprocals of the fade ellipse's radii, in CSS pixels. */
  let fadeRx = 1;
  let fadeRy = 1;
  let fadeCx = 0;
  let fadeCy = 0;

  const measure = (): void => {
    const rect = host.getBoundingClientRect();
    w = Math.max(1, Math.round(rect.width));
    h = Math.max(1, Math.round(rect.height));
    canvas.width = w;
    canvas.height = h;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // A whole number of cells, centred, so the grid never crops unevenly.
    cols = Math.ceil(w / gap) + 1;
    rows = Math.ceil(h / gap) + 1;
    originX = (w - (cols - 1) * gap) / 2;
    originY = (h - (rows - 1) * gap) / 2;
    // The ellipse the CSS mask described: radial-gradient(125% 105% at
    // 50% 45%, #000 30%, transparent 100%). The percentages are radii, so the
    // ellipse reaches well past the element and only the corners fade much.
    fadeCx = w * 0.5;
    fadeCy = h * 0.45;
    fadeRx = 1 / (w * 1.25);
    fadeRy = 1 / (h * 1.05);
    // Allocated once per resize, not once per frame: at 30fps a fresh set of
    // arrays every frame is garbage the collector has to chase during load.
    const cap = cols * rows * 3;
    bucketXYR = [];
    for (let k = 0; k < STEPS; k++) bucketXYR.push(new Float32Array(cap));
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

    // Dots are collected into a few opacity steps and each step is filled as
    // one path. The eye cannot separate 24 levels of a 4%-to-15% ramp, and it
    // turns roughly 1500 fill calls a frame into at most 24.
    bucketN.fill(0);

    for (let j = 0; j < rows; j++) {
      const y = originY + j * gap;
      const dy = (y - fadeCy) * fadeRy;
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

        // The edge fade, as the CSS mask had it: solid to 30% of the way out,
        // then smoothly to nothing at the ellipse's edge.
        const dx = (x - fadeCx) * fadeRx;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= 1) continue;
        // Linear from the 30% stop outwards, as a CSS gradient interpolates.
        const fade = d <= 0.3 ? 1 : 1 - (d - 0.3) / 0.7;

        // Capped deliberately. The dots are ink on the canvas, so the worst
        // case is body copy read against a dot at full bloom: at 0.15 that
        // pair is 4.9:1, and by a fifth it has dropped under AA. Size carries
        // the bloom instead — which is what a halftone does anyway.
        const alpha = (0.04 + bloom * 0.11) * fade;
        const step = Math.min(STEPS - 1, Math.round((alpha / 0.15) * (STEPS - 1)));
        if (step === 0) continue;
        const arr = bucketXYR[step];
        let at = bucketN[step];
        arr[at] = x;
        arr[at + 1] = y;
        arr[at + 2] = 0.6 + bloom * (gap * 0.22);
        bucketN[step] = at + 3;
      }
    }

    const TAU = Math.PI * 2;
    for (let k = 1; k < STEPS; k++) {
      const count = bucketN[k];
      if (!count) continue;
      const arr = bucketXYR[k];
      ctx.globalAlpha = (k / (STEPS - 1)) * 0.15;
      ctx.beginPath();
      for (let i = 0; i < count; i += 3) {
        const x = arr[i];
        const y = arr[i + 1];
        const r = arr[i + 2];
        ctx.moveTo(x + r, y);
        ctx.arc(x, y, r, 0, TAU);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const frame = (time: number): void => {
    // 30fps. The weather moves at 65px a second, so a frame every 33ms is
    // four pixels of travel — smooth at this speed, and it leaves the rest of
    // the budget to the scene and the scroll.
    if (time - last > 32) {
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
