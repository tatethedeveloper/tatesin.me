/**
 * The growth rule for the build log. Pure and deterministic: the same list of
 * commits always produces the same structure. Used at build time to draw the
 * SVG fallback and in the browser to draw the Three.js scene, so the two are
 * the same drawing.
 *
 * Rule: the structure lives on a unit cubic lattice and starts at the origin.
 * Each commit adds one strut from an existing node to an unvisited neighbour.
 * Candidates are scored by distance from the origin, flattened on the vertical
 * axis so the structure grows wider than tall, plus a small hash-seeded
 * jitter so it is not a perfect crystal. Lowest score wins.
 */

export type Vec3 = [number, number, number];

export interface Strut {
  a: Vec3;
  b: Vec3;
  /** Index of the commit that added the strut, oldest = 0. */
  index: number;
}

const DIRS: Vec3[] = [
  [1, 0, 0],
  [-1, 0, 0],
  [0, 1, 0],
  [0, -1, 0],
  [0, 0, 1],
  [0, 0, -1],
];

const key = (v: Vec3) => `${v[0]},${v[1]},${v[2]}`;

/** Small deterministic hash to a float in [0, 1). */
function jitter(seed: string, i: number): number {
  let h = 2166136261 ^ i;
  for (let k = 0; k < seed.length; k++) {
    h ^= seed.charCodeAt(k);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10007) / 10007;
}

export function grow(seeds: string[]): Strut[] {
  const nodes: Vec3[] = [[0, 0, 0]];
  const visited = new Set<string>([key(nodes[0])]);
  const struts: Strut[] = [];

  for (let i = 0; i < seeds.length; i++) {
    let best: { a: Vec3; b: Vec3; score: number } | null = null;
    for (const a of nodes) {
      for (const d of DIRS) {
        const b: Vec3 = [a[0] + d[0], a[1] + d[1], a[2] + d[2]];
        if (visited.has(key(b))) continue;
        // Never grow below the ground plane; the thing is built up from a base.
        if (b[1] < 0) continue;
        const score =
          b[0] * b[0] + b[2] * b[2] + 1.3 * b[1] * b[1] + 2.5 * jitter(seeds[i], nodes.indexOf(a) * 7 + DIRS.indexOf(d));
        if (best === null || score < best.score) best = { a, b, score };
      }
    }
    if (best === null) break;
    nodes.push(best.b);
    visited.add(key(best.b));
    struts.push({ a: best.a, b: best.b, index: i });
  }
  return struts;
}

/** Axis-aligned bounds, for centring the drawing. */
export function bounds(struts: Strut[]): { min: Vec3; max: Vec3; centre: Vec3 } {
  const min: Vec3 = [0, 0, 0];
  const max: Vec3 = [0, 0, 0];
  for (const s of struts) {
    for (const p of [s.a, s.b]) {
      for (let k = 0; k < 3; k++) {
        if (p[k] < min[k]) min[k] = p[k];
        if (p[k] > max[k]) max[k] = p[k];
      }
    }
  }
  return { min, max, centre: [(min[0] + max[0]) / 2, (min[1] + max[1]) / 2, (min[2] + max[2]) / 2] };
}

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
 * Orthographic projection for the SVG fallback, using the same rotation the
 * scene starts from (yaw 45 degrees, then the isometric tilt), so switching
 * between the two does not change the drawing.
 */
export function project(p: Vec3, centre: Vec3): [number, number] {
  const x = p[0] - centre[0];
  const y = p[1] - centre[1];
  const z = p[2] - centre[2];
  const yaw = Math.PI / 4;
  const tilt = Math.atan(1 / Math.sqrt(2));
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
  return [x1, -y2];
}
