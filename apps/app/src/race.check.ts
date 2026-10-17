// Self-check for the race: grid, tyres, pit lane, contact, wrong way and whole races run
// headless. Run: node src/race.check.ts
import assert from "node:assert/strict";
import {
  BOXES,
  HALF,
  LENGTH,
  dirAt,
  bump,
  inPit,
  lateral,
  nearest,
  pointAt,
  signed,
  fmt,
  step,
  TOP,
  type Car,
} from "./track.ts";
import {
  LAPS,
  PIT_V,
  STOP,
  gridSlot,
  teamPick,
  newRace,
  results,
  tick,
  wrongWay,
  type Race,
  type Tyre,
} from "./race.ts";

// The bands agreed for the start: [reaction ms, grid position].
for (const [ms, p] of [
  [190, 1],
  [240, 1],
  [280, 2],
  [300, 3],
  [350, 5],
  [400, 6],
  [520, 10],
  [900, 10],
] as [number, number][])
  assert.equal(gridSlot(ms) + 1, p, `${ms} ms starts P${p}`);

// A seeded random, so races repeat.
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const still = { gas: false, brake: false, steer: 0 };
const DT = 1 / 30;

// One computer car alone on track, from pole.
const solo = (team: number, edit: (r: Race["racers"][number]) => void = () => {}) => {
  const race = newRace(9, seeded(7));
  race.racers = race.racers.filter((r) => r.team === team);
  edit(race.racers[0]!);
  return race;
};
const run = (race: Race, secs: number, until = () => false) => {
  for (let f = 0; f < secs / DT && !until(); f++) tick(race, still, DT);
  return race;
};

// Tyres: a worn set laps slower.
const lapOn = (life: number) => {
  const race = solo(1, (r) => (r.life = life));
  const r = race.racers[0]!;
  run(race, 400, () => r.laps >= 2);
  return r.best;
};
const fresh = lapOn(1);
assert.ok(lapOn(0) > fresh + 1000, `worn tyres are slower (${fmt(fresh)} vs ${fmt(lapOn(0))})`);

// How long each compound lasts, with mistakes on: life at the end of each lap, no stop.
const stint = (tyre: Tyre, seed: number) => {
  const race = newRace(9, seeded(seed));
  race.racers = race.racers.filter((r) => r.team === 5);
  const r = race.racers[0]!;
  [r.tyre, r.pitLap] = [tyre, 0];
  const lives: number[] = [];
  run(race, 900, () => {
    if (r.laps > lives.length) lives.push(r.life);
    return r.finish !== null;
  });
  return lives;
};
for (const seed of [7, 11]) {
  // The box call comes under 0.3: not before lap 4 on mediums, not before lap 3 on softs.
  const m = stint("medium", seed);
  assert.ok(m[2]! > 0.3, `mediums reach lap 4 before the call (${m[2]!.toFixed(2)})`);
  const s = stint("soft", seed);
  assert.ok(s[1]! > 0.3, `softs reach lap 3 before the call (${s[1]!.toFixed(2)})`);
  const h = stint("hard", seed);
  assert.ok(h[LAPS - 1]! > 0, `hards go the distance (${h[LAPS - 1]!.toFixed(2)})`);
}
assert.deepEqual([1, 2, 3, 4].map(teamPick), ["soft", "soft", "medium", "medium"], "team picks");

// Pit lane.
const box = BOXES[1]!;
assert.ok(inPit(box.x, box.y, nearest(box.x, box.y).p), "the boxes are in the lane");
const [cx, cy] = pointAt(-200, 0);
assert.ok(!inPit(cx, cy, nearest(cx, cy).p), "the track isn't");
{
  const race = solo(1, (r) => {
    r.pitLap = 1;
    r.life = 0.2;
  });
  const r = race.racers[0]!;
  let fastest = 0;
  let stopped = 0;
  let at = Infinity;
  let after = 0;
  run(race, 400, () => {
    if (r.pit) fastest = Math.max(fastest, r.car.v);
    if (r.stop > 0) {
      stopped += DT;
      at = Math.min(at, Math.abs(signed(r.p) - box.s));
    } else if (stopped && !after) after = r.life;
    return r.laps >= 2;
  });
  assert.ok(
    stopped > STOP - 0.1 && stopped < STOP + 0.1,
    `stops for ${STOP} s (${stopped.toFixed(2)})`,
  );
  assert.ok(at < 1.5, `at its box (${at.toFixed(2)} m off)`);
  assert.ok(
    fastest > PIT_V - 1 && fastest < PIT_V + 3,
    `limited in the lane (${(fastest * 3.6).toFixed(0)} km/h)`,
  );
  assert.ok(after > 0.99, "and comes out on new tyres");
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
  const race = solo(1, (r) => (r.pitLap = 1));
  const r = race.racers[0]!;
  run(race, 400, () => r.laps >= 1 && !r.pit && signed(r.p) > 300);
  assert.equal(r.strikes, 0, "the pit lane isn't track limits");
}

// DRS: eligible within a second of the car ahead at detection, from lap 2, and quicker.
{
  const race = solo(1);
  race.racers = [race.racers[0]!, { ...race.racers[0]!, team: 2, car: { ...race.racers[0]!.car } }];
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
    [a.laps, b.laps, a.drs] = [laps, laps, null];
    run(race, 0.85);
  };
  cross(1);
  assert.equal(a.drs, "eligible", "within a second at detection");
  assert.equal(b.drs, null, "the car in front isn't");
  cross(0);
  assert.equal(a.drs, null, "not on the first lap");
  const top = (open: boolean) => {
    const car = { x: 0, y: 0, h: 0, v: 0 };
    for (let f = 0; f < 60 * 60; f++)
      step(car, { gas: true, brake: false, steer: 0 }, 1 / 60, false, 1, open ? TOP + 4.2 : TOP);
    return car.v * 3.6;
  };
  assert.ok(
    top(true) - top(false) > 12,
    `DRS is worth ~15 km/h (${(top(true) - top(false)).toFixed(0)})`,
  );
}

// Whole races: nine computer cars, you parked out of the way. Queueing in the single-file pit
// lane behind another car's stop isn't stuck.
const race = newRace(9, seeded(3));
race.racers = race.racers.filter((r) => r.team !== 0);
const stuck = new Map<number, number>();
let worst = 0;
run(race, 900, () => {
  for (const r of race.racers) {
    const s =
      r.car.v < 1 && r.stop <= 0 && !r.pit && r.finish === null && race.t > 2000
        ? (stuck.get(r.team) ?? 0) + DT
        : 0;
    stuck.set(r.team, s);
    worst = Math.max(worst, s);
  }
  return race.racers.every((r) => r.finish !== null);
});
const table = results(race);
console.log(
  table
    .map(({ team, time, best }) => {
      const r = race.racers.find((x) => x.team === team)!;
      return `${team} pace ${r.pace.toFixed(3)} pit ${r.pitLap} best ${fmt(best)} race ${fmt(time)}`;
    })
    .join("\n"),
);
assert.ok(
  race.racers.every((r) => r.finish !== null && r.laps === LAPS),
  "everyone finishes",
);
assert.ok(worst < 2, `nobody's stuck (${worst.toFixed(1)} s)`);
const bests = race.racers.map((r) => r.best);
assert.ok(
  Math.min(...bests) > 88_000 && Math.max(...bests) < 106_000,
  `laps from 1:28 to 1:46 (${fmt(Math.min(...bests))} to ${fmt(Math.max(...bests))})`,
);
const strikes = race.racers.reduce((n, r) => n + r.strikes, 0);
console.log(`strikes ${strikes}, penalties ${race.racers.filter((r) => r.penalty).length}`);
assert.ok(strikes > 0, "computer cars make mistakes and pay for them");
assert.ok(
  race.msgs.some((m) => m.kind === "fastest"),
  "fastest laps are called",
);

// Strategy: soft or medium with a stop, against medium or hard without, alone, on a mid pace.
const strat = (tyre: Tyre, pitLap: number) => {
  const r = solo(5, (x) => ([x.tyre, x.pitLap] = [tyre, pitLap]));
  r.slips = false;
  run(r, 900, () => r.racers[0]!.finish !== null);
  return r.racers[0]!.finish!;
};
const plans = [strat("soft", 2), strat("medium", 3), strat("medium", 0), strat("hard", 0)];
console.log(`soft-stop, medium-stop, medium, hard: ${plans.map(fmt).join(", ")}`);
assert.ok(Math.max(...plans) - Math.min(...plans) < 10_000, "every strategy comes out close");

console.log("race: ok");
