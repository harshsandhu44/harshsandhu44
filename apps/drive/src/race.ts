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
// How close (centre to centre, m) a computer car gets behind a slower one before pulling out to
// pass it: about a car's length between them, near the follow distance at speed.
const PULL = 12;
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
export const aim = (car: Car, [x, y]: [number, number]) => {
  let diff = Math.atan2(y - car.y, x - car.x) - car.h;
  diff = Math.atan2(Math.sin(diff), Math.cos(diff));
  return Math.max(-1, Math.min(1, diff * 4));
};
// A computer car's extra grip: its level's edge (1 below pro), or the track's own for pro and
// legends.
export const edgeOf = ({ level: lv, track }: Race) =>
  (lv === "pro" ? track.PRO_EDGE : lv === "legends" ? track.LEGENDS_EDGE : undefined) ??
  LEVELS[lv].edge;
// A car's grip on its tyres, wing and car: a computer car's (or your simulated one's) scaled by its edge. Close behind another car its
// dirty air takes some of that, and so do cold tyres and damage; on a puncture it has little.
export const carGrip = (race: Race, r: Racer) => {
  const g =
    grip(r.life, r.tyre) *
    wingGrip(r.wing) *
    (r.id || race.sim ? edgeOf(race) : 1) *
    (1 - r.dirty) *
    (1 - COLD * (1 - r.warm)) *
    (1 - r.damage) *
    (1 + race.rubber) *
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
type Team = [name: string, color: string, a: Seat, b: Seat, livery?: Livery];
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
  const all: Team[] = [["BMW", BMW, ["HAR", "You", 0], mate, BMW_LIVERY], ...teams];
  return {
    series,
    line,
    pace,
    slip,
    edge,
    teams: all.map(([name]) => name),
    colors: all.map(([, c]) => c),
    liveries: all.map(
      ([, c, , , livery], k): Livery =>
        livery ?? [AUTO[k % AUTO.length]!, c, shade(c), pale(c) ? "#15151e" : "#f2f2ef"],
    ),
    drivers: all
      .flatMap(([, , a, b]) => [a, b])
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
      ["Campos Racing", "#ff6b1a", ["UGO", "Ugo Ugochukwu", 99], ["NAE", "Théophile Naël", 95]],
      ["Trident", "#1d3b8a", ["SLA", "Freddie Slater", 98], ["STR", "Noah Strømsted", 90]],
      ["MP Motorsport", "#f2c230", ["TAP", "Tuukka Taponen", 97], ["COL", "Mattia Colnaghi", 87]],
      ["ART Grand Prix", "#f2f2ef", ["KAT", "Taito Kato", 96], ["GLA", "Maciej Gładysz", 88]],
      [
        "Van Amersfoort Racing",
        "#f070b2",
        ["YAM", "Hiyu Yamakoshi", 91],
        ["DEL", "Bruno del Pino", 89],
      ],
      ["Rodin Motorsport", "#0d5c3a", ["CLE", "Pedro Clerot", 94], ["BAD", "Brando Badoer", 92]],
      ["Prema Racing", "#b0122b", ["WHA", "James Wharton", 83], ["SHA", "Louis Sharp", 78]],
      ["Hitech", "#b9bec4", ["NAK", "Jin Nakamura", 86], ["MCL", "Fionn McLaughlin", 79]],
      ["DAMS Lucas Oil", "#2f6df0", ["LAC", "Nicola Lacorte", 81], ["XIE", "Gerrard Xie", 77]],
      ["AIX Racing", "#7a2bd6", ["DAV", "Yevan David", 82], ["BAR", "Fernando Barrichello", 76]],
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
      ["Campos Racing", "#ff6b1a", ["TSO", "Nikola Tsolov", 98], ["LEO", "Noel León", 94]],
      ["Invicta Racing", "#c8a24a", ["CAM", "Rafael Câmara", 99], ["DUR", "Joshua Dürksen", 92]],
      [
        "Rodin Motorsport",
        "#0d5c3a",
        ["DUN", "Alex Dunne", 97],
        ["STE", "Martinius Stenshorne", 93],
      ],
      ["MP Motorsport", "#f2c230", ["MIN", "Gabriele Minì", 96], ["GOE", "Oliver Goethe", 85]],
      ["DAMS Lucas Oil", "#2f6df0", ["BEG", "Dino Beganovic", 95], ["BIL", "Roman Bilinski", 84]],
      [
        "ART Grand Prix",
        "#f2f2ef",
        ["MAI", "Kush Maini", 91],
        ["INT", "Tasanapol Inthraphuvasak", 89],
      ],
      ["Trident", "#1d3b8a", ["HOE", "Laurens van Hoepen", 90], ["BEN", "John Bennett", 86]],
      ["Hitech", "#b9bec4", ["MIY", "Ritomo Miyata", 88], ["HER", "Colton Herta", 81]],
      [
        "Van Amersfoort Racing",
        "#f070b2",
        ["VIL", "Rafael Villagómez", 87],
        ["YAM", "Hiyu Yamakoshi", 77],
      ],
      ["Prema Racing", "#b0122b", ["MON", "Sebastián Montoya", 83], ["BOY", "Mari Boya", 80]],
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
        "Mercedes",
        "#27f4d2",
        ["ANT", "Kimi Antonelli", 93, 77],
        ["RUS", "George Russell", 92, 93],
        ["fade", "#c3c8cc", "#121416", "#27f4d2"],
      ],
      [
        "Ferrari",
        "#a6051a",
        ["HAM", "Lewis Hamilton", 95, 91, true],
        ["LEC", "Charles Leclerc", 93, 91],
        ["pods", "#c8102e", "#1a1a1a", "#f2f2ef"],
      ],
      [
        "McLaren",
        "#ff8000",
        ["NOR", "Lando Norris", 94, 85],
        ["PIA", "Oscar Piastri", 91, 84],
        ["split", "#ff8000", "#23272b", "#f2f2ef"],
      ],
      [
        "Red Bull",
        "#1e41ff",
        ["VER", "Max Verstappen", 97, 82, true],
        ["HAD", "Isack Hadjar", 87, 82],
        ["nose", "#1e2a5e", "#d71e28", "#ffcc00"],
      ],
      [
        "Racing Bulls",
        "#6692ff",
        ["LAW", "Liam Lawson", 81, 74],
        ["LIN", "Arvid Lindblad", 78, 66],
        ["fade", "#f2f2ef", "#1634cc", "#d71e28"],
      ],
      [
        "Alpine",
        "#ff87bc",
        ["GAS", "Pierre Gasly", 86, 78],
        ["COL", "Franco Colapinto", 75, 74],
        ["split", "#ff87bc", "#0a2a8a", "#f2f2ef"],
      ],
      [
        "Haas",
        "#b6babd",
        ["BEA", "Oliver Bearman", 84, 70],
        ["OCO", "Esteban Ocon", 84, 84],
        ["pods", "#e8e9ea", "#1a1a1a", "#d4002a"],
      ],
      [
        "Audi",
        "#4a4f55",
        ["HUL", "Nico Hülkenberg", 85, 85],
        ["BOR", "Gabriel Bortoleto", 82, 77],
        ["fade", "#a7abb0", "#141414", "#f50537"],
      ],
      [
        "Williams",
        "#64c4ff",
        ["SAI", "Carlos Sainz", 85, 80],
        ["ALB", "Alexander Albon", 83, 76],
        ["nose", "#041e42", "#64c4ff", "#f2f2ef"],
      ],
      [
        "Aston Martin",
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
      ["Ferrari", "#a6051a", ["SCH", "Michael Schumacher", 100], ["LAU", "Niki Lauda", 88]],
      ["Mercedes", "#27f4d2", ["HAM", "Lewis Hamilton", 88], ["FAN", "Juan Manuel Fangio", 100]],
      ["McLaren", "#ff8000", ["SEN", "Ayrton Senna", 100], ["PRO", "Alain Prost", 100]],
      ["Red Bull", "#1e41ff", ["VER", "Max Verstappen", 100], ["VET", "Sebastian Vettel", 80]],
      ["Williams", "#64c4ff", ["PIQ", "Nelson Piquet", 82], ["MAN", "Nigel Mansell", 79]],
      ["Team Lotus", "#0d5c3a", ["CLA", "Jim Clark", 96], ["FIT", "Emerson Fittipaldi", 74]],
      ["Brabham", "#f2f2ef", ["BRA", "Jack Brabham", 62], ["HIL", "Graham Hill", 58]],
      ["Tyrrell", "#1d3b8a", ["STE", "Jackie Stewart", 77], ["ASC", "Alberto Ascari", 100]],
      ["Renault", "#f2c230", ["ALO", "Fernando Alonso", 100], ["HAK", "Mika Häkkinen", 69]],
      ["Lotus", "#c9b037", ["ROS", "Nico Rosberg", 79], ["RAI", "Kimi Räikkönen", 71]],
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
// A puncture, from contact or a set run to nothing, costs grip (carGrip), not top speed.
const FAIL = 0.04;
const FAULTS = ["Engine", "Gearbox", "Hydraulics", "Power unit", "Brakes"];
const LIMP = 800;
const LIMP_V = 30;
const CRASH = 50;
const SMASH = 25;
const DENT = 10;
const DAMAGE = 0.15;
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
// The slowest a blue flag holds a car to, and how long its closing speed is averaged over (see
// the blue flags below).
const BLUE_V = 20;
const CLOSE_T = 2;
// Under the Safety Car, lapped cars are waved through from half a lap behind it, with more than
// UNLAP_LAPS to go, at UNLAP_PACE of the corner speeds, and back in the queue once within
// REJOIN m of its tail. ponytail: should one never get back, it rejoins where it is after
// UNLAP_MAX laps behind the Safety Car.
const UNLAP_LAPS = 3;
const UNLAP_PACE = 1;
const REJOIN = 150;
const UNLAP_MAX = 4;

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
  // every set run so far and the lap each went on, for the results, and the lap the set on the
  // car went on.
  tyre: Tyre;
  fit: Tyre | null;
  stints: Tyre[];
  sets: number[];
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
  // Track limits: excursions so far, whether off now, time still to serve (ms; added at the flag
  // if not at a stop), time served at the box, and the last contact with another car, which
  // excuses the next excursion for a second.
  strikes: number;
  off: boolean;
  penalty: number;
  paid: number;
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
  // What the steering asked of the grip last frame, over 1 at the limit (track.ts step): the
  // tyres' squeal.
  slide: number;
  // You: whether the team has already called you in on these tyres, and whether you've asked to
  // box while it drives you (see teamDriving).
  boxCall: boolean;
  box: boolean;
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
  // puncture, and the wheel it's on (in CORNERS' order).
  out: string | null;
  wreck: boolean;
  failAt: number;
  fault: string;
  damage: number;
  puncture: boolean;
  flat: number;
  // Queued behind the Safety Car until it crosses the line at the restart, or lapped and waved
  // through to the back of the queue; the top speed a Safety Car, VSC or blue flag holds it to;
  // the blue flag: 0, or the side (+1 right of the faster car) to move over to; and how fast the
  // car a lap up behind is closing (m/s, averaged).
  held: boolean;
  unlap: boolean;
  cap: number;
  blue: number;
  close: number;
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
  // Each team's car (see drawCars), for the weekend, and the grid as driver ids front to back.
  cars: number[];
  grid: number[];
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
  // A VSC or Safety Car: when a VSC ends, whether it's ending, whether lapped cars have been
  // waved through, and the handover call held for you while you were boxing (see handover).
  neutral: {
    kind: "sc" | "vsc";
    end: number;
    ending: boolean;
    wave: boolean;
    owed?: string;
  } | null;
  sc: { car: Car; p: number; run: number } | null;
  // What your engineer last said, so it's said once (see engineer).
  eng: Engineer;
  // Full qualifying (see newSession), or null, and the grip the track's rubbered in by.
  session: Session | null;
  rubber: number;
  // Your car simulated: the team drives it, with a computer car's edge.
  sim?: boolean;
  // The team handing your car back: Infinity while it drives, then the countdown's ms (see HAND).
  hand: number;
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
      sets: [0],
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
      paid: 0,
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
      slide: 0,
      boxCall: false,
      box: false,
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
      flat: 0,
      held: false,
      unlap: false,
      cap: Infinity,
      blue: 0,
      close: 0,
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
    grid,
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
    session: null,
    rubber: 0,
    hand: 0,
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
      owed: 0,
      touch: 0,
      blue: -1,
      hurt: 0,
      gaps: {},
      gapLap: 0,
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
    // Nor does the team, driving yours.
    const risk = race.slips && r.slip > 0 && r.cap === Infinity && r.id > 0;
    r.mistake = risk && race.rand() < r.slip + 0.08 * (1 - r.life) ? k : -1;
  }
  if (r.mistake >= 0 && fwd(CORNERS[r.mistake]!.at, m) < 200) r.mistake = -1;
  const at = atDist(m + 5);
  // How far ahead on track another car is (behind, less than 0), so cars a lap apart are traffic
  // to each other too.
  const gap = (o: Racer) => {
    const d = fwd(m, o.p * LENGTH);
    return d > LENGTH / 2 ? d - LENGTH : d;
  };
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
        const ds = gap(o);
        const back = from < 0 ? from - Math.max(0, o.car.v - car.v) : from;
        return (
          o !== r &&
          !o.out &&
          ds > back &&
          ds < to &&
          Math.abs(off(o) - lane) < 2 * CAR_HALF_WIDTH + 0.2
        );
      })
      .sort((a, b) => gap(a) - gap(b))[0];
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
      want = Math.min(want, block.car.v + Math.sqrt(16 * Math.max(0, gap(block) - 7)));
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
      (o) => o !== r && !o.out && o.pit && o.car.v > 2 && fast(o) && gap(o) > -20 && gap(o) < 4,
    );
    if (r.served && s - box < 3 && traffic) want = 0;
  } else {
    // Off the line the corners are tighter than the line's speeds, so a driver who never makes
    // a mistake only pulls out with no corner coming, and is back on the line for the next. Under
    // the Safety Car nobody pulls out but the lapped cars waved through, past anything but each
    // other, and kept off the Safety Car's line while near it.
    const clear =
      r.unlap || (!r.held && (slip > 0 || limitAt(at, g * r.pace * r.form, line) > car.v + PASS));
    if (!clear) r.lane = 0;
    const sc = race.sc && r.unlap ? fwd(m, race.sc.p * LENGTH) : Infinity;
    const bySc = sc < 150 || (sc < LENGTH && sc > LENGTH - 30);
    if (bySc && !r.lane) r.lane = SPACE;
    // Sat in the tow until close enough to pull out and go by: from further back it'd only lose
    // the tow and have to drop in behind again.
    const block = ahead(lat(r.lane) - base, 0, PULL);
    if (block && block.car.v < car.v + 1 && !(r.unlap && block.unlap)) {
      // A blue-flagged car is passed whatever's coming.
      const free =
        clear || (block.blue && !r.held)
          ? [SPACE, -SPACE, 0].find((l) => !ahead(lat(l) - base, -8))
          : undefined;
      if (free !== undefined && race.t > r.laneT) [r.lane, r.laneT] = [free, race.t + 2000];
    } else if (r.lane && race.t > r.laneT && !bySc && !ahead(lat(0) - base, -10)) r.lane = 0;
    // Shown the blue flag, over to the side away from the faster car.
    to = lat(r.blue ? r.blue * SPACE : r.lane);
    // Behind a car where it is now, at a safe distance: looking far enough ahead to stop for a
    // queue at a hairpin.
    const front = ahead(mine, 0, 120);
    if (front) {
      const held = behind(front.car.v, gap(front), g);
      if (race.session && held < want) impeding(race, r, front, gap(front));
      want = Math.min(want, held);
    }
  }
  let held = false;
  if (r.pitting) {
    // In the lane, don't turn into a car alongside: hold the line until one of you is clear. A
    // car heading for the pit entry (before the line) has the line over any car it leads, or one
    // tucked in on its right shuts it out; rejoining after the line it doesn't, or the cars
    // rejoining together all squeeze onto one line and lean on each other to a stop.
    held = race.racers.some((o) => {
      const d = lateral(o.car.x, o.car.y, o.p) - now;
      const ds = gap(o);
      return (
        o !== r &&
        !o.out &&
        Math.abs(ds) < 6 &&
        !(s < 0 && ds < 0) &&
        d * (to - now) > 0 &&
        Math.abs(d) < 3
      );
    });
    if (held) to = now;
  } else
    // On track, a car's width for any car alongside, moving over to make it. With no room on its
    // side, the car further back lifts and drops in behind; the one ahead keeps what room it can.
    for (const o of race.racers) {
      const ds = gap(o);
      const lo = off(o) + base;
      if (o === r || o.out || Math.abs(ds) > 2 * CAR_HALF_LENGTH + 1 || Math.abs(to - lo) >= SPACE)
        continue;
      held = true;
      const side = Math.sign(mine - off(o)) || 1;
      to = Math.max(-room, Math.min(room, lo + side * SPACE));
      if (Math.abs(to - lo) < SPACE - 0.1 && ds > 0) want = Math.min(want, o.car.v - 2);
    }
  // A wreck ahead, or a car stopped on track (one that never left the grid, say): round it on the
  // side with more room, whatever's coming.
  if (!r.pitting)
    for (const o of race.racers) {
      const stopped = o !== r && !o.out && !o.pit && o.car.v < 1 && !r.held && car.v > 5;
      if (!(o.wreck || stopped) || fwd(m, o.p * LENGTH) > 150) continue;
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
// The classification: each car's lap (0 for none) and its sectors (0 for none, from its own
// race's), quickest first and no time last.
export const qualiOrder = (q: Race[]) =>
  q
    .map(({ racers: [r], sectors }) => ({ id: r!.id, best: r!.best, sectors }))
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

// Full qualifying, as the F1 games run it: Q1, Q2 and Q3 on the clock, the whole field on track
// together. Each segment's clock runs SEGMENTS average laps; the slowest go out after Q1 and Q2,
// leaving CUTS through, and the grid is Q3's order, then Q2's and Q1's for those out. A lap
// counts only if it starts before the flag. Every car waits in its garage (out of the race as
// GARAGE, so nothing on track sees it), goes out on a set of softs from its SETS for the session,
// drives an out-lap at COOL of its pace, pushes, and back in at its box is in the garage again.
// The computer goes out at times planned per segment: its last run to push just before the flag,
// and an early one where a whole run (RUN average laps) fits before that; a new set each run while
// it has one. The track rubbers in, up to RUBBER more grip by the end of Q3. A car stopped on
// track brings the red flag: the clock stops, every car's back in its garage, and after RED ms
// the session goes on; the car that stopped is out for the segment, repaired for the next. Hold
// up a computer car's push lap on yours that isn't for IMPEDE s, within 30 m, and that's
// impeding: a warning, then each time DROP places on the grid.
export const SEGMENTS = [6, 5, 4];
export const CUTS = [16, 10];
export const GARAGE = "Garage";
export const SETS = 5;
const COOL = 0.85;
const RUN = 3.1;
export const RUBBER = 0.015;
const RED = 10_000;
const IMPEDE = 1;
const DROP = 3;
export type Phase = "garage" | "out" | "push" | "in";
export type TyreSet = { wear: number[]; used: boolean };
export type Session = {
  // The segment (0 for Q1), the clock (ms; under 0 after the flag), an average lap (ms), whether
  // it's running, between segments or over, and the red flag's ms still to run (0 for none).
  seg: number;
  left: number;
  lap: number;
  state: "running" | "break" | "done";
  red: number;
  // The cars in each segment so far, and in this one; by id, each car's phase, when (ms into the
  // segment) the computer goes out, its pace on a push lap, the sectors of the lap it's on, its
  // sets, the one on the car (-1 none) and the one you've picked for your next run.
  reached: number[][];
  in: number[];
  phase: Phase[];
  go: number[][];
  pace: number[];
  now: number[][];
  sets: TyreSet[][];
  on: number[];
  pick: number;
  // By segment and id, each car's best lap (0 for none) and that lap's sectors.
  best: number[][];
  sectors: number[][][];
  // Impeding: whether a push lap's lifting for you this frame, for how long (-1 once it's called,
  // until you're clear), the warning, and the places you drop on the grid.
  lifting: boolean;
  held: number;
  // Your speed as a share of the car's limit, smoothed over a couple of seconds: under SLOW you're
  // on a slow lap, whatever the timing says.
  effort: number;
  // Simulated: the team runs your car's session as the computer's. And the team driving your
  // out-lap, asked for (see toggleTeam) and handed back at the line.
  auto: boolean;
  team: boolean;
  warned: boolean;
  drop: number;
};
export const inGarage = (r: Racer) => r.out === GARAGE;
const pushing = (race: Race, r: Racer) => race.session!.phase[r.id] === "push";
// On a push lap for traffic and impeding: yours only while you're on the pace.
const SLOW = 0.85;
const onPush = (race: Race, r: Racer) =>
  pushing(race, r) && (r.id > 0 || race.session!.auto || race.session!.effort >= SLOW);
const lifeOf = (set: TyreSet) => set.wear.reduce((a, b) => a + b, 0) / set.wear.length;
// The set to go out on: a new one while there's one left, else the one with the most life.
export const bestSet = (sets: TyreSet[]) => {
  const fresh = sets.findIndex((t) => !t.used);
  if (fresh >= 0) return fresh;
  return sets.reduce((k, t, i) => (lifeOf(t) > lifeOf(sets[k]!) ? i : k), 0);
};
// About a lap on new softs on the racing line, from the track's speed limits. ponytail: they
// leave out the time a car takes to get up to them, so 4% on, as pole at Monza comes out.
const lapGuess = ({ CUM, PATH, limitAt }: Track) =>
  1040 * PATH.reduce((t, _, i) => t + (CUM[i + 1]! - CUM[i]!) / limitAt(i, grip(1, "soft"), 1), 0);
export function newSession(
  track: Track,
  lv: Level,
  rand = Math.random,
  cars = drawCars(lv, rand),
  auto = false,
) {
  const race = newRace(track, GRID, rand, "soft", lv, 1, true, cars);
  const ids = race.racers.map((r) => r.id);
  const lap = lapGuess(track);
  // Half a race's breakdowns, each somewhere in the session's dozen-odd laps, not on the first.
  for (const r of race.racers) r.failAt *= rand() < 0.5 ? 12 : Infinity;
  race.session = {
    seg: 0,
    left: SEGMENTS[0]! * lap,
    lap,
    state: "running",
    red: 0,
    reached: [ids],
    in: ids,
    phase: ids.map(() => "garage"),
    go: ids.map(() => []),
    pace: race.racers.map((r) => r.pace),
    now: ids.map(() => []),
    sets: ids.map(() => Array.from({ length: SETS }, () => ({ wear: [1, 1, 1, 1], used: false }))),
    on: ids.map(() => -1),
    pick: 0,
    best: SEGMENTS.map(() => ids.map(() => 0)),
    sectors: SEGMENTS.map(() => ids.map(() => [])),
    lifting: false,
    held: 0,
    effort: 1,
    auto,
    team: false,
    warned: false,
    drop: 0,
  };
  for (const r of race.racers) toGarage(race, r);
  plan(race, 0);
  return race;
}
// The computer's runs from `from` ms into the segment: its last to push just before the flag (or
// straight away, if that's past), and an early one where a whole run fits before it. None that
// can't reach the line before the flag: OUT average laps from the garage, with a little to spare.
const OUT = 1.6;
function plan(race: Race, from: number) {
  const s = race.session!;
  const end = SEGMENTS[s.seg]! * s.lap;
  s.go = s.go.map(() => []);
  for (const id of s.in) {
    if ((!id && !s.auto) || end - from < OUT * s.lap) continue;
    const last = Math.min(
      end - OUT * s.lap,
      Math.max(from + 0.3 * race.rand() * s.lap, end - (OUT + 0.6 * race.rand()) * s.lap),
    );
    const early = last - RUN * s.lap;
    s.go[id] = early > from ? [from + race.rand() * (early - from), last] : [last];
  }
}
// Back in the garage: the set comes off, as worn as it is, and the lap in progress is lost.
function toGarage(race: Race, r: Racer) {
  const s = race.session!;
  const b = race.track.BOXES[r.id >> 1]!;
  const k = s.on[r.id]!;
  if (k >= 0 && !r.out) s.sets[r.id]![k]!.wear = r.wear.slice();
  s.on[r.id] = -1;
  Object.assign(r.car, { x: b.x, y: b.y, h: b.h, v: 0 });
  Object.assign(r, {
    out: r.out && r.out !== GARAGE ? r.out : GARAGE,
    wreck: false,
    p: race.track.nearest(b.x, b.y).p,
    pit: true,
    pitting: false,
    stop: 0,
    served: false,
    stops: [],
    box: false,
    lap: newLap(),
    cap: Infinity,
    blue: 0,
  });
  s.phase[r.id] = "garage";
  s.now[r.id] = [];
  if (r.id === 0) s.pick = bestSet(s.sets[0]!);
}
// Out of the garage on set k and a full battery, the team driving down the lane. Not while the
// teammate's still pulling out of the shared box.
function leave(race: Race, r: Racer, k: number) {
  const s = race.session!;
  const box = race.track.BOXES[r.id >> 1]!;
  const mate = race.racers[r.id ^ 1];
  if (mate && !inGarage(mate) && mate.pit && Math.abs(toBox(box, mate.car)) < 15) return false;
  const set = s.sets[r.id]![k]!;
  set.used = true;
  s.on[r.id] = k;
  Object.assign(r, {
    out: null,
    pitting: true,
    served: true,
    tyre: "soft",
    wear: set.wear.slice(),
    life: lifeOf(set),
    warm: 0,
    charge: CAP,
    harvested: 0,
    damage: 0,
    puncture: false,
    pace: s.pace[r.id]! * COOL,
  });
  s.phase[r.id] = "out";
  return true;
}
// Your set for the next run, and out of the garage on it: while the clock's running, you're still
// in, and there's no red flag.
export function pickSet(race: Race, k: number) {
  const s = race.session!;
  if (s.sets[0]![k]) s.pick = k;
}
export function goOut(race: Race) {
  const s = race.session!;
  const me = race.racers[0]!;
  if (s.state === "running" && !s.red && s.left > 0 && inGarage(me) && s.in.includes(0))
    leave(race, me, s.pick);
}
// E: the team drives your out-lap to the line (asked in the garage, for the next run), or takes
// you in off a push lap; again to take it back.
export function toggleTeam(race: Race) {
  const s = race.session;
  const me = race.racers[0];
  if (!s || !me || s.state !== "running" || s.auto) return;
  const phase = s.phase[0];
  if (phase === "garage" || phase === "out") s.team = !s.team;
  else if (phase === "push") goIn(race, me);
  else if (s.left > 0 && !me.pit)
    [s.phase[0], me.pace, me.box, me.pitting] = ["push", s.pace[0]!, false, false];
}
// A lap's sectors as they come, and at the line its time if it was a push lap. A lap starting
// after the flag, or the computer's push lap done, is the in-lap: you're driven in.
function timeLap(race: Race, r: Racer, split: Split | null, started: boolean) {
  const s = race.session!;
  const { phase, now, best, sectors, seg } = s;
  if (split && split.lap === null) now[r.id]!.push(split.valid ? split.ms : 0);
  if (split?.lap) {
    const secs = [...now[r.id]!, split.valid ? split.ms : 0];
    now[r.id] = [];
    const b = best[seg]![r.id]!;
    if (pushing(race, r) && split.valid && (!b || split.lap < b))
      [best[seg]![r.id], sectors[seg]![r.id]] = [split.lap, secs];
    started = true;
  }
  if (!started || phase[r.id] === "in") return;
  if (s.left <= 0 || ((r.id || s.auto) && pushing(race, r))) goIn(race, r);
  else [phase[r.id], r.pace] = ["push", s.pace[r.id]!];
}
// The in-lap: back to the box at the first chance, the team driving yours.
function goIn(race: Race, r: Racer) {
  const s = race.session!;
  [s.phase[r.id], r.pace] = ["in", s.pace[r.id]! * COOL];
  if (r.id) r.stops = [firstChance(race, r)];
  else [r.box, s.team] = [true, false];
}
// A car stopped on track before the flag: the red flag. Every car's back in its garage.
function redFlag(race: Race) {
  const s = race.session!;
  if (s.left <= 0 || s.red) return;
  s.red = RED;
  for (const r of race.racers) toGarage(race, r);
  say(race, "flag", -1, `Red flag · Q${s.seg + 1}`);
}
// Whether a computer car on a push lap is lifting for you, from aiInput: you're the car ahead
// it's held to, within 30 m, not on a push lap yourself.
function impeding(race: Race, r: Racer, front: Racer, gap: number) {
  const { auto } = race.session!;
  const yours = !auto && !teamDriving(race, front);
  if (front.id === 0 && r.id && yours && gap < 30 && pushing(race, r) && !onPush(race, front))
    race.session!.lifting = true;
}
// The segment's ids, quickest first and no time last.
export const segmentOrder = (s: Session, seg: number) =>
  s.reached[seg]!.slice().sort(
    (a, b) => (s.best[seg]![a] || Infinity) - (s.best[seg]![b] || Infinity) || a - b,
  );
// The grid: Q3's order, then the rest of Q2's, then of Q1's, and you down the places you've
// dropped for impeding.
export function sessionGrid(s: Session) {
  const grid: number[] = [];
  for (let seg = s.reached.length - 1; seg >= 0; seg--)
    for (const id of segmentOrder(s, seg)) if (!grid.includes(id)) grid.push(id);
  const k = grid.indexOf(0);
  grid.splice(k, 1);
  grid.splice(Math.min(grid.length, k + s.drop), 0, 0);
  return grid;
}
// A frame of qualifying: the clock (stopped under a red flag), the track rubbering in, the
// computer's runs, then every car, and whether you held a push lap up. Once the flag's out and
// nobody's on a lap that can still count (or three laps on, should one never finish), the
// segment's done and every car's back in its garage, as the F1 games skip the in-laps.
export function tickSession(race: Race, you: Input, dt: number) {
  const s = race.session!;
  if (s.state !== "running") return null;
  const end = SEGMENTS[s.seg]! * s.lap;
  if (s.red) {
    race.t += dt * 1000;
    s.red = Math.max(0, s.red - dt * 1000);
    if (!s.red) {
      say(race, "sc", -1, "Green flag");
      plan(race, end - s.left);
    }
    return null;
  }
  const was = s.left;
  s.left -= dt * 1000;
  if (was > 0 && s.left <= 0) say(race, "flag", -1, `Chequered flag · Q${s.seg + 1}`);
  const at = end - s.left;
  const all = SEGMENTS.reduce((a, b) => a + b, 0) * s.lap;
  const done = SEGMENTS.slice(0, s.seg).reduce((a, b) => a + b, 0) * s.lap;
  race.rubber = (RUBBER * Math.min(all, done + at)) / all;
  for (const r of race.racers) {
    const go = s.go[r.id]!;
    if ((r.id || s.auto) && s.left > 0 && inGarage(r) && go.length && at >= go[0]!) {
      if (leave(race, r, bestSet(s.sets[r.id]!))) go.shift();
    }
  }
  s.lifting = false;
  // Your out-lap: the team hands it back to be yours from the line.
  const me = race.racers[0]!;
  const short = (1 - me.p) * race.track.LENGTH < (me.car.v * HAND) / 1000;
  if (s.team && s.phase[0] === "out" && me.lap.halfway && short) s.team = false;
  const split = tick(race, you, dt);
  if (!me.out) {
    const { LENGTH, atDist, limitAt } = race.track;
    const limit = Math.min(TOP, limitAt(atDist(me.p * LENGTH), carGrip(race, me), 1));
    s.effort += (Math.min(1, me.car.v / limit) - s.effort) * Math.min(1, dt / 2);
  } else s.effort = 1;
  if (!s.lifting) s.held = 0;
  else if (s.held >= 0) s.held += dt;
  if (s.held > IMPEDE) {
    s.held = -1;
    if (!s.warned) {
      s.warned = true;
      say(race, "flag", 0, `Warning · ${driver(race, 0).code} · Impeding`);
      radio(race, pick(LINES.impedeWarn));
    } else {
      s.drop += DROP;
      say(race, "penalty", 0, `${DROP}-place grid penalty · ${driver(race, 0).code} · Impeding`);
      radio(race, pick(LINES.impede));
    }
  }
  const running = race.racers.some((r) => !r.out && s.phase[r.id] !== "in");
  if (s.left <= 0 && (!running || -s.left > 3 * s.lap)) {
    for (const r of race.racers) toGarage(race, r);
    if (s.seg < CUTS.length) {
      s.in = segmentOrder(s, s.seg).slice(0, CUTS[s.seg]);
      s.state = "break";
    } else s.state = "done";
  }
  return split;
}
// On to the next segment, everyone in the garage and the cars that stopped repaired.
export function nextSegment(race: Race) {
  const s = race.session!;
  if (s.state !== "break") return;
  s.seg++;
  [s.left, s.state] = [SEGMENTS[s.seg]! * s.lap, "running"];
  s.reached.push(s.in);
  for (const r of race.racers)
    if (r.out !== GARAGE) [r.out, r.failAt, s.phase[r.id]] = [GARAGE, Infinity, "garage"];
  plan(race, 0);
}

// How far a car is short of a box, down the box's heading: exact at the box, where the lane can
// be far enough out on a bend that the distance round the lap is off by a metre or two.
const toBox = (b: Track["BOXES"][number], car: Car) =>
  (b.x - car.x) * Math.cos(b.h) + (b.y - car.y) * Math.sin(b.h);
// The limiter in the lane and the stop at the box, for any car. Teammates share a box, so one
// that gets there second waits 8 m short of it until the first has gone (a double stack). A car
// that rolls a little past its marks still stops there. A time penalty is served first, like F1:
// the car sits out its seconds before the crew touches it.
function pitStop(race: Race, r: Racer, dt: number) {
  const { car } = r;
  const { BOXES } = race.track;
  if (r.stop > 0) {
    car.v = 0;
    r.stop -= dt;
    if (r.stop <= 0) {
      [r.life, r.served, r.boxCall, r.box, r.warm, r.puncture] = [1, true, false, false, 0, false];
      [r.tyre, r.fit] = [r.fit ?? nextSet(race, r), null];
      r.stints.push(r.tyre);
      // A box before the line: the in-lap was on the old set, as F1 counts a stint.
      r.sets.push(r.laps + (race.track.signed(r.p) < 0 ? 1 : 0));
      [r.set, r.wear, r.wing] = [r.laps, [1, 1, 1, 1], r.nextWing];
    }
    return;
  }
  // A stop's done for the visit: out where the lane merges, a car can read as on track for a
  // moment and back in the lane after, and that's not another stop.
  if (!r.pit) {
    if (!r.pitting) r.served = false;
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
    else {
      r.stop = STOP + r.penalty / 1000;
      if (r.penalty)
        say(race, "penalty", r.id, `${r.penalty / 1000} s penalty served · ${code(race, r)}`);
      [r.paid, r.penalty] = [r.paid + r.penalty, 0];
    }
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
  // Lapped under the Safety Car: the team takes you through, then hands you back.
  unlap: [
    "You're lapped, we'll take you through to the back of the queue.",
    "Lapped cars may overtake. We'll take you round to the back of the queue.",
    "You can unlap yourself. We've got it, back of the queue.",
    "Lapped cars through. Sit back, we'll drive you round.",
    "We're getting the lap back. Leave it with us.",
  ],
  // Under a Safety Car or VSC the team drives you (see teamDriving): taking the car, unless it's
  // calling you in, and handing it back as it ends.
  drive: [
    (k: string) => `${k}. We've got the car, the box is your call.`,
    (k: string) => `${k}. We stay out for track position, unless you want to box.`,
    (k: string) => `${k}, we'll drive. Box is there if you want it.`,
    (k: string) => `${k}. Staying out. Say the word and we'll box.`,
  ],
  yours: ["Your car in three.", "Handing it back in three.", "Three seconds, then it's yours."],
  handover: [
    (k: string) => `${k}. Your car.`,
    (k: string) => `${k}. Over to you, get ready.`,
    (k: string) => `${k}. It's yours, tyres up to temperature.`,
    (k: string) => `${k}. Your car, be ready for the restart.`,
  ],
  rejoin: [
    "Back of the queue. It's yours.",
    "That's the lap back. You have control.",
    "In the queue now, over to you.",
    "Lap back, you're in the queue. Your car.",
    "Back where we belong. Over to you.",
  ],
  damage: [
    "We've got damage. Car feel OK?",
    "Damage on the car. We'll keep an eye on it.",
    "That cost us some downforce. Drive round it.",
    "Damage. Bit less grip from here.",
  ],
  // Qualifying: holding up a push lap, the first time and after.
  impedeWarn: [
    "That's a warning for impeding. Watch the mirrors on the slow laps.",
    "Warning for impeding. Next one costs us grid places.",
    "We've got a warning, impeding. Out of the way on the out-lap, please.",
  ],
  impede: [
    "Three-place grid penalty for impeding. Mirrors, please.",
    "Grid penalty, impeding. That's three places gone.",
    "Impeding again. Three places. The stewards are not amused.",
  ],
  // Qualifying: a car on a push lap closing on you.
  push: [
    (c: string) => `${c} behind on a push lap. Let them by.`,
    (c: string) => `Push lap coming, ${c}. Give them room.`,
    (c: string) => `${c} on a flyer behind. Off the line, please.`,
    (c: string) => `Car behind on a push lap, ${c}. Don't impede.`,
  ],
  blue: [
    (c: string) => `Blue flags. Let ${c} through.`,
    (c: string) => `${c}'s lapping us. Let them by.`,
    (c: string) => `Blue flag, ${c} behind. Don't fight it.`,
    (c: string) => `${c} coming through, blue flags. Give them room.`,
  ],
  gainedStart: [
    (n: string, p: number) => `Gained ${n} off the start. P${p}.`,
    (n: string, p: number) => `P${p}, ${n} up on lap one. Lovely.`,
    (n: string, p: number) => `Up ${n} already. P${p}, keep it going.`,
    (n: string, p: number) => `Great start, ${n} gained. P${p}.`,
  ],
  lostStart: [
    (n: string, p: number) => `Lost ${n} at the start, P${p}. Plenty of time.`,
    (n: string, p: number) => `P${p}, down ${n}. Long way to go.`,
    (n: string, p: number) => `Dropped ${n} on lap one. Settle in, P${p}.`,
    (n: string, p: number) => `P${p}. ${cap(n)} lost, we'll get them back.`,
  ],
  heldStart: [
    (_: string, p: number) => `P${p}, held position. Settle in.`,
    (_: string, p: number) => `P${p}, same as we started. Now push.`,
    (_: string, p: number) => `Clean start, P${p}. Tyres are in, go.`,
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
    "Great stop from the crew,",
    "Smooth stop,",
  ],
  served: [
    (s: string) => `${s} with the penalty. Go get it back.`,
    (s: string) => `Penalty served, ${s}. Clean from here, please.`,
    (s: string) => `${s}, penalty's done. Let's not do that again.`,
    (s: string) => `${s}. Penalty paid, slate's clean.`,
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
  // By strike, at the corner: the first, the second, the black and white flag, then penalties.
  // What counts in a race is the strikes, not the deleted lap.
  limits: [
    [
      (c: string) => `Track limits at ${c}, that's one.`,
      (c: string) => `That's one for track limits, ${c}. Two more and it's the flag.`,
      (c: string) => `Strike one at ${c}. Keep it inside the lines.`,
      (c: string) => `Track limits, ${c}. First one, they're counting.`,
    ],
    [
      (c: string) => `Two now, ${c}. One more and it's the black and white flag.`,
      (c: string) => `Second strike at ${c}. The track is the grey bit.`,
      (c: string) => `That's two, ${c}. The white lines are a suggestion we follow.`,
      (c: string) => `Strike two, ${c}. Next one's the flag.`,
    ],
    [
      (c: string) => `Black and white flag for ${c}. One more and it's a penalty.`,
      (c: string) => `Three, at ${c}. That's the black and white. Next one costs us five seconds.`,
      (c: string) => `Black and white flag. ${c} again? Next one costs time.`,
      (c: string) => `Third strike, ${c}. Black and white flag. Please.`,
    ],
    [
      (c: string) => `Penalty for ${c}. Was it worth it?`,
      (c: string) => `Another penalty, ${c}. The stewards are enjoying this more than we are.`,
      (c: string) => `${c}, penalty. I'll stop telling you where the lines are.`,
      (c: string) => `Penalty at ${c}. At this point it's a lifestyle.`,
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
// spun, the stint the worn-tyres call was for, when you stopped at the box (-1 when not) and the
// seconds of penalty that stop served; the last lap you were in the pit lane or under a Safety
// Car or VSC (not one to call slow), the car the last blue flag call was for, the damage it last
// called, and the gaps either side at the last gaps call, with its lap.
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
  owed: number;
  touch: number;
  blue: number;
  hurt: number;
  gaps: Record<number, number>;
  gapLap: number;
};
// Every tick in a race: a spin, the stop, tyres going off, and twice a second the order, for
// places won and lost (once held for two seconds, not side by side) and a long time last. Places
// change through the stops without a call. Chatter goes if Race Control's busy (see CHATTER).
function engineer(race: Race) {
  const me = race.racers.find((r) => r.id === 0);
  const e = race.eng;
  if (!me || me.out || me.finish !== null || race.laps < 2) return;
  if (me.pit || race.neutral) e.touch = me.laps + 1;
  if (me.damage - e.hurt >= 0.02) {
    e.hurt = me.damage;
    radio(race, pick(LINES.damage));
  }
  const spun = me.wrong > 0.5;
  if (spun && !e.spun) radio(race, pick(LINES.spun), true);
  e.spun = spun;
  if (me.stop > 0 && e.stopped < 0) [e.stopped, e.owed] = [race.t, Math.round(me.stop - STOP)];
  if (me.served && e.stopped >= 0 && me.car.v > 2) {
    const secs = ((race.t - e.stopped) / 1000).toFixed(1);
    const corner = race.track.nextCorner(me.p);
    radio(
      race,
      +secs > STOP + e.owed + 1.5
        ? pick(LINES.held)(secs)
        : e.owed
          ? pick(LINES.served)(secs)
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
  // Lap one: the places against your grid slot.
  if (r.laps === 1) {
    const pos =
      order(race)
        .filter((o) => !o.out)
        .indexOf(r) + 1;
    const n = race.grid.indexOf(r.id) + 1 - pos;
    const places = `${Math.abs(n)} place${Math.abs(n) > 1 ? "s" : ""}`;
    return radio(
      race,
      pick(n > 0 ? LINES.gainedStart : n < 0 ? LINES.lostStart : LINES.heldStart)(places, pos),
    );
  }
  if (race.fastest?.id === 0 && race.fastest.ms === lap)
    return radio(race, `${pick(LINES.fastest)} ${fmt(lap)}.`);
  if (valid && r.laps > 1 && r.best === lap)
    return radio(race, `${pick(LINES.pb)} ${fmt(lap)}.`, true);
  // Not the start, nor a lap any of which was in the pit lane or under a Safety Car or VSC.
  const racing = r.laps > 1 && race.eng.touch < r.laps;
  if (racing && valid && r.best && lap > r.best * 1.04 && r.laps - race.eng.slow >= 4) {
    race.eng.slow = r.laps;
    return radio(race, pick(LINES.slow), true);
  }
  if (r.laps % 3) return;
  const run = order(race);
  const k = run.indexOf(r);
  const e = race.eng;
  const was = e.gaps;
  e.gaps = {};
  const by = (o: Racer | undefined, ahead: boolean) => {
    if (!o || o.out || o.cp < 0 || r.cp < 0) return "";
    const g = Math.abs(gap(race, o) - gap(race, r));
    e.gaps[o.id] = g;
    const then = was[o.id];
    const how = then === undefined ? "" : trend(ahead, then, g, r.laps - e.gapLap);
    return `${code(race, o)} ${ahead ? "ahead" : "behind"} ${g.toFixed(1)}${how}`;
  };
  const gaps = [by(run[k - 1], true), by(run[k + 1], false)].filter(Boolean);
  e.gapLap = r.laps;
  if (gaps.length) radio(race, pick(LINES.gaps)(gaps.join("; ")), true);
}
// How a gap's moved since the last gaps call `laps` ago, a tenth a lap or more, from your side:
// to the car ahead you're taking time or it's pulling away, to the one behind it's closing or
// you're pulling away.
export function trend(ahead: boolean, then: number, now: number, laps: number) {
  const per = (now - then) / Math.max(1, laps);
  if (Math.abs(per) < 0.1) return "";
  const by = `${Math.abs(per).toFixed(1)} a lap`;
  if (ahead) return per < 0 ? `, you're taking ${by}` : `, pulling away ${by}`;
  return per < 0 ? `, closing ${by}` : `, you're pulling ${by}`;
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
  // Qualifying runs softs, and its race is a lap long.
  if (race.session) return "soft";
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
  if (race.session) return redFlag(race);
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
  const k = kind === "sc" ? "Safety Car" : "VSC";
  const lap = race.fastest?.ms ?? 90_000;
  if (kind === "vsc") {
    if (n?.kind === "sc") return;
    if (n) n.end = Math.max(n.end, race.t + VSC_LAPS * lap);
    else {
      race.neutral = { kind, end: race.t + VSC_LAPS * lap, ending: false, wave: false };
      say(race, "sc", -1, "Virtual Safety Car deployed");
    }
  } else if (n?.kind === "sc" && race.sc) [race.sc.run, n.ending] = [0, false];
  else {
    race.neutral = { kind, end: Infinity, ending: false, wave: false };
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
    const stop = !busy && replan(race, r, kind === "sc" ? SC_STOP : VSC_STOP);
    if (r.id) continue;
    if (stop) boxCall(race, r, pick(LINES.neutral)(k));
    else if (race.neutral !== n && teamDriving(race, r)) radio(race, pick(LINES.drive)(k));
  }
}
// The radio calls you in, with the set the team has out (yours if you've picked one).
function boxCall(race: Race, r: Racer, why: string) {
  const k = r.stops.indexOf(firstChance(race, r));
  r.fit ??= (k >= 0 && r.plan[k + 1]) || nextSet(race, r);
  r.boxCall = true;
  const owed = r.penalty ? ` ${r.penalty / 1000} seconds to serve first.` : "";
  radio(race, `${why} ${TYRES[r.fit].name} ready.${owed}`);
}

// One more excursion: the lap's deleted (lapTick does that), and in a race the third brings the
// black and white flag, and every one after that costs time, 5 s and then 10 s each, like F1.
function strike(race: Race, r: Racer) {
  const who = driver(race, r.id).code;
  const at = race.track.cornerAt(r.p);
  say(race, "limits", r.id, `Track limits · ${who} · ${at} · Lap ${r.laps + 1} time deleted`);
  // In qualifying that's all: no strikes, no flag, no penalty.
  if (race.laps === 1) return;
  r.strikes++;
  if (r.strikes === 3) say(race, "flag", r.id, `Black and white flag · ${who} · Track limits`);
  if (r.id === 0 && race.laps > 1) radio(race, pick(LINES.limits[Math.min(r.strikes, 4) - 1]!)(at));
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
  // Clipping until back to CLIP_TO, unless the lap's allowance runs out first. In qualifying the
  // battery only deploys on a push lap: out and in laps save it, harvesting still.
  const flat = input.gas && v > 40 && (!race.session || race.session.phase[r.id] === "push");
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
// A puncture, on a wheel picked at random by a hit (with Math.random: it's only shown, so it
// leaves the race's dice alone) or the most worn as a set runs out: with damage too it's the end,
// else the car boxes at the first chance.
function puncture(race: Race, r: Racer, worn = false) {
  if (r.puncture) return;
  r.puncture = true;
  r.flat = worn ? r.wear.indexOf(Math.min(...r.wear)) : Math.floor(Math.random() * 4);
  say(race, "out", r.id, `Puncture · ${code(race, r)}`);
  if (r.damage > 0.1) {
    [r.failAt, r.fault] = [r.dist + 1, "Puncture damage"];
    return;
  }
  if (race.session) {
    if (r.id === 0) radio(race, pick(LINES.puncture));
    return goIn(race, r);
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
  for (const r of race.racers) [r.wreck, r.unlap] = [false, false];
  say(race, "sc", -1, "Green flag");
}
// Under a Safety Car or VSC the team drives your car, until it's ending (the Safety Car's in this
// lap, or the VSC's last seconds) or, if you've asked to box, until the stop's done; in qualifying
// your out-lap if you've asked, and the in-lap. Then HAND ms more, counting down, as it hands
// your car back; down the pit lane too.
const HAND = 3000;
const teamHas = (race: Race, r: Racer) =>
  r.box ||
  !!race.session?.team ||
  (!!race.neutral && (!race.neutral.ending || (!!race.neutral.owed && !!race.sc)));
export const teamDriving = (race: Race, r: Racer) =>
  r.id === 0 && r.finish === null && !r.out && (teamHas(race, r) || race.hand > 0);
// The seconds to go before your car's yours, or 0.
export const handingBack = (race: Race) => (race.hand < Infinity ? Math.ceil(race.hand / 1000) : 0);
// A simulated session: the team drives your car as the computer drives its own, boxing on the
// laps the plan stops at.
export function simInput(race: Race) {
  const me = race.racers[0]!;
  if (me.stops.includes(me.laps + 1) && !me.pitting) me.box = true;
  return aiInput(me, race);
}
// Asking the team to box, or not, while it drives you: until you're in the lane.
export function toggleBox(race: Race) {
  const me = race.racers.find((r) => r.id === 0);
  if (!me || me.pit || !teamDriving(race, me)) return;
  me.box = !me.box;
  if (!me.box) me.pitting = false;
}
// The Safety Car or VSC is ending: the team hands your car back, unless it's taking you in. Then
// the call waits: it drives you out of the pits and on until the Safety Car's gone, and says it
// as it hands back.
function handover(race: Race, why: string) {
  const me = race.racers.find((r) => r.id === 0);
  const driving = me && teamDriving(race, me);
  const n = race.neutral!;
  n.ending = true;
  n.owed = driving && me.box ? why : undefined;
  if (driving && !me.box) radio(race, pick(LINES.handover)(why));
}
// The Safety Car, VSC and blue flags for a frame: drives the Safety Car, ends a VSC, and sets
// every car's cap and blue flag.
function neutralise(race: Race, dt: number) {
  const { LENGTH, PIT_IN, ahead: fwd, atDist, lateral, limitAt, nearest, pointAt } = race.track;
  const rs = race.racers.filter((r) => !r.out);
  const m0 = (r: Racer) => r.p * LENGTH;
  for (const r of rs) [r.cap, r.blue] = [Infinity, 0];
  const n = race.neutral;
  const pace = (m: number) => Math.min(SC_TOP, SC_PACE * limitAt(atDist(m + 5), 1));
  if (n?.kind === "vsc") {
    if (!n.ending && race.t > n.end - 5000) {
      handover(race, "VSC ending");
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
    // Lapped cars may overtake, F1's way: half a lap in, every lapped car goes by the queue and
    // the Safety Car and round to the back of the queue, and it's in once the last is back.
    const lead = rs.reduce((a, b) => (b.dist > a.dist ? b : a));
    const down = (r: Racer) =>
      Math.round((lead.dist - r.dist - fwd(r.p * LENGTH, lead.p * LENGTH)) / LENGTH);
    if (!n.wave && sc.run > LENGTH / 2) {
      n.wave = true;
      const lapped = rs.filter((r) => r.finish === null && down(r) > 0);
      if (race.laps - lead.laps > UNLAP_LAPS && lapped.length) {
        for (const r of lapped) [r.unlap, r.held] = [true, false];
        say(race, "sc", -1, "Lapped cars may overtake");
        if (lapped.some((r) => r.id === 0)) radio(race, pick(LINES.unlap));
      }
    }
    for (const r of rs) {
      if (!r.unlap) continue;
      const tail = rs.some((o) => o.held && !o.pit && fwd(m0(r), o.p * LENGTH) < REJOIN);
      if ((down(r) <= 0 && tail) || sc.run > UNLAP_MAX * LENGTH) {
        [r.unlap, r.held] = [false, true];
        if (r.id === 0) radio(race, pick(LINES.rejoin));
      }
    }
    if (!n.ending && sc.run > 0.75 * LENGTH && !rs.some((r) => r.unlap)) {
      handover(race, "Safety Car's in this lap");
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
      if (o !== r && !o.pit && !o.unlap && d < gap) [gap, v] = [d, o.car.v];
    }
    r.cap = race.sc || gap < 300 ? behind(v, gap, carGrip(race, r)) : pace(m);
  }
  for (const r of rs)
    if (r.unlap) r.cap = UNLAP_PACE * limitAt(atDist(m0(r) + 5), carGrip(race, r));
  if (race.neutral || rs.some((r) => r.held)) return;
  // Blue flags: a car a lap or more up, up to 60 m behind on track and closing (over CLOSE_T s,
  // so not just braking later), is let by, lifting to BLUE_V at the least: held to the car
  // behind's speed alone, it stops when that car slows behind it, and the pair stop dead in a
  // corner. A lapped car pulling away from it, having unlapped itself, keeps the place.
  for (const r of rs) {
    let near: Racer | undefined;
    let gap = 60;
    if (!r.pit && r.finish === null)
      for (const o of rs) {
        // In qualifying, any car on a push lap when this one isn't.
        const up = race.session
          ? onPush(race, o) && !onPush(race, r)
          : o.dist - r.dist > LENGTH / 2;
        const d = fwd(o.p * LENGTH, r.p * LENGTH);
        if (up && !o.pit && o.finish === null && d <= gap) [near, gap] = [o, d];
      }
    if (!near) {
      r.close = 0;
      if (r.id === 0) race.eng.blue = -1;
      continue;
    }
    r.close += (near.car.v - r.car.v - r.close) * Math.min(1, dt / CLOSE_T);
    if (r.close <= 0) continue;
    const side = lateral(r.car.x, r.car.y, r.p) - lateral(near.car.x, near.car.y, near.p);
    r.blue = Math.sign(side) || 1;
    if (r.id === 0 && race.eng.blue !== near.id) {
      race.eng.blue = near.id;
      radio(race, pick(race.session ? LINES.push : LINES.blue)(code(race, near)));
    }
    // In qualifying getting out of the way is up to you, unless the team's driving.
    if (r.id || !race.session || race.session.auto || teamDriving(race, r))
      r.cap = Math.min(r.cap, Math.max(BLUE_V, near.car.v - 6));
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
    // You, boxing while the team drives you, with the set the crew has out.
    if (r.id === 0 && r.box && s > PIT_IN - 200 && s < PIT_IN && !r.pitting) {
      r.pitting = true;
      r.fit ??= nextSet(race, r);
    }
    if (s > PIT_OUT || s < PIT_IN - 200) r.pitting = false;

    // Anyone in the lane is driven down it: you to your box when the team takes over, and a
    // computer car that strays in without a stop planned, or any car after the flag, straight
    // through. After the flag the team drives you round too, and once you've broken down.
    if (!r.pit) r.through = false;
    else if (!r.pitting && (r.id || r.finish !== null)) r.through = true;
    if (r.pit) r.pitting = true;
    if (r.id === 0) {
      if (r.pitting || r.unlap || teamHas(race, r)) race.hand = Infinity;
      else if (race.hand === Infinity) {
        race.hand = HAND;
        // The Safety Car's or VSC's ending has its own call (see handover), held if you boxed.
        const owed = race.neutral?.owed;
        if (race.neutral) race.neutral.owed = undefined;
        if (r.finish === null && !failed && (owed || !race.neutral?.ending))
          radio(race, owed ? pick(LINES.handover)(owed) : pick(LINES.yours));
      } else race.hand = Math.max(0, race.hand - dt * 1000);
    }
    const input =
      r.id === 0 && race.hand <= 0 && r.finish === null && !failed ? you : aiInput(r, race);
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
    r.slide = Math.abs(turn);
    // Held to a Safety Car, the VSC or a blue flag, braking down to it; broken down and limping,
    // slowing gently so nobody runs into the back of it.
    if (car.v > r.cap) car.v = Math.max(0, r.cap, Math.min(car.v, v0 - brakeAt(v0) * g * dt));
    if (failed && car.v > LIMP_V) car.v = Math.max(LIMP_V, Math.min(car.v, v0 - LIMP_BRAKE * dt));
    pitStop(race, r, dt);
    // In qualifying a car at its box is back in the garage.
    if (race.session && r.stop > 0) toGarage(race, r);
    if (r.out) continue;
    const hit = car.v;
    collide(car);
    impact(race, r, hit - car.v, CRASH);
    // Broken down and rolled to a stop.
    if (failed && !r.out && !r.pit && car.v < 0.5) retire(race, r, r.fault);
    if (r.out) continue;
    const v = Math.abs(car.v);
    // ponytail: in qualifying only a push lap wears the set, so the push starts on the new set the
    // quick lap was tuned on (QUALI_WEAR); out-laps really do cost little.
    if (!race.session || race.session.phase[r.id] === "push")
      wearTyres(race, r, input, turn, edge, dt * v);
    r.warm = Math.min(1, r.warm + (dt * v) / (TYRES[r.tyre].warm * LENGTH));
    if (race.incidents && r.life <= 0 && r.finish === null && race.rand() < 0.05 * dt)
      puncture(race, r, true);
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
    // A qualifying out-lap from the garage: past halfway, the line starts its clock.
    if (race.session && r.lap.start === null && r.p > 0.5 && r.p < 0.75) r.lap.halfway = true;
    const unstarted = r.lap.start === null;
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
      if (r.finish === null && !race.session && (r.laps >= race.laps || leaderDone))
        r.finish = race.t;
      // The team re-plans at the line (not with the car on its way to a stop), and calls you in on
      // the lap you're to stop.
      if (r.finish === null && !race.session && !failed && !r.puncture && !r.pitting) {
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
    if (race.session) timeLap(race, r, split, unstarted && r.lap.start !== null);
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
  if (race.session) return mine;
  if (rs.every((r) => r.finish !== null || r.out) || race.t - won > (3 * won) / race.laps)
    race.done = true;
  return mine;
}

export const wrongWay = (r: Racer) => r.wrong > 1;

// Running order: finishers by time with penalties added, then everyone else by distance, and
// the cars out of the race last.
// Once the flag's out, by laps first, as the classification has it, so a lapped car taking the
// flag just behind the winner doesn't pass one with a penalty: a car still running finishes on
// the lap it's on.
const flagLaps = (r: Racer) => (r.finish !== null ? r.laps : r.laps + 1);
export const order = (race: Race) =>
  race.racers
    .slice()
    .sort(
      (a, b) =>
        +!!a.out - +!!b.out ||
        (a.finish !== null || b.finish !== null
          ? flagLaps(b) - flagLaps(a) ||
            (a.finish ?? Infinity) + a.penalty - ((b.finish ?? Infinity) + b.penalty)
          : b.dist - a.dist),
    );
// Seconds behind the leader, from when each passed the same checkpoint; once in, from the
// winner's flag with penalties added, as the classification will have it.
export const gap = (race: Race, r: Racer) => {
  if (r.finish === null) return r.cp < 0 ? 0 : (r.cpT - race.cps[r.cp]!) / 1000;
  // From the quickest on the lead lap: a lapped car's time says nothing.
  const most = Math.max(...race.racers.map((o) => (o.finish !== null ? o.laps : 0)));
  const lead = Math.min(
    ...race.racers.map((o) =>
      o.finish !== null && o.laps === most ? o.finish + o.penalty : Infinity,
    ),
  );
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
      const { id, best, penalty, paid, stints, sets, out } = r;
      const dsq = r.finish !== null && !sprint(race.laps) && new Set(stints).size < 2;
      // The slot it started from (1 for pole), and the laps on each set.
      const grid = race.grid.indexOf(id) + 1;
      const stintLaps = sets.map((at, k) => (sets[k + 1] ?? r.laps) - at);
      const stops = stints.length - 1;
      return { id, time, down, best, penalty, paid, stints, stintLaps, stops, out, dsq, grid };
    })
    .sort((a, b) => +a.dsq - +b.dsq || +!!a.out - +!!b.out || a.down - b.down || a.time - b.time);
}

// F1's points, P1 to P10 in a Grand Prix and P1 to P8 in a sprint, for a classified finish.
export const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
export const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];
// A round of a season: the classification as driver ids, and those with no points (out of the
// race or disqualified).
export type Round = { order: number[]; none: number[] };
// The championships after `rounds`: drivers, and teams (by team index, its drivers' points
// together), most points first, ties broken on countback (most wins, then seconds, and so on).
export function standings(rounds: Round[], sprints: boolean) {
  const pts = sprints ? SPRINT_POINTS : POINTS;
  const table = (n: number, of: (id: number) => number) => {
    const rows = [...Array(n).keys()].map((k) => ({
      k,
      points: 0,
      places: Array<number>(CARS).fill(0),
    }));
    for (const { order, none } of rounds)
      order.forEach((id, place) => {
        if (none.includes(id)) return;
        const row = rows[of(id)]!;
        row.points += pts[place] ?? 0;
        row.places[place]!++;
      });
    const countback = (a: (typeof rows)[number], b: (typeof rows)[number]) =>
      a.places.reduce((d, _, i) => d || b.places[i]! - a.places[i]!, 0);
    return rows.sort((a, b) => b.points - a.points || countback(a, b) || a.k - b.k);
  };
  return { drivers: table(CARS, (id) => id), teams: table(CARS / 2, (id) => id >> 1) };
}
