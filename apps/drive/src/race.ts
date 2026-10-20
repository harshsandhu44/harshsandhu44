// The race the drive runs: twenty cars, five laps, tyres that wear and a pit stop to change them.
// Plain maths like track.ts, so race.check.ts can run whole races headless.
import {
  TOP,
  WORK,
  allFourOff,
  brakeAt,
  bump,
  fmt,
  lapTick,
  newLap,
  onGrass,
  step,
  type Car,
  type Input,
  type Lap,
  type Split,
  type Track,
} from "./track.ts";

// Race distances to pick from; the tyres and the paces are tuned on the shortest.
export const DISTANCES = [5, 10, 15, 20];

// Difficulty is mostly the other drivers: a level sets how far from the centreline (0) to the
// racing line (1) the computer drives, the share of its grip its quickest and slowest drivers
// dare use (so they brake earlier and corner slower, but run flat out on the straights), and
// how often it overcooks a corner (never, for legends). Pro cars also get EDGE more grip: on the
// best line at the limit the computer laps well off a clean human, so that closes it.
// The field is eleven two-car teams. Driver 0 is you, in the car's own livery, and driver 1 your
// teammate, the best driver whose team didn't make the top ten; then that series' top ten teams
// in championship order, each driver above their teammate. Standings as of 19 Oct 2026; F3
// teams run three cars, so their best two. ponytail: colours are near each team's, by eye.
// Refresh the rosters when the seasons turn over.
// Each driver has a pace and an awareness rating, 0-99. Within a level the best pace drives at
// the level's fast share of the limit and the worst at its slow one, and awareness sets how
// often each overcooks a corner around the level's rate. F1's are EA's F1 25 ratings (2026
// Season Pack); EA rates no F2 or F3 drivers, so theirs are 100 less their championship place.
// Legends is the world champions: every multiple champion, plus Mansell, Hunt, Rosberg and
// Räikkönen, at the team each is best known for. Their pace is their best season in
// f1-analysis.com's model as a share of the best anyone had managed by then, as its scores grow
// with the era. They never make a mistake, and their winner beats a clean race from you by a
// second or two.
export type Level = "amateur" | "intermediate" | "pro" | "legends";
// ponytail: tuned in race.check.ts so pro's pole at Monza is about 1:20.5, a clean qualifying
// lap from the player.
const EDGE = 1.33;
const LEGEND_EDGE = 1.4;
// How far under its limit (m/s) a legend has to be to pull out and pass.
const PASS = 15;
// A computer car's extra grip: its level's edge (1 below pro), or the track's own for pro and
// legends.
export const edgeOf = ({ level: lv, track }: Race) =>
  (lv === "pro" ? track.PRO_EDGE : lv === "legends" ? track.LEGENDS_EDGE : undefined) ??
  LEVELS[lv].edge;
// A car's grip on its tyres: a computer car's scaled by its edge.
// Close behind another car its dirty air takes some of that.
export const carGrip = (race: Race, r: Racer) =>
  grip(r.life, r.tyre) * (r.id ? edgeOf(race) : 1) * (1 - r.dirty);
// Awareness defaults to pace, for the levels that rate only by championship place.
type Seat = [code: string, name: string, pace: number, aware?: number];
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
  const all: Team[] = [["", ["HAR", "You", 0], mate], ...teams];
  return {
    series,
    line,
    pace,
    slip,
    edge,
    colors: all.map(([c]) => c),
    drivers: all
      .flatMap(([, a, b]) => [a, b])
      .map(([code, name, pace, aware = pace]) => ({ code, name, pace, aware })),
  };
};
export const LEVELS: Record<Level, ReturnType<typeof level>> = {
  // ponytail: McLaughlin, Sharp, Xie and Barrichello finished below 20th; their order there is
  // by eye.
  amateur: level(
    "F3",
    0,
    [0.77, 0.71],
    0.1,
    1,
    ["RIV", "Ernesto Rivera", 93],
    [
      ["#ff6b1a", ["UGO", "Ugo Ugochukwu", 99], ["NAE", "Théophile Naël", 95]],
      ["#1d3b8a", ["SLA", "Freddie Slater", 98], ["STR", "Noah Strømsted", 90]],
      ["#f2c230", ["TAP", "Tuukka Taponen", 97], ["COL", "Mattia Colnaghi", 87]],
      ["#f2f2ef", ["KAT", "Taito Kato", 96], ["GLA", "Maciej Gładysz", 88]],
      ["#f070b2", ["YAM", "Hiyu Yamakoshi", 91], ["DEL", "Bruno del Pino", 89]],
      ["#0d5c3a", ["CLE", "Pedro Clerot", 94], ["BAD", "Brando Badoer", 92]],
      ["#b0122b", ["WHA", "James Wharton", 83], ["SHA", "Louis Sharp", 78]],
      ["#b9bec4", ["NAK", "Jin Nakamura", 86], ["MCL", "Fionn McLaughlin", 79]],
      ["#2f6df0", ["LAC", "Nicola Lacorte", 81], ["XIE", "Gerrard Xie", 77]],
      ["#7a2bd6", ["DAV", "Yevan David", 82], ["BAR", "Fernando Barrichello", 76]],
    ],
  ),
  intermediate: level(
    "F2",
    0.5,
    [0.89, 0.83],
    0.06,
    1,
    ["FIT", "Emerson Fittipaldi Jr.", 82],
    [
      ["#ff6b1a", ["TSO", "Nikola Tsolov", 98], ["LEO", "Noel León", 94]],
      ["#c8a24a", ["CAM", "Rafael Câmara", 99], ["DUR", "Joshua Dürksen", 92]],
      ["#0d5c3a", ["DUN", "Alex Dunne", 97], ["STE", "Martinius Stenshorne", 93]],
      ["#f2c230", ["MIN", "Gabriele Minì", 96], ["GOE", "Oliver Goethe", 85]],
      ["#2f6df0", ["BEG", "Dino Beganovic", 95], ["BIL", "Roman Bilinski", 84]],
      ["#f2f2ef", ["MAI", "Kush Maini", 91], ["INT", "Tasanapol Inthraphuvasak", 89]],
      ["#1d3b8a", ["HOE", "Laurens van Hoepen", 90], ["BEN", "John Bennett", 86]],
      ["#b9bec4", ["MIY", "Ritomo Miyata", 88], ["HER", "Colton Herta", 81]],
      ["#f070b2", ["VIL", "Rafael Villagómez", 87], ["YAM", "Hiyu Yamakoshi", 77]],
      ["#b0122b", ["MON", "Sebastián Montoya", 83], ["BOY", "Mari Boya", 80]],
    ],
  ),
  pro: level(
    "F1",
    1,
    [0.98, 0.93],
    0.02,
    EDGE,
    ["PER", "Sergio Pérez", 85, 81],
    [
      ["#27f4d2", ["ANT", "Kimi Antonelli", 93, 77], ["RUS", "George Russell", 92, 93]],
      ["#a6051a", ["HAM", "Lewis Hamilton", 90, 91], ["LEC", "Charles Leclerc", 93, 91]],
      ["#ff8000", ["NOR", "Lando Norris", 94, 85], ["PIA", "Oscar Piastri", 91, 84]],
      ["#1e41ff", ["VER", "Max Verstappen", 97, 82], ["HAD", "Isack Hadjar", 87, 82]],
      ["#6692ff", ["LAW", "Liam Lawson", 81, 74], ["LIN", "Arvid Lindblad", 78, 66]],
      ["#ff87bc", ["GAS", "Pierre Gasly", 86, 78], ["COL", "Franco Colapinto", 75, 74]],
      ["#b6babd", ["BEA", "Oliver Bearman", 84, 70], ["OCO", "Esteban Ocon", 84, 84]],
      ["#4a4f55", ["HUL", "Nico Hülkenberg", 85, 85], ["BOR", "Gabriel Bortoleto", 82, 77]],
      ["#64c4ff", ["SAI", "Carlos Sainz", 85, 80], ["ALB", "Alexander Albon", 83, 76]],
      ["#229971", ["ALO", "Fernando Alonso", 90, 85], ["STR", "Lance Stroll", 76, 73]],
    ],
  ),
  // ponytail: tuned in race.check.ts against pro.
  legends: level(
    "Legends",
    1,
    [0.98, 0.95],
    0,
    LEGEND_EDGE,
    ["HUN", "James Hunt", 88],
    [
      ["#a6051a", ["SCH", "Michael Schumacher", 100], ["LAU", "Niki Lauda", 88]],
      ["#27f4d2", ["HAM", "Lewis Hamilton", 88], ["FAN", "Juan Manuel Fangio", 100]],
      ["#ff8000", ["SEN", "Ayrton Senna", 100], ["PRO", "Alain Prost", 100]],
      ["#1e41ff", ["VER", "Max Verstappen", 100], ["VET", "Sebastian Vettel", 80]],
      ["#64c4ff", ["PIQ", "Nelson Piquet", 82], ["MAN", "Nigel Mansell", 79]],
      ["#0d5c3a", ["CLA", "Jim Clark", 96], ["FIT", "Emerson Fittipaldi", 74]],
      ["#f2f2ef", ["BRA", "Jack Brabham", 62], ["HIL", "Graham Hill", 58]],
      ["#1d3b8a", ["STE", "Jackie Stewart", 77], ["ASC", "Alberto Ascari", 100]],
      ["#f2c230", ["ALO", "Fernando Alonso", 100], ["HAK", "Mika Häkkinen", 69]],
      ["#c9b037", ["ROS", "Nico Rosberg", 79], ["RAI", "Kimi Räikkönen", 71]],
    ],
  ),
};
export const CARS = 22;
export const driver = (race: Race, id: number) => LEVELS[race.level].drivers[id]!;
// A car's colour: its team's, or "" for yours.
export const colorOf = (race: Race, id: number) => LEVELS[race.level].colors[id >> 1]!;

// The grid without qualifying, as driver ids front to back: the computer in roster order, your
// teammate last, and you P10.
const AI = [...Array(CARS).keys()].slice(2).concat(1);
export const GRID = [...AI.slice(0, 9), 0, ...AI.slice(9)];

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
// Wear is per metre at Monza, where it was tuned, and scaled to the lap elsewhere so a set lasts
// the same number of laps on every track.
const WEAR = 1 / 36000;
const MONZA = 5793;
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
// The computer's strategy: every way to run the race with up to three stops and stints of at
// least two laps (so never a stop on the first or last lap), each scored in fresh-medium
// laps: a lap at its mid-lap grip, slowing as grip ^ -GRIP_POWER, plus the track's cost of a stop.
// Each car takes one at random from those within its level's margin of the best. Returns the laps
// they stop at the end of and the set for each stint, best first.
// ponytail: an estimate from the tyre model, not raced out; race.check.ts races the picks.
const LAP_WEAR = WEAR * MONZA;
export function strategies(laps: number, track: Track) {
  const { GRIP_POWER, STOP_LAPS } = track;
  const table = Object.fromEntries(
    COMPOUNDS.map((t) => {
      const sum = [0];
      for (let k = 0; k < laps; k++) {
        const life = Math.max(0, 1 - LAP_WEAR * TYRES[t].wear * (k + 0.5));
        sum.push(sum[k]! + grip(life, t) ** -GRIP_POWER);
      }
      return [t, sum];
    }),
  ) as Record<Tyre, number[]>;
  const all: { at: number[]; tyres: Tyre[]; cost: number }[] = [];
  const walk = (done: number, at: number[], tyres: Tyre[], cost: number) => {
    for (const t of COMPOUNDS) {
      all.push({ at, tyres: [...tyres, t], cost: cost + table[t][laps - done]! });
      if (at.length < 3)
        for (let n = 2; n <= laps - done - 2; n++)
          walk(done + n, [...at, done + n], [...tyres, t], cost + table[t][n]! + STOP_LAPS);
    }
  };
  walk(0, [], [], 0);
  return all.sort((a, b) => a.cost - b.cost);
}
// How far off the best a level's strategists stray, in laps (about 8, 5, 2 and half a second).
const CALL: Record<Level, number> = {
  amateur: 0.09,
  intermediate: 0.055,
  pro: 0.025,
  legends: 0.006,
};

// 2026 power, all as a higher drag-limited top speed: Straight Mode (flat wings in the zones,
// every car, every lap) about 10 km/h, deploying the battery at 350 kW 11 more, and Overtake Mode
// 9 on top. Super clipping, harvesting flat out, costs about 11.
const STRAIGHT_TOP = 2.8;
const DEPLOY_TOP = 3.1;
const OT_TOP = 2.5;
const CLIP_TOP = -3;
// The battery in MJ, as the 2026 rules have it: 4 usable. It deploys by itself flat out above
// 40 m/s, at 350 kW (0.35 MJ a second, about 11 s from full) in the zones and in Overtake Mode and
// 250 kW elsewhere, for less speed. It harvests HARVEST MJ a second on the brakes, half that
// coasting, and CLIP flat out on an empty battery (super clipping) until it's back to 1 MJ; up to
// 8.5 MJ a lap, or 9 MJ, a quarter faster, the lap after a car was within a second at a detection
// line. The pit lane puts back about 2 MJ a trip on top.
export const CAP = 4;
const KW350 = 0.35;
const KW250 = 0.25;
const HARVEST = 0.49;
const CLIP = 0.2;
const LAP_HARVEST = 8.5;
const OT_HARVEST = 0.5;

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
  // every set run so far, for the results, and the lap the set on the car went on.
  tyre: Tyre;
  fit: Tyre | null;
  stints: Tyre[];
  set: number;
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
  // Track limits: excursions so far, whether off now, time added (ms), and
  // the last contact with another car, which excuses the next excursion for a second.
  strikes: number;
  off: boolean;
  penalty: number;
  touchT: number;
  // 2026 power: whether the wings are flat (Straight Mode); the battery (MJ), what it's harvested
  // this lap, and whether it's super clipping; Overtake Mode for the zone it was last eligible in
  // (null, ready, or on) and the lap its harvest bonus is for.
  straight: boolean;
  charge: number;
  harvested: number;
  clipping: boolean;
  ot: null | "ready" | "on";
  otZone: number;
  bonusLap: number;
  // Computer cars: the chance of overcooking each corner, the corner they'll overcook (-1 none)
  // and the last corner they rolled for.
  slip: number;
  mistake: number;
  rolled: number;
  // In another car's wake: the top speed its tow adds and the share of grip its dirty air takes.
  tow: number;
  dirty: number;
  // You: whether the team has already called you in on these tyres.
  boxCall: boolean;
  // In the lane with no stop planned on this visit: a computer car that strayed in, or any car
  // after the flag. It drives straight through in the fast lane.
  through: boolean;
};

// Race Control and your team radio, queued for the HUD.
export type Msg = {
  kind: "limits" | "flag" | "penalty" | "fastest" | "radio";
  id: number;
  text: string;
};

export type Race = {
  track: Track;
  level: Level;
  laps: number;
  racers: Racer[];
  // Milliseconds since the lights went out, and the first car's time at each checkpoint.
  t: number;
  cps: number[];
  done: boolean;
  msgs: Msg[];
  fastest: { id: number; ms: number } | null;
  // The quickest clean time through each sector by anyone, 0 until someone sets one.
  sectors: number[];
  // When any car last crossed each Overtake Mode detection line.
  crossed: number[];
  // Whether computer cars make mistakes (off for the strategy check), and the dice.
  slips: boolean;
  rand: () => number;
};

export function newRace(
  track: Track,
  grid: number[],
  rand = Math.random,
  tyre: Tyre = "medium",
  lv: Level = "intermediate",
  laps = DISTANCES[0]!,
): Race {
  // Computer paces spread across the level's range by pace rating, and mistakes around its rate
  // by awareness, from half for the most aware to one and a half for the least. Everyone lines up
  // in `grid`'s order.
  const { pace, slip, drivers } = LEVELS[lv];
  const { HALF, LENGTH, atDist, dirAt, pointAt, ZONES } = track;
  const options = strategies(laps, track);
  const close = options.filter((o) => o.cost <= options[0]!.cost + CALL[lv]);
  const ai = drivers.slice(1);
  const spread = (k: "pace" | "aware", id: number) => {
    const xs = ai.map((d) => d[k]);
    const [lo, hi] = [Math.min(...xs), Math.max(...xs)];
    return (drivers[id]![k] - lo) / (hi - lo || 1);
  };
  const racers = [...Array(CARS).keys()].map((id): Racer => {
    const strat = id ? close[Math.floor(rand() * close.length)]! : { at: [], tyres: [tyre] };
    const s = grid.indexOf(id);
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
      set: 0,
      stop: 0,
      served: false,
      pit: false,
      pace: id === 0 ? pace[0] : pace[1] + (pace[0] - pace[1]) * spread("pace", id),
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
      straight: false,
      charge: CAP,
      harvested: 0,
      clipping: false,
      ot: null,
      otZone: 0,
      bonusLap: -1,
      slip: slip * (1.5 - spread("aware", id)),
      mistake: -1,
      rolled: -1,
      tow: 0,
      dirty: 0,
      boxCall: false,
      through: false,
    };
  });
  for (const r of racers) r.lap.start = 0;
  return {
    track,
    level: lv,
    laps,
    racers,
    t: 0,
    cps: [],
    done: false,
    msgs: [],
    fastest: null,
    sectors: [0, 0, 0],
    crossed: ZONES.map(() => -Infinity),
    slips: true,
    rand,
  };
}

// A computer driver: aims down its line (between the centreline and the racing line, by level),
// brakes to its share of the corner limit, pulls out to pass a slower car ahead, and on its stop
// lap follows the pit lane, turning into its box and back out.
export function aiInput(r: Racer, race: Race): Input {
  const { car } = r;
  const { BOXES, CORNERS, HALF, LENGTH, PIT_IN, PIT_SIDE, RACING } = race.track;
  const { ahead: fwd, atDist, lateral, limitAt, pitOffset, pointAt, signed } = race.track;
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
    r.mistake = race.slips && r.slip > 0 && race.rand() < r.slip + 0.08 * (1 - r.life) ? k : -1;
  }
  if (r.mistake >= 0 && fwd(CORNERS[r.mistake]!.at, m) < 200) r.mistake = -1;
  const at = atDist(m + 5);
  // The profiles stop at TOP, so a car the 2026 power has taken past it looks down the road for
  // the first point under TOP and brakes for that in time; with none in sight, flat out.
  const gp = g * (r.mistake >= 0 ? 1.08 : r.pace);
  let want = limitAt(at, gp, line);
  if (r.finish !== null) want = 0.8 * Math.min(want, TOP);
  else if (want >= TOP) {
    want = Infinity;
    for (let d = 10; d <= 400; d += 10) {
      const l = limitAt(atDist(m + 5 + d), gp, line);
      if (l >= TOP) continue;
      want = Math.sqrt(l * l + 2 * gp * brakeAt(l) * d);
      break;
    }
  }

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
    const k = r.through ? 0 : r.served ? 1 - (s - box) / 6 : (s - box + 21) / 10;
    to = pitOffset(i) + PIT_SIDE * WORK * Math.max(0, Math.min(1, k));
    // No unsafe release: at the box until nothing's coming down the fast lane from 20 m back.
    const fast = (o: Racer) => Math.abs(lateral(o.car.x, o.car.y, o.p) - pitOffset(i)) < 2.5;
    const traffic = race.racers.some(
      (o) =>
        o !== r && o.pit && o.car.v > 2 && fast(o) && o.dist - r.dist > -20 && o.dist - r.dist < 4,
    );
    if (r.served && s - box < 3 && traffic) want = 0;
  } else {
    // Off the line the corners are tighter than the line's speeds, so a driver who never makes
    // a mistake only pulls out with no corner coming, and is back on the line for the next.
    const clear = slip > 0 || limitAt(at, g * r.pace, line) > car.v + PASS;
    if (!clear) r.lane = 0;
    const block = ahead(lat(r.lane), 0);
    if (block && block.car.v < car.v + 1) {
      const free = clear ? [3, -3, 0].find((l) => !ahead(lat(l), -8)) : undefined;
      if (free !== undefined && race.t > r.laneT) [r.lane, r.laneT] = [free, race.t + 2000];
      else want = Math.min(want, block.car.v);
    } else if (r.lane && race.t > r.laneT && !ahead(lat(0), -10)) r.lane = 0;
    to = lat(r.lane);
  }
  // Don't turn into a car alongside: hold the line until one of you is clear. Two cars
  // swapping sides would otherwise lean on each other down to a crawl. A car heading for the pit
  // entry (before the line) has the line over any car it leads, or one tucked in on its right
  // shuts it out; rejoining after the line it doesn't, or the cars rejoining together all squeeze
  // onto one line and lean on each other to a stop.
  const now = lateral(car.x, car.y, r.p);
  const beside = race.racers.some((o) => {
    const d = lateral(o.car.x, o.car.y, o.p) - now;
    const gap = o.dist - r.dist;
    return (
      o !== r &&
      Math.abs(gap) < 6 &&
      !(r.pitting && s < 0 && gap < 0) &&
      d * (to - now) > 0 &&
      Math.abs(d) < 3
    );
  });
  if (beside) to = now;
  // Held off the line, a legend backs off to the centreline's speed rather than run wide.
  if (beside && !slip) want = Math.min(want, limitAt(at, g * r.pace));

  const [tx, ty] = pointAt(look, to);
  let diff = Math.atan2(ty - car.y, tx - car.x) - car.h;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  const over = car.v > want;
  return {
    gas: !over,
    brake: over && car.v > want + 1,
    steer: Math.max(-1, Math.min(1, diff * 4)),
    ot: true,
  };
}

// Qualifying: one flying lap each on fresh softs, from a rolling start RUN_UP m before the line
// at the centreline's speed there. Every car is alone in a race of its own, yours first, all ticked
// together so they start the lap at about the same moment. No stops, and mistakes still happen.
const RUN_UP = 500;
export function newQuali(track: Track, lv: Level, rand = Math.random): Race[] {
  const { LENGTH, atDist, dirAt, limitAt, pointAt } = track;
  const m = -RUN_UP;
  const p = (m + LENGTH) / LENGTH;
  return [...Array(CARS).keys()].map((id) => {
    const race = newRace(track, GRID, rand, "soft", lv, 1);
    const r = race.racers[id]!;
    const [x, y] = pointAt(m, 0);
    const v = Math.min(TOP, limitAt(atDist(m), grip(1, "soft")));
    Object.assign(r, {
      car: { x, y, h: dirAt(p), v },
      lap: { ...newLap(), p, halfway: true },
      dist: m,
      p,
      tyre: "soft",
      stints: ["soft"],
      stops: [],
      plan: ["soft"],
      launch: 0,
    });
    race.racers = [r];
    return race;
  });
}
// The classification: each car's lap (0 for none), quickest first and no time last.
export const qualiOrder = (q: Race[]) =>
  q
    .map(({ racers: [r] }) => ({ id: r!.id, best: r!.best }))
    .sort((a, b) => (a.best || Infinity) - (b.best || Infinity) || a.id - b.id);
// Your gap in seconds to the quickest car through the last checkpoint anyone else has reached,
// each timed from its own line crossing (checkpoint 0); negative when you're quicker. Null until
// there's one to compare.
export function qualiDelta([mine, ...rest]: Race[]) {
  const lap = (race: Race, k: number) => race.cps[k]! - race.cps[0]!;
  for (let k = mine!.cps.length - 1; k > 0; k--) {
    const theirs = rest.filter((race) => race.cps[k] !== undefined).map((race) => lap(race, k));
    if (theirs.length) return (lap(mine!, k) - Math.min(...theirs)) / 1000;
  }
  return null;
}

// The limiter in the lane and the stop at the box, for any car. Teammates share a box, so one
// that gets there second waits 8 m short of it until the first has gone (a double stack).
function pitStop(race: Race, r: Racer, dt: number) {
  const { car } = r;
  const { BOXES, signed } = race.track;
  if (r.stop > 0) {
    car.v = 0;
    r.stop -= dt;
    if (r.stop <= 0) {
      [r.life, r.served, r.boxCall] = [1, true, false];
      [r.tyre, r.fit] = [r.fit ?? teamPick(race.laps - r.laps - 1), null];
      r.stints.push(r.tyre);
      r.set = r.laps;
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
  if (r.served || r.through || d < 0 || d > 30) return;
  const mate = race.racers.find((o) => o.id === (r.id ^ 1));
  const md = mate && box - signed(mate.p);
  const wait = mate?.pit && !mate.served && (mate.stop > 0 || (md! >= 0 && md! < d));
  const to = wait ? d - 8 : d;
  car.v = Math.min(car.v, Math.sqrt(2 * BOX_BRAKE * Math.max(0, to)));
  if (to < 1) car.v = 0;
  if (!wait && d < 1) r.stop = STOP;
}

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
    `Track limits · ${who} · ${race.track.cornerAt(r.p)} · Lap ${r.laps + 1} time deleted`,
  );
  if (r.strikes === 3) say(race, "flag", r.id, `Black and white flag · ${who} · Track limits`);
  if (r.strikes < 4) return;
  const add = r.strikes === 4 ? 5000 : 10000;
  r.penalty += add;
  say(race, "penalty", r.id, `${add / 1000} s time penalty · ${who} · Track limits`);
}

// 2026 power for a frame from `from` to `to` m round the lap (`moved`: a small step forward).
// Overtake Mode is ready within a second of whoever last crossed a detection line, from lap 2,
// with a harvest bonus for the next lap; fired (computer cars at once), it's on to the end of the
// zone that follows, and lapses there either way. Straight Mode opens on entering a zone and shuts on the brakes (or in the pit
// lane) until the next.
// Returns the top speed.
function power(race: Race, r: Racer, from: number, to: number, moved: boolean, input: Input) {
  const { ZONES, ahead: fwd, inZone } = race.track;
  if (moved)
    ZONES.forEach((z, k) => {
      if (fwd(from, z.detect) > fwd(from, to) || fwd(from, to) > 50) return;
      if (r.laps >= 1 && race.t - race.crossed[k]! < 1000) {
        [r.ot, r.otZone, r.bonusLap] = ["ready", k, r.laps + 1];
        if (r.id === 0) say(race, "radio", 0, "Within a second. Overtake ready.");
      }
      race.crossed[k] = race.t;
    });
  if (r.ot === "ready" && input.ot) r.ot = "on";
  const z = ZONES[r.otZone]!;
  if (r.ot && inZone(from, z) && !inZone(to, z)) r.ot = null;
  const flat = (m: number) => ZONES.some((z) => inZone(m, z));
  if (flat(to) && !flat(from)) r.straight = true;
  if (!flat(to) || input.brake || r.pit) r.straight = false;
  return TOP + (r.straight ? STRAIGHT_TOP : 0) + (r.ot === "on" ? OT_TOP : 0);
}

// The battery for a frame (see CAP). Returns the top speed it adds, or takes away clipping.
function battery(race: Race, r: Racer, input: Input, dt: number) {
  const { LENGTH, PIT_IN, PIT_OUT, ZONES, inZone } = race.track;
  const v = r.car.v;
  const bonus = r.laps === r.bonusLap;
  const room = LAP_HARVEST + (bonus ? OT_HARVEST : 0) - r.harvested;
  const harvest = (mj: number) => {
    const got = Math.max(0, Math.min(mj * (bonus ? 1.25 : 1), room, CAP - r.charge));
    r.charge += got;
    r.harvested += got;
  };
  // Clipping until back to 1 MJ, unless the lap's allowance runs out first.
  const flat = input.gas && v > 40;
  if (!flat || r.charge >= 1 || room <= 0) r.clipping = false;
  else if (r.charge <= 0) r.clipping = true;
  if (r.clipping) {
    harvest(CLIP * dt);
    return CLIP_TOP;
  }
  if (flat) {
    const full = r.ot === "on" || ZONES.some((z) => inZone(r.p * LENGTH, z));
    const kw = full ? KW350 : KW250;
    r.charge = Math.max(0, r.charge - kw * dt);
    return (DEPLOY_TOP * kw) / KW350;
  }
  // The pit lane's 2 MJ is on top of the lap's allowance.
  if (r.pit) r.charge = Math.min(CAP, r.charge + (2 * dt) / ((PIT_OUT - PIT_IN) / PIT_V + STOP));
  else if (v > 10 && (input.brake || !input.gas)) harvest((input.brake ? 1 : 0.5) * HARVEST * dt);
  return 0;
}

// Slipstream: the nearest car up to TOW_M ahead, within WAKE of the same line, tows up to TOW_TOP
// more top speed, and inside DIRTY_M its dirty air takes up to DIRTY of the grip, both fading
// with the gap. Nothing in the pit lane. ponytail: a gap along the lap and a lateral band, not
// real wake geometry.
const TOW_M = 40;
const TOW_TOP = 12 / 3.6;
const DIRTY_M = 25;
const DIRTY = 0.05;
const WAKE = 2;
function wake(race: Race, r: Racer) {
  const { LENGTH, ahead, lateral } = race.track;
  const at = lateral(r.car.x, r.car.y, r.p);
  let gap = Infinity;
  if (!r.pit)
    for (const o of race.racers) {
      const d = ahead(r.p * LENGTH, o.p * LENGTH);
      if (
        o !== r &&
        !o.pit &&
        d > 0 &&
        d < gap &&
        Math.abs(lateral(o.car.x, o.car.y, o.p) - at) < WAKE
      )
        gap = d;
    }
  r.tow = TOW_TOP * Math.max(0, 1 - gap / TOW_M);
  r.dirty = DIRTY * Math.max(0, 1 - gap / DIRTY_M);
}

// One frame for every car. `you` is the player's input, or null to hold them (before the lights).
// Returns the player's split, if this frame made one.
export function tick(race: Race, you: Input, dt: number): Split | null {
  race.t += dt * 1000;
  const { LENGTH, PIT_IN, PIT_OUT, PIT_SIDE } = race.track;
  const { collide, dirAt, inPit, lateral, nearest, signed } = race.track;
  // Race distance between the checkpoints the gaps are timed at.
  const CP = LENGTH / 50;
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

    // Anyone in the lane is driven down it: you to your box when the team takes over, and a
    // computer car that strays in without a stop planned, or any car after the flag, straight
    // through. After the flag the team drives you round too.
    if (!r.pit) r.through = false;
    else if (!r.pitting && (r.id || r.finish !== null)) r.through = true;
    if (r.pit) r.pitting = true;
    const input = r.id === 0 && !r.pitting && r.finish === null ? you : aiInput(r, race);
    const moved = Math.abs(dp) < 0.02 && dp > 0;
    wake(race, r);
    const top =
      power(race, r, from, p * LENGTH, moved, input) + battery(race, r, input, dt) + r.tow;
    const g = carGrip(race, r);
    step(car, input, dt, onGrass(edge), g, top);
    pitStop(race, r, dt);
    collide(car);
    const v = Math.abs(car.v);
    r.life = Math.max(
      0,
      r.life -
        dt * TYRES[r.tyre].wear * v * ((WEAR * MONZA) / LENGTH + (allFourOff(edge) ? GRASS : 0)),
    );
    r.wrong = Math.cos(car.h - dirAt(p)) < -0.5 && car.v > 4.2 ? r.wrong + dt : 0;
    // Track limits, once per trip off. The pit lane's side doesn't count, to 30 m past the exit
    // for a car rejoining alongside another, nor being pushed off: contact in the last second
    // excuses it.
    const entry = s > PIT_IN && s < PIT_OUT + 30 && PIT_SIDE * lateral(car.x, car.y, p) > 0;
    const off = allFourOff(edge) && !entry && r.finish === null && r.lap.start !== null;
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

    // Laps after the flag are cool-down laps and count for nothing.
    const split = r.finish === null ? lapTick(r.lap, p, edge, race.t) : null;
    const sec = split?.sector ?? 0;
    if (split?.valid && (!race.sectors[sec] || split.ms < race.sectors[sec]!))
      race.sectors[sec] = split.ms;
    if (split?.lap) {
      r.laps++;
      r.harvested = 0;
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
  // Done once every car has taken the flag, or, should one never get there, three average laps
  // after the winner.
  const won = Math.min(...rs.map((r) => r.finish ?? Infinity));
  if (rs.every((r) => r.finish !== null) || race.t - won > (3 * won) / race.laps) race.done = true;
  return mine;
}

export const wrongWay = (r: Racer) => r.wrong > 1;

// Running order: finishers by time with penalties added, then everyone else by distance.
export const order = (race: Race) =>
  race.racers
    .slice()
    .sort((a, b) =>
      a.finish !== null || b.finish !== null
        ? (a.finish ?? Infinity) + a.penalty - ((b.finish ?? Infinity) + b.penalty)
        : b.dist - a.dist,
    );
// Seconds behind the leader, from when each passed the same checkpoint; once in, from the flag
// with penalties added, as the classification will have it.
export const gap = (race: Race, r: Racer) => {
  if (r.finish === null) return r.cp < 0 ? 0 : (r.cpT - race.cps[r.cp]!) / 1000;
  const lead = Math.min(...race.racers.map((o) => (o.finish ?? Infinity) + o.penalty));
  return (r.finish + r.penalty - lead) / 1000;
};

// Final classification once the race is done: lapped cars are shown laps down, and any car that
// never made it to the flag too, placed by the time it would take for the rest at its average
// speed so far.
export function results(race: Race) {
  const total = race.laps * race.track.LENGTH;
  return race.racers
    .map((r) => {
      const run = r.finish ?? race.t + (total - r.dist) / (Math.max(r.dist, 1) / race.t);
      const time = run + r.penalty;
      const down = race.laps - r.laps;
      const { id, best, penalty, stints } = r;
      return { id, time, down, best, penalty, stints, stops: stints.length - 1 };
    })
    .sort((a, b) => a.down - b.down || a.time - b.time);
}
