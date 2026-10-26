// Self-check for the race: grid, tyres, pit lane, contact, wrong way and whole races run
// headless. Run: node src/race.check.ts
import assert from "node:assert/strict";
import { bump, fmt, step, TOP, type Car, type Track } from "./track.ts";
import { TRACKS, getTrack } from "./tracks.ts";
import {
  CARS,
  TIERS,
  carsOf,
  drawCars,
  DISTANCES,
  SPRINT,
  lapsOf,
  LEVELS,
  PIT_V,
  edgeOf,
  gap,
  grip,
  order,
  STOP,
  stintLaps,
  strategies,
  gridSlot,
  teamPlan,
  GRID as START,
  aiInput,
  newQuali,
  newRace,
  qualiDelta,
  qualiOrder,
  results,
  teamDriving,
  tick,
  toggleBox,
  trend,
  WINGS,
  wrongWay,
  type Level,
  type Msg,
  type Race,
  type Tyre,
} from "./race.ts";
import { BRAKE, GO, SOON, assist, guide } from "./assist.ts";

// The checks below race the shortest distance, the one the paces are tuned on, at Monza, the
// track they're tuned at. The pit lane and whole races then run on every track.
const LAPS = SPRINT;
// The distances are a share of each Grand Prix, as in the F1 games.
assert.deepEqual(
  DISTANCES.map((d) => lapsOf(d, getTrack("monaco"))),
  [5, 20, 27, 39, 78],
  "Monaco's distances",
);
const FULL = lapsOf(DISTANCES.at(-1)!, getTrack("monza"));
// Without qualifying you start at the back. The checks line the field up as it was tuned, with
// you P10: one race's result swings about 0.7% with the order (and the seed), more than the
// level checks allow.
assert.equal(START.at(-1), 0, "no qualifying, you start last");
const GRID = [...START.slice(0, 9), 0, ...START.slice(9, -1)];
const monza = getTrack("monza");
const { BOXES, HALF, LENGTH, PIT_OUT, RACING, atDist, dirAt, inPit, lateral, nearest } = monza;
const { pitOffset, pointAt, signed } = monza;

// The fields: twenty drivers each, you first, two to a team.
for (const [lv, { drivers, colors }] of Object.entries(LEVELS)) {
  assert.equal(drivers.length, CARS, `${lv} has ${CARS} drivers`);
  assert.equal(new Set(drivers.map((d) => d.code)).size, CARS, `${lv} codes are unique`);
  assert.equal(colors.length, CARS / 2, `${lv} has a colour per team`);
  assert.equal(drivers[0]!.code, "HAR", "you're driver 0");
}

// The bands agreed for the start: [reaction ms, grid position].
for (const [ms, p] of [
  [190, 1],
  [240, 1],
  [280, 2],
  [300, 3],
  [350, 5],
  [400, 6],
  [520, 10],
  [800, 20],
  [900, 22],
] as [number, number][])
  assert.equal(gridSlot(ms) + 1, p, `${ms} ms starts P${p}`);

// A seeded random, so races repeat.
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

// Pro's cars, for the checks that compare levels or time pole: one weekend, fixed, with Red Bull's
// the best (so Verstappen sets pole, as tuned) and yours the slowest of the top five. Elsewhere
// in pro the cars are drawn from the seed.
const WEEKEND = carsOf([0.1, 0.025, 0.05, 0.075, 0, 0.4, 0.375, 0.425, 0.9, 0.875, 0.925]);
const carsFor = (lv: Level) => (lv === "pro" ? WEEKEND : undefined);
const BEST_CARS = carsOf(Array<number>(CARS / 2).fill(0));

// The tiers: each weekend every tier deals out its own offsets, in a new order; below pro every
// car is the best.
{
  const rand = seeded(11);
  const orders = new Set<string>();
  for (let k = 0; k < 20; k++) {
    const cars = drawCars("pro", rand);
    let at = 0;
    for (const tier of TIERS) {
      const got = cars.slice(at, (at += tier.length));
      assert.deepEqual(
        got.sort((a, b) => a - b),
        carsOf(tier).sort((a, b) => a - b),
        "a tier deals its own offsets",
      );
    }
    orders.add(cars.slice(0, 5).join());
  }
  assert.ok(orders.size > 10, `the top five's order changes weekend to weekend (${orders.size})`);
  assert.deepEqual(drawCars("legends", rand), BEST_CARS, "below pro, every car's the best");
}

// Ratings: in F1 Verstappen (8) has the best pace and Colapinto (13) the worst, and
// Lindblad (11) the least awareness and Russell (3) the most.
{
  const rs = newRace(getTrack("monza"), GRID, seeded(1), "medium", "pro").racers;
  const paces = rs.slice(1).map((r) => r.pace);
  assert.equal(rs[8]!.pace, Math.max(...paces), "the best pace rating drives quickest");
  const stars = [rs[4]!.pace, rs[8]!.pace];
  assert.ok(
    rs.slice(1).every((r) => r.id === 4 || r.id === 8 || r.pace < Math.min(...stars)),
    "and Hamilton (4) and Verstappen are the stars",
  );
  assert.equal(rs[13]!.pace, Math.min(...paces), "and the worst slowest");
  assert.ok(rs[11]!.slip > rs[3]!.slip, "the less aware make more mistakes");
  const legends = newRace(getTrack("monza"), GRID, seeded(1), "medium", "legends").racers;
  assert.ok(
    legends.every((r) => r.slip === 0),
    "legends make none",
  );
}
const still = { gas: false, brake: false, steer: 0 };
const DT = 1 / 30;

// One computer car alone on track. Driver 10 is mid-field.
const solo = (
  id: number,
  edit: (r: Race["racers"][number]) => void = () => {},
  lv?: Level,
  track: Track = monza,
) => {
  const race = newRace(track, GRID, seeded(7), "medium", lv);
  race.racers = race.racers.filter((r) => r.id === id);
  edit(race.racers[0]!);
  return race;
};
const run = (race: Race, secs: number, until = () => false) => {
  for (let f = 0; f < secs / DT && !until(); f++) tick(race, still, DT);
  return race;
};
// The same with no stops, whatever the team would re-plan.
const nonStop = (race: Race, secs: number, until = () => false) =>
  run(race, secs, () => {
    for (const r of race.racers) [r.stops, r.plan] = [[], [r.tyre]];
    return until();
  });

// Tyres: a lap on a set held at `life` (and warm), alone, on a mid pace.
const lapAt = (life: number, tyre: Tyre = "medium", track: Track = monza) => {
  const race = solo(10, (r) => ([r.tyre, r.stops] = [tyre, []]), "pro", track);
  const r = race.racers[0]!;
  race.slips = false;
  for (let f = 0; f < 400 / DT && r.laps < 3; f++) {
    [r.life, r.warm, r.stops, r.plan] = [life, 1, [], [tyre]];
    tick(race, still, DT);
  }
  return r.best;
};
const fresh = lapAt(1);
assert.ok(lapAt(0) > fresh + 5000, `worn tyres are slower (${fmt(fresh)} vs ${fmt(lapAt(0))})`);
// Wear is gentle to the cliff (a quarter of the set left) and steep past it.
{
  const [cliff, gone] = [lapAt(0.25) - fresh, lapAt(0.05) - lapAt(0.25)];
  assert.ok(cliff > 800 && cliff < 2500, `to the cliff a set loses a second or two (${cliff})`);
  assert.ok(gone > 2 * cliff, `and past it far more (${gone})`);
}
// F1's gaps at Monza: a soft about 0.8 s a lap quicker than a medium, a hard 0.5 s slower.
{
  const [soft, hard] = [fresh - lapAt(1, "soft"), lapAt(1, "hard") - fresh];
  assert.ok(soft > 500 && soft < 1100, `softs about 0.8 s quicker (${soft})`);
  assert.ok(hard > 300 && hard < 800, `hards about 0.5 s slower (${hard})`);
}
// A cold set from the pits is slower over the first half lap.
{
  const half = (warm: number) => {
    const race = solo(10, (r) => ([r.warm, r.launch] = [warm, 0]));
    race.slips = false;
    run(race, 120, () => race.racers[0]!.dist > LENGTH / 2);
    return race.t;
  };
  const [cold, warm] = [half(0), half(1)];
  assert.ok(cold - warm > 200, `cold tyres cost time (${(cold - warm).toFixed(0)} ms)`);
}
// A set lasts its share of the race to the cliff, at any Grand Prix distance (the sprint's wears
// as a 10-lap race's), faster on harder tracks. Life lost per lap on a medium, alone, over its
// first two laps.
for (const laps of [SPRINT, FULL]) {
  const race = newRace(monza, GRID, seeded(7), "medium", "pro", laps);
  race.racers = race.racers.filter((r) => r.id === 10);
  const r = race.racers[0]!;
  [r.tyre, r.stints] = ["medium", ["medium"]];
  race.slips = false;
  for (let f = 0; f < 400 / DT && r.laps < 2; f++) {
    [r.stops, r.plan] = [[], ["medium"]];
    tick(race, still, DT);
  }
  // From the grid, a little over two laps.
  const lap = (1 - r.life) / ((r.dist + 10 + 8 * GRID.indexOf(10)) / LENGTH);
  const want = 0.75 / stintLaps("medium", laps, monza);
  assert.ok(
    Math.abs(lap / want - 1) < 0.05,
    `${laps} laps: a medium wears to plan (${lap.toFixed(3)})`,
  );
}
assert.equal(stintLaps("medium", SPRINT, monza), stintLaps("medium", 10, monza), "sprint wear");
assert.ok(
  stintLaps("medium", 10, getTrack("silverstone")) < stintLaps("medium", 10, monza),
  "Silverstone is harder on tyres than Monza",
);
// Each tyre wears on its own, the outside ones through the corners: Monza and Silverstone, run
// clockwise, eat the left tyres. Over three laps on a medium, alone.
for (const t of [monza, getTrack("silverstone")]) {
  const race = solo(10, (r) => ([r.tyre, r.stops] = ["medium", []]), "pro", t);
  race.slips = false;
  nonStop(race, 900, () => race.racers[0]!.laps >= 3);
  const [fl, fr, rl, rr] = race.racers[0]!.wear.map((w) => 1 - w) as number[];
  assert.ok(fl! > fr! && rl! > rr!, `${t.name}: the left tyres wear most`);
}
// The quickest wing on each track is the one it lists, wing 3 is the car as tuned, and the
// wrong end costs time: a clean lap at your grip on the racing line, each wing in turn. Low at
// Monza, high at Monaco, and up to about a second a lap.
const cleanLap = (track: Track, wing = track.WING) => {
  const race = solo(2, (r) => ([r.tyre, r.stops, r.wing] = ["medium", [], wing]), "pro", track);
  race.cars = BEST_CARS;
  race.racers[0]!.pace = 1 / edgeOf(race);
  race.slips = false;
  nonStop(race, 600, () => race.racers[0]!.laps >= 3);
  return race.racers[0]!.best;
};
// A clean lap at wing 3 on the 4 MJ battery, as tuned, and how much quicker the 6 MJ one is.
const OLD_CLEAN: Record<string, number> = {
  monza: 86_941,
  spa: 112_216,
  silverstone: 99_757,
  interlagos: 74_466,
  redbullring: 72_246,
  austin: 107_513,
  lasvegas: 100_454,
  yasmarina: 94_239,
  monaco: 75_802,
  lusail: 94_165,
};
const BATTERY = cleanLap(monza, 3) / OLD_CLEAN.monza!;
assert.ok(BATTERY < 0.998, `the bigger battery's quicker (${BATTERY.toFixed(4)})`);

// The tiers at Monza: one driver, alone and clean, in the best car, a midfield one (0.4 s
// down) and a back-marker (0.9 s).
{
  const lap = (s: number) => {
    const race = solo(10, (r) => (r.form = 1), "pro");
    race.cars = carsOf(Array<number>(CARS / 2).fill(s));
    const r = race.racers[0]!;
    race.slips = false;
    for (let f = 0; f < 400 / DT && r.laps < 3; f++) {
      [r.life, r.warm, r.stops, r.plan, r.form] = [1, 1, [], ["medium"], 1];
      tick(race, still, DT);
    }
    return r.best;
  };
  const best = lap(0);
  for (const s of [0.4, 0.9])
    assert.ok(
      Math.abs(lap(s) - best - 1000 * s) < 100,
      `a car ${s} s down is (${((lap(s) - best) / 1000).toFixed(3)} s)`,
    );
}

for (const def of TRACKS) {
  const t = getTrack(def.id);
  const laps = Array.from({ length: WINGS }, (_, k) => cleanLap(t, k + 1));
  const best = Math.min(...laps);
  assert.ok(
    laps[t.WING - 1]! - best < 60,
    `${def.name}: wing ${t.WING} is the quickest (${laps.map((l) => l - laps[2]!).map(Math.round)})`,
  );
  const worst = Math.max(laps[0]!, laps.at(-1)!) - best;
  assert.ok(worst > 100 && worst < 1500, `${def.name}: the wrong end costs ${worst.toFixed(0)} ms`);
}
assert.ok(monza.WING < 3 && getTrack("monaco").WING > 3, "low wing at Monza, high at Monaco");

// Every computer car's plan in a Grand Prix stops at least once and runs two compounds, each
// stint at least two laps (so no stop on the first or last lap) and never past the end of a set's
// life. In the sprint nobody plans a stop, on a set that lasts to the flag.
for (const laps of DISTANCES.map((d) => lapsOf(d, monza)))
  for (const seed of [1, 2, 3])
    for (const r of newRace(monza, GRID, seeded(seed), "medium", "pro", laps).racers.slice(1)) {
      if (laps === SPRINT) {
        assert.ok(!r.stops.length && r.plan.length === 1, "the sprint is one stint");
        assert.ok(stintLaps(r.plan[0]!, laps, monza) / 0.75 >= laps, `on ${r.plan[0]}s that last`);
        continue;
      }
      const ends = [...r.stops, laps];
      assert.equal(r.plan.length, ends.length, `${laps} laps: a set per stint`);
      assert.ok(r.stops.length >= 1 && new Set(r.plan).size > 1, `${laps} laps: two compounds`);
      ends.forEach((end, k) => {
        const len = end - (ends[k - 1] ?? 0);
        const most = stintLaps(r.plan[k]!, laps, monza) / 0.75;
        assert.ok(len >= 2 && len <= most, `${laps} laps: ${len} on ${r.plan[k]}`);
      });
    }
// The team's plan for you starts on the set you pick.
for (const t of ["soft", "medium", "hard"] as const)
  assert.equal(teamPlan(10, monza, t).tyres[0], t, `the team plans a race on ${t}s`);

// Pit lane.
const box = BOXES[1]!;
assert.ok(inPit(box.x, box.y, nearest(box.x, box.y).p), "the boxes are in the lane");
const [cx, cy] = pointAt(-200, 0);
assert.ok(!inPit(cx, cy, nearest(cx, cy).p), "the track isn't");
const pitStop = (track: Track) => {
  // Driver 2 is on team 1, at box 1.
  const box = track.BOXES[1]!;
  const at = (what: string) => `${track.name}: ${what}`;
  const race = solo(
    2,
    (r) => {
      r.stops = [1];
      r.life = 0.2;
    },
    undefined,
    track,
  );
  const r = race.racers[0]!;
  race.slips = false;
  let fastest = 0;
  let stopped = 0;
  let after = 0;
  let off = Infinity;
  // How far before the pit entry it starts slowing for the limiter, off full speed.
  let braked = 0;
  let v = 0;
  run(race, 400, () => {
    const s = track.signed(r.p);
    if (r.pitting && !braked && s < track.PIT_IN && r.car.v < v - 0.01) braked = track.PIT_IN - s;
    v = r.car.v;
    if (r.pit) fastest = Math.max(fastest, r.car.v);
    if (r.stop > 0) {
      stopped += DT;
      off = Math.min(off, Math.hypot(r.car.x - box.x, r.car.y - box.y));
    } else if (stopped && !after) after = r.life;
    return r.laps >= 2;
  });
  assert.ok(
    stopped > STOP - 0.1 && stopped < STOP + 0.1,
    at(`stops for ${STOP} s (${stopped.toFixed(2)})`),
  );
  assert.ok(off < 1.5, at(`at its box (${off.toFixed(2)} m off)`));
  assert.ok(braked < 300, at(`brakes for the lane late (${braked.toFixed(0)} m out)`));
  assert.ok(
    fastest > PIT_V - 1 && fastest < PIT_V + 3,
    at(`limited in the lane (${(fastest * 3.6).toFixed(0)} km/h)`),
  );
  assert.ok(after > 0.99, at("and comes out on new tyres"));
  assert.equal(race.racers[0]!.strikes, 0, at("the pit lane isn't track limits"));
};
for (const def of TRACKS) pitStop(getTrack(def.id));
{
  // A penalty's served at the stop, first: 5 s owed is a 7.5 s stop, and nothing left for the flag.
  const race = solo(2, (r) => {
    r.stops = [1];
    r.penalty = 5000;
  });
  const r = race.racers[0]!;
  race.slips = false;
  let stopped = 0;
  run(race, 400, () => {
    if (r.stop > 0) stopped += DT;
    return r.laps >= 2;
  });
  assert.ok(Math.abs(stopped - STOP - 5) < 0.1, `serves 5 s at the box (${stopped.toFixed(2)})`);
  assert.deepEqual([r.penalty, r.paid], [0, 5000], "and owes nothing at the flag");
  assert.ok(
    race.msgs.some((m) => m.text.startsWith("5 s penalty served")),
    "Race Control says so",
  );
}
{
  // Straight at the pit wall from the track.
  const [x, y] = pointAt(-150, HALF[0]! - 1);
  const race = solo(1);
  const r = race.racers[0]!;
  const h = dirAt(nearest(x, y).p) + Math.PI / 2;
  Object.assign(r.car, { x, y, h, v: 30 });
  r.p = nearest(x, y).p;
  r.launch = Infinity;
  run(race, 1);
  assert.ok(lateral(r.car.x, r.car.y, r.p) < HALF[0]! + 4, "the pit wall keeps cars out");
}

// Contact.
{
  const a: Car = { x: 0, y: 0, h: 0, v: 50 };
  const b: Car = { x: 4, y: 0, h: 0, v: 30 };
  assert.ok(bump(a, b), "nose to tail touches");
  assert.ok(b.x - a.x >= 5.4 - 1e-9, "and pushes apart");
  assert.ok(a.v < 30 && b.v === 30, "the car behind loses speed");
  const c: Car = { x: 0, y: 3, h: 0, v: 50 };
  assert.ok(!bump({ x: 0, y: 0, h: 0, v: 50 }, c), "side by side with room doesn't");
  // Between the wheels used to be a gap two circles left; a nose there is in the car now.
  const e: Car = { x: 0, y: 0, h: 0, v: 0 };
  const d: Car = { x: 0, y: 3.5, h: -Math.PI / 2, v: 10 };
  assert.ok(bump(e, d), "a nose into the sidepod touches");
  assert.ok(d.y - e.y >= 1.3 + 2.75 - 1e-9, "and is pushed back out");
}

// Wrong way: driving back round the track, not reversing.
{
  const race = solo(1);
  const r = race.racers[0]!;
  r.launch = Infinity;
  r.car.h += Math.PI;
  r.car.v = 20;
  run(race, 1.2);
  assert.ok(wrongWay(r), "driving the wrong way warns");
  r.car.h -= Math.PI;
  r.car.v = -8;
  run(race, 1.2);
  assert.ok(!wrongWay(r), "reversing doesn't");
}

// Track limits: push a car off and back, once per trip, excused after contact, the ladder.
{
  const race = solo(1);
  const r = race.racers[0]!;
  r.launch = Infinity;
  const at = (lat: number) => {
    const [x, y] = pointAt(1200, lat);
    Object.assign(r.car, { x, y, v: 0 });
    run(race, 0.2);
  };
  const out = HALF[0]! + 3;
  at(out);
  at(out + 2);
  at(0);
  assert.equal(r.strikes, 1, "one trip off is one strike");
  at(out);
  at(0);
  assert.equal(r.strikes, 2, "the next trip is another");
  r.touchT = race.t;
  at(out);
  at(0);
  assert.equal(r.strikes, 2, "being pushed off is excused");
  run(race, 1.1);
  for (const n of [3, 4, 5]) {
    at(out);
    at(0);
    assert.equal(r.strikes, n);
  }
  const kinds = race.msgs.map((m) => m.kind);
  assert.equal(
    kinds.filter((k) => k === "flag").length,
    1,
    "the black and white flag on the third",
  );
  assert.equal(r.penalty, 15000, "then 5 s, then 10 s");
  assert.ok(race.msgs[0]!.text.includes("time deleted"));
}
// No strike for the pit entry.
{
  const race = solo(1, (r) => (r.stops = [1]));
  const r = race.racers[0]!;
  race.slips = false;
  run(race, 400, () => r.laps >= 1 && !r.pit && signed(r.p) > 300);
  assert.equal(r.strikes, 0, "the pit lane isn't track limits");
}
// Seconds each of these drivers spends in the lane, starting in it 10 m apart, on a race with
// only them.
const lane = (ids: number[]) => {
  const race = newRace(monza, GRID, seeded(7));
  race.racers = race.racers.filter((r) => ids.includes(r.id));
  race.racers.forEach((r, k) => {
    const m = BOXES[0]!.s - 40 - 10 * k;
    const [x, y] = pointAt(m, pitOffset(atDist(m)));
    Object.assign(r.car, { x, y, h: dirAt((m + LENGTH) / LENGTH), v: 25 });
    [r.p, r.dist, r.launch, r.stops, r.pitting] = [nearest(x, y).p, m, 0, [1], true];
  });
  const t = new Map(ids.map((id) => [id, 0]));
  run(race, 60, () => {
    for (const r of race.racers) if (r.pit) t.set(r.id, t.get(r.id)! + DT);
    return race.racers.every((r) => signed(r.p) > PIT_OUT + 20);
  });
  assert.ok(
    race.racers.every((r) => r.stints.length === 2),
    "everyone comes out on new tyres",
  );
  return ids.map((id) => t.get(id)!);
};
{
  const [alone] = lane([12]);
  // Team 2 stops at a box before team 6's: going by costs only the braking behind it on the
  // way in, nowhere near a stop.
  const [, past] = lane([4, 12]);
  assert.ok(
    past! - alone! < 1.5,
    `a rival's stop doesn't block (${(past! - alone!).toFixed(1)} s)`,
  );
  // Teammates share the box: the second waits for the first.
  const [first, second] = lane([4, 5]);
  assert.ok(second! - first! > STOP * 0.6, `a teammate queues (${second!.toFixed(1)} s)`);
}
for (const def of TRACKS) {
  // You, into the lane: the team drives you to box 0, stops and takes you back out.
  const t = getTrack(def.id);
  const race = newRace(t, GRID, seeded(7));
  race.racers = [race.racers[0]!];
  const r = race.racers[0]!;
  const BOX0 = t.BOXES[0]!;
  const m = BOX0.s - 30;
  const [x, y] = t.pointAt(m, t.pitOffset(t.atDist(m)));
  Object.assign(r.car, { x, y, h: t.dirAt((m + t.LENGTH) / t.LENGTH), v: 20 });
  r.p = t.nearest(x, y).p;
  r.dist = m;
  r.launch = 0;
  let at = Infinity;
  run(race, 30, () => {
    if (r.stop > 0) at = Math.min(at, Math.hypot(r.car.x - BOX0.x, r.car.y - BOX0.y));
    return t.signed(r.p) > t.PIT_OUT + 20;
  });
  assert.ok(at < 1.5, `${def.name}: you stop at your box (${at.toFixed(2)} m off)`);
  assert.equal(r.stints.length, 2, `${def.name}: on new tyres`);
  assert.ok(!r.pitting && !r.pit, `${def.name}: and get the car back past the exit`);
  assert.equal(r.strikes, 0, `${def.name}: with no track limits`);
}

// A trip down the pit lane, stop included, puts back about 2 MJ.
{
  const race = solo(10, (r) => ([r.stops, r.plan, r.launch] = [[1], ["medium", "medium"], 0]));
  race.slips = false;
  const r = race.racers[0]!;
  run(race, 300, () => r.pit);
  r.charge = 0;
  run(race, 120, () => !r.pit && r.stints.length === 2);
  assert.ok(r.charge > 1.6 && r.charge < 2.4, `the pit lane charges (${r.charge.toFixed(2)} MJ)`);
}

// The racing line stays on the tarmac, and the same driver laps quicker on it.
assert.ok(
  RACING.every((o, i) => Math.abs(o) <= HALF[i]! - 1.5),
  "the racing line is on the tarmac",
);
{
  const on = (lv: Level) => {
    const race = solo(10, (r) => (r.pace = 0.92), lv);
    race.slips = false;
    run(race, 400, () => race.racers[0]!.laps >= 2);
    return race.racers[0]!.best;
  };
  const [centre, racing] = [on("amateur"), on("pro")];
  assert.ok(racing < centre - 200, `the racing line is quicker (${fmt(centre)} vs ${fmt(racing)})`);
}

// Overtake Mode: ready within a second of the car ahead at detection, from lap 2.
{
  const race = solo(1);
  race.racers = [race.racers[0]!, { ...race.racers[0]!, id: 2, car: { ...race.racers[0]!.car } }];
  const [a, b] = race.racers as [Race["racers"][number], Race["racers"][number]];
  for (const r of race.racers) r.launch = Infinity;
  const put = (r: typeof a, m: number, v: number) => {
    const [x, y] = pointAt(m, 0);
    Object.assign(r.car, { x, y, h: dirAt(m / LENGTH), v });
    r.p = nearest(x, y).p;
  };
  // b crosses the main straight's detection line half a second ahead of a, both at 70 m/s.
  const detect = 4920;
  const cross = (laps: number) => {
    put(b, detect - 1, 70);
    put(a, detect - 36, 70);
    [a.laps, b.laps, a.ot, b.ot] = [laps, laps, null, null];
    run(race, 0.85);
  };
  cross(1);
  assert.equal(a.ot, "ready", "within a second at detection");
  assert.equal(a.bonusLap, 2, "with a harvest bonus for the next lap");
  assert.equal(b.ot, null, "the car in front isn't");
  cross(0);
  assert.equal(a.ot, null, "not on the first lap");
  const top = (more: number) => {
    const car = { x: 0, y: 0, h: 0, v: 0 };
    for (let f = 0; f < 60 * 60; f++)
      step(car, { gas: true, brake: false, steer: 0 }, 1 / 60, false, 1, TOP + more);
    return car.v * 3.6;
  };
  const straight = top(2.8) - top(0);
  assert.ok(
    straight > 8 && straight < 12,
    `Straight Mode is worth ~10 km/h (${straight.toFixed(0)})`,
  );

  // Slipstream: 20 m behind on the same line, half the tow and a little dirty air; the car in
  // front gets neither, nor does one 3 m to the side.
  put(b, 4000, 70);
  put(a, 3980, 70);
  run(race, DT);
  assert.ok(
    Math.abs(a.tow * 3.6 - 10) < 0.5,
    `half the tow 20 m back (${(a.tow * 3.6).toFixed(1)} km/h)`,
  );
  assert.ok(a.dirty > 0 && a.dirty < 0.02, `and some dirty air (${a.dirty.toFixed(3)})`);
  assert.equal(b.tow + b.dirty, 0, "the car in front has neither");
  const [x, y] = pointAt(3980, 3);
  Object.assign(a.car, { x, y });
  run(race, DT);
  assert.equal(a.tow + a.dirty, 0, "out of the wake, neither");
}

// Racecraft: two computer cars squeezed side by side down the straight after Ascari open up to a
// car's width.
{
  const race = newRace(monza, GRID, seeded(7), "medium", "amateur");
  race.racers = race.racers.filter((r) => r.id === 2 || r.id === 3);
  race.slips = false;
  const [a, b] = race.racers as [Race["racers"][number], Race["racers"][number]];
  const { LENGTH, dirAt, lateral, nearest, pointAt } = monza;
  const put = (r: typeof a, m: number, lat: number) => {
    const [x, y] = pointAt(m, lat);
    Object.assign(r.car, { x, y, h: dirAt(m / LENGTH), v: 60 });
    [r.p, r.dist, r.launch] = [nearest(x, y).p, m, 0];
  };
  put(a, 4000, -1.4);
  put(b, 4000, 1.4);
  run(race, 1.5);
  const apart = Math.abs(lateral(a.car.x, a.car.y, a.p) - lateral(b.car.x, b.car.y, b.p));
  assert.ok(apart > 3.4, `side by side, a car's width and more apart (${apart.toFixed(1)} m)`);
}

// The battery, in MJ: a pro's flying lap at Monza harvests most of the 12 MJ allowance and no
// more; flat out on a flat battery the car super clips, harvesting; and a lap with Overtake's
// bonus harvests up to 12.5 MJ.
{
  const race = solo(10, (r) => (r.launch = 0), "pro");
  race.slips = false;
  const r = race.racers[0]!;
  let most = 0;
  const lap = (n: number) =>
    nonStop(race, 600, () => {
      if (r.laps === n) most = Math.max(most, r.harvested);
      return r.laps > n;
    });
  lap(1);
  assert.ok(most > 10.5 && most <= 12 + 1e-9, `a lap harvests up to 12 MJ (${most.toFixed(2)})`);
  [r.charge, r.harvested] = [0, 0];
  nonStop(race, 1);
  assert.ok(r.clipping && r.charge > 0, "flat out on a flat battery, it super clips");
  [most, r.bonusLap] = [0, r.laps];
  lap(r.laps);
  assert.ok(
    most > 12 && most <= 12.5 + 1e-9,
    `Overtake's lap harvests up to 12.5 MJ (${most.toFixed(2)})`,
  );
}

// Whole races at each level: nineteen computer cars, you parked out of the way, all on the same
// plan (mediums, then hards from the end of lap 2 or 3, by driver), so the levels are compared on
// the driving and not on who's on fresh softs. Nobody sits stopped on track, and in the lane
// nobody waits long: at most a release held for traffic (with half the field stopping on the same
// lap, a few seconds of it), or a queue behind a teammate's stop.
const median = (xs: number[]) => xs.slice().sort((a, b) => a - b)[xs.length >> 1]!;
const field = (lv: Level, track: Track = monza) => {
  const race = newRace(track, GRID, seeded(3), "medium", lv, LAPS, false, carsFor(lv));
  race.racers = race.racers.filter((r) => r.id !== 0);
  const stuck = new Map<number, number>();
  const worst = { track: 0, lane: 0 };
  for (const r of race.racers) [r.tyre, r.stints] = ["medium", ["medium"]];
  run(race, 900, () => {
    for (const r of race.racers) {
      [r.stops, r.plan] = [[2 + (r.id % 2)], ["medium", "hard"]];
      const s =
        r.car.v < 1 && r.stop <= 0 && r.finish === null && race.t > 2000
          ? (stuck.get(r.id) ?? 0) + DT
          : 0;
      stuck.set(r.id, s);
      const at = r.pit ? "lane" : "track";
      worst[at] = Math.max(worst[at], s);
    }
    return race.racers.every((r) => r.finish !== null);
  });
  const table = results(race);
  if (track === monza)
    console.log(
      `${lv}\n` +
        table
          .map(({ id, time, best, stints }) => {
            const r = race.racers.find((x) => x.id === id)!;
            return `  ${id} pace ${r.pace.toFixed(3)} ${stints.join(">")} best ${fmt(best)} race ${fmt(time)} strikes ${r.strikes}`;
          })
          .join("\n"),
    );
  const at = `${track.name} ${lv}`;
  assert.ok(
    race.racers.every((r) => r.finish !== null && r.laps === LAPS),
    `${at}: everyone finishes`,
  );
  assert.ok(race.done, `${at}: done once the whole field has the flag`);
  assert.ok(worst.track < 2, `${at}: nobody's stuck (${worst.track.toFixed(1)} s)`);
  assert.ok(worst.lane < 7, `${at}: nobody waits long in the lane (${worst.lane.toFixed(1)} s)`);
  const bests = race.racers.map((r) => r.best);
  // A car whose every lap was deleted has no best; it isn't the front.
  const front = Math.min(...bests.filter(Boolean));
  assert.ok(
    track !== monza || (Math.min(...bests) > 78_000 && Math.max(...bests) < 112_000),
    `${at}: laps from 1:18 to 1:52 (${fmt(Math.min(...bests))} to ${fmt(Math.max(...bests))})`,
  );
  assert.ok(
    race.msgs.some((m) => m.kind === "fastest"),
    "fastest laps are called",
  );
  // The race's best sectors come from clean laps, so the fastest lap is no quicker than them.
  const sum = race.sectors.reduce((a, b) => a + b, 0);
  assert.ok(
    race.sectors.every((ms) => ms > 0) && sum <= front,
    `${at}: the race's best sectors are set and within the fastest lap (${fmt(sum)})`,
  );
  const strikes = race.racers.reduce((n, r) => n + r.strikes, 0);
  return { front, lap: median(bests), win: table[0]!.time, strikes };
};
const levels = (["amateur", "intermediate", "pro", "legends"] as const).map((lv) => field(lv));
console.log(
  levels
    .map((l) => `best ${fmt(l.front)} median ${fmt(l.lap)} win ${fmt(l.win)} ${l.strikes} strikes`)
    .join("\n"),
);
const [am, mid, pro, leg] = levels as [
  (typeof levels)[0],
  (typeof levels)[0],
  (typeof levels)[0],
  (typeof levels)[0],
];
// The ladder: on the 4 MJ battery the front of each field lapped about 1:36, 1:31 and 1:22, and
// pro's winner took about 7:15, about what a clean race from the player (pole pace on mediums)
// takes with the stop everyone has to make; all quicker now by as much as a clean lap is.
const near = (ms: number, want: number, by: number) => Math.abs(ms - want * BATTERY) < by;
assert.ok(near(am.front, 95_500, 1500), `amateur's front laps about 1:36 (${fmt(am.front)})`);
assert.ok(near(mid.front, 91_000, 1500), `intermediate's about 1:31 (${fmt(mid.front)})`);
assert.ok(near(pro.front, 82_000, 1000), `pro's about 1:22 (${fmt(pro.front)})`);
assert.ok(near(pro.win, 435_000, 10_000), `pro's winner takes about 7:15 (${fmt(pro.win)})`);
assert.ok(pro.lap < mid.lap && mid.lap < am.lap, "the better the field, the quicker it laps");
assert.ok(am.strikes > 0, "computer cars make mistakes and pay for them");
assert.ok(pro.strikes < am.strikes, "and pros make fewer");
// Legends: no mistakes (at most a knock-on from a car ahead), and a winner about 1% under pro's,
// so a clean race from you misses by a second or two.
const legends = (l: typeof leg, p: typeof pro, at: string) => {
  assert.ok(l.strikes <= 1, `${at}: legends keep it on the track (${l.strikes} strikes)`);
  assert.ok(l.front < p.front, `${at}: the quickest legend laps quicker than the quickest pro`);
  const r = l.win / p.win;
  assert.ok(r > 0.985 && r < 0.995, `${at}: legends win about 1% under pro (${r.toFixed(4)})`);
};
legends(leg, pro, "Monza");

// Pro's pole on the tracks you've set a clean qualifying lap at: your lap at Monza (1:20.567) and
// Silverstone (1:29.634); 1% off it at Austin (1:34.119), Las Vegas (1:27.666), Yas Marina
// (1:25.238), Monaco (1:07.879) and Lusail (1:24.975), so it's within reach of more than you.
// Those laps were on the car as tuned (wing 3) and the 4 MJ battery, a clean lap there taking
// OLD_CLEAN ms: on the track's wing and today's battery you'd be quicker by as much as a clean
// lap is, so pole is too. Pole is Verstappen's, in the best car (WEEKEND).
const POLE: Record<string, number> = {
  monza: 80_500,
  silverstone: 89_600,
  austin: 95_100,
  lasvegas: 88_500,
  yasmarina: 86_100,
  monaco: 68_600,
  lusail: 85_800,
};
// The ladder carries to every track. A clean lap at your grip on the racing line stands in for
// you: pro's front runner stays as close to it as at Monza, so pro is as hard everywhere. Where
// you've set a lap (POLE) that's the measure instead, as the stand-in can be far off you: at
// Silverstone you're 3 s up on a pole as close to it as Monza's. The lower levels drive nearer the centreline, which costs more on twisty tracks (Silverstone and
// Interlagos most), so they may be easier than at Monza but never harder.
const clean = (track: Track) => cleanLap(track);
const proGap = pro.front / clean(monza);
for (const def of TRACKS.slice(1)) {
  const t = getTrack(def.id);
  const [a, m, p, l] = (["amateur", "intermediate", "pro", "legends"] as const).map((lv) =>
    field(lv, t),
  ) as [typeof pro, typeof pro, typeof pro, typeof pro];
  const gap = p.front / clean(t);
  console.log(
    `${def.name}: fronts ${[a, m, p, l].map((x) => fmt(x.front)).join(", ")}, pro at ${gap.toFixed(3)} of a clean lap`,
  );
  assert.ok(p.lap < m.lap && m.lap < a.lap, `${def.name}: the better the field, the quicker`);
  if (!POLE[def.id])
    assert.ok(Math.abs(gap - proGap) < 0.01, `${def.name}: pro is as hard as at Monza`);
  const ratio = (x: number, y: number) => `(${(x / y).toFixed(4)})`;
  assert.ok(
    a.front / p.front > am.front / pro.front - 0.01,
    `${def.name}: amateur no harder ${ratio(a.front, p.front)}`,
  );
  assert.ok(
    m.front / p.front > mid.front / pro.front - 0.01,
    `${def.name}: intermediate too ${ratio(m.front, p.front)}`,
  );
  legends(l, p, def.name);
}

// Races a plan as given, alone: held to it every frame, as the team re-plans at the line.
const raced = (race: Race, at: number[], tyres: Tyre[], secs: number) => {
  const r = race.racers[0]!;
  [r.tyre, r.stints] = [tyres[0]!, [tyres[0]!]];
  race.slips = false;
  for (let f = 0; f < secs / DT && r.finish === null; f++) {
    [r.stops, r.plan] = [at, tyres];
    tick(race, still, DT);
  }
  return r.finish!;
};
// Strategy: the one-stops on every pair of compounds, alone, on a mid pace, all come out close.
{
  const plans = (
    [
      ["soft", "medium", 2],
      ["medium", "hard", 3],
      ["soft", "hard", 2],
      ["hard", "medium", 3],
    ] as const
  ).map(([a, b, at]) => raced(solo(10), [at], [a, b], 900));
  console.log(`soft-medium, medium-hard, soft-hard, hard-medium: ${plans.map(fmt).join(", ")}`);
  assert.ok(Math.max(...plans) - Math.min(...plans) < 10_000, "every strategy comes out close");
}

// The computer's strategy model, per track. Its two numbers, measured on driver 10 alone: how a
// lap slows on a worn set (lap time going as grip ^ -GRIP_POWER) and what a stop costs, in
// fresh-medium laps. Then its pick for a 10-lap race, raced against the next best, the best with
// each number of stops and a no-stop: within a second and a half of the quickest.
const alone = (t: Track, laps: number, stops: number[], tyres: Tyre[]) => {
  const race = newRace(t, GRID, seeded(7), "medium", "pro", laps);
  race.racers = race.racers.filter((r) => r.id === 10);
  const r = race.racers[0]!;
  [r.tyre, r.stints, r.stops, r.plan] = [tyres[0]!, [tyres[0]!], stops, tyres];
  race.slips = false;
  return { race, r };
};
for (const def of TRACKS) {
  const t = getTrack(def.id);
  const lapAt = (life: number) => {
    const { race, r } = alone(t, 3, [], ["medium"]);
    for (let f = 0; f < 400 / DT && r.laps < 3; f++) {
      [r.life, r.stops, r.plan] = [life, [], ["medium"]];
      tick(race, still, DT);
    }
    return r.best;
  };
  const stopping = (stops: number[]) => {
    const { race, r } = alone(t, 3, stops, ["medium", "medium"]);
    for (let f = 0; f < 600 / DT && r.finish === null; f++) {
      [r.life, r.stops, r.plan] = [1, stops, ["medium", "medium"]];
      tick(race, still, DT);
    }
    return r.finish!;
  };
  const fresh = lapAt(1);
  const power = Math.log(lapAt(0.6) / fresh) / -Math.log(grip(0.6, "medium"));
  const stop = (stopping([2]) - stopping([])) / fresh;
  const all = strategies(10, t);
  const rivals = [...all.slice(0, 2), ...[1, 2].map((n) => all.find((o) => o.at.length === n)!)];
  const times = [...new Set(rivals)].map(({ at, tyres }) =>
    raced(alone(t, 10, at, tyres).race, at, tyres, 2400),
  );
  console.log(
    `${def.name}: grip power ${power.toFixed(3)}, a stop ${stop.toFixed(3)} laps, ` +
      `pick ${fmt(times[0]!)} against ${times.slice(1).map(fmt).join(", ")}`,
  );
  assert.ok(Math.abs(power - t.GRIP_POWER) < 0.04, `${def.name}: grip power ${power.toFixed(3)}`);
  assert.ok(Math.abs(stop - t.STOP_LAPS) < 0.02, `${def.name}: a stop ${stop.toFixed(3)} laps`);
  assert.ok(
    times[0]! - Math.min(...times) < 1500,
    `${def.name}: the model's pick is near the best`,
  );
}

// The longest race: everyone takes the flag, on two compounds and no more than three stops, the team
// re-planning as it goes, and never runs a set down to nothing.
{
  const laps = FULL;
  const t0 = performance.now();
  const race = newRace(monza, GRID, seeded(3), "medium", "pro", laps);
  race.racers = race.racers.filter((r) => r.id !== 0);
  let worn = 1;
  run(race, 60 * laps * 2, () => {
    for (const r of race.racers) if (r.finish === null) worn = Math.min(worn, r.life);
    return race.racers.every((r) => r.finish !== null);
  });
  assert.ok(
    race.racers.every((r) => r.finish !== null && r.laps >= laps - 1),
    `${laps} laps: everyone takes the flag, a lap down at most`,
  );
  assert.ok(
    race.racers.every((r) => new Set(r.stints).size > 1 && r.stints.length <= 4),
    `${laps} laps: two compounds, three stops at most`,
  );
  assert.ok(worn > 0.05, `${laps} laps: no set runs out (${worn.toFixed(2)} left at worst)`);
  console.log(
    `${laps} laps: won in ${fmt(results(race)[0]!.time)}, raced in ${((performance.now() - t0) / 1000).toFixed(0)} s`,
  );
}

// A car that never gets to the flag doesn't hold the classification up: the race is done three
// average laps after the winner, and it's classified on an estimate behind.
{
  const race = newRace(monza, GRID, seeded(7), "medium", "pro", 2);
  race.racers = race.racers.filter((r) => r.id === 10 || r.id === 11);
  race.slips = false;
  race.racers[1]!.launch = Infinity;
  // Two compounds, so it isn't disqualified; too short a race to plan a stop.
  race.racers[0]!.stints = ["medium", "hard"];
  run(race, 600, () => race.done);
  const won = race.racers[0]!.finish!;
  assert.ok(race.done && race.racers[1]!.finish === null, "done without the car that never left");
  assert.ok(Math.abs(race.t - won * 2.5) < 1000, "three average laps after the winner");
  assert.deepEqual(
    results(race).map((r) => r.id),
    [10, 11],
    "and it's classified last",
  );
  assert.ok(results(race)[1]!.down > 0, "laps down");
}

// Penalties count as the cars take the flag: in 3 s ahead with 5 s to serve is 2 s behind.
{
  const race = newRace(monza, GRID, seeded(7));
  const [a, b] = [race.racers[1]!, race.racers[2]!];
  [a.finish, a.penalty, b.finish, a.laps, b.laps] = [100_000, 5000, 103_000, race.laps, race.laps];
  assert.deepEqual(order(race).slice(0, 2), [b, a], "the tower orders finishers with penalties");
  assert.deepEqual([gap(race, b), gap(race, a)], [0, 2], "and gaps them with penalties");
}

// Qualifying sets the whole grid: the cars line up front to back in the order given.
{
  const grid = GRID.slice().reverse();
  const race = newRace(monza, grid, seeded(7));
  assert.deepEqual(
    race.racers
      .slice()
      .sort((a, b) => b.dist - a.dist)
      .map((r) => r.id),
    grid,
    "the grid lines up in the order given",
  );
}

// Qualifying, run as the drive runs it: every race ticked together. On every track each
// computer car sets a time, and you, sat still with no lap, start last. At Monza you're driven by
// the computer instead, set a time too, and the live delta stays sensible all the way round (the
// computer at your grip, without pro's edge, is about 6 s off pole). Pole is your lap where you've
// set one.
for (const { id, name } of TRACKS) {
  const q = newQuali(getTrack(id), "pro", seeded(5), WEEKEND);
  const me = q[0]!.racers[0]!;
  const drive = id === "monza";
  let worst = 0;
  for (let f = 0; f < 300 / DT && !q.slice(drive ? 0 : 1).every((r) => r.done); f++) {
    for (const race of q) if (!race.done) tick(race, drive ? aiInput(me, q[0]!) : still, DT);
    worst = Math.max(worst, Math.abs(qualiDelta(q) ?? 0));
  }
  const order = qualiOrder(q);
  assert.ok(
    order.every((o) => o.best > 0 || o.id === 0),
    `${name}: every computer car sets a quali time`,
  );
  if (drive)
    assert.ok(me.best > 0 && worst > 0 && worst < 10, `${name}: a lap and a delta (${worst})`);
  else assert.equal(order.at(-1)!.id, 0, `${name}: no time starts last`);
  const pole = order[0]!.best;
  if (POLE[id]) {
    const t = getTrack(id);
    const ms = (POLE[id] * cleanLap(t)) / OLD_CLEAN[id]!;
    const want = fmt(ms);
    assert.ok(Math.abs(pole - ms) < 500, `${name}: pro pole about ${want} (${fmt(pole)})`);
    console.log(`${name} quali: pole ${fmt(pole)}`);
  }
}

// Finishing a Grand Prix on a single compound is a disqualification, classified last; in the
// sprint it's allowed.
for (const laps of [10, SPRINT]) {
  const race = newRace(monza, GRID, seeded(7), "medium", "pro", laps);
  race.racers = race.racers.filter((r) => r.id === 10 || r.id === 11);
  const [a, b] = race.racers as [Race["racers"][number], Race["racers"][number]];
  [a.finish, a.laps, a.stints, b.finish, b.laps, b.stints] = [
    1,
    laps,
    ["medium"],
    2,
    laps,
    ["medium", "hard"],
  ];
  const table = results(race);
  assert.deepEqual(
    table.map((r) => [r.id, r.dsq]),
    laps === SPRINT
      ? [
          [10, false],
          [11, false],
        ]
      : [
          [11, false],
          [10, true],
        ],
    laps === SPRINT ? "one compound is fine in the sprint" : "one compound is a DSQ",
  );
}

// Incidents. A few computer cars spread round Monza, the dice for breakdowns put away.
const incident = (ids: number[]) => {
  const race = newRace(monza, GRID, seeded(7), "medium", "pro", 10, true);
  race.racers = race.racers.filter((r) => ids.includes(r.id));
  for (const r of race.racers) r.failAt = Infinity;
  race.slips = false;
  return race;
};
const onTarmac = (r: Race["racers"][number]) =>
  Math.abs(lateral(r.car.x, r.car.y, r.p)) < HALF[atDist(r.p * LENGTH)]!;
// A breakdown out of reach of the pits: the car coasts off the tarmac and stops, the VSC holds
// everyone to its speed, then the green clears the wreck away.
{
  const race = incident([4, 10]);
  const [a, b] = race.racers as [Race["racers"][number], Race["racers"][number]];
  [b.failAt, b.fault] = [1500, "Engine"];
  run(race, 120, () => b.out !== null);
  assert.equal(b.out, b.fault, "a breakdown retires the car");
  assert.ok(!onTarmac(b) && b.wreck, "off the tarmac");
  assert.equal(race.neutral?.kind, "vsc", "and brings the VSC");
  run(race, 5);
  assert.ok(a.car.v < 41, `the VSC holds the others to its speed (${a.car.v.toFixed(1)})`);
  run(race, 120, () => race.neutral === null);
  assert.ok(race.neutral === null && !b.wreck, "the VSC ends and the wreck is cleared");
  assert.ok(
    race.msgs.some((m) => m.text === "Green flag"),
    "with the green flag",
  );
}
// A crash: head on into the pit wall at 216 km/h. Out comes the Safety Car; the field queues
// behind it with nobody passing, a computer car due a stop soon takes the cheap one, and at the
// restart each car is racing again over the line.
{
  const ids = [2, 4, 6, 8, 10, 12, 14, 16];
  const race = incident(ids);
  run(race, 90);
  const x = race.racers.at(-1)!;
  const [px, py] = pointAt(-150, HALF[0]! - 1);
  Object.assign(x.car, { x: px, y: py, h: dirAt(nearest(px, py).p) + Math.PI / 2, v: 60 });
  x.launch = Infinity;
  run(race, 0.5, () => x.out !== null);
  assert.equal(x.out, "Crash", "a hard hit on a wall is a crash out");
  assert.equal(race.neutral?.kind, "sc", "and brings the Safety Car");
  const rest = race.racers.filter((r) => r !== x);
  const stints = rest.map((r) => r.stints.length);
  const rank = (rs: typeof rest) =>
    rs
      .slice()
      .sort((p, q) => q.dist - p.dist)
      .map((r) => r.id);
  const before = rank(rest);
  let spread = Infinity;
  run(race, 400, () => {
    if (race.sc && race.sc.run > LENGTH / 2) {
      const ds = rest.filter((r) => !r.pit).map((r) => r.dist);
      spread = Math.min(spread, (Math.max(...ds) - Math.min(...ds)) / (ds.length - 1));
    }
    return rest.every((r) => !r.held);
  });
  const pitted = rest.filter((r, k) => r.stints.length > stints[k]!);
  const kept = (ids: number[]) => ids.filter((id) => !pitted.some((r) => r.id === id));
  console.log(`Safety Car: ${pitted.length} stopped under it, ${spread.toFixed(1)} m a car`);
  assert.deepEqual(kept(rank(rest)), kept(before), "nobody passes under the Safety Car");
  assert.ok(spread < 15, `the field closes up (${spread.toFixed(1)} m a car)`);
  assert.ok(pitted.length > 0, "a cheap stop under the Safety Car is taken");
  assert.ok(race.neutral === null && !x.wreck, "the restart clears the wreck");
}
// A smaller hit leaves lasting damage, and a puncture costs grip, not top speed, and is fixed at
// the box.
{
  const race = incident([10, 11]);
  const [a, b] = race.racers as [Race["racers"][number], Race["racers"][number]];
  for (const r of race.racers) r.launch = Infinity;
  const put = (r: typeof a, m: number, v: number) => {
    const [x, y] = pointAt(m, 0);
    Object.assign(r.car, { x, y, h: dirAt(m / LENGTH), v });
    r.p = nearest(x, y).p;
  };
  put(a, 3996, 40);
  put(b, 4000, 22);
  run(race, DT);
  assert.ok(a.damage > 0 && !a.out, `an 18 m/s hit is damage (${a.damage.toFixed(3)})`);
  const limp = incident([10]);
  const r = limp.racers[0]!;
  run(limp, 30);
  [r.puncture, r.stops, r.plan] = [true, [r.laps + 1], [r.tyre, "hard"]];
  const from = limp.t;
  let fastest = 0;
  run(limp, 600, () => {
    if (r.puncture && limp.t - from > 10_000) fastest = Math.max(fastest, r.car.v);
    return r.stints.length > 1;
  });
  assert.ok(!r.puncture && r.stints.length === 2, "a puncture is fixed at the stop");
  assert.ok(fastest > 70, `flat out on the straights (${(fastest * 3.6).toFixed(0)} km/h)`);
  // A set run to nothing punctures its most worn tyre.
  const worn = incident([10]);
  const w = worn.racers[0]!;
  run(worn, 30);
  [w.life, w.wear] = [0, [0.3, 0.2, 0, 0.1]];
  run(worn, 120, () => w.puncture);
  assert.ok(w.puncture && w.flat === 2, `the worn-out tyre punctures (${w.flat})`);
}
// The undercut: a rival just in front that stops brings a car with its own stop due soon in the
// lap after.
{
  const cover = (rival: boolean) => {
    const race = newRace(monza, GRID, seeded(7), "medium", "pro", 10);
    race.racers = race.racers.filter((r) => r.id === 10 || r.id === 11);
    race.slips = false;
    const [r, o] = race.racers as [Race["racers"][number], Race["racers"][number]];
    const put = (x: typeof r, m: number) => {
      const [px, py] = pointAt(m, x === r ? -2 : 2);
      Object.assign(x.car, { x: px, y: py, h: dirAt(m / LENGTH), v: 60 });
      [x.p, x.dist, x.launch, x.laps, x.lap.start] = [nearest(px, py).p, LENGTH + m, 0, 1, 0];
      x.lap.halfway = true;
    };
    // The rival a stop's worth of track behind, about where it'd rejoin from alongside.
    put(r, -100);
    put(o, -100 - monza.STOP_LAPS * LENGTH);
    [r.tyre, r.stints, r.life, r.stops, r.plan] = [
      "medium",
      ["medium"],
      0.45,
      [4],
      ["medium", "hard"],
    ];
    if (rival) [o.stints, o.set] = [["medium", "hard"], 1];
    run(race, 5, () => r.laps === 2);
    return r.laps === 2 && r.stops.includes(r.laps + 1);
  };
  assert.ok(cover(true), "a rival's stop is covered");
  assert.ok(!cover(false), "and without it, the plan stands");
}
// Blue flags: a lapped computer car lets a car a lap up by, and so does yours.
for (const id of [11, 0]) {
  const race = newRace(monza, GRID, seeded(7), "medium", "pro", 10);
  race.racers = race.racers.filter((r) => r.id === 10 || r.id === id);
  race.slips = false;
  const [fast, slow] = [
    race.racers.find((r) => r.id === 10)!,
    race.racers.find((r) => r.id === id)!,
  ];
  const put = (r: typeof fast, m: number, laps: number) => {
    const [x, y] = pointAt(m, 0);
    Object.assign(r.car, { x, y, h: dirAt(m / LENGTH), v: 60 });
    [r.p, r.dist, r.launch, r.laps, r.stops] = [nearest(x, y).p, laps * LENGTH + m, 0, laps, []];
  };
  put(fast, 3920, 3);
  put(slow, 3960, 2);
  slow.pace = 0.9;
  const at = (r: typeof fast) => r.p * LENGTH;
  let blue = false;
  for (let f = 0; f < 20 / DT && monza.ahead(at(slow), at(fast)) > LENGTH / 2; f++) {
    tick(race, id ? still : aiInput(slow, race), DT);
    blue ||= slow.blue !== 0;
  }
  assert.ok(blue, `${id ? "the computer" : "you"}: shown the blue flag`);
  assert.ok(monza.ahead(at(slow), at(fast)) < LENGTH / 2, `${id ? "the computer" : "you"}: let by`);
}
// Unlapping on track: a lapped car clearly quicker than the leader (only a little, and the tow
// brings the leader back to it) goes by it and, pulling away, isn't shown the blue flag to give
// the place back.
{
  const race = newRace(monza, GRID, seeded(7), "medium", "pro", 10);
  race.racers = race.racers.filter((r) => r.id === 10 || r.id === 11);
  race.slips = false;
  const [lead, lapped] = [
    race.racers.find((r) => r.id === 10)!,
    race.racers.find((r) => r.id === 11)!,
  ];
  const put = (r: typeof lead, m: number, laps: number) => {
    const [x, y] = pointAt(m, 0);
    Object.assign(r.car, { x, y, h: dirAt(m / LENGTH), v: 60 });
    [r.p, r.dist, r.launch, r.laps, r.stops] = [nearest(x, y).p, laps * LENGTH + m, 0, laps, []];
  };
  put(lead, 3960, 3);
  put(lapped, 3900, 2);
  lead.pace = 0.7;
  const at = (r: typeof lead) => r.p * LENGTH;
  let blue = 0;
  run(race, 120, () => {
    if (monza.ahead(at(lead), at(lapped)) < LENGTH / 2) blue += lapped.blue ? 1 : 0;
    return false;
  });
  const by = monza.ahead(at(lead), at(lapped));
  assert.ok(by < LENGTH / 2 && by > 100, `the lapped car goes by and away (${by.toFixed(0)} m)`);
  assert.equal(blue, 0, "and isn't shown the blue flag to give it back");
}
// Lapped cars may overtake under the Safety Car: yours, a lap down, is taken past the queue and
// the Safety Car and round to its back, and the Safety Car comes in only once it's there.
{
  const race = incident([0, 2, 4, 6, 8, 10, 12, 14]);
  const me = race.racers.find((r) => r.id === 0)!;
  const drive = (secs: number, until = () => false) => {
    for (let f = 0; f < secs / DT && !until(); f++) tick(race, aiInput(me, race), DT);
  };
  drive(90);
  [me.dist, me.laps] = [me.dist - LENGTH, me.laps - 1];
  const x = race.racers.find((r) => r.id === 14)!;
  const [px, py] = pointAt(-150, HALF[0]! - 1);
  Object.assign(x.car, { x: px, y: py, h: dirAt(nearest(px, py).p) + Math.PI / 2, v: 60 });
  x.launch = Infinity;
  drive(1, () => x.out !== null);
  assert.equal(race.neutral?.kind, "sc", "a crash brings the Safety Car");
  let [waved, early] = [false, false];
  const from = race.t;
  drive(600, () => {
    waved ||= me.unlap;
    early ||= !!race.neutral?.ending && me.unlap;
    return race.neutral === null;
  });
  const rest = race.racers.filter((r) => r !== x);
  const lead = rest.reduce((a, b) => (b.dist > a.dist ? b : a));
  const texts = race.msgs.map((m) => m.text);
  console.log(`Unlapping: Safety Car out ${((race.t - from) / 1000).toFixed(0)} s`);
  assert.ok(texts.includes("Lapped cars may overtake") && waved, "lapped cars are waved through");
  assert.ok(!early, "the Safety Car's in only once they're back");
  assert.ok(race.neutral === null && !me.unlap, "and racing starts again");
  assert.ok(
    lead.dist - me.dist < 200,
    `back on the lead lap (${(lead.dist - me.dist).toFixed(0)} m)`,
  );
  assert.ok(
    rest.every((r) => r === me || r.dist > me.dist),
    "at the back of the queue",
  );
}
// Under the Safety Car the team drives your car, whatever you're pressing: no track limits, no
// hit, in the queue, until it hands the car back as the Safety Car comes in. Asked to box, it
// takes you in under it, and drives on until the stop's done.
for (const boxing of [false, true]) {
  const race = incident([0, 2, 4, 6, 8, 10, 12, 14]);
  const me = race.racers.find((r) => r.id === 0)!;
  const flat = { gas: true, brake: false, steer: 1, ot: false };
  const drive = (secs: number, until = () => false) => {
    for (let f = 0; f < secs / DT && !until(); f++)
      tick(race, teamDriving(race, me) ? flat : aiInput(me, race), DT);
  };
  drive(90);
  const x = race.racers.find((r) => r.id === 14)!;
  const [px, py] = pointAt(-150, HALF[0]! - 1);
  Object.assign(x.car, { x: px, y: py, h: dirAt(nearest(px, py).p) + Math.PI / 2, v: 60 });
  x.launch = Infinity;
  drive(1, () => x.out !== null);
  assert.equal(race.neutral?.kind, "sc", "a crash brings the Safety Car");
  assert.ok(teamDriving(race, me), "and the team takes your car");
  if (boxing) toggleBox(race);
  const [strikes, stints] = [me.strikes, me.stints.length];
  let queued = false;
  drive(600, () => {
    queued ||= me.held;
    return !teamDriving(race, me);
  });
  const said = race.msgs.filter((m) => m.kind === "radio").map((m) => m.text);
  assert.ok(queued && me.strikes === strikes && me.damage === 0, "driven clean in the queue");
  assert.ok(!me.out && race.neutral?.ending, "and handed back as it ends");
  if (boxing) {
    assert.equal(me.stints.length, stints + 1, "asked to box, it stops under the Safety Car");
    assert.equal(me.box, false, "and the request's done");
  } else {
    assert.equal(me.stints.length, stints, "not asked, it stays out");
    assert.ok(
      said.some((t) => t.startsWith("Safety Car's in this lap.")),
      "with a word on the radio",
    );
  }
}
// The radio: at Monza the boxes are before the line, so a stop ends inside the in-lap, and the
// out-lap after it is slow but no lap to call slow. Gap trends read from your side.
{
  const race = incident([0, 4]);
  const me = race.racers.find((r) => r.id === 0)!;
  const drive = (until: () => boolean) => {
    for (let f = 0; f < 600 / DT && !until(); f++) tick(race, aiInput(me, race), DT);
  };
  drive(() => me.laps >= 3);
  me.box = true;
  drive(() => me.stints.length > 1);
  const out = me.laps + 1;
  drive(() => me.laps > out);
  const slow = race.msgs.filter((m) => /cool-down|dropping|was slow|Slow lap/.test(m.text));
  assert.equal(slow.length, 0, "the out-lap isn't called slow");
}
assert.equal(trend(true, 1.5, 1.2, 1), ", you're taking 0.3 a lap", "catching the car ahead");
assert.equal(trend(true, 1.0, 1.6, 3), ", pulling away 0.2 a lap", "dropped by the car ahead");
assert.equal(trend(false, 2.0, 1.4, 2), ", closing 0.3 a lap", "caught by the car behind");
assert.equal(trend(false, 1.0, 1.05, 1), "", "a steady gap goes unsaid");
// The classification: each car's grid slot, and its laps on each set adding up to its race.
{
  const race = newRace(monza, GRID, seeded(3), "medium", "pro", lapsOf(DISTANCES[1]!, monza));
  race.racers = race.racers.filter((r) => r.id !== 0);
  run(race, 3600, () => race.done);
  const table = results(race);
  for (const r of table) {
    assert.equal(r.grid, GRID.indexOf(r.id) + 1, "the grid slot it started from");
    assert.equal(r.stintLaps.length, r.stints.length, "a lap count for every set");
    assert.ok(
      r.stintLaps.every((n) => n > 0),
      `no empty stint (${r.stintLaps})`,
    );
    const laps = r.stintLaps.reduce((a, b) => a + b, 0);
    assert.equal(laps, race.laps - r.down, "its stints add up to its laps");
  }
  assert.ok(
    table.some((r) => r.stops > 0),
    "a Grand Prix distance has stops",
  );
}
// With incidents on, every race still gets done, and close walls don't take the field: about four
// crash-outs a race at most, the street circuits included.
for (const { id, name } of TRACKS) {
  const seeds = [1, 2];
  let crashes = 0;
  for (const seed of seeds) {
    const race = newRace(getTrack(id), GRID, seeded(seed), "medium", "pro", LAPS, true);
    race.racers = race.racers.filter((r) => r.id !== 0);
    run(race, 1200, () => race.done);
    assert.ok(race.done, `${name}: a race with incidents gets done`);
    crashes += race.racers.filter((r) => r.out === "Crash").length;
  }
  const mean = crashes / seeds.length;
  console.log(`${name}: ${mean} crash-outs a race`);
  assert.ok(mean <= 4, `${name}: about four crash-outs a race at most (${mean})`);
}

// Your engineer: driven round by the computer, you hear the gaps every third lap (unless that
// lap's a personal best) as chatter, which the HUD drops if it's kept waiting, and the last lap
// as a call that always gets through.
{
  const race = newRace(monza, GRID, seeded(7), "medium", "pro", 10);
  const me = race.racers[0]!;
  const said: Msg[] = [];
  for (let f = 0; f < 1100 / DT && me.laps < 10; f++) {
    tick(race, aiInput(me, race), DT);
    said.push(...race.msgs.splice(0).filter((m) => m.kind === "radio"));
  }
  assert.ok(
    said.some((m) => /ahead \d+\.\d|behind \d+\.\d/.test(m.text) && m.chatter),
    "the engineer calls the gaps",
  );
  assert.ok(
    said.some((m) => /last lap|one more lap/i.test(m.text) && !m.chatter),
    "and the last lap",
  );
}

// The wing you pick for your stop goes on there: driven round and in by the computer.
{
  const race = newRace(monza, GRID, seeded(7), "medium", "pro", 10);
  const me = race.racers[0]!;
  const plan = teamPlan(10, monza, "medium");
  [me.stops, me.plan, me.nextWing] = [plan.at, plan.tyres, 5];
  const after: string[] = [];
  for (let f = 0; f < 1100 / DT && (me.stints.length < 2 || me.pitting); f++) {
    // The computer drives you in on the lap the team calls, as it would itself.
    const s = signed(me.p);
    if (me.stops.includes(me.laps + 1) && s > monza.PIT_IN - 200 && s < monza.PIT_IN)
      me.pitting = true;
    tick(race, aiInput(me, race), DT);
    for (const m of race.msgs.splice(0))
      if (m.kind === "radio" && me.stints.length > 1) after.push(m.text);
  }
  assert.equal(me.stints.length, 2, "you stop");
  assert.equal(me.wing, 5, "and the wing for the stop goes on there");
  // Out of the lane where it merges, the team doesn't take you for coming in again.
  assert.ok(!after.some((t) => t.endsWith("ready.")), `no second stop called: ${after}`);
}

// The racing line's braking point for Rettifilo, from the line at Monza: earlier the faster you
// come, red only once it's close, and gone once you're slow enough for it.
{
  const shade = new Uint8Array(monza.PATH.length);
  const apex = atDist(monza.CORNERS[0]!.at);
  const at = (v: number, m = 100) => [guide(monza, 1, v, m, "full", shade), shade[apex]] as const;
  const [fast, far] = at(100);
  const [slow] = at(85);
  assert.ok(fast! > 150 && fast! < 450, `braking from 360 km/h ${fast?.toFixed(0)} m ahead`);
  assert.ok(slow! > fast!, "later from slower");
  assert.equal(far, SOON, "the corner's yellow from far off");
  assert.equal(at(100, 100 + fast! - 20)[1], BRAKE, "and red at its braking point");
  assert.equal(at(15, 600)[1], GO, "and green once you're slow enough");
  guide(monza, 1, 100, 100, "corners", shade);
  assert.ok(shade.includes(0) && shade[apex], "on corners, only the corners show");
}

// The steering assist brings a car 3 m off the line on Monza's back straight back to it, gently,
// and leaves it alone when you steer.
{
  const race = newQuali(monza, "pro", seeded(3))[0]!;
  const me = race.racers[0]!;
  const m = 2750;
  const i = atDist(m);
  const [x, y] = pointAt(m, RACING[i]! + 3);
  Object.assign(me.car, { x, y, h: dirAt(m / LENGTH), v: 80 });
  [me.p, me.dist, me.launch] = [nearest(x, y).p, m, 0];
  const off = () => lateral(me.car.x, me.car.y, me.p) - RACING[atDist(me.p * LENGTH)]!;
  const you = { gas: true, brake: false, steer: 0 };
  assert.equal(assist(race, me, { ...you, steer: 1 }).steer, 1, "your steering wins");
  let most = 0;
  for (let t = 0; t < 4; t += DT) {
    const input = assist(race, me, you);
    most = Math.max(most, Math.abs(input.steer));
    tick(race, input, DT);
  }
  assert.ok(Math.abs(off()) < 0.5, `back on the line: ${off().toFixed(2)} m off`);
  assert.ok(most <= 0.3, "never more than a gentle pull");
}

// At the flag the tower goes by laps first: a lapped car taking the flag inside the winner's
// 5 s penalty, and one still on the lead lap's last lap, stay where they are.
{
  const race = newRace(monza, GRID, seeded(1), "medium", "pro", 10);
  const [win, lapped, last] = race.racers;
  Object.assign(win!, { laps: 10, finish: 1000, penalty: 5000 });
  Object.assign(lapped!, { laps: 9, finish: 2000, penalty: 0 });
  Object.assign(last!, { laps: 9, finish: null, dist: 9.5 * LENGTH });
  for (const r of race.racers.slice(3)) Object.assign(r, { laps: 8, dist: 8.5 * LENGTH });
  assert.deepEqual(
    order(race)
      .slice(0, 3)
      .map((r) => r.id),
    [win!.id, last!.id, lapped!.id],
    "the winner, the lead lap, then the lapped",
  );
  assert.equal(gap(race, win!), 0, "and the winner's gap is from the winner");
}

console.log("race: ok");
