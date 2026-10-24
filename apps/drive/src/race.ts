// The race the drive runs: twenty cars, five laps, tyres that wear and a pit stop to change them.
// Plain maths like track.ts, so race.check.ts can run whole races headless.
import {
  CAR_HALF_LENGTH,
  CAR_HALF_WIDTH,
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

// Race distances to pick from, as the F1 games have them: a five-lap sprint, or a share of the
// Grand Prix's laps. The paces are tuned on the shortest.
export const SPRINT = 5;
export const DISTANCES = [
  { name: "Sprint", share: 0 },
  { name: "25%", share: 0.25 },
  { name: "35%", share: 0.35 },
  { name: "50%", share: 0.5 },
  { name: "100%", share: 1 },
];
export const lapsOf = ({ share }: (typeof DISTANCES)[number], track: Track) =>
  share ? Math.max(SPRINT, Math.round(share * track.LAPS)) : SPRINT;

// Difficulty is mostly the other drivers: a level sets how far from the centreline (0) to the
// racing line (1) the computer drives, the share of its grip its quickest and slowest drivers
// dare use (so they brake earlier and corner slower, but run flat out on the straights), and
// how often it overcooks a corner (never, for legends). Pro cars also get EDGE more grip: on the
// best line at the limit the computer laps well off a clean human, so that closes it.
// The field is eleven two-car teams. Driver 0 is you, in BMW's livery, and driver 1 your
// teammate, the best driver whose team didn't make the top ten (in F1, Rafael Câmara, F2's
// leader, rated by eye a little above Lindblad's rookie rating); then that series' top ten teams
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
// second or two. In F1, Hamilton and Verstappen are stars: STAR on top of their pace.
export type Level = "amateur" | "intermediate" | "pro" | "legends";
// ponytail: tuned in race.check.ts so pro's pole at Monza is a clean qualifying lap from the
// player (1:20.567 on the 4 MJ battery, about 1:20.1 on today's), Verstappen's in the best car.
const EDGE = 1.3;
const LEGEND_EDGE = 1.31;
const STAR = 1.005;
// Pro's cars, in tiers: your team and the top four, the midfield, and the back, in roster order.
// Each weekend every tier deals its offsets (seconds a lap off the best car at Monza) to its teams
// at random, so who's quickest within a tier changes and the tiers don't. An offset takes PER_S
// of the car's grip and top speed a second; tuned in race.check.ts.
export const TIERS = [
  [0, 0.025, 0.05, 0.075, 0.1],
  [0.375, 0.4, 0.425],
  [0.875, 0.9, 0.925],
];
const PER_S = 0.02;
// Each team's car, as a share of the best's grip and top speed: from offsets in team order, or
// drawn for a weekend (all the best car below pro).
export const carsOf = (offsets: number[]) => offsets.map((s) => 1 - PER_S * s);
export const drawCars = (lv: Level, rand = Math.random) =>
  carsOf(
    lv === "pro"
      ? TIERS.flatMap((t) =>
          t
            .map((s) => [rand(), s] as const)
            .sort((a, b) => a[0] - b[0])
            .map(([, s]) => s),
        )
      : Array<number>(CARS / 2).fill(0),
  );
// How far under its limit (m/s) a legend has to be to pull out and pass.
const PASS = 15;
// A computer car's form, drawn fresh each lap: up to this share either side of its pace and top
// speed, about a tenth of a second, so drivers rated alike don't set the same lap. The top speed
// matters most for that: the computer's pedals are on or off, so pace alone moves its lap only
// when a pedal flips a frame earlier or later, and close paces drive the very same lap.
const FORM = 0.002;
// A car's width and a metre, centre to centre: the room a computer car leaves one alongside,
// and how far over it pulls out to pass.
const SPACE = 2 * CAR_HALF_WIDTH + 1;
// Centre to centre, how close a computer car runs behind another at the same speed: tucked up
// for the tow at 60 m/s and over, and 4 m more by 20 m/s, as through a slow corner cars sit at an
// angle to each other and the gap round the lap understates how close their corners are.
const follow = (v: number) => 8 + 4 * Math.max(0, Math.min(1, (60 - v) / 40));
// The quickest a car on grip g can run `gap` m (centre to centre) behind one at `v`: no quicker
// than lets it stop its follow distance behind should that car brake as hard (with a margin), and
// closer than that, backing off.
const behind = (v: number, gap: number, g: number) => {
  const d = gap - follow(v);
  return d > 0 ? Math.sqrt(v ** 2 + 1.6 * g * brakeAt(v) * d) : v + d;
};
// Steering for a car to head at (x, y).
const aim = (car: Car, [x, y]: [number, number]) => {
  let diff = Math.atan2(y - car.y, x - car.x) - car.h;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  return Math.max(-1, Math.min(1, diff * 4));
};
// A computer car's extra grip: its level's edge (1 below pro), or the track's own for pro and
// legends.
export const edgeOf = ({ level: lv, track }: Race) =>
  (lv === "pro" ? track.PRO_EDGE : lv === "legends" ? track.LEGENDS_EDGE : undefined) ??
  LEVELS[lv].edge;
// A car's grip on its tyres, wing and car: a computer car's scaled by its edge. Close behind another car its
// dirty air takes some of that, and so do cold tyres and damage; on a puncture it has little.
export const carGrip = (race: Race, r: Racer) => {
  const g =
    grip(r.life, r.tyre) *
    wingGrip(r.wing) *
    (r.id ? edgeOf(race) : 1) *
    (1 - r.dirty) *
    (1 - COLD * (1 - r.warm)) *
    (1 - r.damage) *
    race.cars[r.id >> 1]!;
  return r.puncture ? Math.max(MOST_WORN, g * 0.6) : g;
};
// Awareness defaults to pace, for the levels that rate only by championship place.
type Seat = [code: string, name: string, pace: number, aware?: number, star?: boolean];
// A car's paint (scene.ts draws the layouts): a base colour, a second and a stripe, and for BMW's
// M stripes a third. F1's are each team's by eye; the rest are made from the team's colour.
export type Livery = [
  layout: "fade" | "split" | "pods" | "nose" | "m",
  base: string,
  ...more: string[],
];
type Team = [color: string, a: Seat, b: Seat, livery?: Livery];
// Your team, in every series: BMW, white with the M stripes, its box and crew in BMW blue.
const BMW = "#1c69d4";
const BMW_LIVERY: Livery = ["m", "#f2f2ef", "#5fb4ec", "#1c3f94", "#e2231a"];
const AUTO = ["fade", "split", "pods", "nose"] as const;
// A team colour at 40%, and whether it's pale enough to want a dark stripe.
const shade = (c: string) =>
  `#${[1, 3, 5]
    .map((k) =>
      Math.round(parseInt(c.slice(k, k + 2), 16) * 0.4)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
const pale = (c: string) =>
  [1, 3, 5].reduce((n, k) => n + parseInt(c.slice(k, k + 2), 16), 0) > 3 * 180;
const level = (
  series: string,
  line: number,
  pace: [fast: number, slow: number],
  slip: number,
  edge: number,
  mate: Seat,
  teams: Team[],
) => {
  const all: Team[] = [[BMW, ["HAR", "You", 0], mate, BMW_LIVERY], ...teams];
  return {
    series,
    line,
    pace,
    slip,
    edge,
    colors: all.map(([c]) => c),
    liveries: all.map(
      ([c, , , livery], k): Livery =>
        livery ?? [AUTO[k % AUTO.length]!, c, shade(c), pale(c) ? "#15151e" : "#f2f2ef"],
    ),
    drivers: all
      .flatMap(([, a, b]) => [a, b])
      .map(([code, name, pace, aware = pace, star = false]) => ({ code, name, pace, aware, star })),
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
    0.015,
    EDGE,
    ["CAM", "Rafael Câmara", 84, 76],
    [
      [
        "#27f4d2",
        ["ANT", "Kimi Antonelli", 93, 77],
        ["RUS", "George Russell", 92, 93],
        ["fade", "#c3c8cc", "#121416", "#27f4d2"],
      ],
      [
        "#a6051a",
        ["HAM", "Lewis Hamilton", 95, 91, true],
        ["LEC", "Charles Leclerc", 93, 91],
        ["pods", "#c8102e", "#1a1a1a", "#f2f2ef"],
      ],
      [
        "#ff8000",
        ["NOR", "Lando Norris", 94, 85],
        ["PIA", "Oscar Piastri", 91, 84],
        ["split", "#ff8000", "#23272b", "#f2f2ef"],
      ],
      [
        "#1e41ff",
        ["VER", "Max Verstappen", 97, 82, true],
        ["HAD", "Isack Hadjar", 87, 82],
        ["nose", "#1e2a5e", "#d71e28", "#ffcc00"],
      ],
      [
        "#6692ff",
        ["LAW", "Liam Lawson", 81, 74],
        ["LIN", "Arvid Lindblad", 78, 66],
        ["fade", "#f2f2ef", "#1634cc", "#d71e28"],
      ],
      [
        "#ff87bc",
        ["GAS", "Pierre Gasly", 86, 78],
        ["COL", "Franco Colapinto", 75, 74],
        ["split", "#ff87bc", "#0a2a8a", "#f2f2ef"],
      ],
      [
        "#b6babd",
        ["BEA", "Oliver Bearman", 84, 70],
        ["OCO", "Esteban Ocon", 84, 84],
        ["pods", "#e8e9ea", "#1a1a1a", "#d4002a"],
      ],
      [
        "#4a4f55",
        ["HUL", "Nico Hülkenberg", 85, 85],
        ["BOR", "Gabriel Bortoleto", 82, 77],
        ["fade", "#a7abb0", "#141414", "#f50537"],
      ],
      [
        "#64c4ff",
        ["SAI", "Carlos Sainz", 85, 80],
        ["ALB", "Alexander Albon", 83, 76],
        ["nose", "#041e42", "#64c4ff", "#f2f2ef"],
      ],
      [
        "#229971",
        ["ALO", "Fernando Alonso", 90, 85],
        ["STR", "Lance Stroll", 76, 73],
        ["pods", "#0b6b56", "#04352b", "#cedc00"],
      ],
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
// A car's colour: its team's.
export const colorOf = (race: Race, id: number) => LEVELS[race.level].colors[id >> 1]!;

// The grid without qualifying, as driver ids front to back: the computer in roster order, then
// your teammate, and you at the back.
const AI = [...Array(CARS).keys()].slice(2).concat(1);
export const GRID = [...AI, 0];

// Your hero reaction time picks the slot: up to 0.250 s is pole, then one back per 30 ms. The hero
// times from the press to the painted lights-out, so these are real reactions.
export const gridSlot = (ms: number) => Math.min(CARS - 1, Math.max(0, Math.ceil((ms - 250) / 30)));
const gridAt = (slot: number) => -10 - 8 * slot;

// Tyres, like a Grand Prix squeezed into the distance: life runs from 1 (new) to 0, grip falls
// away gently as a set wears and then off a cliff under CLIFF_AT, and a compound reaches the cliff
// after a share of the race whatever its length (on a track of average wear; track.WEAR scales
// it). The sprint is one stint, so its sets wear as in a SPRINT_WEAR-lap race: softs fade before
// the flag, mediums just make it and hards last. All four wheels on the grass wear GRASS of the
// set a metre on top. Each tyre wears on its own: the outside ones through a corner, the fronts
// under braking and the rears on the throttle, the same on average, so a set's life (and grip) is
// the four's average. A set fresh from the pits is cold, short of COLD of its grip until it has warmed
// up over a share of a lap, softs quickest. ponytail: tuned in race.check.ts to F1's gaps, a soft
// about 0.8 s a lap quicker than a medium at Monza and a hard 0.5 s slower; these are the knobs.
const DEG = 0.1;
const CLIFF = 0.3;
export const CLIFF_AT = 0.25;
const GRASS = 1 / 2000;
const COLD = 0.1;
const SPRINT_WEAR = 10;
// ponytail: qualifying's lap wears as the shortest race did when pole was tuned (race.check.ts
// POLE), a soft losing about two fifths of its life.
const QUALI_WEAR = 4.25;
const LOAD = 0.5;
const FRONT = 0.2;
const BRAKING = 0.3;
const TRACTION = 0.1;
// Front-left, front-right, rear-left, rear-right.
export const CORNERS = ["front-left", "front-right", "rear-left", "rear-right"];
export type Tyre = "soft" | "medium" | "hard";
export const TYRES: Record<Tyre, { grip: number; last: number; warm: number; name: string }> = {
  soft: { grip: 1.04, last: 0.41, warm: 0.3, name: "Softs" },
  medium: { grip: 1, last: 0.65, warm: 0.5, name: "Mediums" },
  hard: { grip: 0.975, last: 0.94, warm: 0.7, name: "Hards" },
};
export const grip = (life: number, tyre: Tyre) =>
  TYRES[tyre].grip * (1 - DEG * (1 - life) - CLIFF * Math.max(0, 1 - life / CLIFF_AT) ** 2);
// Laps a set lasts to the cliff, in a race of `laps` (qualifying's is one).
export const stintLaps = (t: Tyre, laps: number, track: Track) =>
  (TYRES[t].last * Math.max(laps, laps > 1 ? SPRINT_WEAR : QUALI_WEAR)) / track.WEAR;
// The sprint's rules, as F1's: no stop needed and one compound allowed.
export const sprint = (laps: number) => laps <= SPRINT;
const lapWear = (t: Tyre, laps: number, track: Track) => (1 - CLIFF_AT) / stintLaps(t, laps, track);
const COMPOUNDS: Tyre[] = ["soft", "medium", "hard"];

// The rear wing, 1 to WINGS, 3 the car as tuned: each step up trades about 4 km/h of top speed
// (drag) for WING_GRIP more grip (downforce), and flattening it gains less each step (the rest of
// the car still drags), so each track has a quickest wing between: low at Monza, high at Monaco.
// ponytail: downforce as plain grip, so the corner profiles serve every wing; real downforce
// counts most in the fast corners. Tuned in race.check.ts so the wrong end costs up to about a
// second a lap. The computer's strategists
// aim for the track's quickest (track.WING), straying up to STRAY steps by level, by a fixed hash
// of driver and track: the dice are untouched, and a driver runs the same wing in qualifying and
// the race.
export const WINGS = 5;
const WING_TOP = 0.0154;
const WING_DRAG = 0.0028;
const WING_GRIP = 0.0063;
export const wingTop = (w: number) => 1 - WING_TOP * (w - 3) - WING_DRAG * (w - 3) ** 2;
export const wingGrip = (w: number) => 1 + WING_GRIP * (w - 3);
const STRAY: Record<Level, number> = { amateur: 2, intermediate: 1.5, pro: 1, legends: 0.4 };
const aiWing = (track: Track, lv: Level, id: number) => {
  const x = Math.sin(id * 12.9898 + track.LENGTH * 78.233) * 43758.5453;
  const w = Math.round(track.WING + STRAY[lv] * (2 * (x - Math.floor(x)) - 1));
  return Math.max(1, Math.min(WINGS, w));
};

// The strategist: every way to run the laps left with up to two more stops (three in the race),
// each stint at least two laps, scored in fresh-medium laps: a lap at its mid-lap grip, slowing as
// grip ^ -GRIP_POWER, plus the track's cost of a stop. A set is never run to within IN_HAND of the
// end of its life, and only plans that run two compounds over the race count, as the rules have it (the sprint
// plans one stint, on any compound). From the start (no `now`) every set is new
// ; mid-race the car is on `now.tyre` at `now.life` after `now.from` laps, can stop at the end of
// any lap from `now.first`, and a stop then costs `now.cheap` of one (under a Safety Car or VSC). Each
// plan is the laps it stops at the end of and the set for each stint from here; `visit` sees each.
// ponytail: an estimate from the tyre model, not raced out; race.check.ts races the picks. Past
// 25 laps a stop is only weighed every few laps (and at the first chance, and where one's already
// planned), so a long race's search stays the size of a 25-lap one.
const IN_HAND = 0.05;
type Plan = { at: number[]; tyres: Tyre[]; cost: number };
type Now = {
  from: number;
  first: number;
  tyre: Tyre;
  life: number;
  used: Tyre[];
  cheap: number;
  keep: number[];
};
function walkPlans(laps: number, track: Track, now: Now | null, visit: (p: Plan) => void) {
  const { GRIP_POWER, STOP_LAPS } = track;
  const run = (t: Tyre, life: number, n: number) => {
    const per = lapWear(t, laps, track);
    if (n && life - per * n < IN_HAND) return Infinity;
    let sum = 0;
    for (let k = 0; k < n; k++) sum += grip(Math.max(0, life - per * (k + 0.5)), t) ** -GRIP_POWER;
    return sum;
  };
  const fresh = Object.fromEntries(
    COMPOUNDS.map((t) => [t, [...Array(laps + 1).keys()].map((n) => run(t, 1, n))]),
  ) as Record<Tyre, number[]>;
  const used = now?.used ?? [];
  // The sprint plans no stop and needs no second compound.
  const more = sprint(laps) ? 0 : Math.min(2, 3 - Math.max(0, used.length - 1));
  const legal = (sets: Tyre[]) => sprint(laps) || new Set([...used, ...sets]).size > 1;
  const every = Math.ceil(laps / 25);
  const weigh = (n: number) => n % every === 0 || n === now?.first || !!now?.keep.includes(n);
  // New sets from the end of lap `done`, after `at` stops so far.
  const walk = (done: number, at: number[], tyres: Tyre[], cost: number) => {
    for (const t of COMPOUNDS) {
      const all = [...tyres, t];
      if (legal(all)) visit({ at, tyres: all, cost: cost + fresh[t][laps - done]! });
      if (at.length < more)
        for (let n = 2; n <= laps - done - 2; n++)
          if (weigh(done + n))
            walk(done + n, [...at, done + n], all, cost + fresh[t][n]! + STOP_LAPS);
    }
  };
  if (!now) return walk(0, [], [], 0);
  const { from, first, tyre, life, cheap } = now;
  if (legal([tyre])) visit({ at: [], tyres: [tyre], cost: run(tyre, life, laps - from) });
  for (let end = Math.max(first, from); more > 0 && end <= laps - 2; end++) {
    if (!weigh(end)) continue;
    const stop = STOP_LAPS * (end === first ? cheap : 1);
    walk(end, [end], [tyre], run(tyre, life, end - from) + stop);
  }
}
export function strategies(laps: number, track: Track) {
  const all: Plan[] = [];
  walkPlans(laps, track, null, (p) => all.push(p));
  return all.sort((a, b) => a.cost - b.cost);
}
// The team's plan for a race started on `tyre`.
export const teamPlan = (laps: number, track: Track, tyre: Tyre) =>
  strategies(laps, track).find((p) => p.tyres[0] === tyre)!;
// How far off the best a level's strategists stray, in laps (about 8, 5, 2 and half a second).
const CALL: Record<Level, number> = {
  amateur: 0.09,
  intermediate: 0.055,
  pro: 0.025,
  legends: 0.006,
};

// 2026 power, all as a higher drag-limited top speed: Straight Mode (flat wings in the zones,
// every car, every lap) about 10 km/h, deploying the battery at 350 kW 18 more, so 370 in a zone,
// and Overtake Mode 9 on top. Super clipping, harvesting flat out, costs about 2: 350 in a zone.
const STRAIGHT_TOP = 2.8;
const DEPLOY_TOP = 5;
const OT_TOP = 2.5;
const CLIP_TOP = -0.6;
// The battery in MJ: 6 usable, more than the 2026 rules' 4. It deploys by itself flat out above
// 40 m/s, at 350 kW (0.35 MJ a second, about 17 s from full) in the zones and in Overtake Mode and
// 250 kW elsewhere, for less speed. It harvests HARVEST MJ a second on the brakes, half that
// coasting, and CLIP flat out on an empty battery (super clipping) until it's back to CLIP_TO; up
// to 12 MJ a lap, or 12.5 MJ, a quarter faster, the lap after a car was within a second at a
// detection line. The pit lane puts back about 2 MJ a trip on top.
export const CAP = 6;
const KW350 = 0.35;
const KW250 = 0.25;
const HARVEST = 0.65;
const CLIP = 0.2;
const CLIP_TO = 1.5;
const LAP_HARVEST = 12;
const OT_HARVEST = 0.5;

// The pit limiter and the stop at the box. ponytail: 120 km/h, not F1's 80, so a stop costs
// little enough to be worth making in five laps.
export const PIT_V = 120 / 3.6;
export const STOP = 2.5;
const BOX_BRAKE = 12;

// Incidents, at about 2026's rates whatever the distance. A breakdown: the car coasts off the
// tarmac and stops, or limps to its box if the pit entry's within LIMP m. A hit costing more than
// CRASH m/s of speed on a wall (about 150 km/h head on), or SMASH m/s car to car (running into one
// about 90 km/h slower), is a crash out; harder than DENT m/s leaves lasting damage, up to
// DAMAGE. ponytail: SMASH is set from race.check.ts's whole races, about one crash out in two.
// A puncture, from contact or a set run to nothing, limps to the box at PUNCTURE_V.
const FAIL = 0.04;
const FAULTS = ["Engine", "Gearbox", "Hydraulics", "Power unit", "Brakes"];
const LIMP = 800;
const LIMP_V = 30;
const CRASH = 50;
const SMASH = 25;
const DENT = 10;
const DAMAGE = 0.15;
const PUNCTURE_V = 25;
const LIMP_BRAKE = 6;
// The worst grip the corner profiles go down to (track.ts).
const MOST_WORN = 0.55;
// The VSC: every car held to VSC_V for VSC_LAPS of a lap. The Safety Car drives at SC_PACE of the
// corner speeds, up to SC_TOP, and comes in at the first pit entry after three quarters of a lap. Under either a
// stop costs about this share of one, the field being slow.
const VSC_V = 40;
const VSC_LAPS = 0.6;
const SC_PACE = 0.7;
const SC_TOP = 50;
const SC_STOP = 0.45;
const VSC_STOP = 0.6;
// The slowest a blue flag holds a car to (see the blue flags below).
const BLUE_V = 20;

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
  // Computer cars: this lap's form (FORM), the chance of overcooking each corner, the corner
  // they'll overcook (-1 none) and the last corner they rolled for.
  form: number;
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
  // How far the set on the car has warmed up, 0 (cold) to 1.
  warm: number;
  // Each tyre's life, in CORNERS' order: `life` is their average.
  wear: number[];
  // The rear wing on the car, and the one going on at the next stop.
  wing: number;
  nextWing: number;
  // Incidents (see race.incidents): why the car's out of the race (null while it's running) and
  // whether its wreck is still out there; how far into the race (m) its mechanical failure comes
  // (Infinity for none) and what fails; lasting damage, a share off its grip and top speed; and a
  // puncture.
  out: string | null;
  wreck: boolean;
  failAt: number;
  fault: string;
  damage: number;
  puncture: boolean;
  // Queued behind the Safety Car until it crosses the line at the restart; the top speed a Safety
  // Car, VSC or blue flag holds it to; and the blue flag: 0, or the side (+1 right of the faster
  // car) to move over to.
  held: boolean;
  cap: number;
  blue: number;
};

// Race Control and your team radio, queued for the HUD. Chatter goes unsaid if it's waited
// CHATTER ms behind other messages (`at` is when it was queued).
export type Msg = {
  kind: "limits" | "flag" | "penalty" | "fastest" | "radio" | "sc" | "out";
  id: number;
  text: string;
  at?: number;
  chatter?: boolean;
};
export const CHATTER = 4000;

export type Race = {
  track: Track;
  level: Level;
  laps: number;
  racers: Racer[];
  // Each team's car (see drawCars), for the weekend.
  cars: number[];
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
  // Whether cars fail, crash out and puncture (the game's races; not qualifying or the checks).
  incidents: boolean;
  // A Safety Car or VSC: which, when a VSC ends, and whether it's ending (the Safety Car is in
  // this lap); and the Safety Car itself while it's on track, with how far it's driven.
  neutral: { kind: "sc" | "vsc"; end: number; ending: boolean } | null;
  sc: { car: Car; p: number; run: number } | null;
  // What your engineer last said, so it's said once (see engineer).
  eng: Engineer;
};

export function newRace(
  track: Track,
  grid: number[],
  rand = Math.random,
  tyre: Tyre = "medium",
  lv: Level = "intermediate",
  laps = SPRINT,
  incidents = false,
  cars = drawCars(lv, rand),
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
    // Too short a race for a stop (qualifying), and you, plan nothing here. You run the car as
    // tuned until the grid screen sets your wing.
    const strat = (id && close[Math.floor(rand() * close.length)]) || { at: [], tyres: [tyre] };
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
      pace:
        id === 0
          ? pace[0]
          : (pace[1] + (pace[0] - pace[1]) * spread("pace", id)) * (drivers[id]!.star ? STAR : 1),
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
      form: id ? 1 + FORM * (2 * rand() - 1) : 1,
      mistake: -1,
      rolled: -1,
      tow: 0,
      dirty: 0,
      boxCall: false,
      through: false,
      warm: 1,
      wear: [1, 1, 1, 1],
      wing: id ? aiWing(track, lv, id) : 3,
      nextWing: id ? aiWing(track, lv, id) : 3,
      out: null,
      wreck: false,
      failAt: Infinity,
      fault: "",
      damage: 0,
      puncture: false,
      held: false,
      cap: Infinity,
      blue: 0,
    };
  });
  for (const r of racers) r.lap.start = 0;
  // About one car in twenty-five breaks down, somewhere in the race.
  if (incidents)
    for (const r of racers)
      if (rand() < FAIL) {
        r.failAt = (0.1 + 0.9 * rand()) * laps * LENGTH;
        r.fault = FAULTS[Math.floor(rand() * FAULTS.length)]!;
      }
  return {
    track,
    level: lv,
    laps,
    racers,
    cars,
    t: 0,
    cps: [],
    done: false,
    msgs: [],
    fastest: null,
    sectors: [0, 0, 0],
    crossed: ZONES.map(() => -Infinity),
    slips: true,
    rand,
    incidents,
    neutral: null,
    sc: null,
    eng: {
      next: 0,
      pos: 0,
      seen: 0,
      since: 0,
      near: [],
      back: -1,
      slow: 0,
      spun: false,
      worn: 0,
      stopped: -1,
    },
  };
}

// A computer driver: aims down its line (between the centreline and the racing line, by level),
// brakes to its share of the corner limit, pulls out to pass a slower car ahead, and on its stop
// lap follows the pit lane, turning into its box and back out.
export function aiInput(r: Racer, race: Race): Input {
  const { car } = r;
  const { BOXES, CORNERS, HALF, LENGTH, PIT_FROM, PIT_IN, PIT_SIDE, RACING } = race.track;
  const { ahead: fwd, atDist, lateral, limitAt, pitOffset, pointAt, signed } = race.track;
  if (race.t < r.launch) return { gas: false, brake: false, steer: 0 };
  const s = signed(r.p);
  // Broken down, and not limping to the box: coast off the tarmac on the nearer side (away from
  // the pit wall along the pit straight) and stop there, short of a close wall.
  if (r.dist >= r.failAt && !r.pitting && !r.stops.includes(r.laps + 1)) {
    const { PIT_OUT, RUNOFF } = race.track;
    const now = lateral(car.x, car.y, r.p);
    const side = s > PIT_IN - 50 && s < PIT_OUT + 50 ? -PIT_SIDE : Math.sign(now) || 1;
    const off = Math.min(6, RUNOFF - 1.5);
    const far = r.p * LENGTH + 10 + car.v * 0.25;
    const steer = aim(car, pointAt(far, side * (HALF[atDist(far)]! + off)));
    return {
      gas: false,
      brake: Math.abs(now) > HALF[atDist(r.p * LENGTH)]! + Math.min(2, off - 1),
      steer,
    };
  }
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
    // Nobody overcooks one under a Safety Car or VSC.
    const risk = race.slips && r.slip > 0 && r.cap === Infinity;
    r.mistake = risk && race.rand() < r.slip + 0.08 * (1 - r.life) ? k : -1;
  }
  if (r.mistake >= 0 && fwd(CORNERS[r.mistake]!.at, m) < 200) r.mistake = -1;
  const at = atDist(m + 5);
  // The profiles stop at TOP, so a car the 2026 power has taken past it looks down the road for
  // the first point under TOP and brakes for that in time; with none in sight, flat out.
  const gp = g * (r.mistake >= 0 ? 1.08 : r.pace * r.form);
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

  // Where a car is across the track from this level's line. Cars on a line that swings across
  // the track, through a chicane, keep their offsets from it, so traffic is judged in these.
  const off = (o: Racer) => lateral(o.car.x, o.car.y, o.p) - line * RACING[atDist(o.p * LENGTH)]!;
  // A car in a lane (an offset) up to `to` m ahead, or from `from` m back (and a second further
  // for each m/s it's closing at), overlapping a car there: the rearmost, so from 0 the nearest.
  const ahead = (lane: number, from: number, to = 30) =>
    race.racers
      .filter((o) => {
        const ds = o.dist - r.dist;
        const back = from < 0 ? from - Math.max(0, o.car.v - car.v) : from;
        return (
          o !== r &&
          !o.out &&
          ds > back &&
          ds < to &&
          Math.abs(off(o) - lane) < 2 * CAR_HALF_WIDTH + 0.2
        );
      })
      .sort((a, b) => a.dist - b.dist)[0];
  const now = lateral(car.x, car.y, r.p);
  const mine = off(r);
  // Lanes are offsets from the line, kept on the tarmac.
  const room = HALF[i]! - 1.5;
  const base = line * RACING[i]!;
  const lat = (l: number) => Math.max(-room, Math.min(room, base + l));
  let to: number;
  if (r.pitting) {
    // Into the lane: brake for the limiter as late as for a corner, and stop short of anyone in
    // the way rather than go through them. Along the boxes, turn into the working lane for its
    // own box and back out after the stop.
    const brake = g * brakeAt(PIT_V);
    want = Math.min(want, Math.sqrt(PIT_V ** 2 + 2 * brake * Math.max(0, PIT_IN + 40 - s)));
    const block = ahead(mine, 0);
    if (block && block.car.v < car.v)
      want = Math.min(want, block.car.v + Math.sqrt(16 * Math.max(0, block.dist - r.dist - 7)));
    // And for its box from the way in: a first box can be only metres past where the lane's out.
    const box = BOXES[r.id >> 1]!.s;
    if (!r.served && !r.through && Math.abs(box - s) < 60)
      want = Math.min(want, Math.sqrt(2 * BOX_BRAKE * Math.max(0, toBox(BOXES[r.id >> 1]!, car))));
    // In once the point it aims at is past the box before, so it's straight by the box and a car
    // waiting for its teammate's stop is out of the fast lane; out within 6 m.
    const k = r.through
      ? 0
      : r.served
        ? 1 - (s - box) / 6
        : (Math.max(s + look - m, PIT_FROM) - box + 21) / 10;
    to = pitOffset(i) + PIT_SIDE * WORK * Math.max(0, Math.min(1, k));
    // No unsafe release: at the box until nothing's coming down the fast lane from 20 m back.
    const fast = (o: Racer) => Math.abs(lateral(o.car.x, o.car.y, o.p) - pitOffset(i)) < 2.5;
    const traffic = race.racers.some(
      (o) =>
        o !== r &&
        !o.out &&
        o.pit &&
        o.car.v > 2 &&
        fast(o) &&
        o.dist - r.dist > -20 &&
        o.dist - r.dist < 4,
    );
    if (r.served && s - box < 3 && traffic) want = 0;
  } else {
    // Off the line the corners are tighter than the line's speeds, so a driver who never makes
    // a mistake only pulls out with no corner coming, and is back on the line for the next. Under
    // the Safety Car nobody pulls out.
    const clear = !r.held && (slip > 0 || limitAt(at, g * r.pace * r.form, line) > car.v + PASS);
    if (!clear) r.lane = 0;
    const block = ahead(lat(r.lane) - base, 0);
    if (block && block.car.v < car.v + 1) {
      // A blue-flagged car is passed whatever's coming.
      const free =
        clear || (block.blue && !r.held)
          ? [SPACE, -SPACE, 0].find((l) => !ahead(lat(l) - base, -8))
          : undefined;
      if (free !== undefined && race.t > r.laneT) [r.lane, r.laneT] = [free, race.t + 2000];
    } else if (r.lane && race.t > r.laneT && !ahead(lat(0) - base, -10)) r.lane = 0;
    // Shown the blue flag, over to the side away from the faster car.
    to = lat(r.blue ? r.blue * SPACE : r.lane);
    // Behind a car where it is now, at a safe distance: looking far enough ahead to stop for a
    // queue at a hairpin.
    const front = ahead(mine, 0, 120);
    if (front) want = Math.min(want, behind(front.car.v, front.dist - r.dist, g));
  }
  let held = false;
  if (r.pitting) {
    // In the lane, don't turn into a car alongside: hold the line until one of you is clear. A
    // car heading for the pit entry (before the line) has the line over any car it leads, or one
    // tucked in on its right shuts it out; rejoining after the line it doesn't, or the cars
    // rejoining together all squeeze onto one line and lean on each other to a stop.
    held = race.racers.some((o) => {
      const d = lateral(o.car.x, o.car.y, o.p) - now;
      const gap = o.dist - r.dist;
      return (
        o !== r &&
        !o.out &&
        Math.abs(gap) < 6 &&
        !(s < 0 && gap < 0) &&
        d * (to - now) > 0 &&
        Math.abs(d) < 3
      );
    });
    if (held) to = now;
  } else
    // On track, a car's width for any car alongside, moving over to make it. With no room on its
    // side, the car further back lifts and drops in behind; the one ahead keeps what room it can.
    for (const o of race.racers) {
      const gap = o.dist - r.dist;
      const lo = off(o) + base;
      if (o === r || o.out || Math.abs(gap) > 2 * CAR_HALF_LENGTH + 1 || Math.abs(to - lo) >= SPACE)
        continue;
      held = true;
      const side = Math.sign(mine - off(o)) || 1;
      to = Math.max(-room, Math.min(room, lo + side * SPACE));
      if (Math.abs(to - lo) < SPACE - 0.1 && gap > 0) want = Math.min(want, o.car.v - 2);
    }
  // A wreck ahead: round it on the side with more room, whatever's coming.
  if (!r.pitting)
    for (const o of race.racers) {
      if (!o.wreck || fwd(m, o.p * LENGTH) > 150) continue;
      const lo = lateral(o.car.x, o.car.y, o.p);
      if (Math.abs(to - lo) < SPACE) to = lo + (lo > 0 ? -1 : 1) * SPACE;
    }
  // Held off the line, a legend backs off to the centreline's speed rather than run wide.
  if (held && !slip) want = Math.min(want, limitAt(at, g * r.pace * r.form));
  want = Math.min(want, r.cap);

  const over = car.v > want;
  return {
    gas: !over,
    brake: over && car.v > want + 1,
    steer: aim(car, pointAt(look, to)),
    ot: true,
  };
}

// Qualifying: one flying lap each on fresh softs, from a rolling start RUN_UP m before the line
// at the centreline's speed there. Every car is alone in a race of its own, yours first, all ticked
// together so they start the lap at about the same moment. No stops, and mistakes still happen.
const RUN_UP = 500;
// Every car's run on the weekend's cars.
export function newQuali(
  track: Track,
  lv: Level,
  rand = Math.random,
  cars = drawCars(lv, rand),
): Race[] {
  const { LENGTH, atDist, dirAt, limitAt, pointAt } = track;
  const m = -RUN_UP;
  const p = (m + LENGTH) / LENGTH;
  return [...Array(CARS).keys()].map((id) => {
    const race = newRace(track, GRID, rand, "soft", lv, 1, false, cars);
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

// How far a car is short of a box, down the box's heading: exact at the box, where the lane can
// be far enough out on a bend that the distance round the lap is off by a metre or two.
const toBox = (b: Track["BOXES"][number], car: Car) =>
  (b.x - car.x) * Math.cos(b.h) + (b.y - car.y) * Math.sin(b.h);
// The limiter in the lane and the stop at the box, for any car. Teammates share a box, so one
// that gets there second waits 8 m short of it until the first has gone (a double stack). A car
// that rolls a little past its marks still stops there.
function pitStop(race: Race, r: Racer, dt: number) {
  const { car } = r;
  const { BOXES } = race.track;
  if (r.stop > 0) {
    car.v = 0;
    r.stop -= dt;
    if (r.stop <= 0) {
      [r.life, r.served, r.boxCall, r.warm, r.puncture] = [1, true, false, 0, false];
      [r.tyre, r.fit] = [r.fit ?? nextSet(race, r), null];
      r.stints.push(r.tyre);
      [r.set, r.wear, r.wing] = [r.laps, [1, 1, 1, 1], r.nextWing];
    }
    return;
  }
  if (!r.pit) {
    r.served = false;
    return;
  }
  if (car.v > PIT_V) car.v = Math.max(PIT_V, car.v - 40 * dt);
  const box = BOXES[r.id >> 1]!;
  const d = toBox(box, car);
  if (r.served || r.through || d < -2 || d > 30) return;
  const mate = race.racers.find((o) => o.id === (r.id ^ 1) && !o.out);
  const md = mate && toBox(box, mate.car);
  const wait = mate?.pit && !mate.served && (mate.stop > 0 || (md! >= 0 && md! < d));
  const to = wait ? d - 8 : d;
  car.v = Math.min(car.v, Math.sqrt(2 * BOX_BRAKE * Math.max(0, to)));
  if (to < 0.25) car.v = 0;
  // A car that limped in broken down retires here.
  if (!wait && d < 0.25) {
    if (r.dist >= r.failAt) retire(race, r, r.fault);
    else r.stop = STOP;
  }
}

const say = (race: Race, kind: Msg["kind"], id: number, text: string) =>
  race.msgs.push({ kind, id, text });
const code = (race: Race, r: Racer) => driver(race, r.id).code;

// Your race engineer. Every call has a few ways of saying it, picked with Math.random so the
// radio never touches the race's dice. Praise is straight; sarcasm is earned: track limits after
// the first, spins, lost places, slow laps and a long time last.
const pick = <T>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]!;
const radio = (race: Race, text: string, chatter = false) =>
  race.msgs.push({ kind: "radio", id: 0, text, at: race.t, chatter });
const cap = (s: string) => `${s[0]!.toUpperCase()}${s.slice(1)}`;
const LINES = {
  box: [
    "Box this lap.",
    "Box, box.",
    "Box this lap, box this lap.",
    "In this lap. Crew's ready.",
    "Box, box. Confirm.",
  ],
  // Why you're called in, before the set the crew has out (see boxCall).
  neutral: [
    (k: string) => `${k}. Box, box.`,
    (k: string) => `${k} out. Box this lap.`,
    (k: string) => `${k}, cheap stop. Box, box.`,
    (k: string) => `Box under the ${k}. Box, box.`,
  ],
  puncture: [
    "Puncture. Box, box.",
    "You've got a puncture. Bring it in.",
    "Puncture! Easy on it, box this lap.",
    "Tyre's gone. Nurse it back to us.",
  ],
  cliff: [
    "Box, box.",
    "Tyres are gone. Box this lap.",
    "That's the cliff. Box, box.",
    "Nothing left on those. Box this lap.",
  ],
  compound: [
    "Box, box. We still need the second compound.",
    "Box this lap, we need the other compound.",
    "Box, box. Two compounds, remember?",
    "Box. The rules say two compounds, and so do I.",
  ],
  overtake: [
    "Within a second. Overtake ready.",
    "Overtake's armed. Use it.",
    "You've got Overtake for the next straight.",
    "Overtake available. Go get the place.",
    "Overtake's yours. Send it.",
  ],
  last: [
    "Last lap. Bring it home.",
    "Last lap, keep it clean.",
    "One more lap. Everything you've got.",
    "Last lap. No heroics, no mistakes.",
    "Last lap. Make it count.",
  ],
  retire: [
    "Sorry, we have to retire the car.",
    "That's it, retire the car. Sorry.",
    "Retire the car. Sorry, mate.",
    "Bring it in and park it. We're done today.",
  ],
  problem: [
    "We have a problem.",
    "We're seeing a problem on the car.",
    "Problem on the car, problem on the car.",
    "Something's failed. Sorry.",
  ],
  // After the problem: the box if it's close, else off the track.
  limp: ["Box, box.", "Bring it in.", "Get it back to the pits.", "Limp it in, we're waiting."],
  pullOver: [
    "Pull over, pull over.",
    "Stop the car, stop the car.",
    "Find somewhere safe and pull over.",
    "Park it, somewhere safe.",
  ],
  unannounced: [
    "Coming in unannounced? Fine.",
    "Nice of you to let us know.",
    "Surprise stop, then.",
    "Oh, you're pitting. Great. Love that for us.",
  ],
  fastest: [
    "Fastest lap of the race!",
    "That's purple, fastest lap!",
    "Fastest lap. Get in there!",
    "Purple lap! Nobody's been quicker.",
  ],
  pb: ["Personal best,", "Good lap, personal best,", "That's a PB,", "Quickest yet,", "Nice lap,"],
  stop: [
    "Good stop,",
    "Nice work from the crew,",
    "Clean stop,",
    "Great stop from the boys,",
    "Smooth stop,",
  ],
  held: [
    (s: string) => `${s} there. Traffic in the lane, sorry.`,
    (s: string) => `Held for traffic, ${s}. Go get it back.`,
    (s: string) => `${s}. Had to hold you for a car coming through.`,
    (s: string) => `${s}, unsafe release otherwise. Sorry.`,
  ],
  // Tyres near the cliff with the stop to come, and in the sprint, with only the flag to come.
  worn: [
    (t: string) => `${cap(t)}'s going off. The stop's coming.`,
    (t: string) => `The ${t} is fading. Hang on, box soon.`,
    (t: string) => `Tyres are going, ${t} worst. Not long now.`,
    (t: string) => `${cap(t)}'s nearly done. Stop's coming.`,
  ],
  nurse: [
    (t: string) => `${cap(t)}'s going. Nurse it to the flag.`,
    (t: string) => `The ${t} is fading. Hang on, nearly there.`,
    (t: string) => `Tyres are going off, ${t} worst. Manage it to the end.`,
    (t: string) => `${cap(t)}'s done, but so is the race nearly. Bring it home.`,
  ],
  gained: [
    (p: number) => `P${p}. Nice move.`,
    (p: number) => `Up to P${p}. Keep it going.`,
    (p: number) => `P${p}. Good job.`,
    (p: number) => `P${p}! Lovely move.`,
    (p: number) => `That's P${p}. Next one.`,
  ],
  lost: [
    (c: string, p: number) => `${c} got through. P${p}.`,
    (c: string, p: number) => `That was ${c}. Just so you know. P${p}.`,
    (c: string, p: number) => `${c} says thanks for the space. P${p}.`,
    (_: string, p: number) => `P${p}. The mirrors are on the car for a reason.`,
    (c: string, p: number) => `${c}'s by. P${p}. Get that one back.`,
  ],
  // By strike: the first, the second, the black and white flag, then penalties.
  limits: [
    [
      "Lap deleted. Watch the track limits.",
      "Track limits, lap deleted. Keep it inside the lines.",
      "That's a strike. Lap deleted.",
      "Lap time deleted. Mind the white lines.",
    ],
    [
      "Second strike. The white lines are a suggestion we follow.",
      "Two strikes. The track is the grey bit.",
      "Strike two. Let's not collect the set.",
      "Second one. The stewards are counting, so am I.",
    ],
    [
      "Black and white flag. One more and it's a penalty.",
      "That's the black and white. Last warning, I promise.",
      "Black and white. Next one costs us time.",
      "Third strike, black and white flag. Please.",
    ],
    [
      "Penalty. Was it worth it?",
      "Another penalty. The stewards are enjoying this more than we are.",
      "Penalty. I'll stop telling you where the lines are.",
      "Penalty. At this point it's a lifestyle.",
    ],
  ],
  spun: [
    "We saw that. Get it pointed the right way.",
    "Wrong way round. Happens. Not usually to us.",
    "Interesting line. Let's not do it again.",
    "Facing the wrong way. Bold strategy.",
  ],
  slow: [
    "Was that a cool-down lap? We're still racing.",
    "Lap time's dropping. Everything OK, or just sightseeing?",
    "That one was slow. The car's fine, I checked.",
    "Slow lap. Are we saving the tyres or the scenery?",
  ],
  back: [
    "Good news: nobody's holding you up.",
    "Last. On the bright side, you can see everyone from there.",
    "Still last. Think of it as a long-term project.",
    "Last. Plenty of cars to pass, at least.",
  ],
  rival: [
    (c: string, t: string) => `${c} has boxed. ${t}.`,
    (c: string, t: string) => `${c}'s in. Going to ${t.toLowerCase()}.`,
    (c: string, t: string) => `${c} is pitting, ${t.toLowerCase()} going on.`,
    (c: string, t: string) => `Box for ${c}. ${t}.`,
  ],
  gaps: [
    (g: string) => `Gap: ${g}.`,
    (g: string) => `Gaps: ${g}.`,
    (g: string) => `Here's the picture: ${g}.`,
    (g: string) => `${g}. Keep at it.`,
  ],
};
// What the engineer's said, so each call's made once: when it next looks at the order, the place
// it last called, the place now and since when, the cars either side, the lap you went last (-1
// when you're not, -2 once it's said so), the lap of the last slow-lap call, whether you're
// spun, the stint the worn-tyres call was for, and when you stopped at the box (-1 when not).
type Engineer = {
  next: number;
  pos: number;
  seen: number;
  since: number;
  near: number[];
  back: number;
  slow: number;
  spun: boolean;
  worn: number;
  stopped: number;
};
// Every tick in a race: a spin, the stop, tyres going off, and twice a second the order, for
// places won and lost (once held for two seconds, not side by side) and a long time last. Places
// change through the stops without a call. Chatter goes if Race Control's busy (see CHATTER).
function engineer(race: Race) {
  const me = race.racers.find((r) => r.id === 0);
  const e = race.eng;
  if (!me || me.out || me.finish !== null || race.laps < 2) return;
  const spun = me.wrong > 0.5;
  if (spun && !e.spun) radio(race, pick(LINES.spun), true);
  e.spun = spun;
  if (me.stop > 0 && e.stopped < 0) e.stopped = race.t;
  if (me.served && e.stopped >= 0 && me.car.v > 2) {
    const secs = ((race.t - e.stopped) / 1000).toFixed(1);
    const corner = race.track.nextCorner(me.p);
    radio(
      race,
      +secs > STOP + 1.5
        ? pick(LINES.held)(secs)
        : `${pick(LINES.stop)} ${secs}. Cold tyres, careful into ${corner}.`,
    );
    e.stopped = -1;
  }
  if (
    me.life < CLIFF_AT + 0.15 &&
    e.worn !== me.stints.length &&
    (sprint(race.laps) || me.stops.some((l) => l > me.laps))
  ) {
    e.worn = me.stints.length;
    radio(race, pick(sprint(race.laps) ? LINES.nurse : LINES.worn)(worst(me)));
  }

  if (race.t < e.next) return;
  e.next = race.t + 500;
  const run = order(race).filter((r) => !r.out);
  const at = run.indexOf(me);
  const pos = at + 1;
  e.near = [run[at - 1], run[at + 1]].filter((r) => r !== undefined).map((r) => r.id);
  if (pos !== e.seen) [e.seen, e.since] = [pos, race.t];
  const stopping = me.pit || (me.stints.length > 1 && me.laps === me.set);
  if (!e.pos || stopping) e.pos = pos;
  else if (pos !== e.pos && race.t - e.since >= 2000) {
    if (pos < e.pos) radio(race, pick(LINES.gained)(pos), true);
    else radio(race, pick(LINES.lost)(code(race, run[at - 1]!), pos), true);
    e.pos = pos;
  }
  if (pos < run.length || run.length < 2) e.back = -1;
  else if (e.back === -1) e.back = me.laps;
  else if (e.back >= 0 && me.laps - e.back >= 3) {
    e.back = -2;
    radio(race, pick(LINES.back), true);
  }
}
// At the line, one call at most: the last lap, the race's fastest lap, a personal best, a slow
// lap, or every third lap the gaps either side.
function lapCall(race: Race, r: Racer, lap: number, valid: boolean) {
  if (race.laps < 2 || r.laps >= race.laps) return;
  if (r.laps === race.laps - 1) return radio(race, pick(LINES.last));
  if (race.fastest?.id === 0 && race.fastest.ms === lap)
    return radio(race, `${pick(LINES.fastest)} ${fmt(lap)}.`);
  if (valid && r.laps > 1 && r.best === lap)
    return radio(race, `${pick(LINES.pb)} ${fmt(lap)}.`, true);
  // Not the start, an in or out lap, or under a Safety Car or VSC.
  const racing = r.laps > 1 && !r.pitting && r.laps - r.set > 1 && !race.neutral;
  if (racing && valid && r.best && lap > r.best * 1.04 && r.laps - race.eng.slow >= 4) {
    race.eng.slow = r.laps;
    return radio(race, pick(LINES.slow), true);
  }
  if (r.laps % 3) return;
  const run = order(race);
  const k = run.indexOf(r);
  const by = (o: Racer | undefined, where: string) =>
    o && !o.out && o.cp >= 0 && r.cp >= 0
      ? `${code(race, o)} ${where} ${Math.abs(gap(race, o) - gap(race, r)).toFixed(1)}`
      : "";
  const gaps = [by(run[k - 1], "ahead"), by(run[k + 1], "behind")].filter(Boolean);
  if (gaps.length) radio(race, pick(LINES.gaps)(gaps.join(", ")), true);
}

// The tyre that's worn most.
const worst = (r: Racer) => CORNERS[r.wear.indexOf(Math.min(...r.wear))]!;
// The first lap a car can stop at the end of: this one while the pit entry's still ahead.
const firstChance = (race: Race, r: Racer) => {
  const s = race.track.signed(r.p);
  return r.laps + (s > race.track.PIT_IN - 250 && s < 0 ? 2 : 1);
};
const nowOf = (race: Race, r: Racer, first: number, cheap: number) => ({
  from: r.laps,
  first,
  tyre: r.tyre,
  life: r.life,
  used: r.stints,
  cheap,
  keep: r.stops,
});
// The team re-plans the race from where the car is, a stop at the first chance costing `cheap`
// of one: the best plan, if it beats the one the car's on by more than the level's margin
// (always, for you) or that one can't be run any more. Returns whether it now stops at the first
// chance.
function replan(race: Race, r: Racer, cheap = 1) {
  const first = firstChance(race, r);
  const k = r.stops.findIndex((n) => n >= first);
  const mine = (k < 0 ? [] : r.stops.slice(k)).join();
  const sets = [r.tyre, ...(k < 0 ? [] : r.plan.slice(k + 1))].join();
  let best: Plan | null = null;
  let cost = Infinity;
  walkPlans(race.laps, race.track, nowOf(race, r, first, cheap), (p) => {
    if (!best || p.cost < best.cost) best = p;
    if (p.at.join() === mine && p.tyres.join() === sets) cost = p.cost;
  });
  const pick = best as Plan | null;
  if (pick && pick.cost < cost - (r.id ? CALL[race.level] : 0))
    [r.stops, r.plan] = [pick.at, pick.tyres];
  return r.stops.includes(first);
}
// The set for a stop now: the next in the best plan that stops here, or this late in the race,
// a compound the car hasn't run yet. In the sprint, the quickest set to the flag.
function nextSet(race: Race, r: Racer): Tyre {
  if (sprint(race.laps)) return strategies(race.laps - r.laps, race.track)[0]?.tyres[0] ?? "soft";
  let best: Plan | null = null;
  walkPlans(race.laps, race.track, nowOf(race, r, r.laps, 1), (p) => {
    if (p.at[0] === r.laps && (!best || p.cost < best.cost)) best = p;
  });
  return (best as Plan | null)?.tyres[1] ?? COMPOUNDS.find((t) => !r.stints.includes(t)) ?? "soft";
}

// Out of the race where it is. A wreck in the pit lane is wheeled away; on track it brings out
// the Safety Car if it's a crash (there's debris) or stopped on the tarmac, else the VSC.
function retire(race: Race, r: Racer, why: string, crash = false) {
  const { HALF, LENGTH, atDist, lateral } = race.track;
  [r.out, r.wreck, r.car.v, r.puncture] = [why || "Retired", !r.pit, 0, false];
  if (r.id === 0) radio(race, pick(LINES.retire));
  say(race, "out", r.id, `${crash ? "Crash" : "Car stopped"} · ${code(race, r)} · ${why}`);
  if (!r.wreck) return;
  const on = Math.abs(lateral(r.car.x, r.car.y, r.p)) < HALF[atDist(r.p * LENGTH)]!;
  deploy(race, crash || on ? "sc" : "vsc");
}
// Neutralises the race (once anyone's taken the flag it's run). A second incident extends a VSC
// or keeps the Safety Car out longer, and one that needs the Safety Car upgrades a VSC. Then
// every team looks at a cheap stop.
function deploy(race: Race, kind: "sc" | "vsc") {
  const rs = race.racers.filter((r) => !r.out && r.finish === null);
  if (rs.length < race.racers.filter((r) => !r.out).length || !rs.length) return;
  const n = race.neutral;
  const lap = race.fastest?.ms ?? 90_000;
  if (kind === "vsc") {
    if (n?.kind === "sc") return;
    if (n) n.end = Math.max(n.end, race.t + VSC_LAPS * lap);
    else {
      race.neutral = { kind, end: race.t + VSC_LAPS * lap, ending: false };
      say(race, "sc", -1, "Virtual Safety Car deployed");
    }
  } else if (n?.kind === "sc" && race.sc) [race.sc.run, n.ending] = [0, false];
  else {
    race.neutral = { kind, end: Infinity, ending: false };
    // Out ahead of the leader, on the centreline.
    const { LENGTH, dirAt, pointAt, nearest } = race.track;
    const lead = rs.reduce((a, b) => (b.dist > a.dist ? b : a));
    const [x, y] = pointAt(lead.p * LENGTH + 100, 0);
    const p = nearest(x, y).p;
    race.sc = { car: { x, y, h: dirAt(p), v: Math.min(lead.car.v, SC_TOP) }, p, run: 0 };
    for (const r of rs) [r.held, r.lane] = [true, 0];
    say(race, "sc", -1, "Safety Car deployed");
  }
  for (const r of rs) {
    const busy = r.dist >= r.failAt || r.puncture || r.pitting;
    if (busy || !replan(race, r, kind === "sc" ? SC_STOP : VSC_STOP)) continue;
    if (r.id === 0) boxCall(race, r, pick(LINES.neutral)(kind === "sc" ? "Safety Car" : "VSC"));
  }
}
// The radio calls you in, with the set the team has out (yours if you've picked one).
function boxCall(race: Race, r: Racer, why: string) {
  const k = r.stops.indexOf(firstChance(race, r));
  r.fit ??= (k >= 0 && r.plan[k + 1]) || nextSet(race, r);
  r.boxCall = true;
  radio(race, `${why} ${TYRES[r.fit].name} ready.`);
}

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
  if (r.id === 0 && race.laps > 1) radio(race, pick(LINES.limits[Math.min(r.strikes, 4) - 1]!));
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
        if (r.id === 0) radio(race, pick(LINES.overtake), true);
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
  // Clipping until back to CLIP_TO, unless the lap's allowance runs out first.
  const flat = input.gas && v > 40;
  if (!flat || r.charge >= CLIP_TO || room <= 0) r.clipping = false;
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
const TOW_TOP = 20 / 3.6;
// How much of the full tow a car is getting, 0 to 1.
export const towShare = (r: Racer) => r.tow / TOW_TOP;
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
        !o.out &&
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

// A hit that cost a car `loss` m/s: out of the race over `limit`, lasting damage over DENT, and car
// to car it can puncture a tyre. Nudges queueing in the pit lane don't count.
function impact(race: Race, r: Racer, loss: number, limit: number) {
  if (!race.incidents || r.out || r.pit || r.finish !== null) return;
  if (loss >= limit) return retire(race, r, "Crash", true);
  if (loss > DENT) r.damage = Math.min(DAMAGE, r.damage + (0.05 * (loss - DENT)) / (limit - DENT));
  if (limit === SMASH && loss > 8 && race.rand() < 0.08) puncture(race, r);
}
// A puncture: with damage too it's the end, else the car limps to its box at the first chance.
function puncture(race: Race, r: Racer) {
  if (r.puncture) return;
  r.puncture = true;
  say(race, "out", r.id, `Puncture · ${code(race, r)}`);
  if (r.damage > 0.1) {
    [r.failAt, r.fault] = [r.dist + 1, "Puncture damage"];
    return;
  }
  [r.stops, r.plan] = [[firstChance(race, r)], [r.tyre, nextSet(race, r)]];
  if (r.id === 0) boxCall(race, r, pick(LINES.puncture));
}
// Covering the undercut: a rival within about two seconds that has just stopped brings a car in
// this lap, if its own stop's within three laps anyway. ponytail: "two seconds" is 150 m either
// side of where it was before its stop.
function cover(race: Race, r: Racer) {
  const { LENGTH, STOP_LAPS } = race.track;
  const k = r.stops.findIndex((n) => n > r.laps);
  const next = r.stops[k];
  if (next === undefined || next - r.laps > 3 || next === r.laps + 1) return;
  const near = race.racers.some((o) => {
    const d = o.dist - r.dist;
    return (
      o !== r &&
      !o.out &&
      o.stints.length > 1 &&
      o.set >= r.laps - 1 &&
      o.set > r.set &&
      d < 150 &&
      d > -STOP_LAPS * LENGTH - 150
    );
  });
  if (near) r.stops[k] = r.laps + 1;
}
// Racing again: the wrecks are cleared away.
function green(race: Race) {
  race.neutral = null;
  for (const r of race.racers) r.wreck = false;
  say(race, "sc", -1, "Green flag");
}
// The Safety Car, VSC and blue flags for a frame: drives the Safety Car, ends a VSC, and sets
// every car's cap and blue flag.
function neutralise(race: Race, dt: number) {
  const { LENGTH, PIT_IN, ahead: fwd, atDist, lateral, limitAt, nearest, pointAt } = race.track;
  const rs = race.racers.filter((r) => !r.out);
  for (const r of rs) [r.cap, r.blue] = [Infinity, 0];
  const n = race.neutral;
  const pace = (m: number) => Math.min(SC_TOP, SC_PACE * limitAt(atDist(m + 5), 1));
  if (n?.kind === "vsc") {
    if (!n.ending && race.t > n.end - 5000) {
      n.ending = true;
      say(race, "sc", -1, "VSC ending");
    }
    if (race.t >= n.end) green(race);
    else for (const r of rs) r.cap = VSC_V;
  }
  const sc = race.sc;
  if (sc && n) {
    const m = sc.p * LENGTH;
    const want = pace(m);
    const steer = aim(sc.car, pointAt(m + 10 + sc.car.v * 0.25, 0));
    step(sc.car, { gas: sc.car.v < want, brake: sc.car.v > want + 1, steer }, dt, false, 1, TOP);
    const p = nearest(sc.car.x, sc.car.y).p;
    sc.run += fwd(m, p * LENGTH);
    sc.p = p;
    if (!n.ending && sc.run > 0.75 * LENGTH) {
      n.ending = true;
      say(race, "sc", -1, "Safety Car in this lap");
    }
    // ponytail: it's gone at the pit entry rather than drive down the lane.
    const s = race.track.signed(p);
    if (n.ending && s > PIT_IN - 30 && s < PIT_IN) race.sc = null;
  }
  // In the queue nobody passes: each car keeps its distance to the one ahead on track (the Safety
  // Car, for the leader). With the Safety Car in, whoever has nothing close ahead (the leader)
  // runs at its pace to the line.
  for (const r of rs) {
    if (!r.held || r.pit) continue;
    const m = r.p * LENGTH;
    let [gap, v] = race.sc ? [fwd(m, race.sc.p * LENGTH), race.sc.car.v] : [Infinity, 0];
    for (const o of rs) {
      const d = fwd(m, o.p * LENGTH);
      if (o !== r && !o.pit && d < gap) [gap, v] = [d, o.car.v];
    }
    r.cap = race.sc || gap < 300 ? behind(v, gap, carGrip(race, r)) : pace(m);
  }
  if (race.neutral || rs.some((r) => r.held)) return;
  // Blue flags: a car a lap or more up, up to 60 m behind on track, is let by, lifting to BLUE_V
  // at the least: held to the car behind's speed alone, it stops when that car slows behind it,
  // and the pair stop dead in a corner.
  for (const r of rs) {
    if (r.pit || r.finish !== null) continue;
    for (const o of rs) {
      const up = o.dist - r.dist > LENGTH / 2;
      if (!up || o.pit || o.finish !== null || fwd(o.p * LENGTH, r.p * LENGTH) > 60) continue;
      const side = lateral(r.car.x, r.car.y, r.p) - lateral(o.car.x, o.car.y, o.p);
      r.blue = Math.sign(side) || 1;
      r.cap = Math.min(r.cap, Math.max(BLUE_V, o.car.v - 6));
    }
  }
}

// A frame's wear over `ds` m (see TYRES): `turn` is what the steering asked of the grip (step),
// turning right with the left tyres on the outside, and `edge` how far past the tarmac the car is.
function wearTyres(race: Race, r: Racer, input: Input, turn: number, edge: number, ds: number) {
  const base = (lapWear(r.tyre, race.laps, race.track) / race.track.LENGTH) * ds;
  const u = Math.min(1, Math.abs(turn));
  const pedal = (input.brake ? BRAKING : 0) - (input.gas ? TRACTION : 0);
  const grass = allFourOff(edge) ? GRASS * ds : 0;
  let lost = 0;
  r.wear = r.wear.map((w, k) => {
    const [front, left] = [k < 2 ? 1 : -1, k % 2 === 0];
    const load = 1 + (left === turn > 0 ? LOAD : -LOAD) * u + front * (FRONT * u + pedal);
    const d = base * load + grass;
    lost += d / 4;
    return Math.max(0, w - d);
  });
  r.life = Math.max(0, r.life - lost);
}

// One frame for every car. `you` is the player's input, or null to hold them (before the lights).
// Returns the player's split, if this frame made one.
export function tick(race: Race, you: Input, dt: number): Split | null {
  race.t += dt * 1000;
  engineer(race);
  const { LENGTH, PIT_IN, PIT_OUT, PIT_SIDE } = race.track;
  const { collide, dirAt, inPit, lateral, nearest, signed } = race.track;
  // Race distance between the checkpoints the gaps are timed at.
  const CP = LENGTH / 50;
  let mine: Split | null = null;
  neutralise(race, dt);
  for (const r of race.racers) {
    // Out of the race: a wreck sits where it stopped, until it's cleared away.
    if (r.out) continue;
    const { car } = r;
    const { edge: e, p } = nearest(car.x, car.y);
    // Progress only counts small steps, so a jump to another part of the lap doesn't.
    let dp = p - r.p;
    dp -= Math.round(dp);
    const was = r.dist;
    if (Math.abs(dp) < 0.02) r.dist += dp * LENGTH;
    const from = r.p * LENGTH;
    r.p = p;
    r.pit = inPit(car.x, car.y, p);
    const edge = r.pit ? -1 : e;
    const s = signed(p);
    // A breakdown, called on the radio if it's yours: near the pit entry the car limps to its box.
    if (r.finish === null && was < r.failAt && r.dist >= r.failAt) {
      const limp = s > PIT_IN - LIMP && s < PIT_IN - 10;
      if (limp) [r.stops, r.plan] = [[r.laps + 1], [r.tyre, r.tyre]];
      if (r.id === 0)
        radio(race, `${pick(LINES.problem)} ${pick(limp ? LINES.limp : LINES.pullOver)}`);
    }
    const failed = r.dist >= r.failAt;
    // A computer car (or a broken-down one) heads in at the end of a lap it planned to stop on,
    // with that stint's set.
    const due = r.stops.indexOf(r.laps + 1);
    if ((r.id || failed) && due >= 0 && s > PIT_IN - 200 && s < PIT_IN && !r.pitting) {
      r.pitting = true;
      r.fit = r.plan[due + 1] ?? null;
      // The cars either side of you, boxing.
      if (r.id && race.eng.near.includes(r.id) && r.fit)
        radio(race, pick(LINES.rival)(code(race, r), TYRES[r.fit].name), true);
    }
    if (s > PIT_OUT || s < PIT_IN - 200) r.pitting = false;

    // Anyone in the lane is driven down it: you to your box when the team takes over, and a
    // computer car that strays in without a stop planned, or any car after the flag, straight
    // through. After the flag the team drives you round too, and once you've broken down.
    if (!r.pit) r.through = false;
    else if (!r.pitting && (r.id || r.finish !== null)) r.through = true;
    if (r.pit) r.pitting = true;
    const input = r.id === 0 && !r.pitting && r.finish === null && !failed ? you : aiInput(r, race);
    const moved = Math.abs(dp) < 0.02 && dp > 0;
    // Over the line once the Safety Car's in: racing again, the first across bringing the green.
    if (r.held && !race.sc && moved && p * LENGTH < from) {
      r.held = false;
      if (race.neutral?.kind === "sc") green(race);
    }
    wake(race, r);
    const top =
      power(race, r, from, p * LENGTH, moved, input) + battery(race, r, input, dt) + r.tow;
    const g = carGrip(race, r);
    const v0 = car.v;
    const turn = step(
      car,
      input,
      dt,
      onGrass(edge),
      g,
      top * (1 - r.damage) * r.form * wingTop(r.wing) * race.cars[r.id >> 1]!,
    );
    // Held to a Safety Car, the VSC or a blue flag, braking down to it; limping, slowing gently so
    // nobody runs into the back of it.
    if (car.v > r.cap) car.v = Math.max(0, r.cap, Math.min(car.v, v0 - brakeAt(v0) * g * dt));
    const limp = failed ? LIMP_V : r.puncture ? PUNCTURE_V : Infinity;
    if (car.v > limp) car.v = Math.max(limp, Math.min(car.v, v0 - LIMP_BRAKE * dt));
    pitStop(race, r, dt);
    if (r.out) continue;
    const hit = car.v;
    collide(car);
    impact(race, r, hit - car.v, CRASH);
    // Broken down and rolled to a stop.
    if (failed && !r.out && !r.pit && car.v < 0.5) retire(race, r, r.fault);
    if (r.out) continue;
    const v = Math.abs(car.v);
    wearTyres(race, r, input, turn, edge, dt * v);
    r.warm = Math.min(1, r.warm + (dt * v) / (TYRES[r.tyre].warm * LENGTH));
    if (race.incidents && r.life <= 0 && r.finish === null && race.rand() < 0.05 * dt)
      puncture(race, r);
    r.wrong = Math.cos(car.h - dirAt(p)) < -0.5 && car.v > 4.2 ? r.wrong + dt : 0;
    // Track limits, once per trip off. The pit lane's side doesn't count, to 30 m past the exit
    // for a car rejoining alongside another, nor being pushed off: contact in the last second
    // excuses it.
    const entry = s > PIT_IN && s < PIT_OUT + 30 && PIT_SIDE * lateral(car.x, car.y, p) > 0;
    const off = allFourOff(edge) && !entry && r.finish === null && r.lap.start !== null;
    if (off && !r.off && race.t - r.touchT > 1000) strike(race, r);
    r.off = off;
    // On a set near the cliff with no stop planned, the team calls you in anyway.
    const planned = r.stops.some((n) => n > r.laps);
    // Not in the sprint: the set's to last to the flag.
    const cliff = r.life < CLIFF_AT + 0.05 && !sprint(race.laps);
    if (r.id === 0 && cliff && !r.boxCall && !planned && r.finish === null)
      boxCall(race, r, pick(LINES.cliff));
    // Into the lane without the call: the team still has a set out.
    if (r.id === 0 && r.pit && !r.served && r.fit === null) {
      r.fit = nextSet(race, r);
      radio(race, `${pick(LINES.unannounced)} ${TYRES[r.fit].name} ready.`);
    }

    // Laps after the flag are cool-down laps and count for nothing.
    const split = r.finish === null ? lapTick(r.lap, p, edge, race.t, dt * 1000) : null;
    const sec = split?.sector ?? 0;
    if (split?.valid && (!race.sectors[sec] || split.ms < race.sectors[sec]!))
      race.sectors[sec] = split.ms;
    if (split?.lap) {
      r.laps++;
      r.harvested = 0;
      if (r.id) r.form = 1 + FORM * (2 * race.rand() - 1);
      if (split.valid && (!r.best || split.lap < r.best)) r.best = split.lap;
      if (split.valid && (!race.fastest || split.lap < race.fastest.ms)) {
        race.fastest = { id: r.id, ms: split.lap };
        say(race, "fastest", r.id, `Fastest lap · ${driver(race, r.id).code} · ${fmt(split.lap)}`);
      }
      if (r.id === 0) lapCall(race, r, split.lap, split.valid);
      const leaderDone = race.racers.some((o) => o.finish !== null);
      if (r.finish === null && (r.laps >= race.laps || leaderDone)) r.finish = race.t;
      // The team re-plans at the line (not with the car on its way to a stop), and calls you in on
      // the lap you're to stop.
      if (r.finish === null && !failed && !r.puncture && !r.pitting) {
        replan(race, r);
        if (r.id) cover(race, r);
        else if (r.stops.includes(r.laps + 1))
          boxCall(
            race,
            r,
            new Set(r.stints).size < 2 && r.laps >= race.laps - 2
              ? pick(LINES.compound)
              : pick(LINES.box),
          );
      }
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
    for (let b = a + 1; b < rs.length; b++) {
      // ponytail: wrecks aren't solid, so nobody piles into one; the computer steers round them.
      const [x, y] = [rs[a]!, rs[b]!];
      if (x.out || y.out) continue;
      // How fast they were closing, along the line between them.
      const [vx, vy] = [x.car.v, y.car.v];
      if (!bump(x.car, y.car)) continue;
      x.touchT = y.touchT = race.t;
      impact(race, x, vx - x.car.v, SMASH);
      impact(race, y, vy - y.car.v, SMASH);
    }
  // Done once every car has taken the flag or is out, or, should one never get there, three
  // average laps after the winner.
  const won = Math.min(...rs.map((r) => r.finish ?? Infinity));
  if (rs.every((r) => r.finish !== null || r.out) || race.t - won > (3 * won) / race.laps)
    race.done = true;
  return mine;
}

export const wrongWay = (r: Racer) => r.wrong > 1;

// Running order: finishers by time with penalties added, then everyone else by distance, and
// the cars out of the race last.
export const order = (race: Race) =>
  race.racers
    .slice()
    .sort(
      (a, b) =>
        +!!a.out - +!!b.out ||
        (a.finish !== null || b.finish !== null
          ? (a.finish ?? Infinity) + a.penalty - ((b.finish ?? Infinity) + b.penalty)
          : b.dist - a.dist),
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
// speed so far. Then the cars out of the race, furthest first, and last any disqualified for
// finishing on a single compound.
export function results(race: Race) {
  const total = race.laps * race.track.LENGTH;
  return race.racers
    .map((r) => {
      const run = r.finish ?? race.t + (total - r.dist) / (Math.max(r.dist, 1) / race.t);
      const time = run + r.penalty;
      const down = race.laps - r.laps;
      const { id, best, penalty, stints, out } = r;
      const dsq = r.finish !== null && !sprint(race.laps) && new Set(stints).size < 2;
      return { id, time, down, best, penalty, stints, stops: stints.length - 1, out, dsq };
    })
    .sort((a, b) => +a.dsq - +b.dsq || +!!a.out - +!!b.out || a.down - b.down || a.time - b.time);
}
