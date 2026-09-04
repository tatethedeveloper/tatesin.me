/**
 * Three.js scene for the structure: this repository's commit history as a
 * lattice. Loaded lazily by Structure.astro when WebGL is available, the
 * device is not low-powered and the visitor has not asked for reduced motion.
 *
 * Two layers:
 *  - The structure itself: rendered on demand (assembly, tilt settling,
 *    drag, hover, scroll).
 *  - The field beneath it: a sparse ground of points joined to their near
 *    neighbours, drifting slowly (the idea is Vanta's NET/dots, built here on
 *    the same renderer rather than a second Three.js). It runs a light loop
 *    only while the hero is on screen and the tab is visible, and it fades
 *    out as the visitor scrolls away, so the page never pays for it.
 */
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
import { Scene } from 'three/src/scenes/Scene.js';
import { Fog } from 'three/src/scenes/Fog.js';
import { PerspectiveCamera } from 'three/src/cameras/PerspectiveCamera.js';
import { Group } from 'three/src/objects/Group.js';
import { InstancedMesh } from 'three/src/objects/InstancedMesh.js';
import { BoxGeometry } from 'three/src/geometries/BoxGeometry.js';
import { MeshBasicMaterial } from 'three/src/materials/MeshBasicMaterial.js';
import { Raycaster } from 'three/src/core/Raycaster.js';
import { Vector2 } from 'three/src/math/Vector2.js';
import { Vector3 } from 'three/src/math/Vector3.js';
import { Quaternion } from 'three/src/math/Quaternion.js';
import { Matrix4 } from 'three/src/math/Matrix4.js';
import { Color } from 'three/src/math/Color.js';
import { AdditiveBlending } from 'three/src/constants.js';
import { Points } from 'three/src/objects/Points.js';
import { PointsMaterial } from 'three/src/materials/PointsMaterial.js';
import { LineSegments } from 'three/src/objects/LineSegments.js';
import { LineBasicMaterial } from 'three/src/materials/LineBasicMaterial.js';
import { BufferGeometry } from 'three/src/core/BufferGeometry.js';
import { Float32BufferAttribute } from 'three/src/core/BufferAttribute.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

type Vec3 = [number, number, number];

export interface StructureData {
  struts: [Vec3, Vec3][];
  commits: { h: string; s: string; d: string }[];
}

const GROUND = new Color('#0b1224');
const STRUT_COLOR = new Color('#c9cfdd');
const NODE_COLOR = new Color('#ede9e3');
const PULSE = new Color('#ffb238');
const ASSEMBLE_MS = 1400;
/** Strut thickness in lattice units. Real geometry, so it survives any DPR. */
const STRUT = 0.04;
const NODE = 0.09;
const EASE_OUT = (p: number) => 1 - Math.pow(1 - p, 3);

export function mount(stage: HTMLElement, data: StructureData, opts: { scrollTarget?: HTMLElement | null }): void {
  const fallback = stage.querySelector<SVGElement>('[data-fallback]');
  const tip = stage.querySelector<HTMLElement>('[data-tip]');
  const hint = document.querySelector<HTMLElement>('[data-hint]');
  const { struts, commits } = data;
  const n = struts.length;

  // Bounds, for centring and for the camera fit.
  const centre = new Vector3();
  const min = new Vector3(Infinity, Infinity, Infinity);
  const max = new Vector3(-Infinity, -Infinity, -Infinity);
  const nodeSet = new Map<string, Vec3>();
  for (const [a, b] of struts) {
    for (const p of [a, b]) {
      nodeSet.set(p.join(','), p);
      min.min(new Vector3(...p));
      max.max(new Vector3(...p));
    }
  }
  centre.addVectors(min, max).multiplyScalar(0.5);
  const radius = Math.max(max.clone().sub(min).length() / 2, 1.5);

  // Each strut is a thin box from a to b. Its full matrix is kept so the
  // assembly can grow it from a toward b, then restore it.
  const up = new Vector3(0, 1, 0);
  const m = new Matrix4();
  const q = new Quaternion();
  const starts: Vector3[] = [];
  const dirs: Vector3[] = [];
  const lens: number[] = [];
  struts.forEach(([a, b]) => {
    const va = new Vector3(...a);
    const vb = new Vector3(...b);
    const dir = vb.clone().sub(va);
    lens.push(dir.length());
    dirs.push(dir.normalize());
    starts.push(va);
  });
  const setStrut = (mesh: InstancedMesh, i: number, t: number, thick: number) => {
    const len = lens[i] * t;
    q.setFromUnitVectors(up, dirs[i]);
    const mid = starts[i].clone().addScaledVector(dirs[i], len / 2);
    m.compose(mid, q, new Vector3(thick, Math.max(len, 1e-4), thick));
    mesh.setMatrixAt(i, m);
  };

  const strutGeo = new BoxGeometry(1, 1, 1);
  const strutMat = new MeshBasicMaterial();
  const strutMesh = new InstancedMesh(strutGeo, strutMat, n);
  // A second, wider pass at low opacity reads as light bleeding off the strut.
  const glowMat = new MeshBasicMaterial({ transparent: true, opacity: 0.16, blending: AdditiveBlending, depthWrite: false });
  const glowMesh = new InstancedMesh(strutGeo, glowMat, n);
  const paint = (i: number, c: Color) => {
    strutMesh.setColorAt(i, c);
    glowMesh.setColorAt(i, c);
  };
  for (let i = 0; i < n; i++) {
    setStrut(strutMesh, i, 1, STRUT);
    setStrut(glowMesh, i, 1, STRUT * 4);
    paint(i, i === n - 1 ? PULSE : STRUT_COLOR);
  }
  const colorsDirty = () => {
    if (strutMesh.instanceColor) strutMesh.instanceColor.needsUpdate = true;
    if (glowMesh.instanceColor) glowMesh.instanceColor.needsUpdate = true;
  };

  const nodeGeo = new BoxGeometry(NODE, NODE, NODE);
  const nodeMat = new MeshBasicMaterial({ color: NODE_COLOR });
  const nodeMesh = new InstancedMesh(nodeGeo, nodeMat, nodeSet.size);
  let k = 0;
  for (const p of nodeSet.values()) {
    m.makeTranslation(p[0], p[1], p[2]);
    nodeMesh.setMatrixAt(k++, m);
  }

  // The field. Points on a disc at ground level, joined where they are near.
  const FIELD_N = 150;
  const fieldR = radius * 3.4;
  const groundY = min.y - 0.35;
  const base = new Float32Array(FIELD_N * 3);
  const phase = new Float32Array(FIELD_N);
  let seed = 1234567;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i < FIELD_N; i++) {
    const r = fieldR * Math.sqrt(rnd());
    const a = rnd() * Math.PI * 2;
    base[i * 3] = centre.x + Math.cos(a) * r;
    base[i * 3 + 1] = groundY;
    base[i * 3 + 2] = centre.z + Math.sin(a) * r;
    phase[i] = rnd() * Math.PI * 2;
  }
  const pairs: number[] = [];
  const linkD = fieldR * 0.26;
  for (let i = 0; i < FIELD_N; i++) {
    for (let j = i + 1; j < FIELD_N; j++) {
      const dx = base[i * 3] - base[j * 3];
      const dz = base[i * 3 + 2] - base[j * 3 + 2];
      if (dx * dx + dz * dz < linkD * linkD) pairs.push(i, j);
    }
  }
  const fieldPos = new Float32Array(base);
  const pointGeo = new BufferGeometry();
  pointGeo.setAttribute('position', new Float32BufferAttribute(fieldPos, 3));
  const pointMat = new PointsMaterial({ color: STRUT_COLOR, size: 0.045, transparent: true, opacity: 0.55, depthWrite: false });
  const points = new Points(pointGeo, pointMat);
  const linePos = new Float32Array(pairs.length * 3);
  const lineGeo = new BufferGeometry();
  lineGeo.setAttribute('position', new Float32BufferAttribute(linePos, 3));
  const lineMat = new LineBasicMaterial({ color: STRUT_COLOR, transparent: true, opacity: 0.12, depthWrite: false });
  const lines = new LineSegments(lineGeo, lineMat);
  const field = new Group();
  field.add(lines, points);
  const FIELD_POINT_OPACITY = 0.55;
  const FIELD_LINE_OPACITY = 0.12;
  const driftField = (t: number) => {
    const amp = 0.09;
    for (let i = 0; i < FIELD_N; i++) {
      fieldPos[i * 3 + 1] = base[i * 3 + 1] + Math.sin(t * 0.0006 + phase[i]) * amp;
    }
    for (let k = 0; k < pairs.length; k++) {
      const i = pairs[k];
      linePos[k * 3] = fieldPos[i * 3];
      linePos[k * 3 + 1] = fieldPos[i * 3 + 1];
      linePos[k * 3 + 2] = fieldPos[i * 3 + 2];
    }
    pointGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.position.needsUpdate = true;
  };
  driftField(0);

  const group = new Group();
  group.add(field, glowMesh, strutMesh, nodeMesh);
  group.position.copy(centre).negate();
  const rig = new Group();
  rig.add(group);
  // Start from the same angle as the SVG projection.
  const BASE_YAW = Math.PI / 4;
  const BASE_TILT = Math.atan(1 / Math.sqrt(2));
  rig.rotation.y = BASE_YAW;
  rig.rotation.x = BASE_TILT;
  // The pointer tilts the rig a few degrees around wherever the drag left it.
  const tilt = new Group();
  tilt.add(rig);

  const scene = new Scene();
  scene.background = null;
  const fog = new Fog(GROUND, 0, 1);
  scene.fog = fog;
  scene.add(tilt);

  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  let baseDist = 10;
  const fit = () => {
    const fov = (camera.fov * Math.PI) / 180;
    baseDist = (radius * 1.1) / Math.sin(fov / 2);
    applyScroll();
  };

  // Scroll pulls the camera back and lifts the structure out of the page.
  let scrollP = 0;
  const applyScroll = () => {
    const dist = baseDist * (1 + scrollP * 0.9);
    camera.position.set(0, scrollP * radius * 0.6, dist);
    camera.lookAt(0, scrollP * radius * 1.2, 0);
    rig.rotation.y = BASE_YAW + scrollP * 0.9 + dragYaw;
    fog.near = dist - radius * 0.2;
    fog.far = dist + radius * 2.6;
    const keep = Math.max(0, 1 - scrollP * 1.6);
    pointMat.opacity = FIELD_POINT_OPACITY * keep;
    lineMat.opacity = FIELD_LINE_OPACITY * keep;
    field.visible = keep > 0;
  };
  let dragYaw = 0;

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  stage.appendChild(canvas);
  if (fallback) fallback.setAttribute('hidden', '');
  if (hint) hint.hidden = false;

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fit();
    requestRender();
  };

  // Render on demand.
  let raf = 0;
  let visible = true;
  let assembling = true;
  const render = () => {
    raf = 0;
    if (!visible || document.hidden) return;
    renderer.render(scene, camera);
  };
  const requestRender = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };

  // The field's loop. Runs only while the stage is on screen, the tab is
  // visible and the field has not faded out. Draws the whole scene, so the
  // on-demand path is a no-op while this is running.
  let fieldRaf = 0;
  const fieldTick = (t: number) => {
    fieldRaf = 0;
    if (!visible || document.hidden || !field.visible) return;
    driftField(t);
    if (!assembling) renderer.render(scene, camera);
    fieldRaf = requestAnimationFrame(fieldTick);
  };
  const wakeField = () => {
    if (!fieldRaf && visible && !document.hidden && field.visible) fieldRaf = requestAnimationFrame(fieldTick);
  };

  // Assembly: each strut grows from its start node in commit order, staggered
  // across ASSEMBLE_MS with an ease-out. Bounds are computed with every strut
  // present first so raycasting works for the life of the scene.
  strutMesh.computeBoundingSphere();
  strutMesh.frustumCulled = false;
  glowMesh.frustumCulled = false;
  const stagger = 0.6; // share of the total time spent staggering starts
  const each = ASSEMBLE_MS * (1 - stagger);
  let start = 0;
  const assemble = (t: number) => {
    if (!start) start = t;
    const elapsed = t - start;
    let done = true;
    for (let i = 0; i < n; i++) {
      const s0 = (ASSEMBLE_MS * stagger * i) / Math.max(n - 1, 1);
      const p = Math.min(Math.max((elapsed - s0) / each, 0), 1);
      if (p < 1) done = false;
      const e = EASE_OUT(p);
      setStrut(strutMesh, i, e, STRUT);
      setStrut(glowMesh, i, e, STRUT * 4);
    }
    strutMesh.instanceMatrix.needsUpdate = true;
    glowMesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
    if (!done) requestAnimationFrame(assemble);
    else {
      assembling = false;
      wakeField();
    }
  };

  // Pointer tilt: a few degrees toward the cursor, eased. Runs a short loop
  // only until it settles. Fine pointers only; touch scrolls instead.
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let targetTx = 0;
  let targetTy = 0;
  let tiltRaf = 0;
  const settle = () => {
    tiltRaf = 0;
    const dx = targetTx - tilt.rotation.x;
    const dy = targetTy - tilt.rotation.y;
    tilt.rotation.x += dx * 0.08;
    tilt.rotation.y += dy * 0.08;
    if (!assembling) renderer.render(scene, camera);
    if (Math.abs(dx) > 1e-4 || Math.abs(dy) > 1e-4) tiltRaf = requestAnimationFrame(settle);
  };
  const onWindowMove = (e: PointerEvent) => {
    if (dragging) return;
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetTy = nx * 0.12;
    targetTx = ny * 0.08;
    if (!tiltRaf) tiltRaf = requestAnimationFrame(settle);
  };
  if (fine) window.addEventListener('pointermove', onWindowMove, { passive: true });

  // Orbit by dragging. No inertia; the structure stops when the hand does.
  let dragging = false;
  let last = { x: 0, y: 0 };
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return; // touch scrolls the page
    dragging = true;
    last = { x: e.clientX, y: e.clientY };
    stage.classList.add('dragging');
    canvas.setPointerCapture(e.pointerId);
    hideTip();
  };
  const onMove = (e: PointerEvent) => {
    if (dragging) {
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      dragYaw += dx * 0.008;
      rig.rotation.x = Math.max(-1.2, Math.min(1.2, rig.rotation.x + dy * 0.008));
      applyScroll();
      requestRender();
      return;
    }
    hover(e);
  };
  const onUp = (e: PointerEvent) => {
    dragging = false;
    stage.classList.remove('dragging');
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
  };

  // Hover: which strut is under the pointer, and which commit that is.
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let hovered = -1;
  const restore = (i: number) => paint(i, i === n - 1 ? PULSE : STRUT_COLOR);
  const hover = (e: PointerEvent) => {
    if (!fine) return;
    const rect = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(strutMesh, false)[0];
    const idx = hit && hit.instanceId !== undefined ? hit.instanceId : -1;
    if (idx !== hovered) {
      if (hovered >= 0) restore(hovered);
      hovered = idx;
      if (hovered >= 0) paint(hovered, PULSE);
      colorsDirty();
      requestRender();
    }
    if (tip) {
      if (idx >= 0 && commits[idx]) {
        tip.textContent = '';
        const subject = document.createElement('span');
        subject.textContent = commits[idx].s;
        const when = document.createElement('span');
        when.className = 'when';
        when.textContent = `${commits[idx].h}  ${commits[idx].d}`;
        tip.append(subject, when);
        tip.style.left = `${e.clientX - rect.left}px`;
        tip.style.top = `${e.clientY - rect.top}px`;
        tip.hidden = false;
      } else {
        tip.hidden = true;
      }
    }
  };
  const hideTip = () => {
    if (tip) tip.hidden = true;
    if (hovered >= 0) {
      restore(hovered);
      colorsDirty();
      hovered = -1;
      requestRender();
    }
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', hideTip);

  // Scroll progress across the hero drives the camera and fades the field.
  gsap.registerPlugin(ScrollTrigger);
  const trigger = ScrollTrigger.create({
    trigger: opts.scrollTarget ?? stage,
    start: 'top top',
    end: 'bottom top',
    scrub: true,
    onUpdate: (self) => {
      scrollP = self.progress;
      applyScroll();
      if (!assembling) requestRender();
      wakeField();
    },
  });

  // Pause when off-screen or the tab is hidden; redraw when back.
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      requestRender();
      wakeField();
    }
  });
  io.observe(stage);
  const onVisibility = () => {
    if (!document.hidden) {
      requestRender();
      wakeField();
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();
  requestAnimationFrame(assemble);

  // Tear down on navigation so nothing leaks between pages.
  window.addEventListener(
    'pagehide',
    () => {
      trigger.kill();
      if (fieldRaf) cancelAnimationFrame(fieldRaf);
      io.disconnect();
      ro.disconnect();
      if (fine) window.removeEventListener('pointermove', onWindowMove);
      document.removeEventListener('visibilitychange', onVisibility);
      strutGeo.dispose();
      nodeGeo.dispose();
      strutMat.dispose();
      glowMat.dispose();
      nodeMat.dispose();
      pointGeo.dispose();
      lineGeo.dispose();
      pointMat.dispose();
      lineMat.dispose();
      strutMesh.dispose();
      glowMesh.dispose();
      nodeMesh.dispose();
      renderer.dispose();
    },
    { once: true },
  );
}
