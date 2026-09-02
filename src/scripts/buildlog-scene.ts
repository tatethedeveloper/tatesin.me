/**
 * Three.js scene for the build log. Loaded lazily by BuildLog.astro, only
 * when WebGL is available and the visitor has not asked for reduced motion.
 *
 * Renders on demand, not on a loop: a frame is drawn during the assembly
 * sequence, while dragging, and when the hovered strut changes. Otherwise
 * nothing runs, so a background tab costs nothing.
 */
import { WebGLRenderer } from 'three/src/renderers/WebGLRenderer.js';
import { Scene } from 'three/src/scenes/Scene.js';
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

type Vec3 = [number, number, number];

export interface BuildLogData {
  struts: [Vec3, Vec3][];
  commits: { h: string; s: string; d: string }[];
}

const INK = new Color('#16202b');
const ACCENT = new Color('#b8450b');
const ASSEMBLE_MS = 1200;
/** Strut thickness in lattice units. Real geometry, so it survives any DPR. */
const STRUT = 0.035;
const NODE = 0.08;

export function mount(stage: HTMLElement, data: BuildLogData): void {
  const fallback = stage.querySelector<SVGElement>('[data-fallback]');
  const tip = stage.querySelector<HTMLElement>('[data-tip]');
  const hint = document.querySelector<HTMLElement>('[data-hint]');
  const { struts, commits } = data;
  const n = struts.length;

  // Struts are thin boxes, one instance per commit; nodes are small cubes.
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

  const strutGeo = new BoxGeometry(STRUT, 1, STRUT);
  const strutMat = new MeshBasicMaterial();
  const strutMesh = new InstancedMesh(strutGeo, strutMat, n);
  const up = new Vector3(0, 1, 0);
  const m = new Matrix4();
  const q = new Quaternion();
  struts.forEach(([a, b], i) => {
    const va = new Vector3(...a);
    const vb = new Vector3(...b);
    const dir = vb.clone().sub(va);
    const len = dir.length();
    q.setFromUnitVectors(up, dir.normalize());
    m.compose(va.add(vb).multiplyScalar(0.5), q, new Vector3(1, len, 1));
    strutMesh.setMatrixAt(i, m);
    strutMesh.setColorAt(i, i === n - 1 ? ACCENT : INK);
  });
  const setStrutColor = (i: number, c: Color) => {
    strutMesh.setColorAt(i, c);
    if (strutMesh.instanceColor) strutMesh.instanceColor.needsUpdate = true;
  };

  const nodeGeo = new BoxGeometry(NODE, NODE, NODE);
  const nodeMat = new MeshBasicMaterial({ color: INK });
  const nodeMesh = new InstancedMesh(nodeGeo, nodeMat, nodeSet.size);
  let k = 0;
  for (const p of nodeSet.values()) {
    m.makeTranslation(p[0], p[1], p[2]);
    nodeMesh.setMatrixAt(k++, m);
  }

  const group = new Group();
  group.add(strutMesh, nodeMesh);
  group.position.copy(centre).negate();
  const rig = new Group();
  rig.add(group);
  // Start from the same angle as the SVG projection.
  rig.rotation.y = Math.PI / 4;
  rig.rotation.x = Math.atan(1 / Math.sqrt(2));

  const scene = new Scene();
  scene.add(rig);

  const camera = new PerspectiveCamera(28, 1, 0.1, 100);
  const fit = () => {
    const fov = (camera.fov * Math.PI) / 180;
    const dist = (radius * 1.15) / Math.sin(fov / 2);
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
  };

  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const canvas = renderer.domElement;
  stage.appendChild(canvas);
  if (fallback) fallback.setAttribute('hidden', ''); // SVGElement has no .hidden property
  if (hint) hint.hidden = false;

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fit();
    requestRender();
  };

  // Render on demand.
  let raf = 0;
  let visible = true;
  const render = () => {
    raf = 0;
    if (!visible || document.hidden) return;
    renderer.render(scene, camera);
  };
  const requestRender = () => {
    if (!raf) raf = requestAnimationFrame(render);
  };

  // Assembly: draw the struts in commit order over ASSEMBLE_MS with an ease-out.
  // Bounds must be computed with every strut present, otherwise the sphere
  // used for raycasting and culling is empty for the life of the scene.
  strutMesh.computeBoundingSphere();
  strutMesh.frustumCulled = false;
  strutMesh.count = 0;
  let start = 0;
  const assemble = (t: number) => {
    if (!start) start = t;
    const p = Math.min((t - start) / ASSEMBLE_MS, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    strutMesh.count = Math.round(eased * n);
    renderer.render(scene, camera);
    if (p < 1) requestAnimationFrame(assemble);
  };

  // Orbit by dragging. No inertia; the structure stops when the hand does.
  let dragging = false;
  let last = { x: 0, y: 0 };
  const onDown = (e: PointerEvent) => {
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
      rig.rotation.y += dx * 0.008;
      rig.rotation.x = Math.max(-1.2, Math.min(1.2, rig.rotation.x + dy * 0.008));
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
  const hover = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(strutMesh, false)[0];
    const idx = hit && hit.instanceId !== undefined ? hit.instanceId : -1;
    if (idx !== hovered) {
      if (hovered >= 0) setStrutColor(hovered, hovered === n - 1 ? ACCENT : INK);
      hovered = idx;
      if (hovered >= 0) setStrutColor(hovered, ACCENT);
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
      setStrutColor(hovered, hovered === n - 1 ? ACCENT : INK);
      hovered = -1;
      requestRender();
    }
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', hideTip);

  // Pause when off-screen or the tab is hidden; redraw when back.
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) requestRender();
  });
  io.observe(stage);
  const onVisibility = () => {
    if (!document.hidden) requestRender();
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
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      strutGeo.dispose();
      nodeGeo.dispose();
      strutMat.dispose();
      nodeMat.dispose();
      strutMesh.dispose();
      nodeMesh.dispose();
      renderer.dispose();
    },
    { once: true },
  );
}
