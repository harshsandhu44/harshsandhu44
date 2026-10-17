// The 3D side of the drive: track, park, car and the helicopter camera. The only module that
// imports three, and drive.tsx loads it on open so the hero never pays for it. Track (x, y) is
// three (x, 0, y): y-down canvas space becomes +z on the ground plane. Models are Kenney's Racing
// Kit (CC0, kenney.nl), recoloured to the site's tokens at load.
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CARS } from "@/race";
import { KERB_R, PIT_HALF, STAND_HALF, type Car, type Track } from "@/track";

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
  const { offset, pitOffset, working } = track;
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
  const boxGeo = new THREE.PlaneGeometry(6, 4).rotateX(-Math.PI / 2);
  const boxes = BOXES.map((b) => {
    const mat = new THREE.MeshStandardMaterial({ color: C.accent, roughness: 0.8 });
    const m = new THREE.Mesh(boxGeo, mat);
    m.position.set(b.x, 0.025, b.y);
    m.rotation.y = yaw(Math.cos(b.h), Math.sin(b.h));
    m.receiveShadow = true;
    scene.add(m);
    return mat;
  });

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
      WALLS.map(([ax, az, bx, bz]) => {
        const len = Math.hypot(bx - ax, bz - az);
        return place((ax + bx) / 2, (az + bz) / 2, yaw(bx - ax, bz - az), len / wall!.size.x, 7, 7);
      }),
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
    // Every car, yours first.
    frame(cars: Car[], steer: number, dt: number) {
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
    // Team colours, yours "" for the accent: its two cars and its box.
    paint(teams: string[]) {
      boxes.forEach((m, k) => m.color.set(teams[k] || C.accent));
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
