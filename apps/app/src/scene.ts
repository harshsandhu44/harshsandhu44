// The 3D side of the drive: track, park, car and the helicopter camera. The only module that
// imports three, and drive.tsx loads it on open so the hero never pays for it. Track (x, y) is
// three (x, 0, y): y-down canvas space becomes +z on the ground plane. Models are Kenney's Racing
// Kit (CC0, kenney.nl), recoloured to the site's tokens at load.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CARS } from "@/race";
import { KERB_R, PIT_HALF, STAND_HALF, WORK, type Car, type Track } from "@/track";

export type Colors = Record<"accent" | "carbon" | "paper" | "chrome" | "ink" | "pit", string>;

const SKY = "#c9d2d6";
const GRASS = ["#56705c", "#5d7863"];
const TREE = "#44634d";
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

const place = (x: number, z: number, rot: number, sx: number, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(
    new THREE.Vector3(x, 0, z),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rot),
    new THREE.Vector3(sx, sy, sz),
  );

// Renders into a canvas of its own inside `host`, so a second scene (React's dev double mount, or
// reopening the dialog) never inherits a context the first one threw away.
export async function createScene(host: HTMLElement, C: Colors, flat: boolean, track: Track) {
  const { BOARDS, BOXES, BOX, CURVE, HALF, MID, PATH, PIT_SIDE, STANDS, TREES, WALLS } = track;
  const { atDist, offset, pitOffset, pointAt, working } = track;
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.domElement.className = "block size-full";
  host.append(renderer.domElement);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  scene.fog = new THREE.Fog(SKY, 260, 720);

  const mid = new THREE.Vector3(MID[0], 0, MID[1]);

  // Grass: a two-pixel texture repeated into 12 m mowing stripes, under the circuit and a margin.
  const size = Math.max(BOX.x1 - BOX.x0, BOX.y1 - BOX.y0) + 900;
  const mow = document.createElement("canvas");
  mow.width = 2;
  mow.height = 1;
  const mc = mow.getContext("2d")!;
  GRASS.forEach((g, i) => {
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

  // Gravel traps on the outside (-sign side) of the tight corners.
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

  // The cars, about 5.5 m long. The model faces +z. Yours is the model; the others are clones,
  // and each has its own copy of the body paint for paint() to set.
  const paints: THREE.MeshStandardMaterial[][] = [];
  const bodies = Array.from({ length: CARS }, (_, k) => {
    const b = k ? car!.root.clone(true) : car!.root;
    const paint: THREE.MeshStandardMaterial[] = [];
    b.traverse((o) => {
      if (!(o instanceof THREE.Mesh) || o.material.name !== "red") return;
      o.material = o.material.clone();
      paint.push(o.material);
    });
    paints.push(paint);
    b.scale.setScalar(5.5 / car!.size.z);
    scene.add(b);
    return b;
  });
  const body = bodies[0]!;
  const wheels = ["wheelFrontLeft", "wheelFrontRight"].map((n) => body.getObjectByName(n));

  scene.add(new THREE.HemisphereLight("#e4ebf0", "#3d5244", 1.4));
  const sun = new THREE.DirectionalLight("#fff1dc", 2.6);
  const SUN = new THREE.Vector3(-40, 90, 30);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -60, right: 60, top: 60, bottom: -60, far: 250 });
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

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
    // Every car, yours first, and each team's crew: 0 in the garage, 1 a car in the lane, 2 a
    // car stopped at the box.
    frame(cars: Car[], steer: number, dt: number, crews: number[]) {
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
      cars.forEach((o, k) => {
        bodies[k]!.position.set(o.x, RIDE, o.y);
        bodies[k]!.rotation.y = Math.PI / 2 - o.h;
      });
      for (const w of wheels) if (w) w.rotation.y = -steer * 0.4;
      sun.position.set(c.x + SUN.x, SUN.y, c.y + SUN.z);
      sun.target.position.set(c.x, 0, c.y);

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
    resize(w: number, h: number) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      // Portrait phones need a taller view to see the next corner.
      camera.fov = w < h ? 60 : 45;
      camera.updateProjectionMatrix();
    },
    // Team colours, yours "" for the accent: its two cars, its box, garage and crew.
    paint(teams: string[]) {
      boxes.forEach((m, k) => m.color.set(teams[k] || C.accent));
      garages.forEach((g, k) => g.band.color.set(teams[k] || C.accent));
      const c = new THREE.Color();
      for (let i = 0; i < crewBody.count; i++)
        crewBody.setColorAt(i, c.set(teams[Math.floor(i / SLOTS.length)] || C.accent));
      crewBody.instanceColor!.needsUpdate = true;
      paints.forEach((ms, id) => ms.forEach((m) => m.color.set(teams[id >> 1] || C.accent)));
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
