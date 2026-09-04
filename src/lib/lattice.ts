/**
 * The growth rule for the structure. Pure and deterministic: the same list of
 * commits always produces the same drawing. Used at build time for the SVG
 * and in the browser for the Three.js scene, so the two are the same thing.
 *
 * Rule: the structure is a tower and each commit adds one floor. A floor is
 * a square ring of four beams, plus four columns rising from the floor below
 * it. Each floor is rotated and scaled slightly against the previous one by
 * a hash of the commit, so the tower twists and tapers by an amount that is
 * fixed by the history rather than chosen.
 *
 * An earlier rule added a single strut per commit on a cubic lattice. At this
 * repository's size that drew a handful of sprawling arms rather than
 * anything that read as a structure, so it was replaced.
 */

export type Vec3 = [number, number, number];

export interface Strut {
  a: Vec3;
  b: Vec3;
  /** Index of the commit that added the strut, oldest = 0. */
  index: number;
  /** Beams run around a floor; columns rise between floors. */
  kind: 'beam' | 'column';
}

/** Floor height and the half-width of the base, in scene units. */
const FLOOR_H = 0.44;
const BASE_R = 1.85;

/** Small deterministic hash of a string to a float in [0, 1). */
function hash01(seed: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let k = 0; k < seed.length; k++) {
    h ^= seed.charCodeAt(k);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10007) / 10007;
}

/** The four corners of floor i. */
function corners(y: number, r: number, twist: number): Vec3[] {
  const out: Vec3[] = [];
  for (let c = 0; c < 4; c++) {
    const a = twist + (c * Math.PI) / 2 + Math.PI / 4;
    out.push([Math.cos(a) * r, y, Math.sin(a) * r]);
  }
  return out;
}

export function grow(seeds: string[]): Strut[] {
  const struts: Strut[] = [];
  if (seeds.length === 0) return struts;

  let twist = 0;
  let r = BASE_R;
  let prev: Vec3[] | null = null;

  seeds.forEach((seed, i) => {
    // Each commit turns and narrows the tower a little. The amounts are
    // bounded so a long history stays a tower rather than a spiral or a spike.
    if (i > 0) {
      twist += 0.07 + hash01(seed, 1) * 0.13;
      r *= 0.972 + hash01(seed, 2) * 0.032;
    }
    const y = i * FLOOR_H;
    const ring = corners(y, r, twist);

    // Columns first, so a floor reads as rising from the one below it.
    if (prev) {
      for (let c = 0; c < 4; c++) {
        struts.push({ a: prev[c], b: ring[c], index: i, kind: 'column' });
      }
    }
    for (let c = 0; c < 4; c++) {
      struts.push({ a: ring[c], b: ring[(c + 1) % 4], index: i, kind: 'beam' });
    }
    prev = ring;
  });

  return struts;
}

/** Axis-aligned bounds, for centring the drawing. */
export function bounds(struts: Strut[]): { min: Vec3; max: Vec3; centre: Vec3 } {
  const min: Vec3 = [Infinity, Infinity, Infinity];
  const max: Vec3 = [-Infinity, -Infinity, -Infinity];
  for (const s of struts) {
    for (const p of [s.a, s.b]) {
      for (let k = 0; k < 3; k++) {
        if (p[k] < min[k]) min[k] = p[k];
        if (p[k] > max[k]) max[k] = p[k];
      }
    }
  }
  if (!struts.length) return { min: [0, 0, 0], max: [0, 0, 0], centre: [0, 0, 0] };
  return { min, max, centre: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2] };
}

const key = (v: Vec3) => v.map((n) => n.toFixed(4)).join(',');

/** Every distinct node in the structure. */
export function uniqueNodes(struts: Strut[]): Vec3[] {
  const seen = new Map<string, Vec3>();
  for (const s of struts) {
    seen.set(key(s.a), s.a);
    seen.set(key(s.b), s.b);
  }
  return [...seen.values()];
}

/**
 * Orthographic projection for the SVG fallback, using the rotation the scene
 * starts from, so switching between the two does not change the drawing.
 */
export function project(p: Vec3, centre: Vec3): [number, number] {
  const x = p[0] - centre[0];
  const y = p[1] - centre[1];
  const z = p[2] - centre[2];
  const yaw = Math.PI / 5;
  const tilt = 0.52;
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
  return [x1, -y2];
}
