// Tracks and the car for the drive the start lights unlock. Units are metres, y points down
// (canvas space) and each lap runs from the start line on the main straight. buildTrack turns a
// circuit's data (tracks.ts) into everything the race, the scene and the checks read.

type Pt = [number, number];

// A circuit: its centreline and widths, and the details read off them by hand. Distances are
// metres round the lap from the line (negative counts back from it).
export type TrackDef = {
  id: string;
  name: string;
  // The real lap length, for the check.
  length: number;
  data: [number, number, number, number][];
  // Where the car turns in, and the last apex. `boards` puts 150/100/50 m boards before turn-in.
  corners: { name: string; turnIn: number; at: number; boards: boolean }[];
  // The straights where the wings go flat (Straight Mode), from `from` to `to`, and the line at
  // `detect` that decides Overtake Mode for the zone.
  zones: { detect: number; from: number; to: number }[];
  // The pit lane, right (1) or left (-1) of the main straight. It leaves the track at `in`, is
  // fully out by `from`, starts back at `to` and rejoins at `out`.
  pit: { side: 1 | -1; in: number; from: number; to: number; out: number };
  // Grandstands: centre m round the lap, gap from the tarmac to the stand (negative on the left).
  stands: [m: number, gap: number][];
  // Plants the park.
  seed: number;
  // For the computer's strategy, both measured in race.check.ts: how much a lap slows as the tyres
  // lose grip (lap time goes as grip ^ -grip), and what a stop costs, in fresh-medium laps.
  grip: number;
  stop: number;
  // Pro's extra grip here, if the shared one (race.ts EDGE) leaves pro easier or harder than at
  // Monza; race.check.ts says which.
  proEdge?: number;
  // And legends', against theirs (race.ts LEGEND_EDGE).
  legendsEdge?: number;
};

// Unit normal at each point of a closed line, averaged over the segments either side. It points
// to the right of travel.
const normals = (pts: readonly (readonly number[])[]) =>
  pts.map((_, i) => {
    const [ax, ay] = pts[(i - 1 + pts.length) % pts.length]!;
    const [bx, by] = pts[(i + 1) % pts.length]!;
    const l = Math.hypot(bx! - ax!, by! - ay!);
    return [-(by! - ay!) / l, (bx! - ax!) / l] as const;
  });

// Signed curvature (radians per metre) at each point of a closed line of the given length,
// measured over w points either side. Positive bends right (towards +normal), so the outside of
// a corner is at offset(-sign * d).
const curvature = (w: number, pts: readonly Pt[], length: number) =>
  pts.map((_, i) => {
    const N = pts.length;
    const dir = (j: number) => {
      const [ax, ay] = pts[(j + N) % N]!;
      const [bx, by] = pts[(j + 1 + N) % N]!;
      return Math.atan2(by - ay, bx - ax);
    };
    let turn = dir(i + w - 1) - dir(i - w);
    turn = Math.atan2(Math.sin(turn), Math.cos(turn));
    return turn / ((2 * w * length) / N);
  });

// Distance along a closed line to each point; the last entry is the full lap.
const cumulative = (pts: readonly Pt[]) =>
  pts.reduce(
    (acc, [x, y], i) => {
      const [nx, ny] = pts[(i + 1) % pts.length]!;
      acc.push(acc[i]! + Math.hypot(nx - x, ny - y));
      return acc;
    },
    [0],
  );

export const CAR_HALF_WIDTH = 1.3;
// How far beyond the tarmac edge the car is (negative while on it).
export const onGrass = (edge: number) => edge > 0;
export const allFourOff = (edge: number) => edge > CAR_HALF_WIDTH;

export type Car = { x: number; y: number; h: number; v: number };
// `ot` fires Overtake Mode while it's ready.
export type Input = { gas: boolean; brake: boolean; steer: number; ot?: boolean };

// Roughly F1. Drag cancels the throttle at the top speed, which is lower on grass. Downforce
// makes braking and cornering grip grow with the square of speed, and grip caps how fast the car
// can turn: arrive too fast and it runs wide however hard you steer. Holding the brake brings
// the car to a stop and then reverses it.
// ponytail: tuned against the ideal lap in track.check.ts. These are the knobs if it drives wrong.
export const TOP = 95;
const GRASS_TOP = 30;
const ACCEL = 14;
const COAST = 4;
const TURN = 2.4;
const REVERSE = 8;
const REVERSE_TOP = 10;
const DOWNFORCE = 0.0035;
const GRIP = 24;
export const brakeAt = (v: number) => 15 + DOWNFORCE * v * v;
export const gripAt = (v: number) => GRIP + DOWNFORCE * v * v;

// g is what's left of the tyres' grip (1 new) and scales cornering and braking. Returns whether
// the steering asked for more than the grip gave: the car is sliding, which wears the tyres.
// `top` is the speed drag allows, higher with the 2026 power on.
export function step(car: Car, input: Input, dt: number, grass: boolean, g = 1, top = TOP) {
  const v = car.v;
  const drag = v > 0 ? ACCEL / (grass ? GRASS_TOP : top) ** 2 : REVERSE / REVERSE_TOP ** 2;
  let a = -drag * v * Math.abs(v);
  // Each pedal brakes while the car rolls the other way, then drives.
  if (input.gas) a += v < -0.5 ? brakeAt(v) * g : ACCEL;
  if (input.brake) a -= v > 0.5 ? brakeAt(v) * g : REVERSE;
  if (!input.gas && !input.brake) a -= COAST * Math.sign(v);
  car.v = v + a * dt;
  // Coasting stops at zero rather than rolling the other way.
  if (!input.gas && !input.brake && Math.sign(car.v) !== Math.sign(v)) car.v = 0;
  // Steering needs some speed to bite, and grip caps the turn rate. Going backwards turns the
  // nose the other way, like a real car.
  const speed = Math.abs(car.v);
  const cap = (gripAt(speed) * g) / Math.max(speed, 1);
  const turn = input.steer * TURN * Math.max(-1, Math.min(1, car.v / 12));
  car.h += Math.max(-cap, Math.min(cap, turn)) * dt;
  car.x += Math.cos(car.h) * car.v * dt;
  car.y += Math.sin(car.h) * car.v * dt;
  return Math.abs(turn) > cap;
}

// Shown in the HUD.
export const gear = (v: number) =>
  v < -0.5 ? "R" : Math.min(8, Math.max(1, 1 + Math.floor((v / TOP) * 8)));

// Profiles every 0.05 of grip from 1.15 (softs, and a pro's extra grip) down to 0.55 (fully
// worn), blended between. Downforce means the fast corners lose more than √grip would say, so
// it's worth the ~13k sums at load.
const STEPS = 13;
const grips = (k: number) => 1.15 - k * 0.05;
// The racing line keeps this far from the tarmac edge.
const LINE_MARGIN = 1.6;

// Everything beside the track. Walls stand RUNOFF beyond the tarmac on both sides.
export const RUNOFF = 20;
const WALL_HALF_THICK = 0.45;
export const STAND_HALF = 11;
// The car collides as a circle. ponytail: a 5.5 m car as a circle overlaps a little at the nose
// and tail; use two circles if it looks wrong.
const CAR_R = 1.6;
// Kerbs and the tree-free zones go on corners tighter than this radius.
export const KERB_R = 250;
export const PIT_HALF = 3.5;
// Along the flat of the lane the boxes sit in a working lane WORK further out than the fast
// lane, so a car at its box is out of the way of the cars going by.
export const WORK = 5.5;

// mulberry32, so the park is planted the same way every time.
function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildTrack(def: TrackDef) {
  // The source centreline isn't quite central, so shift each point half the difference between
  // its two widths. Then the track is HALF[i] either side of PATH[i], never under 9.5 m: three of
  // the 3 m-wide cars abreast, with a little room.
  const RAW_NORMALS = normals(def.data);
  const PATH = def.data.map(([x, y, right, left], i): Pt => {
    const [nx, ny] = RAW_NORMALS[i]!;
    return [x + (nx * (right - left)) / 2, y + (ny * (right - left)) / 2];
  });
  const HALF = def.data.map(([, , right, left]) => Math.max(4.75, (right + left) / 2));
  const N = PATH.length;
  // Distance along the lap to each point; CUM[N] is the full lap.
  const CUM = cumulative(PATH);
  const LENGTH = CUM[N]!;
  // The point a given distance round the lap.
  const atDist = (m: number) => {
    const d = ((m % LENGTH) + LENGTH) % LENGTH;
    return Math.max(0, CUM.findIndex((c) => c > d) - 1);
  };

  const NORMALS = normals(PATH);
  // The centreline pushed sideways by d, or by d(i) at each point: the road edges, kerbs, gravel
  // and barrier lines. Positive is to the right of travel.
  const offset = (d: number | ((i: number) => number)) =>
    PATH.map(([x, y], i): Pt => {
      const k = typeof d === "number" ? d : d(i);
      return [x + NORMALS[i]![0] * k, y + NORMALS[i]![1] * k];
    });

  // Smooth, for placing kerbs, gravel and trees.
  const CURVE = curvature(5, PATH, LENGTH);

  // Distance from the centreline and from the tarmac edge, and how far round the lap (0 to 1) the
  // nearest point is. ponytail: linear scan over ~1,400 segments a frame; search around the last
  // index if it ever shows.
  function nearest(x: number, y: number) {
    let best = Infinity;
    let p = 0;
    let half = 0;
    for (let i = 0; i < N; i++) {
      const [ax, ay] = PATH[i]!;
      const [bx, by] = PATH[(i + 1) % N]!;
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / len2));
      const d2 = (ax + t * dx - x) ** 2 + (ay + t * dy - y) ** 2;
      if (d2 < best) {
        best = d2;
        p = (CUM[i]! + t * Math.sqrt(len2)) / LENGTH;
        half = HALF[i]! * (1 - t) + HALF[(i + 1) % N]! * t;
      }
    }
    const dist = Math.sqrt(best);
    return { dist, p, edge: dist - half };
  }

  // The fastest the car can be at each point and still make every corner ahead under full
  // braking: the corner speed where grip matches v²/R, then braking distances worked back from
  // each corner. Curvature over a short window, so the chicanes keep their bite, and the tightest
  // within 15 m either side, so the limit never promises more than the apex allows.
  const SHARP = curvature(2, PATH, LENGTH).map(Math.abs);
  // The profile for tyres with grip g (1 new): grip and braking both scale with it. Along the
  // centreline unless given another line's curvature and distances.
  const profile = (g: number, sharp = SHARP, cum = CUM) => {
    const corner = sharp.map((_, i) => {
      let k = 0;
      for (let j = -3; j <= 3; j++) k = Math.max(k, sharp[(i + j + N) % N]!);
      const r = 1 / Math.max(k, 1e-6);
      const d = g * DOWNFORCE * r;
      return d >= 1 ? TOP : Math.min(TOP, Math.sqrt((g * GRIP * r) / (1 - d)));
    });
    const limit = corner.slice();
    for (let pass = 0; pass < 2; pass++)
      for (let i = N - 1; i >= 0; i--) {
        const next = limit[(i + 1) % N]!;
        const ds = cum[i + 1]! - cum[i]!;
        limit[i] = Math.min(corner[i]!, Math.sqrt(next * next + 2 * g * brakeAt(next) * ds));
      }
    return limit;
  };
  const LIMIT = profile(1);
  const WORN = Array.from({ length: STEPS }, (_, k) => profile(grips(k)));

  // The racing line: how far right of the centreline to drive at each point, for the least
  // curvature the width allows with LINE_MARGIN to the tarmac edge. Each pass pulls every point
  // towards where its neighbours' bend would put it (half way, as the full step overshoots) and
  // keeps it on the tarmac. 300 passes at load, about 10 ms.
  const RACING: number[] = PATH.map(() => 0);
  const onLine = (j: number): Pt => {
    const i = (j + N) % N;
    return [PATH[i]![0] + NORMALS[i]![0] * RACING[i]!, PATH[i]![1] + NORMALS[i]![1] * RACING[i]!];
  };
  for (let pass = 0; pass < 300; pass++)
    for (let i = 0; i < N; i++) {
      const [a, b, c, d] = [onLine(i - 2), onLine(i - 1), onLine(i + 1), onLine(i + 2)];
      const tx = (-a[0] + 4 * b[0] + 4 * c[0] - d[0]) / 6;
      const ty = (-a[1] + 4 * b[1] + 4 * c[1] - d[1]) / 6;
      const want = (tx - PATH[i]![0]) * NORMALS[i]![0] + (ty - PATH[i]![1]) * NORMALS[i]![1];
      const room = HALF[i]! - LINE_MARGIN;
      RACING[i] = Math.max(-room, Math.min(room, RACING[i]! + (want - RACING[i]!) / 2));
    }
  // The line's own speed profiles, from its curvature and distances.
  const LINE = PATH.map((_, i) => onLine(i));
  const LINE_CUM = cumulative(LINE);
  const LINE_CURVE = curvature(2, LINE, LINE_CUM[N]!);
  // Its curvature is the tighter of the short-window one and the circle through each point and
  // the ones 20 m either side. ponytail: the short window alone smooths the centreline's wiggles
  // away and promised more speed through Monza's Lesmo 1 than the car has the grip for; 20 m is
  // the span that keeps every level clean at full pace in race.check.ts.
  const circle = (a: Pt, b: Pt, c: Pt) => {
    const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.hypot(c[0] - b[0], c[1] - b[1]);
    return Math.abs((2 * cross) / (l * Math.hypot(a[0] - c[0], a[1] - c[1])));
  };
  const LINE_SHARP = LINE.map((p, i) =>
    Math.max(Math.abs(LINE_CURVE[i]!), circle(LINE[(i - 4 + N) % N]!, p, LINE[(i + 4) % N]!)),
  );
  const LINE_WORN = Array.from({ length: STEPS }, (_, k) =>
    profile(grips(k), LINE_SHARP, LINE_CUM),
  );

  // The speed limit at point i on tyres with grip g, driving `line` of the way from the
  // centreline (0) to the racing line (1).
  const limitAt = (i: number, g: number, line = 0) => {
    const f = Math.min(STEPS - 1, Math.max(0, (1.15 - g) / 0.05));
    const k = Math.min(STEPS - 2, Math.floor(f));
    const at = (w: number[][]) => w[k]![i]! + (w[k + 1]![i]! - w[k]![i]!) * (f - k);
    return line ? at(WORN) + (at(LINE_WORN) - at(WORN)) * line : at(WORN);
  };

  // The track's heading at progress p, and how far right of the centreline (x, y) is there.
  const dirAt = (p: number) => {
    const i = atDist(p * LENGTH);
    const [ax, ay] = PATH[i]!;
    const [bx, by] = PATH[(i + 1) % N]!;
    return Math.atan2(by - ay, bx - ax);
  };
  const lateral = (x: number, y: number, p: number) => {
    const i = atDist(p * LENGTH);
    return (x - PATH[i]![0]) * NORMALS[i]![0] + (y - PATH[i]![1]) * NORMALS[i]![1];
  };
  // The point m metres round the lap (negative counts back from the line), lat to the right.
  const pointAt = (m: number, lat: number): Pt => {
    const i = atDist(m);
    return [PATH[i]![0] + NORMALS[i]![0] * lat, PATH[i]![1] + NORMALS[i]![1] * lat];
  };
  // Metres from the line, negative before it, so the pit lane's numbers read naturally.
  const signed = (p: number) => (p > 0.5 ? p - 1 : p) * LENGTH;

  // The pit lane, on PIT_SIDE of the main straight. It leaves the track before the line, runs 8 m
  // beyond the tarmac behind a pit wall, and rejoins after it. pitOffset and working are signed,
  // like lateral: multiply a distance out from the track by PIT_SIDE.
  const { side: PIT_SIDE, in: PIT_IN, from: PIT_FROM, to: PIT_TO, out: PIT_OUT } = def.pit;
  const ease = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
  const pitOffset = (i: number) => {
    const s = signed(CUM[i]! / LENGTH);
    const k =
      s < PIT_FROM
        ? ease((s - PIT_IN) / (PIT_FROM - PIT_IN))
        : ease((PIT_OUT - s) / (PIT_OUT - PIT_TO));
    return PIT_SIDE * k * (HALF[i]! + 8);
  };
  const working = (i: number) => {
    const s = signed(CUM[i]! / LENGTH);
    return s > PIT_FROM && s < PIT_TO ? PIT_SIDE * WORK : 0;
  };
  // In the lane: past the tarmac edge and on the fast or working lane, between where it leaves
  // and rejoins.
  const inPit = (x: number, y: number, p: number) => {
    const s = signed(p);
    if (s < PIT_IN || s > PIT_OUT) return false;
    const i = atDist(s);
    const out = PIT_SIDE * lateral(x, y, p);
    const lat = out - PIT_SIDE * pitOffset(i);
    return out > HALF[i]! && lat > -PIT_HALF && lat < PIT_HALF + PIT_SIDE * working(i);
  };
  // One box per team, 24 m apart in the working lane from just after the lane is fully out:
  // room for a car pulling out of one not to meet a car turning into the next.
  const BOXES = Array.from({ length: 10 }, (_, k) => {
    const i = atDist(PIT_FROM + 10 + k * 24);
    // On a path point, so the paint and the stop agree to the centimetre.
    const s = signed(CUM[i]! / LENGTH);
    const [x, y] = pointAt(s, pitOffset(i) + PIT_SIDE * WORK);
    return { s, x, y, h: dirAt(CUM[i]! / LENGTH) };
  });

  // Corners by distance from the line, read off the curvature in the data.
  const CORNERS = def.corners;
  // The corner the car is heading for, until it's past that corner's last apex.
  const nextCorner = (p: number) => (CORNERS.find((c) => c.at > p * LENGTH) ?? CORNERS[0]!).name;
  // Metres from a to b going forward round the lap.
  const ahead = (a: number, b: number) => (((b - a) % LENGTH) + LENGTH) % LENGTH;
  // The corner with the nearest apex either way, for naming where something happened.
  const cornerAt = (p: number) => {
    const m = p * LENGTH;
    const near = (c: (typeof CORNERS)[number]) => Math.min(ahead(m, c.at), ahead(c.at, m));
    return CORNERS.reduce((a, c) => (near(c) < near(a) ? c : a)).name;
  };

  const ZONES = def.zones;
  const inZone = (m: number, z: (typeof ZONES)[number]) => ahead(z.from, m) < ahead(z.from, z.to);

  // Distance boards on the outside of each braking zone, facing the oncoming car.
  const BOARDS = CORNERS.filter((c) => c.boards).flatMap((c) =>
    [150, 100, 50].map((m) => {
      const i = atDist(c.turnIn - m);
      const side = -Math.sign(CURVE[atDist(c.turnIn + 20)]!) || -1;
      const [x, y] = offset((j) => side * (HALF[j]! + 3))[i]!;
      const [ax, ay] = PATH[i]!;
      const [bx, by] = PATH[(i + 1) % N]!;
      return { x, y, h: Math.atan2(by - ay, bx - ax), m };
    }),
  );

  // Grandstands, centre the gap plus STAND_HALF beyond the tarmac; (fx, fy) faces the track.
  const STANDS = def.stands.map(([m, gap]) => {
    const i = atDist(m);
    const [x, y] = pointAt(m, Math.sign(gap) * (HALF[i]! + Math.abs(gap) + STAND_HALF));
    const [px, py] = PATH[i]!;
    const l = Math.hypot(px - x, py - y);
    return { x, y, fx: (px - x) / l, fy: (py - y) / l };
  });
  const inStand = (x: number, y: number, margin: number) =>
    STANDS.some(({ x: sx, y: sy, fx, fy }) => {
      const dx = x - sx;
      const dy = y - sy;
      const lim = STAND_HALF + margin;
      return Math.abs(dx * fx + dy * fy) < lim && Math.abs(dy * fx - dx * fy) < lim;
    });

  // One wall per path segment, dropped wherever the offset line folds back towards the track on
  // the inside of a corner, and where a grandstand stands in for it.
  const WALLS = [1, -1].flatMap((side): [number, number, number, number][] => {
    const pts = offset((i) => side * (HALF[i]! + RUNOFF));
    return pts.flatMap(([ax, ay], i) => {
      const [bx, by] = pts[(i + 1) % N]!;
      const [mx, my] = [(ax + bx) / 2, (ay + by) / 2];
      return nearest(mx, my).edge < RUNOFF - 1 || inStand(mx, my, 1) ? [] : [[ax, ay, bx, by]];
    });
  });
  // The pit wall, between the track and the flat of the lane, starting a little after the lane
  // is fully out so a car that turns in late still makes it.
  const PIT_WALL = offset((i) => PIT_SIDE * (HALF[i]! + 4));
  for (let i = atDist(PIT_FROM + 20); i !== atDist(PIT_TO); i = (i + 1) % N)
    WALLS.push([...PIT_WALL[i]!, ...PIT_WALL[(i + 1) % N]!]);

  // The park: thickest near the track, where the camera looks. r is the canopy's footprint for a
  // Kenney treeLarge or treeSmall at scale s.
  const xs = PATH.map((p) => p[0]);
  const ys = PATH.map((p) => p[1]);
  const BOX = {
    x0: Math.min(...xs),
    y0: Math.min(...ys),
    x1: Math.max(...xs),
    y1: Math.max(...ys),
  };
  const MID = [(BOX.x0 + BOX.x1) / 2, (BOX.y0 + BOX.y1) / 2] as const;
  const TREES: { x: number; y: number; big: boolean; s: number; rot: number; r: number }[] = [];
  const rand = seeded(def.seed);
  const plant = (x: number, y: number, scale: number) => {
    const big = rand() < 0.6;
    const s = scale + rand() * 3;
    TREES.push({ x, y, big, s, rot: rand() * Math.PI * 2, r: (big ? 0.12 : 0.09) * s });
  };
  // Inside the barriers: a loose row along the straights, kept off the kerbs and gravel (no tight
  // corner within 40 m), clear of the pit lane and the stands, with at least 8 m of grass to the
  // tarmac and 5 m to the barrier so a car scraping the wall doesn't snag on them.
  const tight = (i: number) => {
    for (let k = -8; k <= 8; k++) if (Math.abs(CURVE[(i + k + N) % N]!) > 1 / KERB_R) return true;
    return false;
  };
  for (let i = 12; i < N - 6; i += 3)
    for (const side of [1, -1]) {
      const s = signed(CUM[i]! / LENGTH);
      const lane = side === PIT_SIDE && s > PIT_IN - 40 && s < PIT_OUT + 40;
      if (rand() < 0.45 || tight(i) || lane) continue;
      const d = HALF[i]! + 8 + rand() * (RUNOFF - 14);
      const [x, y] = offset(side * d)[i]!;
      if (nearest(x, y).dist < d - 1 || inStand(x, y, 4)) continue;
      plant(x, y, 5);
    }
  // Behind the barriers. A rough distance against every fourth segment is plenty this far out and
  // keeps load time down. ponytail: ~25k candidates × 350 segments at load (tens of ms).
  const rough = (x: number, y: number) => {
    let best = Infinity;
    for (let i = 0; i < N; i += 4) {
      const [ax, ay] = PATH[i]!;
      const [bx, by] = PATH[(i + 4) % N]!;
      const dx = bx - ax;
      const dy = by - ay;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy)));
      best = Math.min(best, Math.hypot(ax + t * dx - x, ay + t * dy - y));
    }
    return best;
  };
  for (let n = 0; n < 25000 && TREES.length < 2200; n++) {
    const x = BOX.x0 - 150 + rand() * (BOX.x1 - BOX.x0 + 300);
    const y = BOX.y0 - 150 + rand() * (BOX.y1 - BOX.y0 + 300);
    const dist = rough(x, y);
    if (dist < 6.5 + RUNOFF + 10 || (dist > 140 && rand() < 0.85) || inStand(x, y, 4)) continue;
    plant(x, y, 7);
  }

  // ponytail: checks every obstacle every frame (about 2,200, cheap next to drawing); bucket them
  // in a grid if it ever shows in a profile.
  function collide(car: Car) {
    for (const [ax, ay, bx, by] of WALLS) {
      if (Math.abs(car.x - ax) > 12 || Math.abs(car.y - ay) > 12) continue;
      const dx = bx - ax;
      const dy = by - ay;
      const t = Math.max(
        0,
        Math.min(1, ((car.x - ax) * dx + (car.y - ay) * dy) / (dx * dx + dy * dy)),
      );
      touch(car, ax + t * dx, ay + t * dy, WALL_HALF_THICK);
    }
    for (const t of TREES)
      if (Math.abs(car.x - t.x) < 6 && Math.abs(car.y - t.y) < 6) touch(car, t.x, t.y, t.r);
    for (const { x, y, fx, fy } of STANDS) {
      const dx = car.x - x;
      const dy = car.y - y;
      const a = dx * fx + dy * fy;
      const b = dy * fx - dx * fy;
      const ca = Math.max(-STAND_HALF, Math.min(STAND_HALF, a));
      const cb = Math.max(-STAND_HALF, Math.min(STAND_HALF, b));
      if (ca !== a || cb !== b) touch(car, x + fx * ca - fy * cb, y + fy * ca + fx * cb, 0);
      // Centre inside the stand: out through the nearest face.
      else if (STAND_HALF - Math.abs(a) < STAND_HALF - Math.abs(b))
        hit(car, fx * Math.sign(a), fy * Math.sign(a), STAND_HALF - Math.abs(a) + CAR_R);
      else hit(car, -fy * Math.sign(b), fx * Math.sign(b), STAND_HALF - Math.abs(b) + CAR_R);
    }
  }

  return {
    id: def.id,
    name: def.name,
    PRO_EDGE: def.proEdge,
    GRIP_POWER: def.grip,
    STOP_LAPS: def.stop,
    LEGENDS_EDGE: def.legendsEdge,
    PATH,
    HALF,
    CUM,
    LENGTH,
    CURVE,
    LIMIT,
    RACING,
    atDist,
    offset,
    nearest,
    limitAt,
    dirAt,
    lateral,
    pointAt,
    signed,
    PIT_SIDE,
    PIT_IN,
    PIT_OUT,
    pitOffset,
    working,
    inPit,
    BOXES,
    CORNERS,
    nextCorner,
    ahead,
    cornerAt,
    ZONES,
    inZone,
    BOARDS,
    STANDS,
    WALLS,
    BOX,
    MID,
    TREES,
    collide,
  };
}
export type Track = ReturnType<typeof buildTrack>;

export const startCar = (track: Track): Car => {
  const [[x, y], [nx, ny]] = track.PATH as [Pt, Pt];
  return { x, y, h: Math.atan2(ny - y, nx - x), v: 0 };
};

// Pushes the car out of an obstacle along (nx, ny) and takes off the speed it had going into it.
// A head-on hit bounces it back; a glancing one scrubs a little and turns the car along the
// obstacle, so it slides down a wall rather than sticking to it.
function hit(car: Car, nx: number, ny: number, depth: number) {
  car.x += nx * depth;
  car.y += ny * depth;
  const dx = Math.cos(car.h);
  const dy = Math.sin(car.h);
  const along = dx * nx + dy * ny;
  if (along * car.v >= 0) return;
  if (Math.abs(along) > 0.7) {
    car.v *= -0.25;
    return;
  }
  car.v *= 1 - Math.abs(along);
  car.h = Math.atan2(dy - along * ny, dx - along * nx);
}

// Against the nearest point (px, py) of something r thick.
function touch(car: Car, px: number, py: number, r: number) {
  const dx = car.x - px;
  const dy = car.y - py;
  const d = Math.hypot(dx, dy);
  if (d < CAR_R + r && d > 1e-6) hit(car, dx / d, dy / d, CAR_R + r - d);
}
// Car against car. Each is two circles, nose and tail, so they can run close side by side and
// nose to tail without overlapping. They push apart evenly, and the one driving into the other
// faster drops to just under its speed, once, so cars leaning on each other don't bleed speed.
const ends = (c: Car) => {
  const fx = Math.cos(c.h) * 1.6;
  const fy = Math.sin(c.h) * 1.6;
  return [
    [c.x + fx, c.y + fy],
    [c.x - fx, c.y - fy],
  ] as const;
};
export function bump(a: Car, b: Car) {
  if (Math.abs(a.x - b.x) > 6 || Math.abs(a.y - b.y) > 6) return false;
  let depth = 0;
  let nx = 0;
  let ny = 0;
  for (const [ax, ay] of ends(a))
    for (const [bx, by] of ends(b)) {
      const d = Math.hypot(bx - ax, by - ay);
      if (2.2 - d > depth && d > 1e-6) [depth, nx, ny] = [2.2 - d, (bx - ax) / d, (by - ay) / d];
    }
  if (!depth) return false;
  a.x -= (nx * depth) / 2;
  a.y -= (ny * depth) / 2;
  b.x += (nx * depth) / 2;
  b.y += (ny * depth) / 2;
  const aInto = Math.cos(a.h) * nx + Math.sin(a.h) * ny;
  const bInto = -(Math.cos(b.h) * nx + Math.sin(b.h) * ny);
  if (aInto > 0.5 && aInto >= bInto && a.v > b.v) a.v = b.v * 0.95;
  else if (bInto > 0.5 && b.v > a.v) b.v = a.v * 0.95;
  return true;
}

export type Lap = {
  start: number | null;
  p: number;
  halfway: boolean;
  invalid: boolean;
  // Lap time at each sector line crossed so far.
  marks: number[];
};
export const newLap = (): Lap => ({ start: null, p: 0, halfway: false, invalid: false, marks: [] });
// A sector ends: its time, whether the lap is still clean, and the lap time at the third.
export type Split = { sector: number; ms: number; valid: boolean; lap: number | null };

// Advances the lap with this frame's position. Sectors split at a third and two thirds of the
// way round, crossed going forward. A lap counts when the car crosses the line going forward
// after passing halfway going forward, so reversing over the line doesn't. Four wheels off at
// any point deletes it, like track limits on TV. A lap with no start that's already past halfway
// is a rolling start: its clock starts at the line.
export function lapTick(lap: Lap, p: number, edge: number, t: number): Split | null {
  const prev = lap.p;
  lap.p = p;
  if (lap.start === null) {
    if (lap.halfway && prev > 0.75 && p < 0.25) [lap.start, lap.halfway] = [t, false];
    return null;
  }
  if (allFourOff(edge)) lap.invalid = true;
  const ms = t - lap.start;
  const at = lap.marks.at(-1) ?? 0;
  const line = (lap.marks.length + 1) / 3;
  // A frame moves a few metres. A bigger jump means the nearest point hopped to another part of
  // the lap, so a cut across the infield doesn't cross the sector lines or halfway.
  const fwd = p > prev && p - prev < 0.02;
  if (lap.marks.length < 2 && fwd && prev < line && p >= line) {
    lap.marks.push(ms);
    return { sector: lap.marks.length - 1, ms: ms - at, valid: !lap.invalid, lap: null };
  }
  if (fwd && prev < 0.5 && p >= 0.5) lap.halfway = true;
  if (prev > 0.75 && p < 0.25 && lap.halfway) {
    const done = { sector: 2, ms: ms - at, valid: !lap.invalid, lap: ms };
    Object.assign(lap, { start: t, halfway: false, invalid: false, marks: [] });
    return done;
  }
  return null;
}

// Rounded to the millisecond first, so 7:59.9996 reads 8:00.000, not 7:60.000.
export const fmt = (t: number) => {
  const ms = Math.round(t);
  return `${Math.floor(ms / 60000)}:${((ms % 60000) / 1000).toFixed(3).padStart(6, "0")}`;
};
