// The weather: rain cells sweeping round the lap, the water they leave in each section of it, and
// the dry line the cars clear through that. Plain maths like track.ts, so weather.check.ts and
// race.check.ts can run it headless. Starting numbers by eye; these are the knobs.

export type Mode = "auto" | "dry" | "changeable" | "wet";
export const MODES: [Mode, string][] = [
  ["auto", "Auto"],
  ["dry", "Dry"],
  ["changeable", "Changeable"],
  ["wet", "Wet"],
];
// Shown in setup once it's been played: flip this to turn rain on for everyone. Until then, add
// ?weather to the URL.
export const WEATHER_ON = true;

// The chance of any rain in a weekend, by eye from each circuit's climate and season.
const CLIMATE: Record<string, number> = {
  spa: 0.55,
  interlagos: 0.5,
  silverstone: 0.4,
  shanghai: 0.35,
  montreal: 0.3,
  hungaroring: 0.25,
  zandvoort: 0.35,
  redbullring: 0.35,
  melbourne: 0.25,
  miami: 0.25,
  austin: 0.2,
  portimao: 0.15,
  monaco: 0.2,
  barcelona: 0.15,
  monza: 0.2,
  mexico: 0.2,
  buddh: 0.1,
  vegas: 0.03,
  yasmarina: 0.02,
  bahrain: 0.02,
  lusail: 0.02,
};
export const climate = (id: string) => CLIMATE[id] ?? 0.2;

// A rain cell: over `from` to `to` (weekend ms) it rains at `rate` (0 to 1) over a `width` share of
// the lap either side of its centre, which starts at `at` and drifts round at `drift` laps a minute.
export type Cell = {
  from: number;
  to: number;
  at: number;
  drift: number;
  width: number;
  rate: number;
};
export const SECTIONS = 30;
export type Weather = {
  // The weekend's clock (ms), carrying from qualifying into the race.
  t: number;
  cells: Cell[];
  // Water in each section, 0 (dry) to 1 (soaked), and how much of it the cars have cleared on the
  // line, 0 to 1.
  water: number[];
  line: number[];
  // What's falling on each section now, for the scene and the planner.
  rain: number[];
  since: number;
  // Any water on track or rain falling, so a dry race skips the wet sums.
  any: boolean;
};

// Rain brings a section's water up to its own level, the heaviest soaking it in about SOAK ms; with
// less falling it dries, four times as slowly. A car through a section on its line clears PASS of
// its water.
const SOAK = 150_000;
const wetter = (water: number, rain: number, ms: number) =>
  water < rain
    ? Math.min(rain, water + (ms * Math.max(rain, 0.25)) / SOAK)
    : Math.max(rain, water - (ms * (1 - rain)) / (4 * SOAK));
const PASS = 0.012;
const WASH = 1 / 40_000;
const FADE = 1 / 200_000;
const EVERY = 250;

export const rainAt = ({ cells }: Pick<Weather, "cells">, k: number, t: number) => {
  let most = 0;
  const p = (k + 0.5) / SECTIONS;
  for (const c of cells) {
    if (t < c.from || t > c.to) continue;
    const centre = c.at + (c.drift * (t - c.from)) / 60_000;
    let d = (p - centre) % 1;
    d = Math.abs(d > 0.5 ? d - 1 : d < -0.5 ? d + 1 : d);
    // Soft at its edges and in its first and last minute.
    const ease = Math.min(1, (t - c.from) / 60_000, (c.to - t) / 60_000);
    most = Math.max(most, c.rate * ease * Math.max(0, Math.min(1, (c.width - d) / 0.05)));
  }
  return most;
};

const blank = (cells: Cell[], wet = 0): Weather => ({
  t: 0,
  cells,
  water: Array<number>(SECTIONS).fill(wet),
  line: Array<number>(SECTIONS).fill(0),
  // What's falling at the start, so it's already raining on the grid.
  rain: Array.from({ length: SECTIONS }, (_, k) => rainAt({ cells }, k, 0)),
  since: 0,
  any: wet > 0,
});

// A weekend's weather over `span` ms. Auto rolls the track's climate, and most of the rain it
// brings is changeable; Wet is a wet track and rain most of the way.
export function drawWeather(id: string, mode: Mode, span: number, rand = Math.random): Weather {
  const cell = (from: number, long: number, rate: number): Cell => ({
    from,
    to: from + long,
    at: rand(),
    drift: (rand() < 0.5 ? -1 : 1) * (0.05 + 0.15 * rand()),
    width: 0.2 + 0.5 * rand(),
    rate,
  });
  let kind = mode;
  if (mode === "auto") {
    kind = "dry";
    if (rand() < climate(id)) kind = rand() < 0.2 ? "wet" : "changeable";
  }
  if (kind === "dry") return blank([]);
  if (kind === "wet")
    return blank(
      [
        {
          ...cell(-60_000, 60_000 + span * (0.5 + 0.5 * rand()), 0.55 + 0.45 * rand()),
          width: 2,
          drift: 0,
        },
      ],
      0.5 + 0.4 * rand(),
    );
  const n = 1 + Math.floor(rand() * 3);
  return blank(
    Array.from({ length: n }, () =>
      cell(span * (0.1 + 0.7 * rand()), span * (0.1 + 0.25 * rand()), 0.25 + 0.65 * rand()),
    ),
  );
}
// Set for the checks: a track at this water with this rain from now on.
export const fixedWeather = (water: number, rate = 0): Weather =>
  blank(rate ? [{ from: -1e6, to: 1e12, at: 0, drift: 0, width: 2, rate }] : [], water);

export function tickWeather(w: Weather, dt: number) {
  w.t += dt;
  w.since += dt;
  if (w.since < EVERY) return;
  const ms = w.since;
  w.since = 0;
  let any = false;
  for (let k = 0; k < SECTIONS; k++) {
    const rain = rainAt(w, k, w.t);
    w.rain[k] = rain;
    w.water[k] = wetter(w.water[k]!, rain, ms);
    w.line[k] = Math.max(0, w.line[k]! - ms * (rain * WASH + FADE));
    any ||= rain > 0 || w.water[k]! > 0;
  }
  w.any = any;
}
// A car over `share` of a section, on its line: it clears a little more of it.
export const clearLine = (w: Weather, k: number, share: number) => {
  w.line[k] = Math.min(1, w.line[k]! + PASS * share);
};
export const sectionOf = (m: number, length: number) =>
  Math.min(SECTIONS - 1, Math.floor((((m % length) + length) % length) / (length / SECTIONS)));
// The water under a car `off` m from the dry line in section k: on it, what's left once the cars
// have cleared their share; GROOVE m out, all of it.
const GROOVE = 3;
export const waterAt = (w: Weather, k: number, off = 0) =>
  w.water[k]! * (1 - w.line[k]! * Math.max(0, 1 - Math.abs(off) / GROOVE));

// Each kind of tyre's grip by water: dry, damp, wet and soaked (WATER's depths), as a share of its
// dry grip. Slicks share a curve, as the water's what beats them.
const WATER = [0, 0.2, 0.5, 1];
export type Kind = "slick" | "inter" | "wet";
const CURVES: Record<Kind, number[]> = {
  slick: [1, 0.75, 0.5, 0.4],
  inter: [0.86, 0.88, 0.8, 0.62],
  wet: [0.76, 0.78, 0.79, 0.74],
};
export const wetGrip = (kind: Kind, water: number) => {
  const c = CURVES[kind];
  if (water <= 0) return c[0]!;
  for (let k = 1; k < WATER.length; k++)
    if (water <= WATER[k]!) {
      const [a, b] = [WATER[k - 1]!, WATER[k]!];
      return c[k - 1]! + ((c[k]! - c[k - 1]!) * (water - a)) / (b - a);
    }
  return c.at(-1)!;
};
// The tyre that grips most at this much water.
export const bestKind = (water: number): Kind =>
  (["slick", "inter", "wet"] as const).reduce((a, b) =>
    wetGrip(b, water) > wetGrip(a, water) ? b : a,
  );
// Aquaplaning: above a speed set by the tyre and the depth, the tyres ride up and lose up to FLOAT
// of their grip over FLOAT_V m/s more. None under SHALLOW of water.
const SHALLOW = 0.3;
const FLOAT = 0.45;
const FLOAT_V = 25;
const CLEARS: Record<Kind, number> = { slick: 55, inter: 70, wet: 88 };
export const aquaplane = (kind: Kind, water: number, v: number) => {
  if (water <= SHALLOW) return 1;
  const at = CLEARS[kind] / Math.sqrt(water);
  return 1 - FLOAT * Math.max(0, Math.min(1, (Math.abs(v) - at) / FLOAT_V));
};
// The most the wet lets the throttle put down, as a share of the car's acceleration: the road's
// grip, plus downforce with speed.
const TRACTION = 1.45;
export const traction = (share: number, v: number) =>
  Math.min(1, share * TRACTION + 0.00012 * v * v * share);

// A team's read of the weather: its water on each coming lap, over the whole track, from the real
// cells with each one's start, length and strength off by up to `err` (0 to 1) the further away it
// is. `seed` keeps a team's read steady between looks.
const noise = (seed: number, k: number) => {
  const x = Math.sin(seed * 127.1 + k * 311.7) * 43758.5453;
  return 2 * (x - Math.floor(x)) - 1;
};
const SIM = 4;
export function forecast(w: Weather, lapMs: number, laps: number, seed: number, err: number) {
  const cells = w.cells.map((c, k) => {
    // Up to a whole `err` of itself out from five minutes off, sharpening as it nears.
    const off = err * Math.min(1, Math.max(0, c.from - w.t) / 300_000);
    const shift = noise(seed, k) * off * 300_000;
    return {
      ...c,
      from: c.from + shift,
      to: c.to + shift + noise(seed, k + 50) * off * 120_000,
      rate: Math.min(1, Math.max(0, c.rate * (1 + noise(seed, k + 100) * off))),
    };
  });
  const out: number[] = [];
  const water = w.water.slice();
  const step = lapMs / SIM;
  for (let l = 0, t = w.t; l < laps; l++) {
    let sum = 0;
    for (let s = 0; s < SIM; s++, t += step)
      for (let k = 0; k < SECTIONS; k++) {
        water[k] = wetter(water[k]!, rainAt({ cells }, k, t), step);
        sum += water[k]!;
      }
    out.push(sum / (SIM * SECTIONS));
  }
  return out;
}
export const meanWater = (w: Weather) => w.water.reduce((a, b) => a + b, 0) / SECTIONS;
// Whether there's anything to plan for or draw.
export const dryWeekend = (w: Weather | null) =>
  !w || (!w.cells.length && w.water.every((x) => x <= 0));
