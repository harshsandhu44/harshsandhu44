// The race the drive runs: ten cars, five laps, tyres that wear and a pit stop to change them.
// Plain maths like track.ts, so race.check.ts can run whole races headless.
import {
  BOXES,
  CORNERS,
  DRS_ZONES,
  HALF,
  LENGTH,
  PIT_IN,
  PIT_OUT,
  TOP,
  ahead as fwd,
  allFourOff,
  atDist,
  bump,
  collide,
  cornerAt,
  dirAt,
  fmt,
  inPit,
  inZone,
  lapTick,
  lateral,
  limitAt,
  nearest,
  newLap,
  onGrass,
  pitOffset,
  pointAt,
  signed,
  step,
  type Car,
  type Input,
  type Lap,
  type Split,
} from "./track.ts";

export const LAPS = 5;
// Index 0 is you, in the car's own livery. The rest are colours off the grid, with made-up codes.
export const TEAMS = [
  { code: "HAR", color: "" },
  { code: "VAS", color: "#f2c230" },
  { code: "KOR", color: "#ff8000" },
  { code: "BEL", color: "#b9bec4" },
  { code: "MAR", color: "#1f2b5c" },
  { code: "OKO", color: "#0d5c3a" },
  { code: "LIN", color: "#2f6df0" },
  { code: "DUV", color: "#f070b2" },
  { code: "RAS", color: "#f2f2ef" },
  { code: "TEN", color: "#18181c" },
];

// Your hero reaction time picks the slot: up to 0.250 s is pole, then one back per 30 ms. The hero
// times from the press to the painted lights-out, so these are real reactions.
export const gridSlot = (ms: number) => Math.min(9, Math.max(0, Math.ceil((ms - 250) / 30)));
const gridAt = (slot: number) => -10 - 8 * slot;

// Tyres: life runs from 1 (new) to 0 in about four laps, and grip falls away faster as they go,
// to 1 - FADE when they're finished. Distance wears them, sliding wide and the grass much
// faster. ponytail: tuned in race.check.ts so a stop and no stop come out within a few seconds
// over five laps. These are the knobs.
const WEAR = 1 / 25000;
const SLIDE = 1 / 25;
const GRASS = 1 / 2000;
const FADE = 0.45;
export const grip = (life: number) => 1 - FADE * (1 - life) ** 2;

// DRS adds about 15 km/h to the top speed.
const DRS_TOP = TOP + 4.2;

// The pit limiter and the stop at the box.
export const PIT_V = 80 / 3.6;
export const STOP = 2.5;
const BOX_BRAKE = 12;

export type Racer = {
  team: number;
  car: Car;
  lap: Lap;
  // Laps completed, race distance in metres (negative on the grid), and the best clean lap.
  laps: number;
  dist: number;
  p: number;
  best: number;
  life: number;
  // Seconds left at the box, whether this visit's stop is done, and whether in the lane now.
  stop: number;
  served: boolean;
  pit: boolean;
  // Computer cars: share of the corner limit they drive to, the lap they stop at the end of
  // (0 for none), when they react to the lights, and their line's offset for overtaking, held
  // until laneT (race ms) so they don't weave.
  pace: number;
  pitLap: number;
  pitting: boolean;
  launch: number;
  lane: number;
  laneT: number;
  // Race time at the flag; the last checkpoint passed and when; seconds facing the wrong way.
  finish: number | null;
  cp: number;
  cpT: number;
  wrong: number;
  // Track limits: excursions so far, whether off now, time added (ms, with any jump start), and
  // the last contact with another car, which excuses the next excursion for a second.
  strikes: number;
  off: boolean;
  penalty: number;
  touchT: number;
  // DRS for the zone it was last eligible in: null, eligible, or open.
  drs: null | "eligible" | "open";
  drsZone: number;
  // Computer cars: the corner they'll overcook (-1 none) and the last corner they rolled for.
  mistake: number;
  rolled: number;
  // You: whether the team has already called you in on these tyres.
  boxCall: boolean;
};

// Race Control and your team radio, queued for the HUD.
export type Msg = {
  kind: "limits" | "flag" | "penalty" | "fastest" | "radio";
  team: number;
  text: string;
};

export type Race = {
  racers: Racer[];
  // Milliseconds since the lights went out, and the first car's time at each checkpoint.
  t: number;
  cps: number[];
  jump: boolean;
  done: boolean;
  msgs: Msg[];
  fastest: { team: number; ms: number } | null;
  // When any car last crossed each DRS detection line.
  crossed: number[];
  // Whether computer cars make mistakes (off for the strategy check), and the dice.
  slips: boolean;
  rand: () => number;
};

// Computer paces spread across this range. ponytail: calibrated against the laps in
// race.check.ts (about 1:31 to 1:40); move these if their lap times drift.
const FAST = 0.97;
const SLOW = 0.84;

export function newRace(slot: number, rand = Math.random): Race {
  // The quickest computer cars line up at the front, in the slots you didn't take.
  const ai = TEAMS.slice(1)
    .map((_, k) => k + 1)
    .sort(() => rand() - 0.5);
  const stoppers = new Set(
    ai
      .slice()
      .sort(() => rand() - 0.5)
      .slice(0, 4),
  );
  const slots = [...Array(10).keys()].filter((s) => s !== slot);
  const racers = TEAMS.map((_, team): Racer => {
    const order = ai.indexOf(team);
    const s = team === 0 ? slot : slots[order]!;
    const m = gridAt(s);
    const [x, y] = pointAt(m, (s % 2 ? 1 : -1) * (HALF[atDist(m)]! / 2.5));
    return {
      team,
      car: { x, y, h: dirAt((m + LENGTH) / LENGTH), v: 0 },
      lap: newLap(),
      laps: 0,
      dist: m,
      p: (m + LENGTH) / LENGTH,
      best: 0,
      life: 1,
      stop: 0,
      served: false,
      pit: false,
      pace: team === 0 ? 0 : FAST - ((FAST - SLOW) * order) / 8,
      pitLap: stoppers.has(team) ? 2 + Math.floor(rand() * 2) : 0,
      pitting: false,
      launch: 180 + rand() * 140,
      lane: 0,
      laneT: 0,
      finish: null,
      cp: -1,
      cpT: 0,
      wrong: 0,
      strikes: 0,
      off: false,
      penalty: 0,
      touchT: -Infinity,
      drs: null,
      drsZone: 0,
      mistake: -1,
      rolled: -1,
      boxCall: false,
    };
  });
  for (const r of racers) r.lap.start = 0;
  return {
    racers,
    t: 0,
    cps: [],
    jump: false,
    done: false,
    msgs: [],
    fastest: null,
    crossed: DRS_ZONES.map(() => -Infinity),
    slips: true,
    rand,
  };
}

// A computer driver: aims down its line, brakes to its share of the corner limit, follows the
// lane on its stop lap and pulls out to pass a slower car ahead.
export function aiInput(r: Racer, race: Race): Input {
  const { car } = r;
  if (race.t < r.launch) return { gas: false, brake: false, steer: 0 };
  const s = signed(r.p);
  const look = r.p * LENGTH + 10 + Math.abs(car.v) * 0.25;
  const i = atDist(look);
  const g = grip(r.life);
  const m = r.p * LENGTH;
  // Mistakes: rolled once per braking zone, likelier on worn tyres. A mistake drives into the
  // corner on grip the car doesn't have and no margin, so it runs wide or cuts.
  const k = CORNERS.findIndex((c) => fwd(c.turnIn - 250, m) < 50);
  if (k >= 0 && r.rolled !== k) {
    r.rolled = k;
    r.mistake = race.slips && race.rand() < 0.06 + 0.08 * (1 - r.life) ? k : -1;
  }
  if (r.mistake >= 0 && fwd(CORNERS[r.mistake]!.at, m) < 200) r.mistake = -1;
  let want = r.mistake >= 0 ? limitAt(atDist(m + 5), g * 1.08) : r.pace * limitAt(atDist(m + 5), g);
  if (r.finish !== null) want *= 0.8;

  const ahead = (lane: number, from: number) =>
    race.racers.find((o) => {
      const ds = o.dist - r.dist;
      return (
        o !== r && ds > from && ds < 30 && Math.abs(lateral(o.car.x, o.car.y, o.p) - lane) < 2.5
      );
    });
  if (r.pitting) {
    // Into the lane: slow for the limiter, and behind anyone in the way rather than through them.
    want = Math.min(want, Math.sqrt(PIT_V ** 2 + 2 * 8 * Math.max(0, PIT_IN + 40 - s)));
    const block = ahead(lateral(car.x, car.y, r.p), 0);
    if (block && block.car.v < car.v) want = Math.min(want, block.car.v);
  } else {
    const room = HALF[i]! - 1.5;
    const block = ahead(r.lane, 0);
    if (block && block.car.v < car.v + 1) {
      const free = [3, -3, 0]
        .map((l) => Math.max(-room, Math.min(room, l)))
        .find((l) => !ahead(l, -8));
      if (free !== undefined && race.t > r.laneT) [r.lane, r.laneT] = [free, race.t + 2000];
      else want = Math.min(want, block.car.v);
    } else if (r.lane && race.t > r.laneT && !ahead(0, -10)) r.lane = 0;
    r.lane = Math.max(-room, Math.min(room, r.lane));
  }

  const [tx, ty] = pointAt(look, r.pitting ? pitOffset(i) : r.lane);
  let diff = Math.atan2(ty - car.y, tx - car.x) - car.h;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const over = car.v > want;
  return {
    gas: !over,
    brake: over && car.v > want + 1,
    steer: Math.max(-1, Math.min(1, diff * 4)),
  };
}

// The limiter in the lane and the stop at the box, for any car.
function pitStop(r: Racer, dt: number) {
  const { car } = r;
  if (r.stop > 0) {
    car.v = 0;
    r.stop -= dt;
    if (r.stop <= 0) [r.life, r.served, r.boxCall] = [1, true, false];
    return;
  }
  if (!r.pit) {
    r.served = false;
    return;
  }
  if (car.v > PIT_V) car.v = Math.max(PIT_V, car.v - 40 * dt);
  const d = BOXES[r.team]!.s - signed(r.p);
  if (r.served || d < 0 || d > 30) return;
  car.v = Math.min(car.v, Math.sqrt(2 * BOX_BRAKE * d));
  if (d < 1) [car.v, r.stop] = [0, STOP];
}

const CP = LENGTH / 50;

const say = (race: Race, kind: Msg["kind"], team: number, text: string) =>
  race.msgs.push({ kind, team, text });

// One more excursion: the lap's deleted (lapTick does that), the third brings the black and
// white flag, and every one after that costs time, 5 s and then 10 s each, like F1.
function strike(race: Race, r: Racer) {
  const who = TEAMS[r.team]!.code;
  r.strikes++;
  say(
    race,
    "limits",
    r.team,
    `Track limits · ${who} · ${cornerAt(r.p)} · Lap ${r.laps + 1} time deleted`,
  );
  if (r.strikes === 3) say(race, "flag", r.team, `Black and white flag · ${who} · Track limits`);
  if (r.strikes < 4) return;
  const add = r.strikes === 4 ? 5000 : 10000;
  r.penalty += add;
  say(race, "penalty", r.team, `${add / 1000} s time penalty · ${who} · Track limits`);
}

// DRS: eligible within a second of whoever last crossed the detection line, from lap 2. It
// opens in the zone and shuts for good on the brakes or at the end of the zone.
function drs(race: Race, r: Racer, from: number, to: number, brake: boolean) {
  DRS_ZONES.forEach((z, k) => {
    if (fwd(from, z.detect) > fwd(from, to) || fwd(from, to) > 50) return;
    if (r.laps >= 1 && race.t - race.crossed[k]! < 1000) [r.drs, r.drsZone] = ["eligible", k];
    race.crossed[k] = race.t;
  });
  if (!r.drs) return;
  if (brake) r.drs = null;
  else if (inZone(to, DRS_ZONES[r.drsZone]!)) r.drs = "open";
  else if (r.drs === "open") r.drs = null;
}

// One frame for every car. `you` is the player's input, or null to hold them (before the lights).
// Returns the player's split, if this frame made one.
export function tick(race: Race, you: Input, dt: number): Split | null {
  race.t += dt * 1000;
  let mine: Split | null = null;
  for (const r of race.racers) {
    const { car } = r;
    const { edge: e, p } = nearest(car.x, car.y);
    // Progress only counts small steps, so a jump to another part of the lap doesn't.
    let dp = p - r.p;
    dp -= Math.round(dp);
    if (Math.abs(dp) < 0.02) r.dist += dp * LENGTH;
    const from = r.p * LENGTH;
    r.p = p;
    r.pit = inPit(car.x, car.y, p);
    const edge = r.pit ? -1 : e;
    const s = signed(p);
    if (r.pitLap && r.laps === r.pitLap - 1 && s > PIT_IN - 200 && s < PIT_IN) r.pitting = true;
    if (s > PIT_OUT || s < PIT_IN - 200) r.pitting = false;

    const input = r.team === 0 ? you : aiInput(r, race);
    if (Math.abs(dp) < 0.02 && dp > 0) drs(race, r, from, p * LENGTH, input.brake);
    else if (input.brake) r.drs = null;
    // Sliding: steering harder than the grip allows while too fast for the corner, i.e. running
    // wide. Keyboard steering is all or nothing, so asking for too much alone doesn't count.
    const top = r.drs === "open" ? DRS_TOP : undefined;
    const capped = step(car, input, dt, onGrass(edge), grip(r.life), top);
    const slid = capped && car.v > limitAt(atDist(p * LENGTH), grip(r.life)) + 1;
    pitStop(r, dt);
    collide(car);
    const v = Math.abs(car.v);
    r.life = Math.max(
      0,
      r.life - dt * (v * WEAR + (slid ? SLIDE : 0) + (onGrass(edge) ? GRASS * v : 0)),
    );
    r.wrong = Math.cos(car.h - dirAt(p)) < -0.5 && car.v > 4.2 ? r.wrong + dt : 0;
    // Track limits, once per trip off. The pit entry on the right doesn't count, nor being
    // pushed off: contact in the last second excuses it.
    const entry = s > PIT_IN && s < PIT_OUT && lateral(car.x, car.y, p) > 0;
    const off = allFourOff(edge) && !entry && r.finish === null;
    if (off && !r.off && race.t - r.touchT > 1000) strike(race, r);
    r.off = off;
    if (r.team === 0 && r.life < 0.3 && !r.boxCall && r.finish === null) {
      r.boxCall = true;
      say(race, "radio", 0, "Box, box. Tyres are gone.");
    }

    const split = lapTick(r.lap, p, edge, race.t);
    if (split?.lap) {
      r.laps++;
      if (split.valid && (!r.best || split.lap < r.best)) r.best = split.lap;
      if (split.valid && (!race.fastest || split.lap < race.fastest.ms)) {
        race.fastest = { team: r.team, ms: split.lap };
        say(race, "fastest", r.team, `Fastest lap · ${TEAMS[r.team]!.code} · ${fmt(split.lap)}`);
      }
      if (r.team === 0 && r.laps === LAPS - 1) say(race, "radio", 0, "Last lap. Bring it home.");
      const leaderDone = race.racers.some((o) => o.finish !== null);
      if (r.finish === null && (r.laps >= LAPS || leaderDone)) r.finish = race.t;
    }
    if (r.team === 0) mine = split;
    const cp = Math.floor(r.dist / CP);
    if (cp > r.cp && r.finish === null) {
      [r.cp, r.cpT] = [cp, race.t];
      race.cps[cp] ??= race.t;
    }
  }
  const rs = race.racers;
  for (let a = 0; a < rs.length; a++)
    for (let b = a + 1; b < rs.length; b++)
      if (bump(rs[a]!.car, rs[b]!.car)) rs[a]!.touchT = rs[b]!.touchT = race.t;
  if (rs.some((r) => r.team === 0 && r.finish !== null)) race.done = true;
  return mine;
}

export const wrongWay = (r: Racer) => r.wrong > 1;

// Running order: finishers by time, then everyone else by distance.
export const order = (race: Race) =>
  race.racers
    .slice()
    .sort((a, b) =>
      a.finish !== null || b.finish !== null
        ? (a.finish ?? Infinity) - (b.finish ?? Infinity)
        : b.dist - a.dist,
    );
// Seconds behind the leader, from when each passed the same checkpoint.
export const gap = (race: Race, r: Racer) => (r.cp < 0 ? 0 : (r.cpT - race.cps[r.cp]!) / 1000);

// Final classification when you take the flag. Cars still out get the time they'd take for the
// rest of the race at their average speed so far, and lapped cars are shown a lap down.
// ponytail: estimated, not raced out, so the card can show the moment you finish.
export function results(race: Race) {
  const total = LAPS * LENGTH;
  return race.racers
    .map((r) => {
      const run = r.finish ?? race.t + (total - r.dist) / (Math.max(r.dist, 1) / race.t);
      const time = run + r.penalty;
      const down = r.finish !== null && r.laps < LAPS ? LAPS - r.laps : 0;
      return { team: r.team, time, down, best: r.best, penalty: r.penalty };
    })
    .sort((a, b) => a.down - b.down || a.time - b.time);
}
