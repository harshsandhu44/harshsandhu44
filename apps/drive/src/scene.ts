// The 3D side of the drive: track, park, car and the helicopter camera. The only module that
// imports three, and drive.tsx loads it on open so the hero never pays for it. Track (x, y) is
// three (x, 0, y): y-down canvas space becomes +z on the ground plane. Models are Kenney's Racing
// Kit (CC0, kenney.nl), recoloured to the site's tokens at load.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { CARS, type Livery } from "@/race";
import { KERB_R, PIT_HALF, STAND_HALF, WORK, type Car, type Track } from "@/track";

export type Colors = Record<
  "accent" | "carbon" | "paper" | "chrome" | "ink" | "pit" | "slow",
  string
>;

const SKY = "#c9d2d6";
// Mowing stripes: grass in the park, paving round a street circuit, sand in the desert.
const GRASS = ["#56705c", "#5d7863"];
const PAVING = ["#55565c", "#5a5b61"];
const SAND = ["#cbb48a", "#c6ae83"];
const TREE = "#44634d";
// The light: the sky (and fog), the hemisphere's sky and ground colours and strength, the sun's
// colour, strength and offset from the car, and how bright the lamps burn (floodlights, rain
// lights, the Strip's windows). At night the sun is the floodlights, high and cool; there are no
// real lights along the track, so the lamps are only bright colours. Yas Marina runs from GOLDEN
// to NIGHT through SUNSET as the race goes on (frame's `progress`).
type Light = {
  sky: string;
  top: string;
  low: string;
  hemi: number;
  sun: string;
  sunI: number;
  at: [number, number, number];
  lamps: number;
};
const DAY: Light = {
  sky: SKY,
  top: "#e4ebf0",
  low: "#3d5244",
  hemi: 1.4,
  sun: "#fff1dc",
  sunI: 2.6,
  at: [-40, 90, 30],
  lamps: 0,
};
const GOLDEN: Light = {
  sky: "#e7b48a",
  top: "#f3d3b2",
  low: "#4a4036",
  hemi: 1.15,
  sun: "#ffb26a",
  sunI: 2.4,
  at: [-95, 30, 40],
  lamps: 0.25,
};
const SUNSET: Light = {
  sky: "#6f4a6e",
  top: "#b88aa6",
  low: "#2b2530",
  hemi: 0.85,
  sun: "#ff7a45",
  sunI: 0.9,
  at: [-110, 10, 40],
  lamps: 0.8,
};
const NIGHT: Light = {
  sky: "#0a0e1c",
  top: "#a9b8e6",
  low: "#1b1e27",
  hemi: 0.9,
  sun: "#e8eeff",
  sunI: 1.9,
  at: [-15, 120, 10],
  lamps: 1,
};
// Each sky's lights at points through the race, blended between.
const SKIES: Record<"day" | "night" | "sunset", [number, Light][]> = {
  day: [[0, DAY]],
  night: [[0, NIGHT]],
  sunset: [
    [0, GOLDEN],
    [0.3, SUNSET],
    [0.55, NIGHT],
  ],
};
// The Sphere: 157 m across and 112 m tall, so its centre's 34 m up.
const SPHERE_R = 78.5;
const SPHERE_Y = 112 - SPHERE_R;
const TARMAC = "#3e3e47";
const PIT_LANE = "#35353d";
const GRAVEL = "#b3ac9c";
// Gravel goes on the outside of corners tighter than this radius, this far out.
const GRAVEL_R = 130;
const GRAVEL_WIDTH = 18;
// The road surface is at 0.02; the tyres sit just on it.
const RIDE = 0.03;

// Aligns a model's local +x with the direction (dx, dz).
const yaw = (dx: number, dz: number) => Math.atan2(-dz, dx);

// A flat ribbon between two offset lines, `sub` quads per path segment that `keep` allows.
// `color` gets the segment and the piece within it, for kerb stripes shorter than a segment.
function strip(
  a: [number, number][],
  b: [number, number][],
  y: number,
  keep: (i: number) => boolean,
  color?: (i: number, k: number) => THREE.Color,
  sub = 1,
) {
  const pos: number[] = [];
  const col: number[] = [];
  const lerp = (p: [number, number], q: [number, number], t: number) =>
    [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t] as const;
  for (let i = 0; i < a.length; i++) {
    if (!keep(i)) continue;
    const j = (i + 1) % a.length;
    for (let k = 0; k < sub; k++) {
      const [a0, a1] = [lerp(a[i]!, a[j]!, k / sub), lerp(a[i]!, a[j]!, (k + 1) / sub)];
      const [b0, b1] = [lerp(b[i]!, b[j]!, k / sub), lerp(b[i]!, b[j]!, (k + 1) / sub)];
      for (const [x, z] of [a0, b0, a1, b0, b1, a1]) {
        pos.push(x, y, z);
        if (color) col.push(...color(i, k).toArray());
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  if (color) g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

// Double-sided: winding depends on which side of the centreline a strip is, so draw both faces
// rather than track it.
function flatMesh(g: THREE.BufferGeometry, mat: THREE.MeshStandardMaterialParameters) {
  const m = new THREE.Mesh(
    g,
    new THREE.MeshStandardMaterial({ roughness: 0.95, side: THREE.DoubleSide, ...mat }),
  );
  m.receiveShadow = true;
  return m;
}

// Loads a model, recolours its materials by name and sits it on the origin, base at y = 0.
async function model(loader: GLTFLoader, name: string, tint: Record<string, string>) {
  const { scene } = await loader.loadAsync(`/drive/${name}.glb`);
  scene.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    o.castShadow = o.receiveShadow = true;
    const m = o.material as THREE.MeshStandardMaterial;
    const c = tint[m.name];
    if (c) m.color.set(c);
    m.metalness = 0;
    m.roughness = 0.8;
  });
  const box = new THREE.Box3().setFromObject(scene);
  const c = box.getCenter(new THREE.Vector3());
  scene.position.x -= c.x;
  scene.position.z -= c.z;
  scene.position.y -= box.min.y;
  const root = new THREE.Group().add(scene);
  return { root, size: box.getSize(new THREE.Vector3()) };
}

// One InstancedMesh per mesh in the model, so hundreds of copies cost a draw call each.
function instances(root: THREE.Object3D, mats: THREE.Matrix4[]) {
  root.updateMatrixWorld(true);
  const g = new THREE.Group();
  root.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const im = new THREE.InstancedMesh(o.geometry, o.material, mats.length);
    mats.forEach((m, i) => im.setMatrixAt(i, m.clone().multiply(o.matrixWorld)));
    im.computeBoundingSphere();
    im.castShadow = im.receiveShadow = true;
    g.add(im);
  });
  return g;
}

// Liveries (race.ts Livery), drawn on the body paint from the model's own coordinates, as its UVs
// index a palette and a texture won't map: along the car from the tail (0) to the nose (1), and
// across it from the centreline (0) to the side (1). ponytail: five layouts by eye, as the chase
// camera sees them from above and behind.
const LAYOUTS: Livery[0][] = ["fade", "split", "pods", "nose", "m"];
const LIVERY_GLSL = `
  vec3 q = (vLiv - livLo) / livSize;
  float t = q.z, s = abs(q.x * 2.0 - 1.0);
  vec3 col = livC[0];
  if (livLayout == 0) {
    col = mix(livC[0], livC[1], 1.0 - smoothstep(0.25, 0.65, t));
    if (s < 0.12) col = livC[2];
  } else if (livLayout == 1) {
    col = t > 0.5 ? livC[0] : livC[1];
    if (abs(t - 0.5) < 0.035) col = livC[2];
  } else if (livLayout == 2) {
    col = s > 0.55 ? livC[1] : livC[0];
    if (abs(s - 0.55) < 0.06) col = livC[2];
  } else if (livLayout == 3) {
    col = t > 0.68 ? livC[1] : livC[0];
    if (abs(t - 0.68) < 0.03) col = livC[2];
  } else {
    float d = t + 0.3 * s;
    if (d > 0.7 && d < 0.85) col = livC[1 + int((d - 0.7) / 0.05)];
  }
  vec4 diffuseColor = vec4(col, opacity);`;
function livery(m: THREE.MeshStandardMaterial, box: THREE.Box3) {
  const u = {
    livLayout: { value: 0 },
    livC: { value: [0, 1, 2, 3].map(() => new THREE.Color()) },
    livLo: { value: box.min },
    livSize: { value: box.getSize(new THREE.Vector3()) },
  };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vLiv;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvLiv = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vLiv;\nuniform int livLayout;\nuniform vec3 livC[4];\nuniform vec3 livLo;\nuniform vec3 livSize;",
      )
      .replace("vec4 diffuseColor = vec4( diffuse, opacity );", LIVERY_GLSL);
  };
  return ([layout, ...colors]: Livery) => {
    u.livLayout.value = LAYOUTS.indexOf(layout);
    u.livC.value.forEach((c, k) => c.set(colors[k] ?? colors[0]!));
  };
}

const place = (x: number, z: number, rot: number, sx: number, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, 0, z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot),
    new THREE.Vector3(sx, sy, sz),
  );

// Renders into a canvas of its own inside `host`, so a second scene (React's dev double mount, or
// reopening the dialog) never inherits a context the first one threw away.
export async function createScene(host: HTMLElement, C: Colors, flat: boolean, track: Track) {
  const { BOARDS, BOXES, BOX, CURVE, HALF, MID, PATH, PIT_SIDE, STANDS, TREES, WALLS, ZONES } =
    track;
  const { BOARD_GAP, BUILDINGS, RUNOFF, SETTING, SKY: SKY_KIND, SPHERE } = track;
  const { atDist, dirAt, nearest, offset, pitOffset, pointAt, wallGap, working } = track;
  const { LENGTH, RACING } = track;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.domElement.className = "block size-full";
  host.append(renderer.domElement);
  // 1.5, not 2: a retina laptop's full 5 MP with antialiasing and shadows misses every few
  // frames on the GPU. ponytail: fixed cap, step it down at runtime if 1.5 still drops frames.
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const sky = new THREE.Color(SKY);
  const fog = new THREE.Fog(SKY, 260, 720);
  scene.background = sky;
  scene.fog = fog;

  const mid = new THREE.Vector3(MID[0], 0, MID[1]);

  // Grass: a two-pixel texture repeated into 12 m mowing stripes, under the circuit and a margin.
  const size = Math.max(BOX.x1 - BOX.x0, BOX.y1 - BOX.y0) + 900;
  const mow = document.createElement("canvas");
  mow.width = 2;
  mow.height = 1;
  const mc = mow.getContext("2d")!;
  const city = SETTING === "riviera" || SETTING === "strip";
  (city ? PAVING : SETTING === "desert" ? SAND : GRASS).forEach((g, i) => {
    mc.fillStyle = g;
    mc.fillRect(i, 0, 1, 1);
  });
  const stripes = new THREE.CanvasTexture(mow);
  stripes.colorSpace = THREE.SRGBColorSpace;
  stripes.magFilter = THREE.NearestFilter;
  stripes.wrapS = stripes.wrapT = THREE.RepeatWrapping;
  stripes.repeat.set(size / 24, 1);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: stripes, roughness: 1 }),
  );
  ground.position.copy(mid);
  ground.receiveShadow = true;
  scene.add(ground);

  const kerb = (i: number) => Math.abs(CURVE[i]!) > 1 / KERB_R;
  // Gravel spreads a few points either side of a tight corner so the traps don't stop short.
  const tight = PATH.map((_, i) => {
    for (let k = -12; k <= 12; k++)
      if (Math.abs(CURVE[(i + k + PATH.length) % PATH.length]!) > 1 / GRAVEL_R)
        return Math.sign(CURVE[(i + k + PATH.length) % PATH.length]!);
    return 0;
  });
  // A line k beyond the tarmac edge (negative is inside it), on the right (1) or left (-1).
  const edge = (side: number, k: number) => offset((i) => side * (HALF[i]! + k));
  const L = edge(1, 0);
  const R = edge(-1, 0);
  const outer = [edge(1, GRAVEL_WIDTH), edge(-1, GRAVEL_WIDTH)] as const;

  // Gravel traps on the outside (-sign side) of the tight corners, where there's room for them
  // before the wall.
  if (RUNOFF >= GRAVEL_WIDTH)
    scene.add(
      flatMesh(
        strip(R, outer[1], 0.01, (i) => tight[i]! > 0),
        { color: GRAVEL },
      ),
      flatMesh(
        strip(L, outer[0], 0.01, (i) => tight[i]! < 0),
        { color: GRAVEL },
      ),
    );
  scene.add(
    flatMesh(
      strip(L, R, 0.02, () => true),
      { color: TARMAC, roughness: 0.9 },
    ),
  );
  // The racing line (assist.ts): a ribbon a little narrower than a tyre is wide apart, its colour
  // and opacity set a point at a time, and the braking point as a red bar across it.
  const N = PATH.length;
  const lineSides = [-0.4, 0.4].map((k) => offset((i) => RACING[i]! + k));
  const linePos = new Float32Array(N * 6);
  for (let i = 0; i < N; i++)
    for (const [k, [x, z]] of lineSides.map((side) => side[i]!).entries())
      linePos.set([x, 0.035, z], i * 6 + k * 3);
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(linePos, 3));
  const lineCol = new THREE.BufferAttribute(new Float32Array(N * 8), 4);
  lineGeo.setAttribute("color", lineCol);
  lineGeo.setIndex(
    Array.from({ length: N }, (_, i) => {
      const j = (i + 1) % N;
      return [2 * i, 2 * i + 1, 2 * j, 2 * i + 1, 2 * j + 1, 2 * j];
    }).flat(),
  );
  const racingLine = new THREE.Mesh(
    lineGeo,
    new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }),
  );
  racingLine.visible = false;
  // By assist.ts's shades: hidden, flat out, slowing for one soon, brake now.
  const SHADES = [null, "#2bd46b", C.slow, C.accent].map((c) => c && new THREE.Color(c).toArray());
  const brakeBar = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 4).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({
      color: C.accent,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    }),
  );
  brakeBar.position.y = 0.04;
  brakeBar.visible = false;
  scene.add(racingLine, brakeBar);

  // White edge lines where there is no kerb, kerbs just inside the edge on corners.
  const line = { color: C.paper };
  scene.add(
    flatMesh(
      strip(edge(1, -0.5), edge(1, -0.15), 0.03, (i) => !kerb(i)),
      line,
    ),
    flatMesh(
      strip(edge(-1, -0.5), edge(-1, -0.15), 0.03, (i) => !kerb(i)),
      line,
    ),
  );
  const red = new THREE.Color(C.accent);
  const white = new THREE.Color(C.paper);
  // Path points are 5 m apart, so two stripes per segment.
  const band = (i: number, k: number) => ((i * 2 + k) % 2 ? red : white);
  const kerbMat = { vertexColors: true, roughness: 0.7 };
  scene.add(
    flatMesh(strip(edge(1, -1.2), L, 0.05, kerb, band, 2), kerbMat),
    flatMesh(strip(edge(-1, -1.2), R, 0.05, kerb, band, 2), kerbMat),
  );

  // The pit lane: its own tarmac under the track's where they meet, with the working lane beside
  // it along the boxes, a white line along its inner edge once it's clear of the track, and a
  // box per team, painted in its colour by paint().
  const lane = (k: number) => offset((i) => pitOffset(i) + PIT_SIDE * k);
  const apart = (i: number) => PIT_SIDE * pitOffset(i) - PIT_HALF > HALF[i]!;
  scene.add(
    flatMesh(
      strip(
        lane(-PIT_HALF),
        offset((i) => pitOffset(i) + PIT_SIDE * PIT_HALF + working(i)),
        0.015,
        (i) => PIT_SIDE * pitOffset(i) + PIT_HALF > HALF[i]!,
      ),
      { color: PIT_LANE, roughness: 0.9 },
    ),
    flatMesh(strip(lane(-PIT_HALF), lane(0.35 - PIT_HALF), 0.03, apart), line),
  );
  // Each box is painted on the lane as an outline in the team's colour, as in F1.
  const rect = (w: number, h: number) =>
    new THREE.Shape()
      .moveTo(-w / 2, -h / 2)
      .lineTo(w / 2, -h / 2)
      .lineTo(w / 2, h / 2)
      .lineTo(-w / 2, h / 2);
  const outlineShape = rect(6, 4);
  outlineShape.holes.push(rect(5.6, 3.6));
  const boxGeo = new THREE.ShapeGeometry(outlineShape).rotateX(-Math.PI / 2);
  const boxes = BOXES.map((b) => {
    const mat = new THREE.MeshStandardMaterial({ color: C.accent, roughness: 0.8 });
    const m = new THREE.Mesh(boxGeo, mat);
    m.position.set(b.x, 0.025, b.y);
    m.rotation.y = yaw(Math.cos(b.h), Math.sin(b.h));
    m.receiveShadow = true;
    scene.add(m);
    return mat;
  });

  // The garages: one long building behind the boxes, a section per team with a dark door and a
  // band in its colour, painted by paint(). `at` is a point beside a box: `along` the lap from it
  // and `out` from its centre towards the garage.
  // `along` goes down the box's heading: pointAt snaps to the 5 m path points.
  const at = (b: (typeof BOXES)[number], along: number, out: number) => {
    const [x, y] = pointAt(b.s, pitOffset(atDist(b.s)) + PIT_SIDE * (WORK + out));
    return [x + along * Math.cos(b.h), y + along * Math.sin(b.h)] as const;
  };
  const GARAGE = { w: 23.6, d: 8, h: 5, front: PIT_HALF + 0.5 };
  const shell = new THREE.MeshStandardMaterial({ color: C.chrome, roughness: 0.9 });
  const door = new THREE.MeshStandardMaterial({
    color: C.pit,
    roughness: 1,
    side: THREE.DoubleSide,
  });
  const shellGeo = new THREE.BoxGeometry(GARAGE.w, GARAGE.h, GARAGE.d).translate(
    0,
    GARAGE.h / 2,
    0,
  );
  const doorGeo = new THREE.PlaneGeometry(14, 4);
  const bandGeo = new THREE.PlaneGeometry(GARAGE.w, 0.6);
  const garages = BOXES.map((b) => {
    const rot = yaw(Math.cos(b.h), Math.sin(b.h));
    const put = (m: THREE.Mesh, out: number, y: number) => {
      const [x, z] = at(b, 0, out);
      m.position.set(x, y, z);
      m.rotation.y = rot;
      m.castShadow = m.receiveShadow = true;
      scene.add(m);
    };
    const band = new THREE.MeshStandardMaterial({
      color: C.accent,
      roughness: 0.8,
      side: THREE.DoubleSide,
    });
    put(new THREE.Mesh(shellGeo, shell), GARAGE.front + GARAGE.d / 2, 0);
    put(new THREE.Mesh(doorGeo, door), GARAGE.front - 0.05, 2);
    put(new THREE.Mesh(bandGeo, band), GARAGE.front - 0.05, 4.5);
    const [x, y] = at(b, 0, GARAGE.front + GARAGE.d / 2);
    return { x, y, h: b.h, band };
  });
  // The barrier behind the lane runs through the garages; they stand in for it on screen.
  const inGarage = (x: number, y: number) =>
    garages.some((g) => {
      const [dx, dy] = [x - g.x, y - g.y];
      const along = dx * Math.cos(g.h) + dy * Math.sin(g.h);
      const across = dy * Math.cos(g.h) - dx * Math.sin(g.h);
      return Math.abs(along) < GARAGE.w / 2 && Math.abs(across) < GARAGE.d / 2;
    });

  // Eight crew per team: four on the wheels, the front and rear jacks and one either side, at
  // (along, out) from the car stopped at the box. They wait in the garage (hidden), line up on
  // the garage side when one of the team's cars is in the lane, and go to the car for the stop;
  // the wheel crew kneel. A pose per team runs 0 (garage) to 1 (ready) to 2 (working).
  const SLOTS: [number, number][] = [
    [1.8, 1.9],
    [1.8, -1.9],
    [-1.8, 1.9],
    [-1.8, -1.9],
    [3.7, 0],
    [-3.7, 0],
    [0, 2],
    [0, -2],
  ];
  const teams = BOXES.length;
  const crewBody = new THREE.InstancedMesh(
    new THREE.CapsuleGeometry(0.28, 0.9).translate(0, 0.73, 0),
    new THREE.MeshStandardMaterial({ roughness: 0.8 }),
    teams * SLOTS.length,
  );
  const crewHead = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.2),
    new THREE.MeshStandardMaterial({ color: C.paper, roughness: 0.6 }),
    teams * SLOTS.length,
  );
  const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
  for (const m of [crewBody, crewHead]) {
    // Their bounds come from these first, hidden, matrices, so they'd be culled; skip culling.
    m.frustumCulled = false;
    m.castShadow = true;
    for (let i = 0; i < m.count; i++) m.setMatrixAt(i, hidden);
    scene.add(m);
  }
  const accent = new THREE.Color(C.accent);
  for (let i = 0; i < crewBody.count; i++) crewBody.setColorAt(i, accent);
  // Each crew member's spots in the garage and lined up ready, in track (x, y), and at the car:
  // set from the car itself while it's stopped, as it stops a little off the box's centre.
  const spots = BOXES.map((b) =>
    SLOTS.map(([along], j) => [
      at(b, along * 0.6, GARAGE.front + 2),
      at(b, Math.max(-3.5, Math.min(3.5, along * 1.3 + (j - 3.5) * 0.3)), 3),
    ]),
  );
  const work = BOXES.map((b) => SLOTS.map(([along, out]) => at(b, along, out)));
  // The team's cars are 2k and 2k + 1; the one at the box sets the spots.
  const atCar = (k: number, cars: Car[]) => {
    const b = BOXES[k]!;
    const near = (o: Car) => Math.hypot(o.x - b.x, o.y - b.y);
    const c = [cars[2 * k], cars[2 * k + 1]].reduce((a, o) => (o && near(o) < near(a!) ? o : a))!;
    const [fx, fy] = [Math.cos(c.h), Math.sin(c.h)];
    work[k] = SLOTS.map(([al, out]) => [
      c.x + al * fx - PIT_SIDE * out * fy,
      c.y + al * fy + PIT_SIDE * out * fx,
    ]);
  };
  const pose = new Array<number>(teams).fill(0);
  const m4 = new THREE.Matrix4();
  const v3 = new THREE.Vector3();
  const s3 = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const placeCrew = (k: number) => {
    const v = pose[k]!;
    SLOTS.forEach((_, j) => {
      const i = k * SLOTS.length + j;
      if (v < 0.02) {
        crewBody.setMatrixAt(i, hidden);
        crewHead.setMatrixAt(i, hidden);
        return;
      }
      const [a, b] = spots[k]![j]!;
      const c = work[k]![j]!;
      const [p0, p1, t] = v <= 1 ? [a!, b!, v] : [b!, c, v - 1];
      const kneel = j < 4 && v > 1 ? 1 - 0.35 * (v - 1) : 1;
      v3.set(p0[0] + (p1[0] - p0[0]) * t, 0, p0[1] + (p1[1] - p0[1]) * t);
      crewBody.setMatrixAt(i, m4.compose(v3, q, s3.set(1, kneel, 1)));
      v3.y = 1.66 * kneel;
      crewHead.setMatrixAt(i, m4.compose(v3, q, s3.set(1, 1, 1)));
    });
  };

  // Chequered start line, two rows of squares across the road.
  const cq = document.createElement("canvas");
  cq.width = 10;
  cq.height = 2;
  const cc = cq.getContext("2d")!;
  for (let x = 0; x < 10; x++)
    for (let y = 0; y < 2; y++) {
      cc.fillStyle = (x + y) % 2 ? C.ink : C.paper;
      cc.fillRect(x, y, 1, 1);
    }
  const cqTex = new THREE.CanvasTexture(cq);
  cqTex.colorSpace = THREE.SRGBColorSpace;
  cqTex.magFilter = THREE.NearestFilter;
  const [[sx, sz], [nx, nz]] = PATH as [[number, number], [number, number]];
  const across = yaw(nz - sz, -(nx - sx));
  const startLine = new THREE.Mesh(
    new THREE.PlaneGeometry(HALF[0]! * 2, 2.8).rotateX(-Math.PI / 2),
    new THREE.MeshStandardMaterial({ map: cqTex, roughness: 0.8 }),
  );
  startLine.position.set(sx, 0.04, sz);
  startLine.rotation.y = across;
  startLine.receiveShadow = true;
  scene.add(startLine);

  const loader = new GLTFLoader();
  const tint = {
    red: C.accent,
    grey: C.chrome,
    glass: C.ink,
    carTire: C.pit,
    road: C.carbon,
    _defaultMat: C.paper,
    grass: TREE,
    bark: "#5e5246",
  };
  const [car, wall, stand, gantry, treeL, treeS] = await Promise.all(
    [
      "raceCarRed",
      "barrierWall",
      "grandStandCovered",
      "overheadLights",
      "treeLarge",
      "treeSmall",
    ].map((n) => model(loader, n, tint)),
  );

  // Barriers, grandstands and trees, placed by track.ts so they line up with the collisions.
  scene.add(
    instances(
      wall!.root,
      WALLS.filter(([ax, az, bx, bz]) => !inGarage((ax + bx) / 2, (az + bz) / 2)).map(
        ([ax, az, bx, bz]) => {
          const len = Math.hypot(bx - ax, bz - az);
          return place(
            (ax + bx) / 2,
            (az + bz) / 2,
            yaw(bx - ax, bz - az),
            len / wall!.size.x,
            7,
            7,
          );
        },
      ),
    ),
    instances(
      stand!.root,
      STANDS.map(({ x, y, fx, fy }) =>
        place(x, y, yaw(fx, fy) + Math.PI / 2, (STAND_HALF * 2) / stand!.size.x),
      ),
    ),
    ...([true, false] as const).map((big) =>
      instances(
        (big ? treeL : treeS)!.root,
        TREES.filter((t) => t.big === big).map((t) => place(t.x, t.y, t.rot, t.s)),
      ),
    ),
  );

  // The city, placed by track.ts: one mesh of boxes, each in its tone's colour with a window every
  // 4 m across and 3.5 m up (8 to a texture each way). On the Strip the windows light up at night
  // from a second texture, about half of them lit.
  // Everything that glows with the lamps: its emissive strength by day, plus k at full night.
  const lamped: { m: THREE.MeshStandardMaterial; base: number; k: number }[] = [];
  if (BUILDINGS.length) {
    const strip = SETTING === "strip";
    const cells = (paint: (c: CanvasRenderingContext2D, x: number, y: number) => void) => {
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      const x = c.getContext("2d")!;
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) paint(x, i * 32, j * 32);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      return t;
    };
    const map = cells((c, x, y) => {
      c.fillStyle = "#ffffff";
      c.fillRect(x, y, 32, 32);
      c.fillStyle = strip ? "#4b5563" : "#8a8277";
      c.fillRect(x + 7, y + 6, 18, 20);
    });
    const rand = (() => {
      let s = 7;
      return () => (s = (s * 16807) % 2147483647) / 2147483647;
    })();
    const lit = strip
      ? cells((c, x, y) => {
          c.fillStyle = "#000000";
          c.fillRect(x, y, 32, 32);
          if (rand() < 0.5) return;
          c.fillStyle = `hsl(38 90% ${55 + rand() * 30}%)`;
          c.fillRect(x + 7, y + 6, 18, 20);
        })
      : null;
    const tones = strip
      ? ["#2b3442", "#3a404c", "#8a7a55", "#cfd3d8", "#4a5466"]
      : ["#e8dcc4", "#d9c7a7", "#efe6d6", "#c9b79c", "#e3cfb0"];
    const colour = new THREE.Color();
    const boxes = BUILDINGS.map(({ x, y, fx, fy, w, d, h, tone }) => {
      const g = new THREE.BoxGeometry(2 * d, h, 2 * w).translate(0, h / 2, 0);
      // Faces +x, -x, +y, -y, +z, -z, four corners each: the sides tile the windows by their
      // size; the roof takes the texture's corner, plain wall.
      const uv = g.getAttribute("uv") as THREE.BufferAttribute;
      const across = [2 * w, 2 * w, 0, 0, 2 * d, 2 * d];
      for (let f = 0; f < 6; f++)
        for (let k = 0; k < 4; k++) {
          const n = f * 4 + k;
          uv.setXY(
            n,
            (uv.getX(n) * across[f]!) / 32,
            f === 2 || f === 3 ? 0 : (uv.getY(n) * h) / 28,
          );
        }
      g.applyMatrix4(place(x, y, yaw(fx, fy), 1));
      colour.set(tones[Math.floor(tone * tones.length)]!);
      g.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(
          Array.from({ length: g.getAttribute("position").count }, () => colour.toArray()).flat(),
          3,
        ),
      );
      return g;
    });
    const mat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      map,
      roughness: 0.85,
      ...(lit && { emissive: "#ffffff", emissiveMap: lit, emissiveIntensity: 0 }),
    });
    if (lit) lamped.push({ m: mat, base: 0, k: 1.2 });
    const city = new THREE.Mesh(mergeGeometries(boxes), mat);
    for (const g of boxes) g.dispose();
    city.castShadow = city.receiveShadow = true;
    scene.add(city);
  }

  // Floodlights for a race at night: a pylon behind the wall every 80 m, on alternate sides,
  // its lamp a bright box facing the track. Not where the wall's far out for the pit lane, nor
  // in a stand or on another part of the track.
  if (SKY_KIND) {
    const spots: THREE.Matrix4[] = [];
    const every = Math.max(1, Math.round(80 / (track.LENGTH / PATH.length)));
    for (let i = 0, k = 0; i < PATH.length; i += every, k++) {
      const side = k % 2 ? 1 : -1;
      const gap = wallGap(i, side);
      if (gap > RUNOFF) continue;
      const [x, y] = offset((j) => side * (HALF[j]! + gap + 2.5))[i]!;
      if (nearest(x, y).edge < gap + 1) continue;
      if (STANDS.some((s) => Math.hypot(s.x - x, s.y - y) < STAND_HALF + 6)) continue;
      const [ax, ay] = PATH[i]!;
      spots.push(place(x, y, yaw(ax - x, ay - y), 1));
    }
    const pole = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 20, 0.4).translate(0, 10, 0),
      new THREE.MeshStandardMaterial({ color: C.chrome, roughness: 0.8 }),
    );
    const lampMat = new THREE.MeshStandardMaterial({
      color: C.carbon,
      emissive: "#fff6e0",
      emissiveIntensity: 0,
    });
    lamped.push({ m: lampMat, base: 0, k: 2.5 });
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.9, 1.1, 3.2).translate(0.3, 20, 0),
      lampMat,
    );
    scene.add(instances(new THREE.Group().add(pole, head), spots));
  }

  // The Sphere: our own eye, drawn on a canvas round the globe (the iris in the middle, so on
  // the sphere's +z once turned), lit from within. It watches the car the camera follows.
  let sphere: THREE.Mesh | null = null;
  if (SPHERE) {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const e = c.getContext("2d")!;
    const white = e.createRadialGradient(512, 256, 60, 512, 256, 560);
    white.addColorStop(0, "#fbfbf8");
    white.addColorStop(1, "#d8d2cc");
    e.fillStyle = white;
    e.fillRect(0, 0, 1024, 512);
    // Veins from the edges in towards the iris.
    const rand = (() => {
      let s = 11;
      return () => (s = (s * 16807) % 2147483647) / 2147483647;
    })();
    e.strokeStyle = "rgba(190, 40, 40, 0.55)";
    e.lineCap = "round";
    for (let n = 0; n < 34; n++) {
      const a = rand() * Math.PI * 2;
      const [x0, y0] = [512 + Math.cos(a) * 420, 256 + Math.sin(a) * 210];
      const [x1, y1] = [512 + Math.cos(a) * 150, 256 + Math.sin(a) * 140];
      e.lineWidth = 1.5 + rand() * 2.5;
      e.beginPath();
      e.moveTo(x0, y0);
      e.quadraticCurveTo(
        (x0 + x1) / 2 + (rand() - 0.5) * 80,
        (y0 + y1) / 2 + (rand() - 0.5) * 80,
        x1,
        y1,
      );
      e.stroke();
    }
    const iris = e.createRadialGradient(512, 256, 30, 512, 256, 118);
    iris.addColorStop(0, "#0d3b3f");
    iris.addColorStop(0.45, "#1f7a74");
    iris.addColorStop(0.85, "#3fa38a");
    iris.addColorStop(1, "#123033");
    e.fillStyle = iris;
    e.beginPath();
    e.arc(512, 256, 118, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "#050505";
    e.beginPath();
    e.arc(512, 256, 46, 0, Math.PI * 2);
    e.fill();
    e.fillStyle = "rgba(255, 255, 255, 0.85)";
    e.beginPath();
    e.ellipse(482, 222, 20, 13, -0.5, 0, Math.PI * 2);
    e.fill();
    const eye = new THREE.CanvasTexture(c);
    eye.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshStandardMaterial({
      map: eye,
      emissive: "#ffffff",
      emissiveMap: eye,
      emissiveIntensity: 0.4,
      roughness: 0.6,
      fog: false,
    });
    lamped.push({ m: mat, base: 0.4, k: 0.8 });
    sphere = new THREE.Mesh(new THREE.SphereGeometry(SPHERE_R, 64, 32).rotateY(-Math.PI / 2), mat);
    sphere.position.set(SPHERE[0], SPHERE_Y, SPHERE[1]);
    sphere.lookAt(PATH[0]![0], SPHERE_Y, PATH[0]![1]);
    scene.add(sphere);
  }

  // The start gantry, a little up the road so it doesn't hide the car on the grid.
  const g = gantry!.root;
  g.scale.setScalar((HALF[6]! * 2 + 6) / gantry!.size.x);
  g.position.set(PATH[6]![0], 0, PATH[6]![1]);
  g.rotation.y = across;
  scene.add(g);

  // 150/100/50 m boards before the braking zones: a post and a panel facing the oncoming car.
  const boardFont = getComputedStyle(document.documentElement).getPropertyValue("--font-display");
  const faces = new Map(
    [150, 100, 50].map((m) => {
      const c = document.createElement("canvas");
      c.width = 240;
      c.height = 160;
      const x = c.getContext("2d")!;
      x.fillStyle = C.paper;
      x.fillRect(0, 0, 240, 160);
      x.fillStyle = C.ink;
      x.font = `italic 800 112px ${boardFont}`;
      x.textAlign = "center";
      x.textBaseline = "middle";
      x.fillText(String(m), 120, 86);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace;
      return [m, new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 })];
    }),
  );
  const boardSide = new THREE.MeshStandardMaterial({ color: C.chrome, roughness: 0.8 });
  const panel = new THREE.BoxGeometry(2.4, 1.6, 0.12);
  const post = new THREE.BoxGeometry(0.16, 1.6, 0.16).translate(0, 0.8, 0);
  for (const b of BOARDS) {
    const board = new THREE.Group();
    // Box faces are +x, -x, +y, -y, +z, -z; the number goes on +z, towards the car.
    const face = faces.get(b.m)!;
    const front = new THREE.Mesh(panel, [
      boardSide,
      boardSide,
      boardSide,
      boardSide,
      face,
      boardSide,
    ]);
    front.position.y = 2.4;
    board.add(front, new THREE.Mesh(post, boardSide));
    board.traverse((o) => (o.castShadow = true));
    board.position.set(b.x, 0, b.y);
    board.rotation.y = Math.atan2(-Math.cos(b.h), -Math.sin(b.h));
    scene.add(board);
  }

  // Overtake Mode's detection lines: painted across the track, with a board on the side away
  // from the pits.
  const otCanvas = document.createElement("canvas");
  otCanvas.width = 240;
  otCanvas.height = 160;
  const oc = otCanvas.getContext("2d")!;
  oc.fillStyle = C.paper;
  oc.fillRect(0, 0, 240, 160);
  oc.fillStyle = C.ink;
  oc.font = `italic 800 40px ${boardFont}`;
  oc.textAlign = "center";
  oc.textBaseline = "middle";
  oc.fillText("OVERTAKE", 120, 84);
  const otTex = new THREE.CanvasTexture(otCanvas);
  otTex.colorSpace = THREE.SRGBColorSpace;
  const otFace = new THREE.MeshStandardMaterial({ map: otTex, roughness: 0.8 });
  const paint = new THREE.MeshStandardMaterial({ color: C.paper, roughness: 0.9 });
  for (const z of ZONES) {
    const i = atDist(z.detect);
    const [[ax, ay], [bx, by]] = [PATH[i]!, PATH[(i + 1) % PATH.length]!];
    const stripe = new THREE.Mesh(
      new THREE.PlaneGeometry(HALF[i]! * 2, 0.5).rotateX(-Math.PI / 2),
      paint,
    );
    stripe.position.set(ax, 0.04, ay);
    stripe.rotation.y = yaw(by - ay, -(bx - ax));
    stripe.receiveShadow = true;
    const front = new THREE.Mesh(panel, [
      boardSide,
      boardSide,
      boardSide,
      boardSide,
      otFace,
      boardSide,
    ]);
    front.position.y = 2.4;
    const board = new THREE.Group();
    board.add(front, new THREE.Mesh(post, boardSide));
    board.traverse((o) => (o.castShadow = true));
    const [x, y] = pointAt(z.detect, -PIT_SIDE * (HALF[i]! + BOARD_GAP));
    board.position.set(x, 0, y);
    board.rotation.y = Math.atan2(-(bx - ax), -(by - ay));
    scene.add(stripe, board);
  }

  // The cars, about 5.5 m long. The model faces +z. Yours is the model; the others are clones,
  // and each has its own copy of the body paint, in a livery for paint() to set.
  const paints: ((l: Livery) => void)[][] = [];
  const bodies = Array.from({ length: CARS }, (_, k) => {
    const b = k ? car!.root.clone(true) : car!.root;
    const paint: ((l: Livery) => void)[] = [];
    b.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || o.material.name !== "red") return;
      o.material = o.material.clone();
      o.geometry.computeBoundingBox();
      paint.push(livery(o.material, o.geometry.boundingBox!));
    });
    paints.push(paint);
    b.scale.setScalar(5.5 / car!.size.z);
    scene.add(b);
    return b;
  });
  const body = bodies[0]!;
  // The Safety Car: one more of the car, in silver, with an amber light bar on top.
  const safety = new THREE.Group();
  {
    const b = car!.root.clone(true);
    b.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || o.material.name !== "red") return;
      o.material = o.material.clone();
      (o.material as THREE.MeshStandardMaterial).color.set(C.chrome);
    });
    const k = 5.5 / car!.size.z;
    b.scale.setScalar(k);
    const bar = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.15, 0.3),
      new THREE.MeshBasicMaterial({ color: "#ff9a1f" }),
    );
    bar.position.y = car!.size.y * k + 0.08;
    safety.add(b, bar);
    safety.visible = false;
    scene.add(safety);
  }
  // A car in a slipstream: Lucide's wind icon (ISC) on the tarmac behind it, the streaks' tails
  // at the car, fading in with the tow.
  const windCanvas = document.createElement("canvas");
  windCanvas.width = windCanvas.height = 128;
  const wc = windCanvas.getContext("2d")!;
  wc.scale(128 / 24, 128 / 24);
  Object.assign(wc, { strokeStyle: C.paper, lineWidth: 2, lineCap: "round", lineJoin: "round" });
  for (const d of [
    "M12.8 19.6A2 2 0 1 0 14 16H2",
    "M17.5 8a2.5 2.5 0 1 1 2 4H2",
    "M9.8 4.4A2 2 0 1 1 11 8H2",
  ])
    wc.stroke(new Path2D(d));
  const windTex = new THREE.CanvasTexture(windCanvas);
  windTex.colorSpace = THREE.SRGBColorSpace;
  const windGeo = new THREE.PlaneGeometry(3, 3).rotateX(-Math.PI / 2);
  const winds = bodies.map(() => {
    const w = new THREE.Mesh(
      windGeo,
      new THREE.MeshBasicMaterial({ map: windTex, transparent: true, depthWrite: false }),
    );
    w.position.y = 0.05;
    scene.add(w);
    return w;
  });
  const wheels = ["wheelFrontLeft", "wheelFrontRight"].map((n) => body.getObjectByName(n));

  // Rain lights, on at night: a red bar low on the back of each car (not the Safety Car's). As in
  // 2026, it flashes at 4 Hz while the car's super clipping.
  const rainMat = new THREE.MeshBasicMaterial({ color: "#ff2b2b" });
  const bars = bodies.map((b) => {
    const s = car!.size;
    const bar = new THREE.Mesh(new THREE.BoxGeometry(s.x * 0.14, s.y * 0.12, s.z * 0.02), rainMat);
    bar.position.set(0, s.y * 0.4, -s.z / 2);
    b.add(bar);
    return bar;
  });
  let night = false;
  let blink = 0;

  const hemi = new THREE.HemisphereLight("#e4ebf0", "#3d5244", 1.4);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight("#fff1dc", 2.6);
  const SUN = new THREE.Vector3(-40, 90, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, far: 250 });
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

  // The light for how far through the race the leader is (0 to 1), blended between the sky's
  // stops; only Yas Marina's changes.
  const stops = SKIES[SKY_KIND ?? "day"];
  const c0 = new THREE.Color();
  const c1 = new THREE.Color();
  const mix = (a: string, b: string, t: number) => c0.set(a).lerp(c1.set(b), t);
  const toward = new THREE.Vector3();
  let shown = -1;
  const light = (progress: number) => {
    let k = 0;
    while (k < stops.length - 1 && progress > stops[k + 1]![0]) k++;
    const [p0, a] = stops[k]!;
    const [p1, b] = stops[Math.min(k + 1, stops.length - 1)]!;
    const t = p1 > p0 ? Math.min(1, (progress - p0) / (p1 - p0)) : 0;
    if (Math.abs(k + t - shown) < 0.002) return;
    shown = k + t;
    sky.copy(mix(a.sky, b.sky, t));
    fog.color.copy(sky);
    hemi.color.copy(mix(a.top, b.top, t));
    hemi.groundColor.copy(mix(a.low, b.low, t));
    hemi.intensity = a.hemi + (b.hemi - a.hemi) * t;
    sun.color.copy(mix(a.sun, b.sun, t));
    sun.intensity = a.sunI + (b.sunI - a.sunI) * t;
    SUN.set(...a.at).lerp(toward.set(...b.at), t);
    const lamps = a.lamps + (b.lamps - a.lamps) * t;
    for (const { m, base, k } of lamped) m.emissiveIntensity = base + k * lamps;
    night = lamps > 0.5;
  };
  light(0);
  const gaze = new THREE.Object3D();

  const camera = new THREE.PerspectiveCamera(45, 1, 1, 1600);
  const look = new THREE.Vector3();
  const want = new THREE.Vector3();
  const wantLook = new THREE.Vector3();
  // The intro swoops down from high behind the grid. Not over the whole circuit: it's 2 km
  // across, and from that far up it would all be fog.
  const start = new THREE.Vector3(sx, 0, sz);
  const heading = new THREE.Vector3(nx - sx, 0, nz - sz).normalize();
  const from = start.clone().addScaledVector(heading, -180).setY(260);
  let intro = flat ? 1 : 0;
  let snap = true;

  const chase = (c: Car) => {
    const fx = Math.cos(c.h);
    const fz = Math.sin(c.h);
    if (flat) {
      // North up, straight down, no rotation.
      want.set(c.x, 110, c.y + 0.01);
      wantLook.set(c.x, 0, c.y);
    } else {
      want.set(c.x - fx * 28, 40, c.y - fz * 28);
      wantLook.set(c.x + fx * 8, 0, c.y + fz * 8);
    }
  };

  return {
    // Every car on track, yours first (only yours in qualifying, the rest hidden), each one's
    // share of the full tow, each team's crew (0 in the garage, 1 a car in the lane, 2 a car
    // stopped at the box), which cars are gone (out of the race, their wrecks cleared), the
    // Safety Car, if it's out, how far through the race the leader is, for the light, and which
    // cars are super clipping.
    frame(
      cars: Car[],
      tows: number[],
      steer: number,
      dt: number,
      crews: number[],
      gone: boolean[] = [],
      sc: Car | null = null,
      progress = 0,
      clips: boolean[] = [],
    ) {
      let moved = false;
      crews.forEach((want, k) => {
        if (want === 2) atCar(k, cars);
        const v = pose[k]!;
        if (v === want) return;
        // About a second to walk out or in, and a quick dash to the car.
        const step = dt * (Math.max(v, want) > 1 ? 2.5 : 1.2);
        pose[k] = flat ? want : v + Math.max(-step, Math.min(step, want - v));
        placeCrew(k);
        moved = true;
      });
      if (moved) crewBody.instanceMatrix.needsUpdate = crewHead.instanceMatrix.needsUpdate = true;
      const c = cars[0]!;
      bodies.forEach((b, k) => (b.visible = k < cars.length && !gone[k]));
      safety.visible = !!sc;
      if (sc) {
        safety.position.set(sc.x, RIDE, sc.y);
        safety.rotation.y = Math.PI / 2 - sc.h;
      }
      cars.forEach((o, k) => {
        bodies[k]!.position.set(o.x, RIDE, o.y);
        bodies[k]!.rotation.y = Math.PI / 2 - o.h;
      });
      winds.forEach((w, k) => {
        const o = cars[k];
        w.visible = !!o && tows[k]! > 0 && !gone[k];
        if (!o || !w.visible) return;
        // Its middle 4.5 m behind the car's, just off the rear wing.
        w.position.x = o.x - Math.cos(o.h) * 4.5;
        w.position.z = o.y - Math.sin(o.h) * 4.5;
        w.rotation.y = yaw(-Math.cos(o.h), -Math.sin(o.h));
        (w.material as THREE.MeshBasicMaterial).opacity = 0.85 * tows[k]!;
      });
      for (const w of wheels) if (w) w.rotation.y = -steer * 0.4;
      light(progress);
      blink += dt;
      const on = Math.floor(blink * 8) % 2 === 0;
      bars.forEach((bar, k) => (bar.visible = clips[k] ? on : night));
      sun.position.set(c.x + SUN.x, SUN.y, c.y + SUN.z);
      sun.target.position.set(c.x, 0, c.y);
      // The eye turns to the car, gliding, and tilts no more than 5° down or up.
      if (sphere) {
        const far = Math.hypot(c.x - sphere.position.x, c.y - sphere.position.z);
        const dy = Math.max(-0.09, Math.min(0.09, (RIDE - SPHERE_Y) / far)) * far;
        gaze.position.copy(sphere.position);
        gaze.lookAt(c.x, SPHERE_Y + dy, c.y);
        sphere.quaternion.slerp(gaze.quaternion, flat ? 1 : 1 - Math.exp(-3 * dt));
      }

      chase(c);
      if (intro < 1) {
        intro = Math.min(1, intro + dt / 1.6);
        const e = 1 - (1 - intro) ** 3;
        camera.position.lerpVectors(from, want, e);
        look.lerpVectors(start, wantLook, e);
      } else if (snap || flat) {
        camera.position.copy(want);
        look.copy(wantLook);
        snap = false;
      } else {
        camera.position.lerp(want, 1 - Math.exp(-4 * dt));
        look.lerp(wantLook, 1 - Math.exp(-8 * dt));
      }
      if (flat) camera.up.set(0, 0, -1);
      camera.lookAt(look);
      renderer.render(scene, camera);
    },
    // The racing line's shades, one a point (null hides it), and the braking point, metres round
    // the lap (null for none).
    guide(shades: Uint8Array | null, brake: number | null) {
      racingLine.visible = !!shades;
      if (shades) {
        const a = lineCol.array as Float32Array;
        shades.forEach((k, i) => {
          const c = SHADES[k];
          for (const v of [0, 4]) {
            if (c) a.set(c, i * 8 + v);
            a[i * 8 + v + 3] = c ? 0.8 : 0;
          }
        });
        lineCol.needsUpdate = true;
      }
      brakeBar.visible = brake !== null;
      if (brake === null) return;
      const [x, z] = pointAt(brake, RACING[atDist(brake)]!);
      const h = dirAt(brake / LENGTH);
      brakeBar.position.set(x, 0.04, z);
      brakeBar.rotation.y = yaw(Math.cos(h), Math.sin(h));
    },
    resize(w: number, h: number) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Portrait phones need a taller view to see the next corner.
      camera.fov = w < h ? 60 : 45;
      camera.updateProjectionMatrix();
    },
    // Team colours for its box, garage and crew, and its liveries on its two cars.
    paint(teams: string[], liveries: Livery[]) {
      boxes.forEach((m, k) => m.color.set(teams[k]!));
      garages.forEach((g, k) => g.band.color.set(teams[k]!));
      const c = new THREE.Color();
      for (let i = 0; i < crewBody.count; i++)
        crewBody.setColorAt(i, c.set(teams[Math.floor(i / SLOTS.length)]!));
      crewBody.instanceColor!.needsUpdate = true;
      paints.forEach((ps, id) => ps.forEach((p) => p(liveries[id >> 1]!)));
    },
    skipIntro() {
      if (intro < 1) {
        intro = 1;
        snap = true;
      }
    },
    dispose() {
      scene.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        o.geometry.dispose();
        for (const m of [o.material].flat() as THREE.MeshStandardMaterial[]) {
          m.map?.dispose();
          m.dispose();
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

export type Scene = Awaited<ReturnType<typeof createScene>>;
