// The race the drive runs: twenty cars, five laps, tyres that wear and a pit stop to change them.
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
  RACING,
  WORK,
  pointAt,
  signed,
  step,
  type Car,
  type Input,
  type Lap,
  type Split,
} from "./track.ts";

// Race distances to pick from; the tyres and the paces are tuned on the shortest.
export const DISTANCES = [5, 10, 15, 20];

// Difficulty is mostly the other drivers: a level sets how far from the centreline (0) to the
// racing line (1) the computer drives, the share of its grip its quickest and slowest drivers
// dare use (so they brake earlier and corner slower, but run flat out on the straights), and
// how often it overcooks a corner. Pro cars also get EDGE more grip: on the best line at the
// limit the computer still laps about 1.5 s off a clean human, so that closes it.
// The field is ten two-car teams. Driver 0 is you, in the car's own livery, and driver 1 your
// teammate, the best driver whose team didn't make the top nine; then that series' top nine teams
// in championship order, each driver above their teammate. Standings as of 17 Oct 2026; F3
// teams run three cars, so their best two. ponytail: colours are near each team's, by eye, and
// the paces are tuned in race.check.ts. Refresh the rosters when the seasons turn over.
export type Level = "amateur" | "intermediate" | "pro";
// ponytail: tuned in race.check.ts so pro's winner finishes in about 7:30, the time a clean
// race from the player beats by a few seconds, and the field laps 1:26 to 1:29.
const EDGE = 1.1;
// A car's grip on its tyres: a computer car's scaled by its level's edge (1 but for pro).
export const carGrip = (race: Race, r: Racer) =>
  grip(r.life, r.tyre) * (r.id ? LEVELS[race.level].edge : 1);
type Seat = [code: string, name: string];
type Team = [color: string, a: Seat, b: Seat];
const level = (
  series: string,
  line: number,
  pace: [fast: number, slow: number],
  slip: number,
  edge: number,
  mate: Seat,
  teams: Team[],
) => {
  const all: Team[] = [["", ["HAR", "You"], mate], ...teams];
  return {
    series,
    line,
    pace,
    slip,
    edge,
    colors: all.map(([c]) => c),
    drivers: all.flatMap(([, a, b]) => [a, b]).map(([code, name]) => ({ code, name })),
  };
};
export const LEVELS: Record<Level, ReturnType<typeof level>> = {
  amateur: level(
    "F3",
    0,
    [0.77, 0.71],
    0.1,
    1,
    ["RIV", "Ernesto Rivera"],
    [
      ["#ff6b1a", ["UGO", "Ugo Ugochukwu"], ["NAE", "Théophile Naël"]],
      ["#1d3b8a", ["SLA", "Freddie Slater"], ["STR", "Noah Strømsted"]],
      ["#f2c230", ["TAP", "Tuukka Taponen"], ["COL", "Mattia Colnaghi"]],
      ["#f2f2ef", ["KAT", "Taito Kato"], ["GLA", "Maciej Gładysz"]],
      ["#f070b2", ["YAM", "Hiyu Yamakoshi"], ["DEL", "Bruno del Pino"]],
      ["#0d5c3a", ["CLE", "Pedro Clerot"], ["BAD", "Brando Badoer"]],
      ["#b0122b", ["WHA", "James Wharton"], ["SHA", "Louis Sharp"]],
      ["#b9bec4", ["NAK", "Jin Nakamura"], ["MCL", "Fionn McLaughlin"]],
      ["#2f6df0", ["LAC", "Nicola Lacorte"], ["XIE", "Gerrard Xie"]],
    ],
  ),
  intermediate: level(
    "F2",
    0.5,
    [0.89, 0.83],
    0.06,
    1,
    ["MON", "Sebastián Montoya"],
    [
      ["#ff6b1a", ["TSO", "Nikola Tsolov"], ["LEO", "Noel León"]],
      ["#c8a24a", ["CAM", "Rafael Câmara"], ["DUR", "Joshua Dürksen"]],
      ["#0d5c3a", ["DUN", "Alex Dunne"], ["STE", "Martinius Stenshorne"]],
      ["#f2c230", ["MIN", "Gabriele Minì"], ["GOE", "Oliver Goethe"]],
      ["#2f6df0", ["BEG", "Dino Beganovic"], ["BIL", "Roman Bilinski"]],
      ["#f2f2ef", ["MAI", "Kush Maini"], ["INT", "Tasanapol Inthraphuvasak"]],
      ["#1d3b8a", ["HOE", "Laurens van Hoepen"], ["BEN", "John Bennett"]],
      ["#b9bec4", ["MIY", "Ritomo Miyata"], ["HER", "Colton Herta"]],
      ["#f070b2", ["VIL", "Rafael Villagómez"], ["YAM", "Hiyu Yamakoshi"]],
    ],
  ),
  pro: level(
    "F1",
    1,
    [0.98, 0.93],
    0.02,
    EDGE,
    ["ALO", "Fernando Alonso"],
    [
      ["#27f4d2", ["ANT", "Kimi Antonelli"], ["RUS", "George Russell"]],
      ["#a6051a", ["HAM", "Lewis Hamilton"], ["LEC", "Charles Leclerc"]],
      ["#ff8000", ["NOR", "Lando Norris"], ["PIA", "Oscar Piastri"]],
      ["#1e41ff", ["VER", "Max Verstappen"], ["HAD", "Isack Hadjar"]],
      ["#6692ff", ["LAW", "Liam Lawson"], ["LIN", "Arvid Lindblad"]],
      ["#ff87bc", ["GAS", "Pierre Gasly"], ["COL", "Franco Colapinto"]],
      ["#b6babd", ["BEA", "Oliver Bearman"], ["OCO", "Esteban Ocon"]],
      ["#4a4f55", ["HUL", "Nico Hülkenberg"], ["BOR", "Gabriel Bortoleto"]],
      ["#64c4ff", ["SAI", "Carlos Sainz"], ["ALB", "Alexander Albon"]],
    ],
  ),
};
export const CARS = 20;
export const driver = (race: Race, id: number) => LEVELS[race.level].drivers[id]!;
// A car's colour: its team's, or "" for yours.
export const colorOf = (race: Race, id: number) => LEVELS[race.level].colors[id >> 1]!;

// Your hero reaction time picks the slot: up to 0.250 s is pole, then one back per 30 ms. The hero
// times from the press to the painted lights-out, so these are real reactions.
export const gridSlot = (ms: number) => Math.min(CARS - 1, Math.max(0, Math.ceil((ms - 250) / 30)));
const gridAt = (slot: number) => -10 - 8 * slot;

// Tyres: life runs from 1 (new) to 0, and grip falls away faster as they go, to 1 - FADE when
// they're finished. Distance wears them, and only all four wheels on the grass wears them faster;
// sliding and a wheel or two off cost nothing extra. A medium nearly lasts the race; a compound
// scales its grip and how fast it wears. ponytail: tuned in race.check.ts so a medium reaches lap
// 4 before the call, and with tyres this long-lived a no-stop is the quick way round, the stops
// within about 10 s of it. These are the knobs.
const WEAR = 1 / 36000;
const GRASS = 1 / 2000;
const FADE = 0.45;
export type Tyre = "soft" | "medium" | "hard";
export const TYRES: Record<Tyre, { grip: number; wear: number; name: string }> = {
  soft: { grip: 1.04, wear: 1.5, name: "Softs" },
  medium: { grip: 1, wear: 1, name: "Mediums" },
  hard: { grip: 0.92, wear: 0.6, name: "Hards" },
};
export const grip = (life: number, tyre: Tyre) => TYRES[tyre].grip * (1 - FADE * (1 - life) ** 2);
// Laps a set lasts before it's too far gone (about 0.15 of its life left).
export const STINT: Record<Tyre, number> = { soft: 3, medium: 5, hard: 9 };
const COMPOUNDS: Tyre[] = ["soft", "medium", "hard"];
// The team fits the softest set that reaches the flag, given the full laps left after this one,
// or mediums when nothing will and there's another stop to come.
export const teamPick = (left: number): Tyre => COMPOUNDS.find((t) => STINT[t] > left) ?? "medium";
// A computer car's race: the fewest stops its hards allow, sometimes one more, the laps split
// into near-even stints, each on the softest set that lasts it or the next one harder. Returns
// the laps it stops at the end of and the set for each stint.
function plan(laps: number, rand: () => number) {
  const stops = Math.ceil(laps / STINT.hard) - 1 + (rand() < 0.4 ? 1 : 0);
  const at: number[] = [];
  for (let k = 1; k <= stops; k++) at.push(Math.round((laps * k) / (stops + 1) + (rand() - 0.5)));
  const tyres = [0, ...at, laps].slice(1).map((end, k, ends) => {
    const fits = COMPOUNDS.filter((t) => STINT[t] >= end - (ends[k - 1] ?? 0));
    return fits[rand() < 0.5 || fits.length < 2 ? 0 : 1]!;
  });
  return { at, tyres };
}

// DRS adds about 15 km/h to the top speed.
const DRS_TOP = TOP + 4.2;

// The pit limiter and the stop at the box. ponytail: 120 km/h, not F1's 80, so a stop costs
// little enough to be worth making in five laps.
export const PIT_V = 120 / 3.6;
export const STOP = 2.5;
const BOX_BRAKE = 12;

export type Racer = {
  // Driver index into the level's roster: 0 is you, and id >> 1 is the team (and its box).
  id: number;
  car: Car;
  lap: Lap;
  // Laps completed, race distance in metres (negative on the grid), and the best clean lap.
  laps: number;
  dist: number;
  p: number;
  best: number;
  life: number;
  // The compound on the car, the one going on at the stop (null until the team picks), and
  // every set run so far, for the results.
  tyre: Tyre;
  fit: Tyre | null;
  stints: Tyre[];
  // Seconds left at the box, whether this visit's stop is done, and whether in the lane now.
  stop: number;
  served: boolean;
  pit: boolean;
  // Computer cars (and you, while the team drives you down the pit lane): share of the corner
  // limit they drive to, the laps they stop at the end of and the set for each stint, whether on
  // the way in, when they react to the lights, and how far off their line they are to overtake,
  // held until laneT (race ms) so they don't weave.
  pace: number;
  stops: number[];
  plan: Tyre[];
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
  id: number;
  text: string;
};

export type Race = {
  level: Level;
  laps: number;
  racers: Racer[];
  // Milliseconds since the lights went out, and the first car's time at each checkpoint.
  t: number;
  cps: number[];
  jump: boolean;
  done: boolean;
  msgs: Msg[];
  fastest: { id: number; ms: number } | null;
  // When any car last crossed each DRS detection line.
  crossed: number[];
  // Whether computer cars make mistakes (off for the strategy check), and the dice.
  slips: boolean;
  rand: () => number;
};

export function newRace(
  slot: number,
  rand = Math.random,
  tyre: Tyre = "medium",
  lv: Level = "intermediate",
  laps = DISTANCES[0]!,
): Race {
  // Computer paces spread across the level's range in roster order, your teammate the slowest,
  // and the quickest line up at the front in the slots you didn't take.
  const { pace } = LEVELS[lv];
  const ai = [...Array(CARS).keys()].slice(2).concat(1);
  const slots = [...Array(CARS).keys()].filter((s) => s !== slot);
  const racers = [...Array(CARS).keys()].map((id): Racer => {
    const order = ai.indexOf(id);
    const strat = id ? plan(laps, rand) : { at: [], tyres: [tyre] };
    const s = id === 0 ? slot : slots[order]!;
    const m = gridAt(s);
    const [x, y] = pointAt(m, (s % 2 ? 1 : -1) * (HALF[atDist(m)]! / 2.5));
    const on = strat.tyres[0]!;
    return {
      id,
      car: { x, y, h: dirAt((m + LENGTH) / LENGTH), v: 0 },
      lap: newLap(),
      laps: 0,
      dist: m,
      p: (m + LENGTH) / LENGTH,
      best: 0,
      life: 1,
      tyre: on,
      fit: null,
      stints: [on],
      stop: 0,
      served: false,
      pit: false,
      pace: id === 0 ? pace[0] : pace[0] - ((pace[0] - pace[1]) * order) / (CARS - 2),
      stops: strat.at,
      plan: strat.tyres,
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
    level: lv,
    laps,
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

// A computer driver: aims down its line (between the centreline and the racing line, by level),
// brakes to its share of the corner limit, pulls out to pass a slower car ahead, and on its stop
// lap follows the pit lane, turning into its box and back out.
export function aiInput(r: Racer, race: Race): Input {
  const { car } = r;
  if (race.t < r.launch) return { gas: false, brake: false, steer: 0 };
  const s = signed(r.p);
  const look = r.p * LENGTH + 10 + Math.abs(car.v) * 0.25;
  const i = atDist(look);
  const g = carGrip(race, r);
  const m = r.p * LENGTH;
  const { line, slip } = LEVELS[race.level];
  // Mistakes: rolled once per braking zone, likelier on worn tyres. A mistake drives into the
  // corner on grip the car doesn't have and no margin, so it runs wide or cuts.
  const k = CORNERS.findIndex((c) => fwd(c.turnIn - 250, m) < 50);
  if (k >= 0 && r.rolled !== k) {
    r.rolled = k;
    r.mistake = race.slips && race.rand() < slip + 0.08 * (1 - r.life) ? k : -1;
  }
  if (r.mistake >= 0 && fwd(CORNERS[r.mistake]!.at, m) < 200) r.mistake = -1;
  const at = atDist(m + 5);
  let want = limitAt(at, g * (r.mistake >= 0 ? 1.08 : r.pace), line);
  if (r.finish !== null) want *= 0.8;

  const ahead = (lane: number, from: number) =>
    race.racers.find((o) => {
      const ds = o.dist - r.dist;
      return (
        o !== r && ds > from && ds < 30 && Math.abs(lateral(o.car.x, o.car.y, o.p) - lane) < 2.5
      );
    });
  // Lanes are offsets from the line, kept on the tarmac.
  const room = HALF[i]! - 1.5;
  const base = line * RACING[i]!;
  const lat = (l: number) => Math.max(-room, Math.min(room, base + l));
  let to: number;
  if (r.pitting) {
    // Into the lane: slow for the limiter, and stop short of anyone in the way rather than go
    // through them. Along the boxes, turn into the working lane for its own box and back out
    // after the stop.
    want = Math.min(want, Math.sqrt(PIT_V ** 2 + 2 * 8 * Math.max(0, PIT_IN + 40 - s)));
    const block = ahead(lateral(car.x, car.y, r.p), 0);
    if (block && block.car.v < car.v)
      want = Math.min(want, block.car.v + Math.sqrt(16 * Math.max(0, block.dist - r.dist - 7)));
    const box = BOXES[r.id >> 1]!.s;
    // In once past the box before, so a car waiting for its teammate's stop is out of the fast
    // lane; out within 6 m.
    const k = r.served ? 1 - (s - box) / 6 : (s - box + 21) / 10;
    to = pitOffset(i) + WORK * Math.max(0, Math.min(1, k));
    // No unsafe release: at the box until nothing's coming down the fast lane from 20 m back.
    const fast = (o: Racer) => Math.abs(lateral(o.car.x, o.car.y, o.p) - pitOffset(i)) < 2.5;
    const traffic = race.racers.some(
      (o) =>
        o !== r && o.pit && o.car.v > 2 && fast(o) && o.dist - r.dist > -20 && o.dist - r.dist < 4,
    );
    if (r.served && s - box < 3 && traffic) want = 0;
  } else {
    const block = ahead(lat(r.lane), 0);
    if (block && block.car.v < car.v + 1) {
      const free = [3, -3, 0].find((l) => !ahead(lat(l), -8));
      if (free !== undefined && race.t > r.laneT) [r.lane, r.laneT] = [free, race.t + 2000];
      else want = Math.min(want, block.car.v);
    } else if (r.lane && race.t > r.laneT && !ahead(lat(0), -10)) r.lane = 0;
    to = lat(r.lane);
  }
  // Don't turn into a car alongside: hold the line until one of you is clear. Two cars
  // swapping sides would otherwise lean on each other down to a crawl. A car heading for the pit
  // entry has the line over any car it leads, or one tucked in on its right shuts it out.
  const now = lateral(car.x, car.y, r.p);
  const beside = race.racers.some((o) => {
    const d = lateral(o.car.x, o.car.y, o.p) - now;
    const gap = o.dist - r.dist;
    return (
      o !== r &&
      Math.abs(gap) < 6 &&
      !(r.pitting && gap < 0) &&
      d * (to - now) > 0 &&
      Math.abs(d) < 3
    );
  });
  if (beside) to = now;

  const [tx, ty] = pointAt(look, to);
  let diff = Math.atan2(ty - car.y, tx - car.x) - car.h;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const over = car.v > want;
  return {
    gas: !over,
    brake: over && car.v > want + 1,
    steer: Math.max(-1, Math.min(1, diff * 4)),
  };
}

// The limiter in the lane and the stop at the box, for any car. Teammates share a box, so one
// that gets there second waits 8 m short of it until the first has gone (a double stack).
function pitStop(race: Race, r: Racer, dt: number) {
  const { car } = r;
  if (r.stop > 0) {
    car.v = 0;
    r.stop -= dt;
    if (r.stop <= 0) {
      [r.life, r.served, r.boxCall] = [1, true, false];
      [r.tyre, r.fit] = [r.fit ?? teamPick(race.laps - r.laps - 1), null];
      r.stints.push(r.tyre);
    }
    return;
  }
  if (!r.pit) {
    r.served = false;
    return;
  }
  if (car.v > PIT_V) car.v = Math.max(PIT_V, car.v - 40 * dt);
  const box = BOXES[r.id >> 1]!.s;
  const d = box - signed(r.p);
  if (r.served || d < 0 || d > 30) return;
  const mate = race.racers.find((o) => o.id === (r.id ^ 1));
  const md = mate && box - signed(mate.p);
  const wait = mate?.pit && !mate.served && (mate.stop > 0 || (md! >= 0 && md! < d));
  const to = wait ? d - 8 : d;
  car.v = Math.min(car.v, Math.sqrt(2 * BOX_BRAKE * Math.max(0, to)));
  if (to < 1) car.v = 0;
  if (!wait && d < 1) r.stop = STOP;
}

const CP = LENGTH / 50;

const say = (race: Race, kind: Msg["kind"], id: number, text: string) =>
  race.msgs.push({ kind, id, text });

// One more excursion: the lap's deleted (lapTick does that), the third brings the black and
// white flag, and every one after that costs time, 5 s and then 10 s each, like F1.
function strike(race: Race, r: Racer) {
  const who = driver(race, r.id).code;
  r.strikes++;
  say(
    race,
    "limits",
    r.id,
    `Track limits · ${who} · ${cornerAt(r.p)} · Lap ${r.laps + 1} time deleted`,
  );
  if (r.strikes === 3) say(race, "flag", r.id, `Black and white flag · ${who} · Track limits`);
  if (r.strikes < 4) return;
  const add = r.strikes === 4 ? 5000 : 10000;
  r.penalty += add;
  say(race, "penalty", r.id, `${add / 1000} s time penalty · ${who} · Track limits`);
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
    // A computer car heads in at the end of a lap it planned to stop on, with that stint's set.
    const due = r.stops.indexOf(r.laps + 1);
    if (r.id && due >= 0 && s > PIT_IN - 200 && s < PIT_IN && !r.pitting) {
      r.pitting = true;
      r.fit = r.plan[due + 1] ?? null;
    }
    if (s > PIT_OUT || s < PIT_IN - 200) r.pitting = false;

    // Anyone in the lane drives it to the box and back out: you, when the team takes over, and a
    // computer car that strays in off the Parabolica.
    if (r.pit && r.finish === null) r.pitting = true;
    const input = r.id === 0 && !r.pitting ? you : aiInput(r, race);
    if (Math.abs(dp) < 0.02 && dp > 0) drs(race, r, from, p * LENGTH, input.brake);
    else if (input.brake) r.drs = null;
    const top = r.drs === "open" ? DRS_TOP : undefined;
    const g = carGrip(race, r);
    step(car, input, dt, onGrass(edge), g, top);
    pitStop(race, r, dt);
    collide(car);
    const v = Math.abs(car.v);
    r.life = Math.max(
      0,
      r.life - dt * TYRES[r.tyre].wear * v * (WEAR + (allFourOff(edge) ? GRASS : 0)),
    );
    r.wrong = Math.cos(car.h - dirAt(p)) < -0.5 && car.v > 4.2 ? r.wrong + dt : 0;
    // Track limits, once per trip off. The pit entry on the right doesn't count, nor being
    // pushed off: contact in the last second excuses it.
    const entry = s > PIT_IN && s < PIT_OUT && lateral(car.x, car.y, p) > 0;
    const off = allFourOff(edge) && !entry && r.finish === null;
    if (off && !r.off && race.t - r.touchT > 1000) strike(race, r);
    r.off = off;
    if (r.id === 0 && r.life < 0.3 && !r.boxCall && r.finish === null) {
      r.boxCall = true;
      r.fit ??= teamPick(race.laps - r.laps - 1);
      say(race, "radio", 0, `Box, box. ${TYRES[r.fit].name} ready.`);
    }
    // Into the lane without the call: the team still has a set out.
    if (r.id === 0 && r.pit && !r.served && r.fit === null) {
      r.fit = teamPick(race.laps - r.laps - 1);
      say(race, "radio", 0, `${TYRES[r.fit].name} ready.`);
    }

    const split = lapTick(r.lap, p, edge, race.t);
    if (split?.lap) {
      r.laps++;
      if (split.valid && (!r.best || split.lap < r.best)) r.best = split.lap;
      if (split.valid && (!race.fastest || split.lap < race.fastest.ms)) {
        race.fastest = { id: r.id, ms: split.lap };
        say(race, "fastest", r.id, `Fastest lap · ${driver(race, r.id).code} · ${fmt(split.lap)}`);
      }
      if (r.id === 0 && r.laps === race.laps - 1) say(race, "radio", 0, "Last lap. Bring it home.");
      const leaderDone = race.racers.some((o) => o.finish !== null);
      if (r.finish === null && (r.laps >= race.laps || leaderDone)) r.finish = race.t;
    }
    if (r.id === 0) mine = split;
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
  if (rs.some((r) => r.id === 0 && r.finish !== null)) race.done = true;
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
  const total = race.laps * LENGTH;
  return race.racers
    .map((r) => {
      const run = r.finish ?? race.t + (total - r.dist) / (Math.max(r.dist, 1) / race.t);
      const time = run + r.penalty;
      const down = r.finish !== null && r.laps < race.laps ? race.laps - r.laps : 0;
      const { id, best, penalty, stints } = r;
      return { id, time, down, best, penalty, stints, stops: stints.length - 1 };
    })
    .sort((a, b) => a.down - b.down || a.time - b.time);
}
