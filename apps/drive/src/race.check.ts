// Self-check for the race: grid, tyres, pit lane, contact, wrong way and whole races run
// headless. Run: node src/race.check.ts
import assert from "node:assert/strict";
import { bump, fmt, step, TOP, type Car, type Track } from "./track.ts";
import { TRACKS, getTrack } from "./tracks.ts";
import {
  CARS,
  DISTANCES,
  STINT,
  LEVELS,
  PIT_V,
  edgeOf,
  grip,
  STOP,
  strategies,
  gridSlot,
  teamPick,
  GRID,
  aiInput,
  newQuali,
  newRace,
  qualiDelta,
  qualiOrder,
  results,
  tick,
  wrongWay,
  type Level,
  type Race,
  type Tyre,
} from "./race.ts";

// The checks below race the shortest distance, the one the paces are tuned on, at Monza, the
// track they're tuned at. The pit lane and whole races then run on every track.
const LAPS = DISTANCES[0]!;
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

// Ratings: in F1 Verstappen (8) has the best pace and Colapinto (13) the worst, and
// Lindblad (11) the least awareness and Russell (3) the most.
{
  const rs = newRace(getTrack("monza"), GRID, seeded(1), "medium", "pro").racers;
  const paces = rs.slice(1).map((r) => r.pace);
  assert.equal(rs[8]!.pace, Math.max(...paces), "the best pace rating drives quickest");
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

// Tyres: a worn set laps slower.
const lapOn = (life: number) => {
  const race = solo(1, (r) => ([r.life, r.tyre] = [life, "medium"]));
  const r = race.racers[0]!;
  race.slips = false;
  run(race, 400, () => r.laps >= 2);
  return r.best;
};
const fresh = lapOn(1);
assert.ok(lapOn(0) > fresh + 1000, `worn tyres are slower (${fmt(fresh)} vs ${fmt(lapOn(0))})`);

// How long each compound lasts, with mistakes on: life at the end of each lap, no stop.
const stint = (tyre: Tyre, seed: number) => {
  const race = newRace(monza, GRID, seeded(seed));
  race.racers = race.racers.filter((r) => r.id === 10);
  const r = race.racers[0]!;
  [r.tyre, r.stops, r.plan] = [tyre, [], [tyre]];
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
assert.deepEqual(
  [1, 2, 3, 4, 6, 9, 14].map(teamPick),
  ["soft", "soft", "medium", "medium", "hard", "medium", "medium"],
  "team picks: the softest set that reaches the flag, or mediums when another stop's to come",
);
// Every computer car's plan covers the distance, each stint at least two laps (so no stop on the
// first or last lap) on a set that lasts it.
for (const laps of DISTANCES)
  for (const seed of [1, 2, 3])
    for (const r of newRace(monza, GRID, seeded(seed), "medium", "pro", laps).racers.slice(1)) {
      const ends = [...r.stops, laps];
      assert.equal(r.plan.length, ends.length, `${laps} laps: a set per stint`);
      ends.forEach((end, k) => {
        const len = end - (ends[k - 1] ?? 0);
        assert.ok(len >= 2 && len <= STINT[r.plan[k]!], `${laps} laps: ${len} on ${r.plan[k]}`);
      });
    }

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
  run(race, 400, () => {
    if (r.pit) fastest = Math.max(fastest, r.car.v);
    if (r.stop > 0) {
      stopped += DT;
      off = Math.min(off, Math.abs(track.signed(r.p) - box.s));
    } else if (stopped && !after) after = r.life;
    return r.laps >= 2;
  });
  assert.ok(
    stopped > STOP - 0.1 && stopped < STOP + 0.1,
    at(`stops for ${STOP} s (${stopped.toFixed(2)})`),
  );
  assert.ok(off < 1.5, at(`at its box (${off.toFixed(2)} m off)`));
  assert.ok(
    fastest > PIT_V - 1 && fastest < PIT_V + 3,
    at(`limited in the lane (${(fastest * 3.6).toFixed(0)} km/h)`),
  );
  assert.ok(after > 0.99, at("and comes out on new tyres"));
  assert.equal(race.racers[0]!.strikes, 0, at("the pit lane isn't track limits"));
};
for (const def of TRACKS) pitStop(getTrack(def.id));
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
}

// The battery, in MJ: a pro's flying lap at Monza harvests the 8.5 MJ allowance and no more;
// flat out on a flat battery the car super clips, harvesting; and a lap with Overtake's bonus
// harvests up to 9 MJ.
{
  const race = solo(10, (r) => (r.launch = 0), "pro");
  race.slips = false;
  const r = race.racers[0]!;
  let most = 0;
  const lap = (n: number) =>
    run(race, 600, () => {
      if (r.laps === n) most = Math.max(most, r.harvested);
      return r.laps > n;
    });
  lap(1);
  assert.ok(most > 8 && most <= 8.5 + 1e-9, `a lap harvests up to 8.5 MJ (${most.toFixed(2)})`);
  [r.charge, r.harvested] = [0, 0];
  run(race, 1);
  assert.ok(r.clipping && r.charge > 0, "flat out on a flat battery, it super clips");
  [most, r.bonusLap] = [0, r.laps];
  lap(r.laps);
  assert.ok(
    most > 8.5 && most <= 9 + 1e-9,
    `Overtake's lap harvests up to 9 MJ (${most.toFixed(2)})`,
  );
}

// Whole races at each level: nineteen computer cars, you parked out of the way. Nobody sits
// stopped on track, and in the lane nobody waits long: at most a release held for traffic (with
// half of twenty-two cars stopping on the same lap, a few seconds of it), or a queue behind a
// teammate's stop.
const median = (xs: number[]) => xs.slice().sort((a, b) => a - b)[xs.length >> 1]!;
const field = (lv: Level, track: Track = monza) => {
  const race = newRace(track, GRID, seeded(3), "medium", lv);
  race.racers = race.racers.filter((r) => r.id !== 0);
  const stuck = new Map<number, number>();
  const worst = { track: 0, lane: 0 };
  run(race, 900, () => {
    for (const r of race.racers) {
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
    track !== monza || (Math.min(...bests) > 84_000 && Math.max(...bests) < 112_000),
    `${at}: laps from 1:24 to 1:52 (${fmt(Math.min(...bests))} to ${fmt(Math.max(...bests))})`,
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
// The ladder: the front of each field laps about 1:36, 1:31 and 1:26, and pro's winner takes
// about 7:30, which a clean race from the player (about 1:26 laps) only just beats.
const near = (ms: number, want: number, by: number) => Math.abs(ms - want) < by;
assert.ok(near(am.front, 95_500, 1500), `amateur's front laps about 1:36 (${fmt(am.front)})`);
assert.ok(near(mid.front, 91_000, 1500), `intermediate's about 1:31 (${fmt(mid.front)})`);
assert.ok(near(pro.front, 86_500, 1000), `pro's about 1:26 (${fmt(pro.front)})`);
assert.ok(near(pro.win, 450_000, 10_000), `pro's winner takes about 7:30 (${fmt(pro.win)})`);
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

// The ladder carries to every track. A clean lap at your grip on the racing line stands in for
// you: pro's front runner stays as close to it as at Monza, so pro is as hard everywhere. The
// lower levels drive nearer the centreline, which costs more on twisty tracks (Silverstone and
// Interlagos most), so they may be easier than at Monza but never harder.
const clean = (track: Track) => {
  const race = solo(2, (r) => ([r.tyre, r.stops] = ["medium", []]), "pro", track);
  race.racers[0]!.pace = 1 / edgeOf(race);
  race.slips = false;
  run(race, 600, () => race.racers[0]!.laps >= 3);
  return race.racers[0]!.best;
};
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
  assert.ok(Math.abs(gap - proGap) < 0.01, `${def.name}: pro is as hard as at Monza`);
  assert.ok(a.front / p.front > am.front / pro.front - 0.01, `${def.name}: amateur no harder`);
  assert.ok(m.front / p.front > mid.front / pro.front - 0.01, `${def.name}: intermediate too`);
  legends(l, p, def.name);
}

// Strategy: soft or medium with a stop, against medium or hard without, alone, on a mid pace.
const strat = (tyre: Tyre, pitLap: number) => {
  const r = solo(10, (x) => ([x.tyre, x.stops, x.plan] = [tyre, pitLap ? [pitLap] : [], [tyre]]));
  r.slips = false;
  run(r, 900, () => r.racers[0]!.finish !== null);
  return r.racers[0]!.finish!;
};
const plans = [strat("soft", 2), strat("medium", 3), strat("medium", 0), strat("hard", 0)];
console.log(`soft-stop, medium-stop, medium, hard: ${plans.map(fmt).join(", ")}`);
assert.ok(Math.max(...plans) - Math.min(...plans) < 10_000, "every strategy comes out close");

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
      r.life = life;
      tick(race, still, DT);
    }
    return r.best;
  };
  const stopping = (stops: number[]) => {
    const { race, r } = alone(t, 3, stops, ["medium", "medium"]);
    for (let f = 0; f < 600 / DT && r.finish === null; f++) {
      r.life = 1;
      tick(race, still, DT);
    }
    return r.finish!;
  };
  const fresh = lapAt(1);
  const power = Math.log(lapAt(0.6) / fresh) / -Math.log(grip(0.6, "medium"));
  const stop = (stopping([2]) - stopping([])) / fresh;
  const all = strategies(10, t);
  const rivals = [
    ...all.slice(0, 2),
    ...[0, 1, 2, 3].map((n) => all.find((o) => o.at.length === n)!),
  ];
  const raced = [...new Set(rivals)].map(({ at, tyres }) => {
    const { race, r } = alone(t, 10, at, tyres);
    run(race, 2400, () => r.finish !== null);
    return r.finish!;
  });
  console.log(
    `${def.name}: grip power ${power.toFixed(3)}, a stop ${stop.toFixed(3)} laps, ` +
      `pick ${fmt(raced[0]!)} against ${raced.slice(1).map(fmt).join(", ")}`,
  );
  assert.ok(Math.abs(power - t.GRIP_POWER) < 0.04, `${def.name}: grip power ${power.toFixed(3)}`);
  assert.ok(Math.abs(stop - t.STOP_LAPS) < 0.02, `${def.name}: a stop ${stop.toFixed(3)} laps`);
  assert.ok(
    raced[0]! - Math.min(...raced) < 1500,
    `${def.name}: the model's pick is near the best`,
  );
}

// The longest race: everyone finishes, having made every stop they planned and never run a set
// down to nothing.
{
  const laps = DISTANCES.at(-1)!;
  const race = newRace(monza, GRID, seeded(3), "medium", "pro", laps);
  race.racers = race.racers.filter((r) => r.id !== 0);
  let worn = 1;
  run(race, 60 * laps * 2, () => {
    for (const r of race.racers) if (r.finish === null) worn = Math.min(worn, r.life);
    return race.racers.every((r) => r.finish !== null);
  });
  assert.ok(
    race.racers.every((r) => r.finish !== null && r.laps === laps),
    `${laps} laps: everyone finishes`,
  );
  assert.ok(
    race.racers.every((r) => r.stints.length === r.plan.length),
    `${laps} laps: every planned stop is made`,
  );
  assert.ok(worn > 0.05, `${laps} laps: no set runs out (${worn.toFixed(2)} left at worst)`);
  console.log(`${laps} laps: won in ${fmt(results(race)[0]!.time)}`);
}

// A car that never gets to the flag doesn't hold the classification up: the race is done three
// average laps after the winner, and it's classified on an estimate behind.
{
  const race = newRace(monza, GRID, seeded(7), "medium", "pro", 2);
  race.racers = race.racers.filter((r) => r.id === 10 || r.id === 11);
  race.slips = false;
  race.racers[1]!.launch = Infinity;
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
// the computer instead, set a time too, and the live delta stays sensible all the way round.
for (const { id, name } of TRACKS) {
  const q = newQuali(getTrack(id), "pro", seeded(5));
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
  if (drive) {
    assert.ok(me.best > 0 && worst > 0 && worst < 5, `${name}: a lap and a delta (${worst})`);
    console.log(`${name} quali: pole ${fmt(order[0]!.best)}`);
  } else assert.equal(order.at(-1)!.id, 0, `${name}: no time starts last`);
}

console.log("race: ok");
