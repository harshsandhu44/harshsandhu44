// Self-check for the drive's tracks and lap logic. Run: node src/track.check.ts
import assert from "node:assert/strict";
import {
  RUNOFF,
  STAND_HALF,
  TOP,
  fmt,
  gear,
  gripAt,
  lapTick,
  newLap,
  onGrass,
  startCar,
  step,
  type Car,
  type Input,
  type Track,
} from "./track.ts";
import { TRACKS, getTrack } from "./tracks.ts";

// Monza in detail, then what every track has to get right.
const monza = getTrack("monza");
const { CORNERS, CUM, CURVE, HALF, LENGTH, LIMIT, PATH, STANDS, TREES, WALLS } = monza;
const { atDist, collide, nearest, nextCorner, offset } = monza;

assert.ok(Math.abs(LENGTH - 5793) < 20, `the lap is Monza's 5,793 m (${Math.round(LENGTH)})`);
assert.equal(CUM.length, PATH.length + 1, "the closing segment is counted");

const [x, y] = PATH[200]!;
assert.ok(nearest(x, y).dist < 1e-9, "a centreline point is on the centreline");
assert.ok(Math.abs(nearest(x, y).p - CUM[200]! / LENGTH) < 1e-9, "and at its own progress");
assert.ok(nearest(x, y).edge < -3, "and well inside the tarmac");

for (const [i, [ex, ey]] of offset((j) => HALF[j]!).entries())
  if (i % 50 === 0) assert.ok(Math.abs(nearest(ex, ey).edge) < 0.5, `edge ${i} is on the edge`);
assert.ok(Math.abs(CURVE[atDist(200)]!) < 1 / 1000, "the main straight is straight");
assert.ok(CURVE[atDist(619)]! > 1 / 60, "the first corner, 620 m in, is a tight right");
assert.ok(LIMIT[atDist(619)]! < 25, "taken at about 70 km/h");
assert.equal(LIMIT[atDist(300)], TOP, "with the straight before it flat out");
assert.equal(nextCorner(0), "Rettifilo");
assert.equal(nextCorner(3000 / LENGTH), "Ascari");
assert.equal(nextCorner(5500 / LENGTH), "Rettifilo", "after Parabolica it wraps round");
assert.deepEqual(
  CORNERS.map((c) => c.at),
  CORNERS.map((c) => c.at).sort((a, b) => a - b),
  "corners in lap order",
);

// Drive the progress values a lap would produce, one frame each.
const run = (ps: number[], dist = 0) => {
  const lap = newLap();
  lap.start = 0;
  return ps.map((p, t) => lapTick(lap, p, dist, t * 1000)).filter(Boolean);
};
const laps = (ps: number[], dist = 0) => run(ps, dist).flatMap((s) => (s!.lap ? [s!] : []));
// Progress in small steps, like frames, through the given waypoints.
const steps = (...ws: number[]) =>
  ws.flatMap((w, i) => {
    const from = i ? ws[i - 1]! : w;
    const n = Math.max(1, Math.ceil(Math.abs(w - from) / 0.01));
    return Array.from({ length: n }, (_, k) => from + ((w - from) * (k + 1)) / n);
  });
const lap = run([...steps(0, 0.95), 0.05]);
assert.equal(lap.length, 3, "three splits");
assert.equal(
  lap.reduce((a, s) => a + s!.ms, 0),
  lap.at(-1)!.lap,
  "that add up to the lap",
);
assert.deepEqual(laps([0, 0.9, 0.05]), [], "reversing over the line and back doesn't count");
assert.equal(run(steps(0, 0.4, 0.3, 0.4)).length, 1, "crossing a sector line twice splits once");
assert.equal(run(steps(0.5, 0.3)).length, 0, "reversing over a sector line doesn't split");
assert.equal(run([0.3, 0.4]).length, 0, "jumping across the infield doesn't split");
assert.deepEqual(laps([0, 0.3, 0.6, 0.9, 0.05]), [], "nor does cutting the lap short");
assert.equal(
  laps([...steps(0, 0.95), 0.05], 5)[0]!.valid,
  false,
  "four wheels off deletes the lap",
);
const idle = newLap();
assert.equal(lapTick(idle, 0.6, 0, 0), null, "no timing before the first input");

const speed = (grass: boolean) => {
  const car = startCar(monza);
  for (let i = 0; i < 600; i++) step(car, { gas: true, brake: false, steer: 0 }, 1 / 60, grass);
  return car.v;
};
assert.ok(speed(true) < speed(false) / 2, "grass is slow");

assert.equal(gear(0), 1);
assert.equal(gear(TOP), 8);
assert.equal(gear(-5), "R");
assert.equal(gear(-0.2), 1, "barely rolling back is still first");

// Runs a car for some seconds of frames, colliding as the game does.
const drive = (car: Car, input: Partial<Input>, secs: number) => {
  for (let i = 0; i < secs * 60; i++) {
    step(car, { gas: false, brake: false, steer: 0, ...input }, 1 / 60, false);
    collide(car);
  }
  return car;
};
const reversing = drive(startCar(monza), { brake: true }, 4);
assert.ok(reversing.v < -5 && reversing.v > -11, `brake from a stop reverses (${reversing.v})`);
assert.equal(
  drive(drive(startCar(monza), { gas: true }, 2), {}, 30).v,
  0,
  "coasting stops, never reverses",
);
const h0 = startCar(monza).h;
assert.ok(drive(startCar(monza), { gas: true, steer: 1 }, 1).h > h0, "steering right forwards");
assert.ok(
  drive(startCar(monza), { brake: true, steer: 1 }, 2).h < h0,
  "turns the nose left in reverse",
);

// Aims a car at (tx, ty) from 30 m away at 60 m/s.
const aim = (tx: number, ty: number, from: number) => {
  const car = { x: tx - Math.cos(from) * 30, y: ty - Math.sin(from) * 30, h: from, v: 60 };
  let closest = Infinity;
  for (let i = 0; i < 120; i++) {
    step(car, { gas: true, brake: false, steer: 0 }, 1 / 60, false);
    collide(car);
    closest = Math.min(closest, Math.hypot(car.x - tx, car.y - ty));
  }
  return { car, closest };
};
const [ax, ay, bx, by] = WALLS[100]!;
const [mx, my] = [(ax + bx) / 2, (ay + by) / 2];
const nx = -(by - ay);
const ny = bx - ax;
// Straight at the wall, from whichever side the track is.
const into =
  nearest(mx + nx * 0.1, my + ny * 0.1).dist < nearest(mx - nx * 0.1, my - ny * 0.1).dist
    ? Math.atan2(-ny, -nx)
    : Math.atan2(ny, nx);
const wall = aim(mx, my, into);
assert.ok(wall.closest > 1.6, `a wall stops the car (${wall.closest.toFixed(2)} m)`);
assert.ok(nearest(wall.car.x, wall.car.y).edge < RUNOFF, "on the track side of it");
// Trees and grandstands sit behind the walls, so overlap the car with them directly.
const tree = TREES[0]!;
const inTree = { x: tree.x + tree.r + 1, y: tree.y, h: 0, v: 0 };
collide(inTree);
assert.ok(
  Math.hypot(inTree.x - tree.x, inTree.y - tree.y) >= tree.r + 1.6 - 1e-9,
  "trees push out",
);
const stand = STANDS[0]!;
for (const deep of [0.5, 8]) {
  const inStand = {
    x: stand.x - stand.fx * (STAND_HALF - deep),
    y: stand.y - stand.fy * (STAND_HALF - deep),
    h: 0,
    v: 0,
  };
  collide(inStand);
  const out = -((inStand.x - stand.x) * stand.fx + (inStand.y - stand.y) * stand.fy);
  assert.ok(
    out >= STAND_HALF + 1.6 - 1e-9,
    `grandstands push out from ${deep} m in (${out.toFixed(2)})`,
  );
}
// Five degrees into the right-hand wall of the main straight, 250 m after the line.
const s = atDist(250);
const [cx, cy] = offset((j) => HALF[j]! + RUNOFF - 1.8)[s]!;
const roadH = Math.atan2(PATH[s + 1]![1] - PATH[s]![1], PATH[s + 1]![0] - PATH[s]![0]);
const along = drive({ x: cx, y: cy, h: roadH + 0.09, v: 50 }, { gas: true }, 1);
assert.ok(along.v > 40, `scraping along a wall keeps most of the speed (${along.v.toFixed(0)})`);
assert.ok(Math.abs(along.h - roadH) < 0.02, "and turns the car along it");

// Grip caps the turn rate: full lock at top speed turns no faster than grip allows.
const fast = { ...startCar(monza), v: TOP };
const h1 = fast.h;
step(fast, { gas: true, brake: false, steer: 1 }, 1 / 60, false);
assert.ok(fast.h - h1 <= gripAt(TOP) / TOP / 60 + 1e-9, "grip caps the turn rate");

// A lap by a simple driver on keyboard-style inputs: aim down the centreline, and with `brakes`
// brake whenever the car is over 95% of LIMIT (it uses none of the track's width, so it needs the
// margin). Without brakes it can't make the corners.
const autopilot = (track: Track, brakes: boolean) => {
  const { LENGTH, LIMIT, PATH, atDist, collide, nearest } = track;
  const car = startCar(track);
  const lap = newLap();
  lap.start = 0;
  for (let f = 1; f < 60 * 200; f++) {
    const { edge, p } = nearest(car.x, car.y);
    const [tx, ty] = PATH[atDist(p * LENGTH + 10 + Math.abs(car.v) * 0.25)]!;
    let diff = Math.atan2(ty - car.y, tx - car.x) - car.h;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    const over = car.v > LIMIT[atDist(p * LENGTH + 5)]! * 0.95;
    const steer = diff > 0.01 ? 1 : diff < -0.01 ? -1 : 0;
    step(car, { gas: !(brakes && over), brake: brakes && over, steer }, 1 / 60, onGrass(edge));
    collide(car);
    const split = lapTick(lap, p, edge, (f * 1000) / 60);
    if (split?.lap) return split;
  }
  return null;
};
const braking = autopilot(monza, true);
assert.ok(braking?.valid, "braking for the corners makes a clean lap");
assert.ok(
  braking.lap! > 80_000 && braking.lap! < 110_000,
  `in a real Monza time (${fmt(braking.lap!)})`,
);
const flat = autopilot(monza, false);
assert.ok(!flat?.valid, "flat out, it can't stay on the track");

for (const def of TRACKS) {
  const t = getTrack(def.id);
  const at = (what: string) => `${def.name}: ${what}`;
  const radius = (from: number, to: number) => {
    let k = 0;
    for (let m = from; m <= from + t.ahead(from, to); m += 5)
      k = Math.max(k, Math.abs(t.CURVE[t.atDist(m)]!));
    return 1 / k;
  };
  assert.ok(
    Math.abs(t.LENGTH - def.length) < def.length / 100,
    at(`the lap is the real ${def.length} m (${Math.round(t.LENGTH)})`),
  );
  assert.ok(radius(-170, 0) > 250, at("the grid is on a straight"));
  for (let slot = 0; slot < 20; slot++) {
    const [gx, gy] = t.pointAt(-10 - 8 * slot, 0);
    assert.ok(t.nearest(gx, gy).edge < -3, at(`grid slot ${slot} is on tarmac`));
  }
  t.CORNERS.forEach((c, k) => {
    assert.ok(c.turnIn < c.at && c.at < t.LENGTH, at(`${c.name} turns in before its apex`));
    assert.ok(k === 0 || c.turnIn > t.CORNERS[k - 1]!.at, at(`${c.name} comes after the last`));
    assert.ok(radius(c.at - 15, c.at + 15) < 300, at(`${c.name}'s apex is in a bend`));
  });
  for (const z of t.DRS_ZONES)
    assert.ok(radius(z.from, z.to) > 150, at(`DRS from ${z.from} m is on a straight`));
  for (const b of t.BOXES) {
    const { p } = t.nearest(b.x, b.y);
    assert.ok(t.inPit(b.x, b.y, p), at(`box at ${Math.round(b.s)} m is in the lane`));
    assert.ok(t.PIT_SIDE * t.lateral(b.x, b.y, p) > t.HALF[t.atDist(b.s)]!, at("off the track"));
  }
  for (const st of t.STANDS)
    assert.ok(t.nearest(st.x, st.y).edge > STAND_HALF + 5, at("the stands are clear of the track"));
  const clean = autopilot(t, true);
  assert.ok(clean?.valid, at("braking for the corners makes a clean lap"));
  console.log(`  ${def.name}: ${Math.round(t.LENGTH)} m, autopilot ${fmt(clean.lap!)}`);
}

assert.equal(fmt(83456), "1:23.456");
assert.equal(fmt(479999.97), "8:00.000");
assert.equal(fmt(5007), "0:05.007");

console.log("track: ok");
