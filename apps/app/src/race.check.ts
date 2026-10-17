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
  STOP,
  gridSlot,
  teamPick,
  newRace,
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
  [900, 20],
] as [number, number][])
  assert.equal(gridSlot(ms) + 1, p, `${ms} ms starts P${p}`);

// A seeded random, so races repeat.
const seeded = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};
const still = { gas: false, brake: false, steer: 0 };
const DT = 1 / 30;

// One computer car alone on track. Driver 10 is mid-field.
const solo = (
  id: number,
  edit: (r: Race["racers"][number]) => void = () => {},
  lv?: Level,
  track: Track = monza,
) => {
  const race = newRace(track, 9, seeded(7), "medium", lv);
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
  const race = solo(1, (r) => (r.life = life));
  const r = race.racers[0]!;
  run(race, 400, () => r.laps >= 2);
  return r.best;
};
const fresh = lapOn(1);
assert.ok(lapOn(0) > fresh + 1000, `worn tyres are slower (${fmt(fresh)} vs ${fmt(lapOn(0))})`);

// How long each compound lasts, with mistakes on: life at the end of each lap, no stop.
const stint = (tyre: Tyre, seed: number) => {
  const race = newRace(monza, 9, seeded(seed));
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
// Every computer car's plan covers the distance, each stint on a set that lasts it.
for (const laps of DISTANCES)
  for (const seed of [1, 2, 3])
    for (const r of newRace(monza, 9, seeded(seed), "medium", "pro", laps).racers.slice(1)) {
      const ends = [...r.stops, laps];
      assert.equal(r.plan.length, ends.length, `${laps} laps: a set per stint`);
      ends.forEach((end, k) => {
        const len = end - (ends[k - 1] ?? 0);
        assert.ok(len >= 1 && len <= STINT[r.plan[k]!], `${laps} laps: ${len} on ${r.plan[k]}`);
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
  run(race, 400, () => r.laps >= 1 && !r.pit && signed(r.p) > 300);
  assert.equal(r.strikes, 0, "the pit lane isn't track limits");
}
// Seconds each of these drivers spends in the lane, starting in it 10 m apart, on a race with
// only them.
const lane = (ids: number[]) => {
  const race = newRace(monza, 9, seeded(7));
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
  const race = newRace(t, 9, seeded(7));
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

// DRS: eligible within a second of the car ahead at detection, from lap 2, and quicker.
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

// Whole races at each level: nineteen computer cars, you parked out of the way. Nobody sits
// stopped on track, and in the lane nobody waits long: at most a release held for traffic, or
// a queue behind a teammate's stop.
const median = (xs: number[]) => xs.slice().sort((a, b) => a - b)[xs.length >> 1]!;
const field = (lv: Level, track: Track = monza) => {
  const race = newRace(track, 9, seeded(3), "medium", lv);
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
  assert.ok(worst.track < 2, `${at}: nobody's stuck (${worst.track.toFixed(1)} s)`);
  assert.ok(worst.lane < 5, `${at}: nobody waits long in the lane (${worst.lane.toFixed(1)} s)`);
  const bests = race.racers.map((r) => r.best);
  assert.ok(
    track !== monza || (Math.min(...bests) > 84_000 && Math.max(...bests) < 112_000),
    `${at}: laps from 1:24 to 1:52 (${fmt(Math.min(...bests))} to ${fmt(Math.max(...bests))})`,
  );
  assert.ok(
    race.msgs.some((m) => m.kind === "fastest"),
    "fastest laps are called",
  );
  const strikes = race.racers.reduce((n, r) => n + r.strikes, 0);
  return { front: Math.min(...bests), lap: median(bests), win: table[0]!.time, strikes };
};
const levels = (["amateur", "intermediate", "pro"] as const).map((lv) => field(lv));
console.log(
  levels
    .map((l) => `best ${fmt(l.front)} median ${fmt(l.lap)} win ${fmt(l.win)} ${l.strikes} strikes`)
    .join("\n"),
);
const [am, mid, pro] = levels as [(typeof levels)[0], (typeof levels)[0], (typeof levels)[0]];
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

// The ladder carries to every track. A clean lap at your grip on the racing line stands in for
// you: pro's front runner stays as close to it as at Monza, so pro is as hard everywhere. The
// lower levels drive nearer the centreline, which costs more on twisty tracks (Silverstone and
// Interlagos most), so they may be easier than at Monza but never harder.
const clean = (track: Track) => {
  const race = solo(2, undefined, "pro", track);
  race.racers[0]!.pace = 1 / edgeOf(race);
  race.slips = false;
  run(race, 600, () => race.racers[0]!.laps >= 3);
  return race.racers[0]!.best;
};
const proGap = pro.front / clean(monza);
for (const def of TRACKS.slice(1)) {
  const t = getTrack(def.id);
  const [a, m, p] = (["amateur", "intermediate", "pro"] as const).map((lv) => field(lv, t)) as [
    typeof pro,
    typeof pro,
    typeof pro,
  ];
  const gap = p.front / clean(t);
  console.log(
    `${def.name}: fronts ${[a, m, p].map((l) => fmt(l.front)).join(", ")}, pro at ${gap.toFixed(3)} of a clean lap`,
  );
  assert.ok(p.lap < m.lap && m.lap < a.lap, `${def.name}: the better the field, the quicker`);
  assert.ok(Math.abs(gap - proGap) < 0.01, `${def.name}: pro is as hard as at Monza`);
  assert.ok(a.front / p.front > am.front / pro.front - 0.01, `${def.name}: amateur no harder`);
  assert.ok(m.front / p.front > mid.front / pro.front - 0.01, `${def.name}: intermediate too`);
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

// The longest race: everyone finishes, having made every stop they planned and never run a set
// down to nothing.
{
  const laps = DISTANCES.at(-1)!;
  const race = newRace(monza, 9, seeded(3), "medium", "pro", laps);
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

console.log("race: ok");
