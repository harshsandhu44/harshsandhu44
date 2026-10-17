// The exploded architecture drawing on a case study. Only components/exploded.tsx imports it, when
// the figure nears the viewport, so the page never pays for three up front. Each part is a white
// wireframe on the blueprint background, shaped by its layer: a screen slab for clients, a box for
// compute, a stack of discs for data and a hex nut for external services. It renders on demand
// (scroll, pointer, highlight), never in a loop.
import * as THREE from "three";
import type { Arch, Layer, Part } from "@/content";

// Top to bottom.
export const LAYERS: Layer[] = ["client", "compute", "data", "external"];

// Width, height and depth of each layer's shape.
const SIZE: Record<Layer, [number, number, number]> = {
  client: [2.4, 0.2, 1.6],
  compute: [1.8, 1.1, 1.4],
  data: [1.8, 1.1, 1.8],
  external: [1.2, 0.4, 1.2],
};

// A balloon sits this far up and right of its part's front top corner.
const LEADER = new THREE.Vector3(0.45, 0.55, 0);

export type Box = { x: number; y: number; w: number; h: number; d: number };

// Where each part sits, in `parts` order, at explode t (0 assembled, 1 apart). Layers stack down
// y and parts spread along x; both gaps open with t. Centred on the origin at every t.
export function layout(parts: Part[], t: number): Box[] {
  const gap = 0.15 + 1.6 * t;
  const out: Box[] = [];
  let y = 0;
  for (const layer of LAYERS) {
    const row = parts.flatMap((p, i) => (p.layer === layer ? [i] : []));
    if (!row.length) continue;
    const [w, h, d] = SIZE[layer];
    const step = w + 0.2 + 1.4 * t;
    row.forEach(
      (i, k) => (out[i] = { x: (k - (row.length - 1) / 2) * step, y: y - h / 2, w, h, d }),
    );
    y -= h + gap;
  }
  const mid = (y + gap) / 2;
  for (const b of out) b.y -= mid;
  return out;
}

function shapes(layer: Layer) {
  const [w, h, d] = SIZE[layer];
  if (layer === "data")
    return [-1, 0, 1].map((k) =>
      new THREE.CylinderGeometry(w / 2, w / 2, h / 3 - 0.08, 32).translate(0, (k * h) / 3, 0),
    );
  if (layer === "external") return [new THREE.CylinderGeometry(w / 2, w / 2, h, 6)];
  return [new THREE.BoxGeometry(w, h, d)];
}

// Segment buffers drawn with a moving end, so updates never allocate.
function segments(max: number, material: THREE.LineBasicMaterial | THREE.LineDashedMaterial) {
  const pos = new THREE.BufferAttribute(new Float32Array(max * 6), 3);
  const dist = new THREE.BufferAttribute(new Float32Array(max * 2), 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", pos);
  g.setAttribute("lineDistance", dist);
  const lines = new THREE.LineSegments(g, material);
  lines.frustumCulled = false;
  let n = 0;
  return {
    lines,
    reset: () => (n = 0),
    add(a: THREE.Vector3, b: THREE.Vector3) {
      pos.setXYZ(n * 2, a.x, a.y, a.z);
      pos.setXYZ(n * 2 + 1, b.x, b.y, b.z);
      dist.setX(n * 2, 0);
      dist.setX(n * 2 + 1, a.distanceTo(b));
      n++;
    },
    done() {
      g.setDrawRange(0, n * 2);
      pos.needsUpdate = dist.needsUpdate = true;
    },
  };
}

export function createExploded(
  host: HTMLElement,
  arch: Arch,
  accent: string,
  // Screen position (CSS px in the host) of each part's balloon, after every render.
  onDraw: (balloons: { x: number; y: number }[]) => void,
) {
  // Throws without WebGL; the figure falls back to its parts list.
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.domElement.style.cssText = "display:block;width:100%;height:100%";
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const white = (opacity: number) =>
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity });
  const edge = white(1);
  const dim = white(0.3);
  const fill = new THREE.MeshBasicMaterial({
    color: accent,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  // Invisible but still hit by the raycaster.
  const ghost = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

  const parts = arch.parts.map((p, i) => {
    const group = new THREE.Group();
    const lines: THREE.LineSegments[] = [];
    const meshes: THREE.Mesh[] = [];
    for (const g of shapes(p.layer)) {
      const m = new THREE.Mesh(g, ghost);
      m.userData.i = i;
      const l = new THREE.LineSegments(new THREE.EdgesGeometry(g, 20), edge);
      meshes.push(m);
      lines.push(l);
      group.add(m, l);
    }
    scene.add(group);
    return { group, lines, meshes };
  });
  const meshes = parts.flatMap((p) => p.meshes);
  const index = new Map(arch.parts.map((p, i) => [p.id, i]));
  const links = arch.links.map(([a, b]) => [index.get(a)!, index.get(b)!] as const);

  const cold = segments(
    links.length,
    new THREE.LineDashedMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      dashSize: 0.16,
      gapSize: 0.12,
    }),
  );
  const hot = segments(links.length, new THREE.LineBasicMaterial({ color: accent }));
  const leaders = segments(parts.length, white(0.8));
  scene.add(cold.lines, hot.lines, leaders.lines);

  let t = 0;
  let yaw = 0;
  let on = -1;
  let frame = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const ends = arch.parts.map(() => new THREE.Vector3());

  const aim = () => {
    camera.position.set(Math.sin(yaw) * 20, 14, Math.cos(yaw) * 20);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
  };

  const place = (boxes: Box[]) => {
    boxes.forEach((x, i) => {
      parts[i]!.group.position.set(x.x, x.y, 0);
      ends[i]!.set(x.x + x.w / 2, x.y + x.h / 2, x.d / 2).add(LEADER);
    });
  };

  function render() {
    frame = 0;
    const boxes = layout(arch.parts, t);
    place(boxes);

    cold.reset();
    hot.reset();
    for (const [i, j] of links) {
      const p = boxes[i]!;
      const q = boxes[j]!;
      if (Math.abs(p.y - q.y) < 0.01) {
        // Same layer: side to side.
        const s = Math.sign(q.x - p.x);
        a.set(p.x + (s * p.w) / 2, p.y, 0);
        b.set(q.x - (s * q.w) / 2, q.y, 0);
      } else {
        const s = Math.sign(p.y - q.y);
        a.set(p.x, p.y - (s * p.h) / 2, 0);
        b.set(q.x, q.y + (s * q.h) / 2, 0);
      }
      (on === i || on === j ? hot : cold).add(a, b);
    }
    cold.done();
    hot.done();

    leaders.reset();
    boxes.forEach((x, i) => {
      a.set(x.x + x.w / 2, x.y + x.h / 2, x.d / 2);
      leaders.add(a, ends[i]!);
    });
    leaders.done();

    aim();
    renderer.render(scene, camera);
    const w = host.clientWidth;
    const h = host.clientHeight;
    onDraw(
      ends.map((e) => {
        a.copy(e).project(camera);
        return { x: ((a.x + 1) / 2) * w, y: ((1 - a.y) / 2) * h };
      }),
    );
  }

  // Coalesces scroll and pointer updates into one render a frame.
  const draw = () => {
    frame ||= requestAnimationFrame(render);
  };

  // Frames the fully exploded drawing, balloons included, from straight on.
  function fit() {
    const w = host.clientWidth;
    const h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const keep = yaw;
    yaw = 0;
    aim();
    yaw = keep;
    const boxes = layout(arch.parts, 1);
    place(boxes);
    const box = new THREE.Box3();
    boxes.forEach((x) => {
      box.expandByPoint(a.set(x.x - x.w / 2, x.y - x.h / 2, -x.d / 2));
      box.expandByPoint(a.set(x.x + x.w / 2, x.y + x.h / 2, x.d / 2));
    });
    ends.forEach((e) => box.expandByPoint(e));
    const view = new THREE.Box3();
    for (const cx of [box.min.x, box.max.x])
      for (const cy of [box.min.y, box.max.y])
        for (const cz of [box.min.z, box.max.z])
          view.expandByPoint(a.set(cx, cy, cz).applyMatrix4(camera.matrixWorldInverse));
    const mx = (view.min.x + view.max.x) / 2;
    const my = (view.min.y + view.max.y) / 2;
    let hw = ((view.max.x - view.min.x) / 2) * 1.1;
    let hh = ((view.max.y - view.min.y) / 2) * 1.1;
    if (hw / hh < w / h) hw = (hh * w) / h;
    else hh = (hw * h) / w;
    // The camera looks at the origin, so the frame's centre is an offset in view space.
    Object.assign(camera, { left: mx - hw, right: mx + hw, top: my + hh, bottom: my - hh });
    camera.updateProjectionMatrix();
    draw();
  }

  const ro = new ResizeObserver(fit);
  ro.observe(host);

  const ray = new THREE.Raycaster();
  return {
    setProgress(x: number) {
      t = x;
      draw();
    },
    // -1 to 1, from the pointer across the figure.
    setOrbit(x: number) {
      yaw = x * THREE.MathUtils.degToRad(12);
      draw();
    },
    highlight(id: string | null) {
      on = id === null ? -1 : (index.get(id) ?? -1);
      parts.forEach((p, i) => {
        for (const l of p.lines) l.material = on < 0 || on === i ? edge : dim;
        for (const m of p.meshes) m.material = on === i ? fill : ghost;
      });
      draw();
    },
    // The part under a viewport point, if any.
    pick(clientX: number, clientY: number) {
      const r = renderer.domElement.getBoundingClientRect();
      ray.setFromCamera(
        new THREE.Vector2(
          ((clientX - r.left) / r.width) * 2 - 1,
          -((clientY - r.top) / r.height) * 2 + 1,
        ),
        camera,
      );
      const hit = ray.intersectObjects(meshes)[0];
      return hit ? arch.parts[hit.object.userData.i as number]!.id : null;
    },
    dispose() {
      cancelAnimationFrame(frame);
      ro.disconnect();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments) o.geometry.dispose();
      });
      for (const m of [edge, dim, fill, ghost, cold.lines.material, hot.lines.material])
        m.dispose();
      leaders.lines.material.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

export type Drawing = ReturnType<typeof createExploded>;
