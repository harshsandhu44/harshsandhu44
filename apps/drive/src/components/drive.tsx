"use client";

import { useEffect, useRef, useState } from "react";
import { assist, guide, type Line } from "@/assist";
import { createAudio, MIX, rpm, type Audio, type Mix } from "@/audio";
import {
  Bolt,
  Car,
  Chassis,
  Chequered,
  Cog,
  Flag,
  Headset,
  Out,
  Pit,
  Roundel,
  Stopwatch,
  Straight,
  Warned,
  Warning,
  Wing,
  Wrench,
} from "@/components/icons";
import type { Scene } from "@/scene";
import {
  CAP,
  CARS,
  CHATTER,
  CORNERS,
  DISTANCES,
  GRID,
  LEVELS,
  TYRES,
  STOP,
  WINGS,
  carGrip,
  colorOf,
  driver,
  gap,
  grip,
  lapsOf,
  CUTS,
  goOut,
  inGarage,
  newQuali,
  newRace,
  newSession,
  nextSegment,
  pickSet,
  segmentOrder,
  sessionGrid,
  tickSession,
  order,
  qualiDelta,
  qualiOrder,
  results,
  sprint,
  stintLaps,
  teamDriving,
  teamPlan,
  tick,
  toggleBox,
  towShare,
  wingGrip,
  wingTop,
  wrongWay,
  type Level,
  type Phase,
  type Race,
  type Racer,
  type Tyre,
} from "@/race";
import { KERB_R, TOP, fmt, gear } from "@/track";
import { TRACKS, getTrack } from "@/tracks";

// Your record per track. v2: Monza's real-length track; the v1 keys hold bests from the old short
// one. ponytail: the old `-sectors-v2` keys are left in storage, unread.
const BEST = (id: string) => `${id}-best-v3`;
// The rest kept Monza's names from when it was the only track, so picks carry over.
const TRACK = "drive-track";
const SOUND = "monza-sound";
// The driving aids, as in the F1 games (assist.ts).
const SETTINGS = "drive-settings";
type Settings = { line: Line; brakes: boolean; assist: boolean; mix: Mix };
const MIX_NAMES: Record<keyof Mix, string> = {
  engine: "Engine",
  cars: "Other cars",
  crowd: "Crowd",
  pit: "Pit lane",
  tyres: "Tyres",
  radio: "Radio",
};
const AIDS: Settings = { line: "off", brakes: false, assist: true, mix: MIX };
const LEVEL = "monza-level";
// The race distance, as an index into DISTANCES. The v1 key held a lap count: 5, 10, 15 or 20.
const DIST = "drive-distance";
const LAPS = "monza-laps";
// The tower's gap column and the map's size, as indices into MODES and MAPS.
const TOWER = "drive-tower";
// The classification's gap column: to the car ahead, or to the leader.
const GAPS = "drive-gaps";
// Qualifying: quick (one lap) or full (Q1, Q2 and Q3).
const QUALI = "drive-quali";
// How many frames a fast-forward runs per frame in the garage, and to skip to the end once you're out.
const FAST = 20;
const SKIP = 300;
const PHASE_NAMES: Record<Phase, string> = {
  garage: "Garage",
  out: "Out lap",
  push: "Push",
  in: "In lap",
};
// A session clock: m:ss.
const clock = (ms: number) => {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
};
const MAP = "drive-map";
const MODES = ["Interval", "Leader", "Tyres"] as const;
// Small and medium are the 600 m round you; large is the whole circuit.
const MAPS = ["size-28", "size-28 md:size-40", "size-40 md:size-60"];
const DASH = "-:--.---";
const KEYS: Record<string, "up" | "down" | "left" | "right" | "ot"> = {
  ArrowUp: "up",
  w: "up",
  ArrowDown: "down",
  s: "down",
  ArrowLeft: "left",
  a: "left",
  ArrowRight: "right",
  d: "right",
  " ": "ot",
};

// Each circuit's outline in its own box, from the raw data so drawing one doesn't build the
// track: for the loading screen and the minimap, and every 6th point for the picker.
const SHAPES = new Map(
  TRACKS.map(({ id, data }) => {
    const xs = data.map((p) => p[0]);
    const ys = data.map((p) => p[1]);
    const box = { x: Math.min(...xs), y: Math.min(...ys) };
    const box2 = { w: Math.max(...xs) - box.x, h: Math.max(...ys) - box.y };
    const path = (every: number) =>
      `M${data
        .filter((_, i) => i % every === 0)
        .map(([x, y]) => `${(x - box.x).toFixed(1)} ${(y - box.y).toFixed(1)}`)
        .join("L")}Z`;
    return [id, { box, box2, outline: path(1), thumb: path(6) }];
  }),
);

const read = <T,>(key: string, fallback: T): T => {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") ?? fallback;
  } catch {
    return fallback;
  }
};
const write = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be blocked; bests just won't persist.
  }
};

// The rev strip's lights, F1's way: green, then red, then purple at the top of the gear.
const REVS = 15;
const REV_INK = (k: number) => (k < 5 ? "bg-go" : k < 10 ? "bg-accent" : "bg-fl");
// Throttle and brake as two arcs round the gear, filling from the bottom (svg units, r 80 about
// (100, 96)): throttle 165° to 262° on the left, brake 15° to 278° on the right.
const THR_ARC = "M22.73 116.71A80 80 0 0 1 88.87 16.78";
const BRK_ARC = "M177.27 116.71A80 80 0 0 0 111.13 16.78";
// Pirelli's colours: red softs, yellow mediums, white hards. In key order, 1 to 3.
const COMPOUNDS: Tyre[] = ["soft", "medium", "hard"];
const TYRE_INK: Record<Tyre, string> = {
  soft: "text-accent",
  medium: "text-slow",
  hard: "text-paper",
};
// How long a set lasts in this race, to the cliff.
const blurb = (t: Tyre, laps: number) => {
  const n = Math.max(1, Math.round(laps));
  return `About ${n} lap${n > 1 ? "s" : ""}${t === "hard" ? ", slower" : ""}`;
};
const letter = (t: Tyre) => t[0]!.toUpperCase();
// A wing's trade against the car as tuned (3), as the grid screen shows it.
const WING_STEPS = Array.from({ length: WINGS }, (_, k) => k + 1);
const signed = (n: number, digits: number) => `${n < 0 ? "−" : "+"}${Math.abs(n).toFixed(digits)}`;
const wingText = (w: number) =>
  w === 3
    ? "The car as tuned"
    : `Top speed ${signed((wingTop(w) - 1) * TOP * 3.6, 0)} km/h, grip ${signed((wingGrip(w) - 1) * 100, 1)}%`;
// A tyre's colour in the HUD: blue while cold, then green, yellow and red as it wears.
const wearInk = (life: number, warm: number) =>
  warm < 0.9 ? "bg-print text-paper" : life > 0.6 ? "bg-go" : life > 0.3 ? "bg-slow" : "bg-accent";
// The team's plan as the grid screen shows it: "M → H, box lap 3", or in the sprint "M, no stop".
const planText = ({ at, tyres }: { at: number[]; tyres: Tyre[] }) =>
  `${tyres.map(letter).join(" → ")}, ${at.length ? `box lap ${at.join(" and ")}` : "no stop"}`;
const STEPS: [Level, string, string][] = [
  ["amateur", "Amateur", "F3 grid"],
  ["intermediate", "Intermediate", "F2 grid"],
  ["pro", "Pro", "F1 grid"],
  ["legends", "Legends", "Champions"],
];
const CONTROLS: [string[], string][] = [
  [["↑", "W"], "Gas"],
  [["↓", "S"], "Brake, reverse"],
  [["← →", "A D"], "Steer"],
  [["1–3"], "Tyres"],
  [["[ ]"], "Wing"],
  [["Space"], "Overtake"],
  [["B"], "Box (Safety Car)"],
  [["P"], "Pause"],
  [["R"], "Restart"],
  [["T"], "Timing"],
  [["M"], "Map"],
];
const RULES: [string, string][] = [
  [
    "Start",
    "You start at the back, or qualify for your slot. Quick qualifying is one flying lap on softs from a rolling start, and the grid lines up by lap time. Track limits, the pit lane or abandoning the lap leaves you without a time, still at the back. Full qualifying is Q1, Q2 and Q3 on the clock with the whole field on track: go out from the garage when you like, on new softs, and only a lap started before the flag counts. The slowest six go out after Q1 and Q2, and the last ten fight for pole. Each car has five sets of softs for the session: go out on a new one or a used one, as worn as you left it. The track rubbers in and gets quicker. Cars on a push lap get room, and holding one up is impeding: a warning, then three places on the grid each time. A car stopped on track brings the red flag: the clock stops and everyone's back in the garage. In the garage you can fast-forward the clock. Go when the lights go out. Amateur races the F3 grid, intermediate F2 and pro F1: on the racing line, with the fewest mistakes and a little more grip than your car. Legends is the world champions: no mistakes, and a perfect race only just keeps up.",
  ],
  [
    "Tyres & pits",
    "Softs grip most, hards last longest, and a set lasts the same share of the race at any Grand Prix distance, less on tracks hard on tyres like Silverstone and Spa. Grip fades slowly, then falls off a cliff in the last quarter of a set's life, and all four wheels on the grass wears them faster. Each tyre wears on its own: the outside ones through the corners, the fronts on the brakes and the rears on the throttle. A new set is cold for its first half lap, shown blue. In a Grand Prix you must run two compounds, so everyone stops at least once: finish on one and you're disqualified. The sprint is one stint, as in F1: no stop needed and any compound, with softs quickest but fading before the flag. The team plans your race on the grid screen and calls you in, but when you box is up to you: press 1, 2 or 3 any time to pick the next set. The pit lane leaves the main straight before the line: turn in and the team drives you to your box and back out. Only your teammate can hold you up there.",
  ],
  [
    "Wing",
    "More rear wing is more grip in the corners and under braking, and less top speed. Each track has a quickest wing, low at Monza and high at Monaco: the team suggests it on the grid screen. Qualify and the race starts on your qualifying wing (parc fermé). In the race, [ and ] pick the wing for your next stop.",
  ],
  [
    "Safety Car & failures",
    "Cars break down (about one in twenty-five a race, yours too), crash out on a big hit, take lasting damage from smaller ones, and puncture from contact or a set run to nothing; a puncture costs grip, not top speed, until you box, its wheel blinking red. A car stopped off the track brings the Virtual Safety Car: everyone is held to the same speed. A crash, or a car stopped on the track, brings the Safety Car: the field queues behind it with no passing, and racing starts again at the line once it's gone in. The team drives your car under both and hands it back as either ends: press B (or Box) to have it take you in, as a stop under either costs less. With more than three laps to go, lapped cars are waved past the queue to its back first (the team drives you through), and the Safety Car comes in once the last is back. When a car a lap up catches you, the blue flag lets it by; pass it again and pull away, and you've unlapped yourself.",
  ],
  [
    "Track limits",
    "All four wheels off the track deletes the lap. The third time brings the black and white flag, then 5 s and 10 s penalties, served at your next stop (sitting them out before the crew starts) or added at the flag.",
  ],
  [
    "2026 power",
    "Straight Mode flattens the wings on the straights for every car, every lap, until you brake. The 6 MJ battery deploys by itself flat out, at 350 kW in the zones and 250 kW elsewhere, and recharges off the throttle (most on the brakes) and in the pit lane, up to 12 MJ a lap. Run it flat and the car super clips: it harvests at full throttle and loses speed (the reading turns red). From lap 2, within a second of the car ahead at a detection line (the painted line with the Overtake board), Overtake Mode is ready: Space for full power and more speed to the end of the next straight, and the next lap harvests faster, up to 12.5 MJ (the bar turns green).",
  ],
];
const PAD: ["left" | "right", string, string][] = [
  ["left", "Steer left", "◀"],
  ["right", "Steer right", "▶"],
];
const padKey =
  "pointer-events-auto grid h-16 min-w-16 touch-none place-items-center rounded-lg bg-ink/70 text-2xl text-paper ring-1 ring-paper/25 select-none active:bg-lamp";
const kbd = "rounded-sm bg-lamp px-1.5 py-0.5 text-xs font-semibold text-paper";
const panel = "rounded-lg bg-ink/85 text-paper tabular-nums";
// The HUD's panels, as the F1 games draw them: translucent, square, the outer ends slanted.
const hud = "bg-ink/75 text-paper tabular-nums backdrop-blur-sm";
const slantR = "[clip-path:polygon(0_0,100%_0,calc(100%-14px)_100%,0_100%)]";
const slantL = "[clip-path:polygon(14px_0,100%_0,100%_100%,0_100%)]";
const chip = "flex items-center gap-1 rounded-sm px-1.5 py-0.5";
// A sector's colour, as its time and the bar under it.
const SECTOR_INK = { fl: "text-fl", pb: "text-go", slow: "text-slow", bad: "text-accent", "": "" };
const SECTOR_BAR = { fl: "bg-fl", pb: "bg-go", slow: "bg-slow", bad: "bg-accent", "": "bg-lamp" };
// Race Control's icon for each kind of message (the Safety Car's end is its green flag).
const RC_ICONS = [
  ["radio", Headset, "text-accent"],
  ["limits", Warning, "text-slow"],
  ["flag", Warned, "text-paper"],
  ["penalty", Stopwatch, "text-accent"],
  ["fastest", Stopwatch, "text-fl"],
  ["sc", Car, "text-slow"],
  ["green", Flag, "text-go"],
  ["out", Out, "text-accent"],
] as const;
const label = "text-sm text-soft";
const TYRE_CELL =
  "w-8 rounded-sm py-0.5 text-center text-[11px] leading-none font-semibold text-ink tabular-nums";
const secs = (ms: number) => (ms / 1000).toFixed(3);
// A gap in seconds as F1 shows it: seconds under a minute, then minutes too.
const plus = (s: number, dp = 3) => {
  const v = Math.round(s * 10 ** dp) / 10 ** dp;
  const sec = (v % 60).toFixed(dp);
  return v < 60 ? `+${sec}` : `+${Math.floor(v / 60)}:${sec.padStart(dp + 3, "0")}`;
};
const lapsDown = (n: number) => `+${n} lap${n > 1 ? "s" : ""}`;

// A race's classification, or qualifying's, where each row's time is its lap (0 for none) with
// its sectors, and the team's word on it.
type Result = {
  quali: boolean;
  table: (ReturnType<typeof results>[number] & { sectors?: number[]; drop?: number })[];
  // Full qualifying: the segment (0 for Q1), how many go through, and whether another follows.
  seg?: number;
  cut?: number;
  next?: boolean;
  fastest: number | null;
  level: Level;
  laps: number;
  radio: string;
};
// A qualifying classification row: its lap (0 for none) and that lap's sectors.
const qualiRow = (id: number, best: number, sectors: number[]): Result["table"][number] => ({
  id,
  time: best,
  down: 0,
  best,
  penalty: 0,
  paid: 0,
  stints: [],
  stintLaps: [],
  stops: 0,
  out: null,
  dsq: false,
  grid: 0,
  sectors,
});
// The garage screen in full qualifying, from the frame loop a couple of times a second.
type Timing = {
  seg: number;
  left: number;
  red: number;
  through: boolean;
  fast: boolean;
  rows: { id: number; best: number; phase: Phase }[];
  // Your sets: life left (1 new) and whether run, and the one picked for the next run.
  sets: { life: number; used: boolean }[];
  pick: number;
};
// F1's points, P1 to P10, for a classified finish.
const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

// The team's word at the flag, picked once. Last, or behind your teammate, earns a jab.
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]!;
const debrief = (pos: number, last: boolean) =>
  pos === 1
    ? pick([
        "P1! Get in there!",
        "You won it! What a drive!",
        "Race winner! Fantastic job.",
        "That's a win! Absolutely mega.",
        "P1. Put it on the fridge.",
      ])
    : pos <= 3
      ? pick([
          `P${pos}, a podium! Great job.`,
          `Podium! P${pos}, well driven.`,
          `P${pos}. Champagne time.`,
          `P${pos} and on the podium. Lovely stuff.`,
        ])
      : pos <= 10
        ? pick([
            `P${pos}, good points today.`,
            `P${pos}. Points in the bag.`,
            `P${pos}. Solid, we'll take those points.`,
            `P${pos}, in the points. Good work.`,
          ])
        : last
          ? pick([
              `P${pos}. Well, someone had to be last.`,
              `P${pos}. Let's call it a test session.`,
              `P${pos}. At least nobody overtook you at the end.`,
              `P${pos}. We'll look at the data. All of it.`,
            ])
          : pick([
              `P${pos}. We'll get them next time.`,
              `P${pos}, no points today. Next time.`,
              `P${pos}. Not our day.`,
              `P${pos}. Something to build on. Somehow.`,
            ]);
// And at the end of qualifying.
const qualiWord = (pos: number, timed: boolean) =>
  !timed
    ? pick([
        "No time. We start from the back.",
        "No lap time. Back of the grid it is.",
        "No time. The back of the grid has a lovely view.",
        "No lap. Plenty of overtaking to do, then.",
      ])
    : pos === 1
      ? pick([
          "Pole! What a lap.",
          "Pole position! Mega lap.",
          "P1 in qualifying! Pole's ours.",
          "Pole. That lap was something else.",
        ])
      : pos === 2
        ? pick([
            "P2. Front row, good lap.",
            "Front row! P2.",
            "P2. So close to pole.",
            "P2, front row. Great lap.",
          ])
        : pos > CARS - 4
          ? pick([
              `P${pos}. At least the car looks nice.`,
              `P${pos}. Plenty of cars to pass, then.`,
              `P${pos}. The race is what counts.`,
              `P${pos}. Long race ahead. Good.`,
            ])
          : pick([
              `P${pos}. Let's go racing.`,
              `P${pos}. Good base for the race.`,
              `P${pos}. We can work with that.`,
              `P${pos}. Race pace is what matters.`,
            ]);
// Out of the race or disqualified, there's no position to talk about.
const raceWord = (table: Result["table"]) => {
  const k = table.findIndex((r) => !r.id);
  const me = table[k]!;
  if (me.out)
    return pick([
      "Retired. We'll get them next time.",
      "Retired. Sorry, mate.",
      "Retired. Not how we wanted it to end.",
      "DNF. We'll find out what happened.",
    ]);
  if (me.dsq)
    return pick([
      "Disqualified. We had to run two compounds.",
      "Disqualified. Two compounds. It's in the rules, I promise.",
      "Disqualified. One compound isn't a strategy.",
      "Disqualified. We did mention the second compound.",
    ]);
  const runners = table.filter((r) => !r.out && !r.dsq).length;
  const mate = table.findIndex((r) => r.id === 1);
  const word = debrief(k + 1, k + 1 === runners);
  return mate >= 0 && mate < k && !table[mate]!.out && k + 1 > 3
    ? `${word} ${pick([
        `Your teammate says hi from P${mate + 1}.`,
        `Your teammate was P${mate + 1}. Just saying.`,
        `Same car, P${mate + 1} for your teammate. Interesting.`,
        `Your teammate made P${mate + 1}. We'll compare notes.`,
      ])}`
    : word;
};

// A setting: its choices in a row, the one picked lit.
function Choice<T extends string | boolean>(props: {
  name: string;
  value: T;
  options: [T, string][];
  pick: (v: T) => void;
}) {
  const { name, value, options, pick } = props;
  return (
    <div className="mt-3">
      <p className={label}>{name}</p>
      <div role="radiogroup" aria-label={name} className="mt-1 grid grid-flow-col gap-2">
        {options.map(([v, text]) => (
          <button
            key={String(v)}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => pick(v)}
            className={`min-h-11 rounded-md px-2 text-sm ring-1 active:scale-[.98] ${value === v ? "bg-lamp font-semibold ring-paper" : "ring-paper/25"}`}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

// The whole page. three.js (in scene.ts) loads on mount and draws the circuit; the race
// (race.ts) runs in one rAF loop here, which writes the HUD straight to the DOM so React doesn't
// re-render every frame.
export default function Drive() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [result, setResult] = useState<Result | null>(null);
  const [rules, setRules] = useState(false);
  const [sound, setSound] = useState(() => read(SOUND, false));
  const [aids, setAids] = useState<Settings>(() => {
    const kept: Partial<Settings> = read(SETTINGS, {});
    return { ...AIDS, ...kept, mix: { ...MIX, ...kept.mix } };
  });
  const aidsRef = useRef(aids);
  const [settings, setSettings] = useState(false);
  const audio = useRef<Audio | null>(null);
  const again = useRef<() => void>(() => {});
  // The grid screen's pick, and what it and the pit lane's chips call into the race.
  const [grid, setGrid] = useState(true);
  const [trackId, setTrackId] = useState(() => {
    const id: string = read(TRACK, TRACKS[0]!.id);
    return TRACKS.some((t) => t.id === id) ? id : TRACKS[0]!.id;
  });
  const def = TRACKS.find((t) => t.id === trackId)!;
  // Read on each render: the grid screen comes back after every race, so a new record shows.
  const trackRecord: number = read(BEST(trackId), 0);
  const { box2, outline } = SHAPES.get(trackId)!;
  const built = getTrack(trackId);
  const [tyre, setTyre] = useState<Tyre>("medium");
  // The wing for the next session: the team's suggestion each time the grid screen comes up, or
  // once you've qualified, your qualifying wing (parc fermé).
  const [wing, setWing] = useState(built.WING);
  const wingRef = useRef(built.WING);
  const qualiWing = useRef(built.WING);
  const pickWing = (w: number) => {
    wingRef.current = w;
    setWing(w);
  };
  const [level, setLevel] = useState<Level>(() => {
    const l: string = read(LEVEL, "intermediate");
    return l in LEVELS ? (l as Level) : "intermediate";
  });
  const [dist, setDist] = useState(() => {
    const old: Record<number, number> = { 10: 1, 15: 1, 20: 2 };
    const k: number = read(DIST, old[read(LAPS, 5)] ?? 0);
    return DISTANCES[k] ? k : 0;
  });
  const laps = lapsOf(DISTANCES[dist]!, built);
  // The grid for the next race, as driver ids front to back: GRID (you last) until you qualify,
  // and back to it after the race or on a new track, field or distance.
  const [lineup, setLineup] = useState(GRID);
  const lineupRef = useRef(GRID);
  const slot = lineup.indexOf(0) + 1;
  const qualified = lineup !== GRID;
  const unqualify = () => {
    lineupRef.current = GRID;
    setLineup(GRID);
  };
  const levelRef = useRef(level);
  const distRef = useRef(dist);
  const regrid = useRef<() => void>(() => {});
  const go = useRef<(t: Tyre) => void>(() => {});
  const qualify = useRef<() => void>(() => {});
  const [full, setFull] = useState(() => read(QUALI, false));
  const fullRef = useRef(full);
  const [timing, setTiming] = useState<Timing | null>(null);
  const leaveGarage = useRef<() => void>(() => {});
  const fastForward = useRef<() => void>(() => {});
  const chooseSet = useRef<(k: number) => void>(() => {});
  const abandon = useRef<() => void>(() => {});
  const quit = useRef<() => void>(() => {});
  const fit = useRef<(t: Tyre) => void>(() => {});
  const fitWing = useRef<(by: number) => void>(() => {});
  const boxIt = useRef<() => void>(() => {});
  const wingNext = useRef<HTMLSpanElement>(null);
  const wingEl = useRef<HTMLSpanElement>(null);
  const tyreEls = useRef<HTMLSpanElement[]>([]);
  const fitWrap = useRef<HTMLDivElement>(null);
  const fitLabel = useRef<HTMLSpanElement>(null);
  const fitEls = useRef<HTMLButtonElement[]>([]);
  // The touch controls' state, read by the frame loop. `touch` is whether they drive the car.
  const pad = useRef({ touch: false, left: false, right: false, brake: false, ot: false });
  const tyreName = useRef<HTMLSpanElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLCanvasElement>(null);
  const [mapSize, setMapSize] = useState(() => {
    const k: number = read(MAP, 1);
    return MAPS[k] ? k : 1;
  });
  const mapSizeRef = useRef(mapSize);
  const restart = useRef<() => void>(() => {});
  const lapName = useRef<HTMLSpanElement>(null);
  const lapEl = useRef<HTMLSpanElement>(null);
  const posEl = useRef<HTMLSpanElement>(null);
  const timeEl = useRef<HTMLSpanElement>(null);
  const lastEl = useRef<HTMLSpanElement>(null);
  const bestEl = useRef<HTMLSpanElement>(null);
  const fastEl = useRef<HTMLSpanElement>(null);
  const sectorEls = useRef<HTMLSpanElement[]>([]);
  const nearEl = useRef<HTMLDivElement>(null);
  const waitEl = useRef<HTMLDivElement>(null);
  const waitHead = useRef<HTMLParagraphElement>(null);
  const waitText = useRef<HTMLParagraphElement>(null);
  const skip = useRef<() => void>(() => {});
  const pauseEl = useRef<HTMLDivElement>(null);
  const abandonEl = useRef<HTMLButtonElement>(null);
  const quitEl = useRef<HTMLButtonElement>(null);
  const togglePause = useRef<(on?: boolean) => void>(() => {});
  const towerEl = useRef<HTMLDivElement>(null);
  const towerEls = useRef<HTMLDivElement[]>([]);
  const lampEls = useRef<HTMLSpanElement[]>([]);
  const lightsEl = useRef<HTMLDivElement>(null);
  const bannerEl = useRef<HTMLDivElement>(null);
  const speedEl = useRef<HTMLSpanElement>(null);
  const nextEl = useRef<HTMLSpanElement>(null);
  const gearEl = useRef<HTMLSpanElement>(null);
  const thrEl = useRef<SVGPathElement>(null);
  const brkEl = useRef<SVGPathElement>(null);
  const revEls = useRef<HTMLSpanElement[]>([]);
  const tyreText = useRef<HTMLSpanElement>(null);
  const limiterEl = useRef<HTMLSpanElement>(null);
  const straightEl = useRef<HTMLSpanElement>(null);
  const otEl = useRef<HTMLSpanElement>(null);
  const scEl = useRef<HTMLSpanElement>(null);
  const blueEl = useRef<HTMLSpanElement>(null);
  const unlapEl = useRef<HTMLSpanElement>(null);
  const teamEl = useRef<HTMLSpanElement>(null);
  const boxPad = useRef<HTMLButtonElement>(null);
  const otPad = useRef<HTMLButtonElement>(null);
  const batEl = useRef<HTMLSpanElement>(null);
  const batText = useRef<HTMLSpanElement>(null);
  const limitsEl = useRef<HTMLDivElement>(null);
  const rcEl = useRef<HTMLDivElement>(null);
  const rcLabel = useRef<HTMLSpanElement>(null);
  const rcIcon = useRef<HTMLSpanElement>(null);
  const damageEl = useRef<HTMLSpanElement>(null);
  const rcText = useRef<HTMLSpanElement>(null);

  // Holding a touch control sets its flag; any press also hands the car to the touch controls.
  const hold = (k: "left" | "right" | "brake" | "ot") => {
    const up = () => (pad.current[k] = false);
    return {
      onPointerDown: () => Object.assign(pad.current, { [k]: true, touch: true }),
      onPointerUp: up,
      onPointerCancel: up,
      onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    };
  };

  const aid = (change: Partial<Settings>) => {
    const next = { ...aids, ...change };
    setAids(next);
    aidsRef.current = next;
    write(SETTINGS, next);
    if (change.mix) audio.current?.mix(next.mix);
  };
  // Mid-race, the settings pause it.
  const openSettings = () => {
    togglePause.current(true);
    setSettings(true);
  };

  const toggleSound = () => {
    const on = !sound;
    setSound(on);
    write(SOUND, on);
    audio.current?.close();
    audio.current = on ? createAudio(aidsRef.current.mix) : null;
  };

  useEffect(() => {
    const cv = stage.current!;
    const mv = map.current!;
    const mctx = mv.getContext("2d")!;

    const css = getComputedStyle(document.documentElement);
    const col = (n: string) => css.getPropertyValue(`--color-${n}`).trim();
    const C = {
      accent: col("accent"),
      carbon: col("carbon"),
      paper: col("paper"),
      chrome: col("chrome"),
      ink: col("ink"),
      pit: col("pit"),
      slow: col("slow"),
    };
    const paintOf = (id: number) => colorOf(race, id);
    const flat = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const track = getTrack(trackId);
    const { CURVE, LENGTH, STANDS, ZONES, atDist, dirAt, limitAt, nearest, nextCorner } = track;
    const { box, box2, outline } = SHAPES.get(trackId)!;
    const shades = new Uint8Array(track.PATH.length);
    const road = new Path2D(outline);

    let record: number = read(BEST(trackId), 0);
    // Your quickest clean time through each sector this race.
    let mine = [0, 0, 0];

    // The race runs through these phases. The grid screen waits for your tyres (the flyover
    // plays behind it), then the lights come on a second apart and go out after an unannounced
    // pause, as in the hero. Qualifying runs the same phases with `quali` set: your race (`race`,
    // just you) and the computer's, one car each, ticked together. Its grid waits in `nextGrid`
    // for the classification's button, and its cars in `weekend` for the race on that grid.
    let race: Race;
    let quali: Race[] | null = null;
    let weekend: number[] | undefined;
    let nextGrid: number[] | null = null;
    let scene: Scene | null = null;
    let phase: "grid" | "lights" | "racing" = "grid";
    let phaseAt = 0;
    let pause = 0;
    let thr = 0;
    let brk = 0;
    let board = 0;
    let msgAt = -Infinity;
    let mode: number = read(TOWER, 0);
    // Your place at the last board, and whether you were stopped at the box last frame, for the
    // sound.
    let place = 0;
    let stopped = false;
    if (!MODES[mode]) mode = 0;
    let revs = -1;
    let skipping = false;
    // Full qualifying: frames run per frame while you're in the garage, and the segment whose
    // classification's been shown.
    let fast = 0;
    let shown = -1;
    let paused = false;
    const still = { gas: false, brake: false, steer: 0 };
    const keys = new Set<string>();
    // A touch screen starts on the touch controls, so the throttle's on from the lights.
    const p = pad.current;
    p.touch = matchMedia("(pointer: coarse)").matches;

    // F1's colours: purple the quickest anyone's been this race, green your own best, yellow slower,
    // red on a lap past the track limits.
    const paintSector = (i: number, text: string, cls: keyof typeof SECTOR_INK) => {
      const el = sectorEls.current[i]!;
      const [time, bar] = el.children as unknown as HTMLElement[];
      time!.textContent = text || `S${i + 1}`;
      time!.className = SECTOR_INK[cls];
      bar!.className = `h-0.5 rounded-full ${SECTOR_BAR[cls]}`;
      el.dataset.cls = cls;
    };

    const ac = new AbortController();
    const on = { signal: ac.signal };
    const key = (e: KeyboardEvent) => KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    window.addEventListener(
      "keydown",
      (e) => {
        const l = e.key.toLowerCase();
        if (l === "p") return togglePause.current();
        if (l === "r") return restart.current();
        if (l === "t") {
          mode = (mode + 1) % MODES.length;
          write(TOWER, mode);
          return drawBoard();
        }
        if (e.key === "[" || e.key === "]") return fitWing.current(e.key === "]" ? 1 : -1);
        if (l === "b") return boxIt.current();
        if (l === "m") {
          const k = (mapSizeRef.current + 1) % MAPS.length;
          mapSizeRef.current = k;
          setMapSize(k);
          return write(MAP, k);
        }
        const pick = COMPOUNDS[+e.key - 1];
        if (pick && phase === "grid") setTyre(pick);
        else if (pick) fit.current(pick);
        const k = key(e);
        if (!k || phase === "grid") return;
        e.preventDefault();
        keys.add(k);
        p.touch = false;
      },
      on,
    );
    window.addEventListener("keyup", (e) => keys.delete(key(e) ?? ""), on);
    window.addEventListener("blur", () => keys.clear(), on);

    // Minimap: about 600 m round you, heading up, or at the large size the whole circuit the way
    // the loading screen draws it. The road in one pale stroke, a dot per car in its colour, and
    // yours in the accent with a ring, on top.
    const drawMap = () => {
      const w = mv.clientWidth;
      const whole = mapSizeRef.current === MAPS.length - 1;
      const s = whole ? (w - 16) / Math.max(box2.w, box2.h) : w / 600;
      const me = race.racers[0]!;
      mctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      mctx.clearRect(0, 0, w, w);
      mctx.translate(w / 2, w / 2);
      mctx.scale(s, s);
      if (whole) mctx.translate(-box2.w / 2, -box2.h / 2);
      else {
        mctx.rotate(-dirAt(me.p) - Math.PI / 2);
        mctx.translate(box.x - me.car.x, box.y - me.car.y);
      }
      mctx.lineWidth = Math.max(14, 3 / s);
      mctx.lineJoin = "round";
      mctx.strokeStyle = C.chrome;
      mctx.globalAlpha = 0.5;
      mctx.stroke(road);
      mctx.globalAlpha = 1;
      // The overtake detection lines, across the road.
      mctx.strokeStyle = C.paper;
      mctx.lineWidth = 2 / s;
      for (const z of ZONES) {
        const [x, y] = track.pointAt(z.detect, 0);
        const h = dirAt(z.detect / LENGTH) + Math.PI / 2;
        const [dx, dy] = [Math.cos(h) * 14, Math.sin(h) * 14];
        mctx.beginPath();
        mctx.moveTo(x - box.x - dx, y - box.y - dy);
        mctx.lineTo(x - box.x + dx, y - box.y + dy);
        mctx.stroke();
      }
      const dot = (r: Racer, size: number) => {
        mctx.beginPath();
        mctx.arc(r.car.x - box.x, r.car.y - box.y, size / s, 0, Math.PI * 2);
        mctx.fill();
      };
      for (const r of race.racers.slice(1)) {
        if (r.out && !r.wreck) continue;
        mctx.fillStyle = paintOf(r.id);
        dot(r, 3.5);
      }
      mctx.fillStyle = C.accent;
      mctx.strokeStyle = C.paper;
      mctx.lineWidth = 2 / s;
      dot(me, 5);
      mctx.stroke();
    };

    // The fastest lap so far: the race's, or in qualifying the whole field's.
    const showFastest = () => {
      const f = quali
        ? quali.reduce<Race["fastest"]>(
            (a, q) => (q.fastest && (!a || q.fastest.ms < a.ms) ? q.fastest : a),
            null,
          )
        : race.fastest;
      const text = f ? `${driver(race, f.id).code} ${fmt(f.ms)}` : DASH;
      if (fastEl.current!.textContent !== text) fastEl.current!.textContent = text;
    };

    // The tower and the phone's gaps, twice a second rather than every frame. The tower runs down
    // the stage, above the touch controls: every car if they fit, else the top n, or once you're
    // out of them the top n - 3 and the cars either side of you. T switches its gap column: to
    // the car ahead, to the leader, or each car's tyres and laps on them.
    const drawBoard = () => {
      const run = order(race);
      const me = race.racers[0]!;
      const at = run.indexOf(me);
      const first = towerEls.current[0]!;
      const pads = matchMedia("(pointer: coarse)").matches ? 88 : 8;
      const room = cv.getBoundingClientRect().bottom - pads;
      const n = Math.max(3, Math.floor((room - first.getBoundingClientRect().top) / 20));
      const cut = at > n - 2;
      const m = MODES[mode]!;
      posEl.current!.textContent = `P${at + 1}`;
      // The crowd cheers a place taken.
      if (place && at + 1 < place && !quali) audio.current?.cheer();
      place = at + 1;
      // Laps down: by distance while running (to the leader's, which stops at the flag), and by
      // laps once in.
      const lead = Math.min(run[0]!.dist, race.laps * LENGTH);
      run.forEach((r, k) => {
        const row = towerEls.current[k]!;
        row.hidden = cut ? k >= n - 3 && Math.abs(k - at) > 1 : k >= n;
        row.classList.toggle("border-t", cut && k === at - 1);
        const [num, sw, code, done, fl, pit, pen, right] = row.children as unknown as HTMLElement[];
        done!.hidden = r.finish === null || !!r.out;
        num!.textContent = String(k + 1);
        const [tyre, out, g] = right!.children as unknown as HTMLElement[];
        pit!.hidden = !r.pit || !!r.out;
        out!.hidden = !r.out;
        sw!.style.background = paintOf(r.id);
        code!.textContent = driver(race, r.id).code;
        fl!.hidden = race.fastest?.id !== r.id;
        pen!.hidden = !r.penalty;
        pen!.textContent = `+${r.penalty / 1000}s`;
        tyre!.hidden = m !== "Tyres" || !!r.out;
        tyre!.querySelector("text")!.textContent = letter(r.tyre);
        tyre!.className = TYRE_INK[r.tyre];
        row.classList.toggle("opacity-50", !!r.out);
        const down = r.finish !== null ? race.laps - r.laps : Math.floor((lead - r.dist) / LENGTH);
        // Order is by distance and gaps by checkpoint, so a car just out of the pits can time in
        // ahead of the car it's behind; floor the interval at 0.
        const behind = () =>
          Math.max(0, gap(race, r) - (m === "Interval" ? gap(race, run[k - 1]!) : 0));
        g!.textContent = r.out
          ? "OUT"
          : m === "Tyres"
            ? String(r.laps - r.set)
            : !k
              ? m
              : down > 0
                ? lapsDown(down).toUpperCase()
                : r.cp < 0
                  ? ""
                  : plus(behind(), 1);
        row.classList.toggle("bg-lamp", r === me);
      });
      const near = (o: (typeof run)[number] | undefined, sign: string) =>
        o && o.cp >= 0 && me.cp >= 0
          ? `${driver(race, o.id).code} ${sign}${Math.abs(gap(race, o) - gap(race, me)).toFixed(1)}`
          : "";
      nearEl.current!.textContent = [near(run[at - 1], "+"), near(run[at + 1], "−")]
        .filter(Boolean)
        .join("  ·  ");
    };

    // Qualifying's stand-in for the position: your live delta, green when you're quicker.
    const showDelta = () => {
      const d = qualiDelta(quali!);
      const el = posEl.current!;
      el.textContent = d === null ? "–" : `${d < 0 ? "−" : "+"}${Math.abs(d).toFixed(2)}`;
      el.classList.toggle("text-go", d !== null && d < 0);
    };

    const start = () => {
      race = newRace(
        track,
        lineupRef.current,
        Math.random,
        "medium",
        levelRef.current,
        lapsOf(DISTANCES[distRef.current]!, track),
        true,
        lineupRef.current === GRID ? undefined : weekend,
      );
      quali = null;
      towerEl.current!.hidden = false;
      lapName.current!.textContent = "Lap";
      [fast, shown] = [0, -1];
      setTiming(null);
      posEl.current!.classList.remove("text-go");
      scene?.paint(LEVELS[race.level].colors, LEVELS[race.level].liveries);
      phase = "grid";
      setGrid(true);
      pickWing(lineupRef.current === GRID ? track.WING : qualiWing.current);
      pause = 200 + Math.random() * 2800;
      for (const i of [0, 1, 2]) paintSector(i, "", "");
      mine = [0, 0, 0];
      lastEl.current!.textContent = DASH;
      bestEl.current!.textContent = DASH;
      fastEl.current!.textContent = DASH;
      lightsEl.current!.hidden = false;
      rcEl.current!.hidden = true;
      msgAt = -Infinity;
      skipping = false;
      waitEl.current!.hidden = true;
      paused = false;
      pauseEl.current!.hidden = true;
      drawBoard();
    };
    start();
    skip.current = () => {
      skipping = true;
    };
    // Not on the grid screen or once the classification's up.
    togglePause.current = (on = !paused) => {
      if (phase === "grid" || race.done) return;
      paused = on;
      pauseEl.current!.hidden = !paused;
      abandonEl.current!.hidden = !quali;
      quitEl.current!.hidden = !!quali;
      keys.clear();
    };
    // Ends your quali lap without a time.
    abandon.current = () => {
      race.racers[0]!.finish = race.t;
      togglePause.current();
    };
    // Out of a race to the grid screen, on the same grid: a slot you qualified for is kept.
    quit.current = start;
    // Out of qualifying onto its grid; out of a race, back to the back.
    again.current = () => {
      if (race.session?.state === "break") {
        nextSegment(race);
        fast = 0;
        return setResult(null);
      }
      const g = nextGrid ?? GRID;
      nextGrid = null;
      lineupRef.current = g;
      setLineup(g);
      setResult(null);
      start();
    };
    // Straight back to the lights: a new quali lap any time, a race only from the pause screen so a
    // stray key doesn't throw one away. Not once the classification's up.
    restart.current = () => {
      if (phase === "grid" || (quali ? quali.every((q) => q.done) : race.done)) return;
      const w = wingRef.current;
      if (quali) {
        start();
        pickWing(w);
        return qualify.current();
      }
      if (!paused) return;
      if (race.session) {
        start();
        pickWing(w);
        return qualify.current();
      }
      const t = race.racers[0]!.stints[0]!;
      start();
      pickWing(w);
      go.current(t);
    };
    // A new level or distance is a new race on the same grid.
    regrid.current = () => {
      if (phase === "grid") start();
    };
    const launch = () => {
      scene?.skipIntro();
      keys.clear();
      [phase, phaseAt] = ["lights", performance.now()];
      setGrid(false);
      // Lining up or qualifying is a click or a key, so the browser lets a remembered "sound on"
      // start.
      if (read(SOUND, false)) audio.current ??= createAudio(aidsRef.current.mix);
    };
    go.current = (t) => {
      const me = race.racers[0]!;
      const plan = teamPlan(race.laps, track, t);
      [me.tyre, me.stints, me.stops, me.plan] = [t, [t], plan.at, plan.tyres];
      [me.wing, me.nextWing] = [wingRef.current, wingRef.current];
      drawBoard();
      launch();
    };
    qualify.current = () => {
      if (fullRef.current) return session();
      quali = newQuali(track, levelRef.current);
      race = quali[0]!;
      weekend = race.cars;
      qualiWing.current = wingRef.current;
      [race.racers[0]!.wing, race.racers[0]!.nextWing] = [wingRef.current, wingRef.current];
      towerEl.current!.hidden = true;
      nearEl.current!.textContent = "";
      lapName.current!.textContent = "Quali";
      showDelta();
      launch();
    };
    // Full qualifying: no lights, you start in the garage.
    const session = () => {
      race = newSession(track, levelRef.current);
      weekend = race.cars;
      qualiWing.current = wingRef.current;
      [race.racers[0]!.wing, race.racers[0]!.nextWing] = [wingRef.current, wingRef.current];
      towerEl.current!.hidden = true;
      nearEl.current!.textContent = "";
      lapName.current!.textContent = "";
      launch();
      phase = "racing";
      lightsEl.current!.hidden = true;
      showSession();
    };
    leaveGarage.current = () => {
      if (race.session) goOut(race);
      fast = 0;
    };
    chooseSet.current = (k) => {
      if (!race.session) return;
      pickSet(race, k);
      showSession();
    };
    // Fast-forward in the garage, and once you're knocked out, skip to the end.
    fastForward.current = () => {
      const s = race.session;
      if (!s) return;
      fast = !s.in.includes(0) ? SKIP : fast ? 0 : FAST;
    };
    // Full qualifying's HUD: the clock, your place in the segment and the cut, and the garage
    // screen's timing.
    const showSession = () => {
      const s = race.session!;
      const order = segmentOrder(s, s.seg).filter((id) => s.in.includes(id));
      const me = race.racers[0]!;
      const pos = order.indexOf(0) + 1;
      posEl.current!.textContent = s.best[s.seg]![0] ? `P${pos}` : "–";
      lapEl.current!.textContent = `Q${s.seg + 1} ${clock(s.left)}`;
      const cut = CUTS[s.seg];
      const last = cut && s.best[s.seg]![order[cut - 1]!];
      nearEl.current!.textContent = last ? `Cut P${cut} ${fmt(last)}` : "";
      setTiming(
        s.state === "running" && inGarage(me)
          ? {
              seg: s.seg,
              left: s.left,
              red: s.red,
              through: s.in.includes(0),
              fast: fast > 0,
              rows: order.map((id) => ({ id, best: s.best[s.seg]![id]!, phase: s.phase[id]! })),
              sets: s.sets[0]!.map(({ wear, used }) => ({
                life: wear.reduce((a, b) => a + b, 0) / wear.length,
                used,
              })),
              pick: s.pick,
            }
          : null,
      );
    };
    // A segment's classification as it ends, and at the end of Q3 the grid.
    const showSegment = () => {
      const s = race.session!;
      const done = s.state === "done";
      const segOf = (id: number) => s.reached.reduce((k, ids, i) => (ids.includes(id) ? i : k), 0);
      const ids = done ? sessionGrid(s) : segmentOrder(s, s.seg);
      const table = ids.map((id) => ({
        ...qualiRow(id, s.best[segOf(id)]![id]!, s.sectors[segOf(id)]![id]!),
        drop: done && !id ? s.drop : 0,
      }));
      const k = ids.indexOf(0);
      const q = `Q${s.seg + 1}`;
      const text = done
        ? qualiWord(k + 1, !!table[k]!.best)
        : k < CUTS[s.seg]!
          ? pick([`Through to Q${s.seg + 2}. P${k + 1}.`, `P${k + 1}, we're through. Next one.`])
          : pick([`Out in ${q}. P${k + 1}.`, `P${k + 1}, that's ${q} done for us. Sorry.`]);
      race.msgs.push({ kind: "radio", id: 0, text });
      nextGrid = done ? ids : null;
      fast = 0;
      setResult({
        quali: true,
        table,
        level: race.level,
        laps: 1,
        fastest: null,
        radio: text,
        seg: s.seg,
        cut: done ? undefined : CUTS[s.seg],
        next: !done,
      });
    };
    // The set for your next stop, any time until it's on.
    fit.current = (t) => {
      const me = race.racers[0]!;
      if (!quali && !race.session && me.finish === null && !me.out && !(me.pit && me.served))
        me.fit = t;
    };
    // The wing: on the grid screen for the session (not once qualified), in a race for your next
    // stop, as the set is.
    fitWing.current = (by) => {
      const clamp = (w: number) => Math.max(1, Math.min(WINGS, w + by));
      if (phase === "grid") {
        if (lineupRef.current === GRID) pickWing(clamp(wingRef.current));
        return;
      }
      const me = race.racers[0]!;
      if (!quali && !race.session && me.finish === null && !me.out && !(me.pit && me.served))
        me.nextWing = clamp(me.nextWing);
    };

    // Under a Safety Car or VSC, asking the team driving you to box, or not.
    boxIt.current = () => {
      if (phase === "racing" && !quali && !race.session && !paused) toggleBox(race);
    };

    let raf = 0;
    let last = performance.now();
    const ro = new ResizeObserver(() => {
      scene?.resize(cv.clientWidth, cv.clientHeight);
      mv.width = mv.clientWidth * devicePixelRatio;
      mv.height = mv.clientHeight * devicePixelRatio;
    });
    ro.observe(mv);

    const frame = (t: number) => {
      const dt = Math.min((t - last) / 1000, 1 / 30);
      // Paused, the clocks the lights and Race Control run on stand still too.
      if (paused) [phaseAt, msgAt] = [phaseAt + t - last, msgAt + t - last];
      last = t;
      // Touch: the throttle's on unless braking, and braking at a stop reverses.
      const steer = p.touch ? +p.right - +p.left : +keys.has("right") - +keys.has("left");
      const gas = p.touch ? !p.brake : keys.has("up");
      const brake = p.touch ? p.brake : keys.has("down");
      const ot = p.touch ? p.ot : keys.has("ot");

      if (phase === "lights" && !paused) {
        const lit = Math.min(5, Math.floor((t - phaseAt) / 1000));
        lampEls.current.forEach((l, i) => {
          l.classList.toggle("bg-accent", i < lit);
          l.classList.toggle("bg-lamp", i >= lit);
        });
        if (t - phaseAt > 5000 + pause) {
          phase = "racing";
          if (!quali) audio.current?.cheer();
          for (const l of lampEls.current) l.classList.replace("bg-accent", "bg-lamp");
          setTimeout(() => lightsEl.current && (lightsEl.current.hidden = true), 1200);
        }
      }

      const me = race.racers[0]!;
      if (phase === "racing" && !paused) {
        const wasDone = race.done;
        // Before your tick: a lap that ends after every computer car's would otherwise already
        // read as over, and the classification would never come.
        const over = quali?.every((q) => q.done);
        const raw = { gas, brake, steer, ot };
        const input = aidsRef.current.assist ? assist(race, me, raw) : raw;
        const sess = race.session;
        const split = sess ? tickSession(race, input, dt) : tick(race, input, dt);
        if (sess)
          for (let n = 0; n < fast && sess.state === "running" && inGarage(me); n++)
            tickSession(race, still, 1 / 30);
        if (sess && sess.state !== "running" && shown !== sess.seg) {
          shown = sess.seg;
          showSegment();
        }
        // After your flag, Skip runs the rest of the field to theirs a few hundred frames at a time.
        if (skipping) for (let n = 0; n < 300 && !race.done; n++) tick(race, still, 1 / 30);
        if (quali) {
          // The pit lane or track limits end your lap without a time. Once it's over the rest
          // run to their flags the same way, then the classification sets the grid.
          if (me.finish === null && (me.pit || me.lap.invalid)) me.finish = race.t;
          if (me.finish !== null) skipping = true;
          for (const q of quali.slice(1))
            for (let n = 0; n < (skipping ? 300 : 1) && !q.done; n++)
              tick(q, still, skipping ? 1 / 30 : dt);
          if (!over && quali.every((q) => q.done)) {
            const table = qualiOrder(quali).map(({ id, best, sectors }) =>
              qualiRow(id, best, sectors),
            );
            nextGrid = table.map((r) => r.id);
            const k = table.findIndex((r) => !r.id);
            const text = qualiWord(k + 1, !!table[k]!.best);
            race.msgs.push({ kind: "radio", id: 0, text });
            setResult({
              quali: true,
              table,
              level: race.level,
              laps: 1,
              fastest: null,
              radio: text,
            });
          }
        }
        if (split) {
          const s = split.sector;
          if (s === 0) for (const i of [1, 2]) paintSector(i, "", "");
          const pb = split.valid && (!mine[s] || split.ms <= mine[s]);
          if (pb) mine[s] = split.ms;
          // In qualifying, against the whole field's.
          const best = quali
            ? Math.min(...quali.map((q) => q.sectors[s] || Infinity))
            : race.sectors[s]!;
          const fl = split.valid && split.ms <= best;
          paintSector(s, secs(split.ms), !split.valid ? "bad" : fl ? "fl" : pb ? "pb" : "slow");
        }
        // Off the track: the sector you're in goes red there and then, and so does the rest of the lap.
        const k = me.lap.marks.length;
        if (me.lap.invalid && sectorEls.current[k]!.dataset.cls !== "bad")
          paintSector(k, "", "bad");
        if (split?.lap) {
          const l = lastEl.current!;
          l.textContent = fmt(split.lap);
          l.classList.toggle("text-accent", !split.valid);
          l.classList.toggle("text-paper", split.valid);
          if (me.best) bestEl.current!.textContent = fmt(me.best);
          if (split.valid && (!record || split.lap < record)) {
            record = split.lap;
            write(BEST(trackId), record);
          }
        }
        if (race.done && !wasDone && !quali) {
          const table = results(race);
          const text = raceWord(table);
          race.msgs.push({ kind: "radio", id: 0, text });
          const { level, laps, fastest } = race;
          setResult({
            quali: false,
            table,
            level,
            laps,
            fastest: fastest?.id ?? null,
            radio: text,
          });
        }
        if (t - board > 500) {
          board = t;
          if (quali) showDelta();
          else if (race.session) showSession();
          else drawBoard();
          showFastest();
        }
        // The classification waits for the whole field to take the flag, or retire.
        const waiting = !quali && !race.session && (me.finish !== null || !!me.out) && !race.done;
        waitEl.current!.hidden = !waiting;
        if (waiting) {
          const left = race.racers.filter((r) => r.finish === null && !r.out).length;
          const text = `Waiting for ${left} to finish`;
          if (waitText.current!.textContent !== text) waitText.current!.textContent = text;
          waitHead.current!.textContent = me.out ? "Retired" : "Chequered flag";
        }
      }

      if (!race.session)
        lapEl.current!.textContent = quali
          ? ""
          : `${Math.min(me.laps + 1, race.laps)}/${race.laps}`;
      const time = timeEl.current!;
      // Zero until a rolling start reaches the line.
      const { start: from } = me.lap;
      time.textContent = fmt(
        phase === "racing" && me.finish === null && !me.out && from !== null ? race.t - from : 0,
      );
      time.classList.toggle("text-accent", me.lap.invalid);
      time.classList.toggle("text-paper", !me.lap.invalid);

      const ease = Math.min(1, dt * 12);
      thr += (+gas - thr) * ease;
      brk += (+brake - brk) * ease;
      const { car } = me;
      speedEl.current!.textContent = String(Math.round(Math.abs(car.v) * 3.6));
      // Red when the car can't brake in time for the next corner on these tyres. The limit stops
      // at TOP where there's nothing to brake for.
      const limit = limitAt(atDist(me.p * LENGTH), grip(me.life, me.tyre));
      speedEl.current!.classList.toggle("text-accent", limit < TOP && car.v > limit + 2);
      const next = nextCorner(me.p);
      if (nextEl.current!.textContent !== next) nextEl.current!.textContent = next;
      const g = gear(car.v);
      gearEl.current!.textContent = String(g);
      thrEl.current!.style.strokeDashoffset = String(1 - thr);
      brkEl.current!.style.strokeDashoffset = String(1 - brk);
      // The rev strip fills through each gear.
      const lit =
        g === "R" ? 0 : Math.round(REVS * Math.min(1, Math.max(0, (car.v / TOP) * 8 - (g - 1))));
      if (lit !== revs) {
        revs = lit;
        revEls.current.forEach((el, k) => {
          el.classList.toggle(REV_INK(k), k < lit);
          el.classList.toggle("bg-lamp", k >= lit);
        });
      }
      tyreEls.current.forEach((el, k) => {
        // A puncture: that wheel at 0, blinking red.
        const flat = me.puncture && me.flat === k;
        const w = flat ? 0 : me.wear[k]!;
        const text = String(Math.round(w * 100));
        if (el.textContent !== text) el.textContent = text;
        const cls = `${TYRE_CELL} ${flat ? "bg-accent motion-safe:animate-pulse" : wearInk(w, me.warm)}`;
        if (el.className !== cls) el.className = cls;
      });
      tyreText.current!.textContent = `${Math.round(me.life * 100)}%`;
      const name = tyreName.current!;
      if (name.textContent !== letter(me.tyre)) {
        name.querySelector("text")!.textContent = letter(me.tyre);
        name.className = TYRE_INK[me.tyre];
      }
      wingEl.current!.textContent = `W${me.wing}`;
      const nextWing = wingNext.current!;
      nextWing.textContent = `W${me.nextWing}`;
      nextWing.classList.toggle("text-accent", me.nextWing !== me.wing);
      // The next set: on track to pick ahead, in the lane what's going on.
      const fitting =
        phase === "racing" &&
        !quali &&
        !race.session &&
        me.finish === null &&
        !me.out &&
        !(me.pit && me.served);
      fitWrap.current!.hidden = !fitting;
      fitLabel.current!.textContent = me.pit ? "Fitting" : "Next set";
      if (fitting)
        fitEls.current.forEach((b, i) => {
          const on = COMPOUNDS[i] === me.fit;
          b.classList.toggle("bg-lamp", on);
          b.classList.toggle("ring-paper", on);
          b.classList.toggle("ring-paper/25", !on);
          b.setAttribute("aria-pressed", String(on));
        });
      limiterEl.current!.hidden = !me.pit;
      const banner = bannerEl.current!;
      // A penalty's served first, before the stop's own STOP seconds.
      const serving = me.stop > STOP;
      const say =
        me.stop > 0
          ? serving
            ? `Penalty ${(me.stop - STOP).toFixed(1)}`
            : me.stop.toFixed(1)
          : wrongWay(me)
            ? "Wrong way"
            : "";
      if (banner.textContent !== say) banner.textContent = say;
      banner.hidden = !say;
      banner.classList.toggle("text-accent", me.stop <= 0 || serving);

      // Race Control: one message at a time for 3.5 s. A backlog drops other cars' track-limit
      // notes first, so yours and the flags always get through.
      while (race.msgs.length > 3) {
        const k = race.msgs.findIndex((m) => m.id && m.kind === "limits");
        if (k < 0) break;
        race.msgs.splice(k, 1);
      }
      if (t - msgAt > 3500) {
        let m = race.msgs.shift();
        while (m?.chatter && race.t - m.at! > CHATTER) m = race.msgs.shift();
        rcEl.current!.hidden = !m;
        if (m) {
          msgAt = t;
          rcLabel.current!.textContent = m.kind === "radio" ? "Radio · HAR" : "Race Control";
          if (m.kind === "radio") audio.current?.radio();
          rcLabel.current!.classList.toggle("text-accent", m.kind === "radio");
          const icon = m.kind === "sc" && m.text === "Green flag" ? "green" : m.kind;
          for (const el of rcIcon.current!.children as unknown as HTMLElement[])
            el.hidden = el.dataset.kind !== icon;
          rcText.current!.textContent = m.text;
        }
      }
      const limits = limitsEl.current!;
      limits.hidden = !me.strikes;
      limits.lastChild!.textContent = String(me.strikes);
      limits.classList.toggle("text-accent", me.strikes >= 3);
      limits.classList.toggle("text-slow", me.strikes < 3);
      const hurt = damageEl.current!;
      hurt.hidden = !me.damage;
      hurt.lastChild!.textContent = `${Math.round(me.damage * 100)}%`;
      straightEl.current!.hidden = !me.straight;
      const sc = scEl.current!;
      const n = race.neutral?.kind;
      sc.hidden = !n;
      if (n && sc.lastChild!.textContent !== n.toUpperCase())
        sc.lastChild!.textContent = n.toUpperCase();
      blueEl.current!.hidden = !me.blue;
      unlapEl.current!.hidden = !me.unlap;
      const driven = !quali && teamDriving(race, me);
      const team = teamEl.current!;
      team.hidden = !driven;
      // The team's suggesting a stop: B (or Box) takes it.
      const boxing = me.box ? "Boxing" : me.boxCall ? "Box? B" : "Team driving";
      if (team.lastChild!.textContent !== boxing) team.lastChild!.textContent = boxing;
      const bp = boxPad.current!;
      bp.hidden = !driven || me.pit || !p.touch;
      if (bp.textContent !== (me.box ? "Stay out" : "Box"))
        bp.textContent = me.box ? "Stay out" : "Box";
      const otChip = otEl.current!;
      otChip.hidden = !me.ot;
      otChip.classList.toggle("bg-lamp", me.ot === "ready");
      otChip.classList.toggle("bg-accent", me.ot === "on");
      otPad.current!.hidden = me.ot !== "ready" || !p.touch;
      // Green on a lap with Overtake's harvest bonus; the reading goes red while super clipping.
      const bat = batEl.current!;
      bat.style.transform = `scaleX(${me.charge / CAP})`;
      bat.classList.toggle("bg-go", me.laps === me.bonusLap);
      bat.classList.toggle("bg-paper", me.laps !== me.bonusLap);
      batText.current!.textContent = `${me.charge.toFixed(1)} MJ`;
      batText.current!.classList.toggle("text-accent", me.clipping);
      batText.current!.classList.toggle("text-paper", !me.clipping);
      // What you hear (audio.ts): your engine, the three nearest cars, the stands and the tyres.
      // The guns go once any penalty's served.
      if (me.stop > 0 && me.stop <= STOP && !stopped) audio.current?.stop(STOP);
      stopped = me.stop > 0 && me.stop <= STOP;
      if (audio.current && (paused || me.out)) audio.current.frame(null);
      else if (audio.current) {
        const { edge, p: at } = nearest(car.x, car.y);
        const kerbed = Math.abs(CURVE[atDist(at * LENGTH)]!) > 1 / KERB_R;
        const [fx, fy] = [Math.cos(car.h), Math.sin(car.h)];
        const cars = race.racers
          .filter((o) => o !== me && !o.out)
          .map((o) => {
            const [dx, dy] = [o.car.x - car.x, o.car.y - car.y];
            const dist = Math.max(0.1, Math.hypot(dx, dy));
            const [vx, vy] = [
              Math.cos(o.car.h) * o.car.v - fx * car.v,
              Math.sin(o.car.h) * o.car.v - fy * car.v,
            ];
            const closing = -(dx * vx + dy * vy) / dist;
            return { dist, closing, pan: (dy * fx - dx * fy) / dist, rpm: rpm(o.car.v) };
          })
          .sort((a, b) => a.dist - b.dist)
          .slice(0, 3);
        const crowd = Math.max(
          0,
          ...STANDS.map((st) => Math.max(0, 1 - Math.hypot(st.x - car.x, st.y - car.y) / 150) ** 2),
        );
        const g = gear(car.v);
        audio.current.frame({
          rpm: rpm(car.v),
          gear: g === "R" ? 1 : g,
          load: thr,
          limiter: me.pit && me.stop <= 0 && Math.abs(car.v) > 1,
          slide: Math.abs(car.v) > 15 ? (me.slide - 0.95) / 0.3 : 0,
          kerb: kerbed && edge > -2.3 && edge < 0.3 ? Math.abs(car.v) / TOP : 0,
          grass: edge > 0 ? Math.min(1, Math.abs(car.v) / 40) : 0,
          crowd: Math.min(1, crowd),
          cars,
        });
      }

      // The racing line and braking point (assist.ts), while you're the one driving.
      const { line, brakes } = aidsRef.current;
      const driving = me.finish === null && !me.out && !me.pitting;
      const m = me.p * LENGTH;
      const brakeIn =
        driving && (line !== "off" || brakes)
          ? guide(track, carGrip(race, me), car.v, m, line, shades)
          : null;
      scene!.guide(
        driving && line !== "off" ? shades : null,
        brakes && brakeIn !== null && brakeIn > 15 ? m + brakeIn : null,
      );

      // Each team's crew: out for a car in the lane, at the car while it's stopped (standing back
      // while it sits out a penalty).
      const crews = new Array<number>(CARS / 2).fill(0);
      for (const r of race.racers)
        if (!r.out)
          crews[r.id >> 1] = Math.max(
            crews[r.id >> 1]!,
            r.stop > 0 && r.stop <= STOP ? 2 : r.pit ? 1 : 0,
          );
      scene!.frame(
        race.racers.map((r) => r.car),
        race.racers.map(towShare),
        steer,
        paused ? 0 : dt,
        crews,
        race.racers.map((r) => !!r.out && !r.wreck),
        race.sc?.car ?? null,
        // Yas Marina's sunset follows the leader round; qualifying there is after dark.
        quali || race.session
          ? 1
          : Math.max(0, ...race.racers.map((r) => r.dist)) / (race.laps * LENGTH),
      );
      drawMap();
      raf = requestAnimationFrame(frame);
    };

    let dead = false;
    import("@/scene")
      .then(({ createScene }) => createScene(cv, C, flat, track))
      .then((s) => {
        if (dead) return s.dispose();
        scene = s;
        s.resize(cv.clientWidth, cv.clientHeight);
        ro.observe(cv);
        setStatus("ready");
        last = performance.now();
        start();
        raf = requestAnimationFrame(frame);
      })
      .catch(() => !dead && setStatus("error"));

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      ac.abort();
      scene?.dispose();
      audio.current?.close();
      audio.current = null;
    };
  }, [trackId]);

  const shown = status === "ready" ? "" : "opacity-0";
  const leader = result?.table[0]?.time ?? 0;
  const [toCar, setToCar] = useState(() => read(GAPS, false));
  const flipGaps = () => {
    setToCar(!toCar);
    write(GAPS, !toCar);
  };
  // Qualifying's best sectors, purple in the table.
  const bestSectors = [0, 1, 2].map((s) =>
    Math.min(...(result?.table ?? []).map((r) => r.sectors?.[s] || Infinity)),
  );

  return (
    <main
      aria-label={`Race at ${def.name}`}
      className="on-dark flex h-dvh flex-col gap-3 bg-ink px-4 pt-3 pb-4 text-paper [--focus:var(--color-accent)] md:px-6 md:pt-4 md:pb-5"
    >
      <div className="flex items-center gap-x-6 text-base tabular-nums">
        <span className="disp text-xl">{def.name}</span>
        <span className={`${label} hidden md:inline`}>
          Grid<span className="ml-2 text-paper">P{slot}</span>
        </span>
        <button
          type="button"
          onClick={openSettings}
          aria-haspopup="dialog"
          className="ml-auto flex min-h-11 items-center gap-1.5 pl-4 text-soft active:scale-[.96]"
        >
          <Cog />
          Settings
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-carbon">
        <div ref={stage} className="absolute inset-0 touch-none select-none" />

        {status !== "ready" && (
          <div className="absolute inset-0 grid place-items-center p-10">
            {status === "loading" ? (
              <svg
                viewBox={`-10 -10 ${box2.w + 20} ${box2.h + 20}`}
                role="img"
                aria-label={`Loading ${def.name}`}
                className="h-full max-h-80 motion-safe:animate-pulse"
              >
                <path
                  d={outline}
                  fill="none"
                  stroke="var(--color-soft)"
                  strokeWidth="5"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <p className="text-soft">This browser can&apos;t run the 3D drive.</p>
            )}
          </div>
        )}

        {/* Top left, the F1 games' way: your place and the lap on a slanted header, over the tower. */}
        <div
          className={`pointer-events-none absolute top-2 left-2 flex flex-col items-start gap-1.5 transition-opacity duration-300 md:top-3 md:left-3 ${shown}`}
        >
          <div
            className={`${hud} ${slantR} flex items-center gap-3 border-l-[3px] border-accent py-1.5 pr-7 pl-2.5 md:py-2`}
          >
            <span ref={posEl} className="disp text-[26px] leading-none md:text-[32px]">
              P{slot}
            </span>
            <span className="flex flex-col gap-0.5 text-xs leading-none">
              <span className="font-semibold tracking-wide text-soft uppercase">
                <span ref={lapName}>Lap</span>{" "}
                <span ref={lapEl} className="text-paper">
                  1/{laps}
                </span>
              </span>
              <span className="text-soft">
                Next{" "}
                <span ref={nextEl} className="text-paper">
                  Rettifilo
                </span>
              </span>
            </span>
            <span
              ref={limitsEl}
              hidden
              title="Track limits"
              className="flex items-center gap-1 text-sm font-semibold"
            >
              <Warning />
              <span />
            </span>
          </div>
          <div
            ref={nearEl}
            className={`${hud} px-2.5 py-1 text-xs text-paper empty:hidden md:hidden`}
          />

          <div ref={towerEl} className={`${hud} hidden w-56 py-1 text-sm md:block`}>
            {Array.from({ length: CARS }, (_, k) => (
              <div
                key={k}
                ref={(el) => {
                  if (el) towerEls.current[k] = el;
                }}
                className="flex items-center gap-1.5 border-paper/25 pr-2.5 pl-2 leading-5 whitespace-nowrap"
              >
                <span className="w-5 shrink-0 text-right text-xs text-soft" />
                <span className="h-3 w-1 shrink-0 rounded-full ring-1 ring-paper/25" />
                <span className="shrink-0 font-semibold" />
                <span hidden title="Finished">
                  <Chequered className="size-3.5" />
                </span>
                <span hidden title="Fastest lap" className="text-fl">
                  <Stopwatch className="size-3.5" />
                </span>
                <span hidden title="In the pit lane" className="text-slow">
                  <Pit className="size-3.5" />
                </span>
                <span
                  hidden
                  className="shrink-0 rounded-sm bg-slow px-1 text-xs font-semibold text-ink"
                />
                <span className="ml-auto flex items-center gap-1.5 text-right text-soft">
                  <span hidden>
                    <Roundel letter="M" className="size-3.5" />
                  </span>
                  <span hidden className="text-accent">
                    <Out className="size-3.5" />
                  </span>
                  <span />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div
          ref={lightsEl}
          className={`pointer-events-none absolute top-[38%] left-1/2 flex -translate-x-1/2 gap-2 rounded-md bg-pit p-2.5 shadow-[inset_0_0_0_2px_var(--color-lamp)] md:top-4 md:gap-3 md:p-3 ${shown}`}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              ref={(el) => {
                if (el) lampEls.current[i] = el;
              }}
              className="size-6 rounded-full bg-lamp transition-colors duration-[60ms] md:size-8"
            />
          ))}
        </div>

        <div
          ref={rcEl}
          hidden
          aria-live="polite"
          className={`${panel} pointer-events-none absolute right-2 bottom-24 left-2 flex items-center gap-3 px-3 py-2 text-sm max-md:pointer-coarse:bottom-56 md:top-3 md:right-auto md:bottom-auto md:left-1/2 md:max-w-xl md:-translate-x-1/2 md:px-4 md:text-[15px]`}
        >
          <span
            ref={rcIcon}
            className="grid size-7 shrink-0 place-items-center rounded-[3px] bg-lamp"
          >
            {RC_ICONS.map(([k, Glyph, ink]) => (
              <span key={k} data-kind={k} hidden className={ink}>
                <Glyph className="size-5" />
              </span>
            ))}
          </span>
          <span>
            <span ref={rcLabel} className="block text-xs font-semibold tracking-wide uppercase" />
            <span ref={rcText} />
          </span>
        </div>

        <div
          ref={bannerEl}
          hidden
          role="status"
          className="disp pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 rounded-lg bg-ink/85 px-6 py-3 text-[28px] leading-none uppercase motion-safe:animate-livepulse md:text-[40px]"
        />

        <div
          ref={waitEl}
          hidden
          role="status"
          className={`${panel} absolute top-[30%] left-1/2 flex -translate-x-1/2 items-center gap-4 px-4 py-3`}
        >
          <div>
            <p ref={waitHead} className="disp text-xl leading-none whitespace-nowrap">
              Chequered flag
            </p>
            <p ref={waitText} className={`${label} mt-1 whitespace-nowrap`} />
          </div>
          <button
            type="button"
            onClick={() => skip.current()}
            className="min-h-11 rounded-md bg-paper px-4 font-semibold text-ink active:scale-[.98]"
          >
            Skip
          </button>
        </div>

        <div
          ref={pauseEl}
          hidden
          role="status"
          className={`${panel} absolute top-[30%] left-1/2 flex -translate-x-1/2 items-center gap-4 px-4 py-3`}
        >
          <div>
            <p className="disp text-xl leading-none whitespace-nowrap">Paused</p>
            <p className={`${label} mt-1 whitespace-nowrap pointer-coarse:hidden`}>
              P to resume, R to restart
            </p>
          </div>
          <button
            type="button"
            onClick={() => restart.current()}
            className="min-h-11 rounded-md px-4 font-semibold ring-1 ring-paper/25 active:scale-[.98]"
          >
            Restart
          </button>
          <button
            ref={abandonEl}
            type="button"
            hidden
            onClick={() => abandon.current()}
            className="min-h-11 rounded-md px-4 font-semibold ring-1 ring-paper/25 active:scale-[.98]"
          >
            Abandon lap
          </button>
          <button
            ref={quitEl}
            type="button"
            hidden
            onClick={() => quit.current()}
            className="min-h-11 rounded-md px-4 font-semibold ring-1 ring-paper/25 active:scale-[.98]"
          >
            Quit
          </button>
          <button
            type="button"
            onClick={() => setSettings(true)}
            className="min-h-11 rounded-md px-4 font-semibold ring-1 ring-paper/25 active:scale-[.98]"
          >
            Settings
          </button>
          <button
            type="button"
            onClick={() => togglePause.current()}
            className="min-h-11 rounded-md bg-paper px-4 font-semibold text-ink active:scale-[.98]"
          >
            Resume
          </button>
        </div>

        {settings && (
          <div
            className="absolute inset-0 z-10 grid place-items-center bg-ink/70 p-4"
            onClick={(e) => e.target === e.currentTarget && setSettings(false)}
          >
            <div
              role="dialog"
              aria-label="Settings"
              className={`${panel} max-h-full w-full max-w-sm overflow-y-auto p-4 md:p-5`}
            >
              <p className="disp text-xl">Settings</p>
              <Choice
                name="Racing line"
                value={aids.line}
                options={[
                  ["off", "Off"],
                  ["corners", "Corners"],
                  ["full", "Full"],
                ]}
                pick={(line) => aid({ line })}
              />
              <Choice
                name="Braking point"
                value={aids.brakes}
                options={[
                  [false, "Off"],
                  [true, "On"],
                ]}
                pick={(brakes) => aid({ brakes })}
              />
              <Choice
                name="Steering assist on the straights"
                value={aids.assist}
                options={[
                  [false, "Off"],
                  [true, "On"],
                ]}
                pick={(on) => aid({ assist: on })}
              />
              <Choice
                name="Sound"
                value={sound}
                options={[
                  [false, "Off"],
                  [true, "On"],
                ]}
                pick={(on) => on !== sound && toggleSound()}
              />
              {sound &&
                (Object.keys(MIX) as (keyof Mix)[]).map((k) => (
                  <label key={k} className="mt-2 flex items-center gap-3 text-sm">
                    <span className="w-20 shrink-0 text-soft">{MIX_NAMES[k]}</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(aids.mix[k] * 100)}
                      onChange={(e) => aid({ mix: { ...aids.mix, [k]: +e.target.value / 100 } })}
                      className="min-h-11 flex-1 accent-accent"
                    />
                    <span className="w-8 text-right">{Math.round(aids.mix[k] * 100)}</span>
                  </label>
                ))}
              <button
                type="button"
                onClick={() => setSettings(false)}
                className="mt-4 min-h-11 w-full rounded-md bg-paper px-4 font-semibold text-ink active:scale-[.98]"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Top right: the map, and under it your lap, sectors and times, small. */}
        <div
          className={`${hud} pointer-events-none absolute top-2 right-2 flex flex-col p-2 transition-opacity duration-300 md:top-3 md:right-3 md:p-3 ${shown}`}
        >
          <canvas ref={map} className={`block self-center ${MAPS[mapSize]}`} />
          <div className="mt-2 min-w-36 text-xs text-soft md:text-[13px]">
            <div className="flex items-center justify-between gap-2">
              <Stopwatch className="size-3.5" />
              <span ref={timeEl} className="disp text-base leading-none text-paper md:text-lg">
                0:00.000
              </span>
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5 text-center">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  ref={(el) => {
                    if (el) sectorEls.current[i] = el;
                  }}
                  className="flex flex-col gap-0.5"
                >
                  <span>S{i + 1}</span>
                  <span className="h-0.5 rounded-full bg-lamp" />
                </span>
              ))}
            </div>
            <div className="mt-1.5 flex justify-between gap-2">
              <span>
                Last{" "}
                <span ref={lastEl} className="text-paper">
                  {DASH}
                </span>
              </span>
              <span>
                Best{" "}
                <span ref={bestEl} className="text-paper">
                  {DASH}
                </span>
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              <Stopwatch className="size-3.5 text-fl" />
              Fastest
              <span ref={fastEl} className="ml-auto text-paper">
                {DASH}
              </span>
            </div>
          </div>
        </div>

        {/* The car, F1 TV's onboard way: the status pills over a slab with the rev strip, the gear
            between throttle (left) and brake (right) arcs, the speed, then tyres and battery. */}
        <div
          className={`pointer-events-none absolute right-2 bottom-2 flex flex-col items-end gap-1.5 transition-opacity duration-300 pointer-coarse:bottom-20 md:right-3 md:bottom-3 md:pointer-coarse:bottom-21 ${shown}`}
        >
          <div className="flex h-6 items-center gap-1 text-xs font-semibold tracking-wide uppercase">
            <span ref={limiterEl} hidden className={`${chip} bg-slow text-ink`}>
              <Pit className="size-3.5" />
              Pit
            </span>
            <span ref={straightEl} hidden className={`${chip} bg-go text-ink`}>
              <Straight className="size-3.5" />
              Straight
            </span>
            <span ref={otEl} hidden className={`${chip} text-paper`}>
              <Bolt className="size-3.5" />
              Overtake
            </span>
            <span ref={scEl} hidden className={`${chip} bg-slow text-ink`}>
              <Car className="size-3.5" />
              <span>SC</span>
            </span>
            <span ref={teamEl} hidden className={`${chip} bg-paper text-ink`}>
              <Headset className="size-3.5" />
              <span>Team driving</span>
            </span>
            <span ref={unlapEl} hidden className={`${chip} bg-go text-ink`}>
              <Flag className="size-3.5" />
              Unlapping
            </span>
            <span ref={blueEl} hidden className={`${chip} bg-print text-paper`}>
              <Flag className="size-3.5" />
              Blue
            </span>
          </div>
          <div
            className={`${hud} ${slantL} w-48 py-2.5 pr-2.5 pl-5 md:w-60 md:py-3.5 md:pr-3.5 md:pl-6`}
          >
            <div className="flex gap-0.5" aria-hidden>
              {Array.from({ length: REVS }, (_, k) => (
                <span
                  key={k}
                  ref={(el) => {
                    if (el) revEls.current[k] = el;
                  }}
                  className="h-1.5 flex-1 rounded-[1px] bg-lamp"
                />
              ))}
            </div>
            <div className="relative mt-1.5">
              <svg viewBox="0 10 200 112" className="block w-full" aria-hidden>
                <g fill="none" strokeWidth="7">
                  <path d={THR_ARC} className="stroke-paper/15" />
                  <path d={BRK_ARC} className="stroke-paper/15" />
                  <path
                    ref={thrEl}
                    d={THR_ARC}
                    pathLength={1}
                    strokeDasharray="1 2"
                    strokeDashoffset={1}
                    className="stroke-go"
                  />
                  <path
                    ref={brkEl}
                    d={BRK_ARC}
                    pathLength={1}
                    strokeDasharray="1 2"
                    strokeDashoffset={1}
                    className="stroke-accent"
                  />
                </g>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                <span ref={gearEl} className="disp text-[48px] leading-none md:text-[56px]">
                  1
                </span>
                <span className="mt-1 flex items-baseline gap-1">
                  <span ref={speedEl} className="disp text-[20px] leading-none md:text-[22px]">
                    0
                  </span>
                  <span className="text-xs text-soft">km/h</span>
                </span>
              </div>
            </div>
            {/* Each tyre's life as the car carries them, front at the top: blue while cold. */}
            <div className="mt-2 flex items-center gap-3 text-xs text-soft">
              <div
                className="grid grid-cols-[auto_auto_auto] items-center gap-x-1.5 gap-y-1"
                aria-hidden
              >
                <Chassis className="col-start-2 row-span-2 row-start-1 h-9 w-4 text-paper/30" />
                {CORNERS.map((c, k) => (
                  <span
                    key={c}
                    ref={(el) => {
                      if (el) tyreEls.current[k] = el;
                    }}
                    style={{ gridColumn: k % 2 ? 3 : 1, gridRow: k < 2 ? 1 : 2 }}
                    className={`${TYRE_CELL} bg-go`}
                  >
                    100
                  </span>
                ))}
              </div>
              <div className="ml-auto flex flex-col items-end gap-1">
                <span className="flex items-center gap-2">
                  <span ref={tyreName} title="Compound" className="text-slow">
                    <Roundel letter="M" />
                  </span>
                  <span className="flex items-center gap-1 text-paper" title="Rear wing">
                    <Wing className="size-3.5 text-soft" />
                    <span ref={wingEl}>W3</span>
                  </span>
                </span>
                <span>
                  Tyres{" "}
                  <span ref={tyreText} className="text-paper">
                    100%
                  </span>
                </span>
                <span
                  ref={damageEl}
                  hidden
                  title="Damage"
                  className="flex items-center gap-1 text-accent"
                >
                  <Wrench className="size-3.5" />
                  <span />
                </span>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-[auto_1fr_auto] items-center gap-x-2 text-xs text-soft">
              <span>
                <Bolt className="size-3.5" />
                <span className="sr-only">Battery</span>
              </span>
              <span className="h-1 rounded-full bg-lamp">
                <span ref={batEl} className="block h-full origin-left rounded-full bg-paper" />
              </span>
              <span ref={batText} className="w-12 text-right whitespace-nowrap text-paper">
                6.0 MJ
              </span>
            </div>
            <div ref={fitWrap} hidden className="pointer-events-auto mt-2 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span ref={fitLabel} className="mr-auto text-xs whitespace-nowrap text-soft">
                  Next set
                </span>
                {COMPOUNDS.map((t, i) => (
                  <button
                    key={t}
                    ref={(el) => {
                      if (el) fitEls.current[i] = el;
                    }}
                    type="button"
                    aria-label={TYRES[t].name}
                    aria-pressed="false"
                    onClick={() => fit.current(t)}
                    className={`h-8 w-9 rounded-sm text-sm font-semibold ring-1 ring-paper/25 ${TYRE_INK[t]}`}
                  >
                    {letter(t)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="mr-auto text-xs whitespace-nowrap text-soft">Next wing</span>
                <button
                  type="button"
                  aria-label="Less wing"
                  onClick={() => fitWing.current(-1)}
                  className="h-8 w-9 rounded-sm text-sm font-semibold ring-1 ring-paper/25"
                >
                  −
                </button>
                <span ref={wingNext} className="w-9 text-center text-sm font-semibold">
                  W3
                </span>
                <button
                  type="button"
                  aria-label="More wing"
                  onClick={() => fitWing.current(1)}
                  className="h-8 w-9 rounded-sm text-sm font-semibold ring-1 ring-paper/25"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Touch: steer bottom-left, brake bottom-right. Touch pointers are captured implicitly,
            so a button hears the lift even after the thumb slides off it. */}
        <div
          className={`pointer-events-none absolute inset-x-2 bottom-2 hidden items-end justify-between transition-opacity duration-300 pointer-coarse:flex md:inset-x-3 md:bottom-3 ${shown}`}
        >
          <div className="flex gap-2">
            {PAD.map(([k, name, glyph]) => (
              <button key={k} type="button" aria-label={name} className={padKey} {...hold(k)}>
                {glyph}
              </button>
            ))}
          </div>
          <button
            ref={boxPad}
            type="button"
            hidden
            onClick={() => boxIt.current()}
            className={`${padKey} px-4 text-sm font-semibold tracking-wide uppercase`}
          >
            Box
          </button>
          <button
            ref={otPad}
            type="button"
            hidden
            className={`${padKey} px-4 text-sm font-semibold tracking-wide uppercase`}
            {...hold("ot")}
          >
            Overtake
          </button>
          <button
            type="button"
            className={`${padKey} w-28 bg-accent/80 text-sm font-semibold tracking-wide uppercase`}
            {...hold("brake")}
          >
            Brake
          </button>
        </div>

        {timing && !result && (
          // Full qualifying, in the garage: the clock, the timing, and out you go.
          <div className="absolute inset-x-0 bottom-0 grid place-items-center p-4">
            <div className={`${panel} w-full max-w-md p-4`}>
              <div className="flex items-baseline justify-between gap-4">
                <p className={`disp text-xl ${timing.red ? "text-accent" : ""}`}>
                  {timing.red
                    ? `Red flag · ${Math.ceil(timing.red / 1000)}`
                    : `Q${timing.seg + 1} · ${clock(timing.left)}`}
                </p>
                <p className={label}>
                  {timing.through
                    ? `${timing.rows.length} cars, ${CUTS[timing.seg] ? `top ${CUTS[timing.seg]} through` : "pole"}`
                    : `Out in Q${timing.seg}`}
                </p>
              </div>
              <ol className="mt-2 max-h-48 overflow-y-auto text-sm tabular-nums">
                {timing.rows.map((r, k) => (
                  <li
                    key={r.id}
                    className={`flex items-center gap-2 px-1 py-0.5 ${r.id ? "" : "bg-lamp"} ${k + 1 === CUTS[timing.seg] ? "border-b border-accent" : ""}`}
                  >
                    <span className="w-6 text-soft">{k + 1}</span>
                    <span
                      className="h-3 w-1 shrink-0 rounded-full"
                      style={{ background: LEVELS[level].colors[r.id >> 1] }}
                    />
                    <span className="font-semibold">{LEVELS[level].drivers[r.id]!.code}</span>
                    <span className="ml-auto text-xs text-soft">{PHASE_NAMES[r.phase]}</span>
                    <span className="w-20 text-right">
                      {!r.best
                        ? DASH
                        : k
                          ? plus((r.best - timing.rows[0]!.best) / 1000)
                          : fmt(r.best)}
                    </span>
                  </li>
                ))}
              </ol>
              {timing.through && (
                <div
                  role="radiogroup"
                  aria-label="Tyre set"
                  className="mt-3 grid grid-cols-5 gap-1.5"
                >
                  {timing.sets.map((t, k) => (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={timing.pick === k}
                      onClick={() => chooseSet.current(k)}
                      className={`min-h-11 rounded-md px-1 text-xs ring-1 active:scale-[.98] ${timing.pick === k ? "bg-lamp ring-paper" : "ring-paper/25"}`}
                    >
                      <span className="block font-semibold text-accent">S{k + 1}</span>
                      <span className="block text-soft">
                        {t.used ? `${Math.round(t.life * 100)}%` : "New"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <div className="mt-3 flex gap-2">
                {timing.through && (
                  <button
                    type="button"
                    autoFocus
                    disabled={timing.red > 0}
                    onClick={() => leaveGarage.current()}
                    className="min-h-11 flex-1 rounded-md bg-paper font-semibold text-ink active:scale-[.98] disabled:opacity-40"
                  >
                    Go out
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fastForward.current()}
                  className={`min-h-11 flex-1 rounded-md font-semibold ring-1 active:scale-[.98] ${timing.fast ? "bg-lamp ring-paper" : "ring-paper/25"}`}
                >
                  {timing.through
                    ? timing.fast
                      ? "Fast-forwarding"
                      : "Fast-forward"
                    : "Skip to the end"}
                </button>
              </div>
            </div>
          </div>
        )}

        {grid && status === "ready" && !result && (
          <div className="absolute inset-0 grid place-items-center bg-ink/40 p-4">
            <div
              className={`${panel} max-h-full w-full max-w-sm overflow-y-auto p-4 md:max-w-lg md:p-5`}
            >
              <p className="disp text-xl">Grid P{slot}</p>
              <p className={`${label} mt-1`}>
                {qualified
                  ? "Qualified. A new track, field or distance means qualifying again."
                  : "Pick the track, the field, the distance and your tyres. Qualify for a better slot."}
              </p>
              {trackRecord ? (
                <p className={`${label} mt-1`}>
                  Your record <span className="text-paper">{fmt(trackRecord)}</span>
                </p>
              ) : null}
              <div
                role="radiogroup"
                aria-label="Track"
                className="mt-4 grid grid-cols-3 gap-2 md:grid-cols-5"
              >
                {TRACKS.map((t) => {
                  const { box2: b, thumb } = SHAPES.get(t.id)!;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={trackId === t.id}
                      onClick={() => {
                        if (t.id === trackId) return;
                        write(TRACK, t.id);
                        unqualify();
                        setStatus("loading");
                        setTrackId(t.id);
                      }}
                      className={`rounded-md p-2 text-left ring-1 active:scale-[.98] ${trackId === t.id ? "bg-lamp ring-paper" : "ring-paper/25"}`}
                    >
                      <svg viewBox={`0 0 ${b.w} ${b.h}`} aria-hidden="true" className="h-9 w-full">
                        <path
                          d={thumb}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinejoin="round"
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>
                      <span className="mt-1.5 block truncate text-xs">{t.name}</span>
                    </button>
                  );
                })}
              </div>
              <div
                role="radiogroup"
                aria-label="Field"
                className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-4"
              >
                {STEPS.map(([l, name, field]) => (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={level === l}
                    onClick={() => {
                      setLevel(l);
                      write(LEVEL, l);
                      unqualify();
                      levelRef.current = l;
                      regrid.current();
                    }}
                    className={`rounded-md p-2.5 text-left ring-1 active:scale-[.98] ${level === l ? "bg-lamp ring-paper" : "ring-paper/25"}`}
                  >
                    <span className="block text-sm font-semibold">{name}</span>
                    <span className="block text-xs text-soft">{field}</span>
                  </button>
                ))}
              </div>
              <div
                role="radiogroup"
                aria-label="Race distance"
                className="mt-2 grid grid-cols-5 gap-2"
              >
                {DISTANCES.map((d, k) => (
                  <button
                    key={d.name}
                    type="button"
                    role="radio"
                    aria-checked={dist === k}
                    onClick={() => {
                      setDist(k);
                      write(DIST, k);
                      unqualify();
                      distRef.current = k;
                      regrid.current();
                    }}
                    className={`min-h-11 rounded-md px-1 text-sm ring-1 active:scale-[.98] ${dist === k ? "bg-lamp font-semibold ring-paper" : "ring-paper/25"}`}
                  >
                    <span className="block">{d.name}</span>
                    <span className="block text-xs font-normal text-soft">
                      {lapsOf(d, built)} laps
                    </span>
                  </button>
                ))}
              </div>
              <div role="radiogroup" aria-label="Tyres" className="mt-2 grid grid-cols-3 gap-2">
                {COMPOUNDS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={tyre === t}
                    onClick={() => setTyre(t)}
                    className={`rounded-md p-2.5 text-left ring-1 active:scale-[.98] ${tyre === t ? "bg-lamp ring-paper" : "ring-paper/25"}`}
                  >
                    <span className={`disp block text-xl leading-none ${TYRE_INK[t]}`}>
                      {letter(t)}
                    </span>
                    <span className="mt-1.5 block text-sm">{TYRES[t].name.slice(0, -1)}</span>
                    <span className="block text-xs text-soft">
                      {blurb(t, stintLaps(t, laps, built))}
                    </span>
                  </button>
                ))}
              </div>
              <div role="radiogroup" aria-label="Rear wing" className="mt-2 grid grid-cols-5 gap-2">
                {WING_STEPS.map((w) => (
                  <button
                    key={w}
                    type="button"
                    role="radio"
                    aria-checked={wing === w}
                    disabled={qualified && wing !== w}
                    onClick={() => pickWing(w)}
                    className={`min-h-11 rounded-md px-1 text-sm ring-1 active:scale-[.98] disabled:opacity-40 ${wing === w ? "bg-lamp font-semibold ring-paper" : "ring-paper/25"}`}
                  >
                    <span className="block">Wing {w}</span>
                    {w === built.WING ? (
                      <span className="block text-xs font-normal text-soft">Team</span>
                    ) : null}
                  </button>
                ))}
              </div>
              <p className={`${label} mt-2`}>
                {qualified ? "Parc fermé: your qualifying wing. " : ""}
                <span className="text-paper">{wingText(wing)}</span>
              </p>
              <p className={`${label} mt-1`}>
                Team plan{" "}
                <span className="text-paper">{planText(teamPlan(laps, built, tyre))}</span>
              </p>
              {!qualified && (
                <Choice
                  name="Qualifying"
                  value={full}
                  options={[
                    [false, "Quick: one lap"],
                    [true, "Full: Q1, Q2, Q3"],
                  ]}
                  pick={(v) => {
                    setFull(v);
                    fullRef.current = v;
                    write(QUALI, v);
                  }}
                />
              )}
              <div className="mt-4 flex gap-2">
                {!qualified && (
                  <button
                    type="button"
                    onClick={() => qualify.current()}
                    className="min-h-11 flex-1 rounded-md font-semibold ring-1 ring-paper/25 active:scale-[.98]"
                  >
                    Qualify
                  </button>
                )}
                <button
                  type="button"
                  autoFocus
                  onClick={() => go.current(tyre)}
                  className="min-h-11 flex-1 rounded-md bg-paper font-semibold text-ink active:scale-[.98]"
                >
                  Line up
                </button>
              </div>
              <p className="mt-2 text-xs text-soft pointer-coarse:hidden">
                1, 2 or 3 to pick tyres, [ and ] the wing, Enter to line up.
              </p>
            </div>
          </div>
        )}

        {rules && (
          <div
            className="absolute inset-0 grid place-items-center bg-ink/60 p-4"
            onClick={(e) => e.target === e.currentTarget && setRules(false)}
          >
            <div
              id="drive-rules"
              className="max-h-full w-full max-w-lg overflow-y-auto rounded-lg bg-ink p-4 text-paper shadow-[inset_0_0_0_1px_var(--color-lamp)] md:p-5"
            >
              <div className="flex items-baseline justify-between">
                <p className="disp text-xl">Rules</p>
                <button
                  type="button"
                  onClick={() => setRules(false)}
                  className="min-h-11 pl-4 text-sm font-semibold active:scale-[.96]"
                >
                  Close
                </button>
              </div>
              <dl className="mt-1 grid gap-3 text-sm">
                {RULES.map(([term, text]) => (
                  <div key={term}>
                    <dt className="text-xs font-semibold tracking-wide text-accent uppercase">
                      {term}
                    </dt>
                    <dd className="mt-0.5 text-paper/90">{text}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        )}

        {result && (
          // The flag: the stage fades to black, then the classification comes in row by row.
          // The heading and button stay put; only the positions scroll.
          <div className="absolute inset-0 flex flex-col bg-pit p-4 motion-safe:animate-blackout md:p-8">
            <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col">
              <p
                className="text-xs font-semibold tracking-wide text-soft uppercase motion-safe:animate-rowin"
                style={{ animationDelay: "0.9s" }}
              >
                {def.name} ·{" "}
                {result.quali
                  ? "Qualifying"
                  : sprint(result.laps)
                    ? "Sprint"
                    : `${result.laps} laps`}{" "}
                · {LEVELS[result.level].series} grid
              </p>
              <div
                className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 motion-safe:animate-rowin"
                style={{ animationDelay: "1s" }}
              >
                <div>
                  <p className="disp text-[28px] leading-none md:text-[36px]">
                    {result.next
                      ? `Q${result.seg! + 1}`
                      : result.quali
                        ? "Qualifying"
                        : "Classification"}
                  </p>
                  <p className="mt-2 text-sm text-soft">
                    {result.quali ? "Your lap" : "Your fastest lap"}{" "}
                    <span className="text-paper">
                      {result.table.find((r) => !r.id)?.best
                        ? fmt(result.table.find((r) => !r.id)!.best)
                        : DASH}
                    </span>
                  </p>
                  <p className="mt-1 text-sm">
                    <span className="mr-2 text-xs font-semibold tracking-wide text-accent uppercase">
                      Radio
                    </span>
                    {result.radio}
                  </p>
                </div>
                <button
                  type="button"
                  autoFocus
                  onClick={() => again.current()}
                  className="min-h-11 w-full rounded-md bg-paper px-6 font-semibold text-ink active:scale-[.98] md:w-auto"
                >
                  {result.next
                    ? `Continue to Q${result.seg! + 2}`
                    : result.quali
                      ? "To the grid"
                      : "Race again"}
                </button>
              </div>
              <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm tabular-nums md:text-[15px]">
                  <thead className="sticky top-0 z-10 bg-pit text-xs text-soft">
                    <tr>
                      <th className="w-8 py-1 font-normal">Pos</th>
                      <th className="py-1 font-normal">Driver</th>
                      {!result.quali && (
                        <th className="py-1 pl-3 text-right font-normal">
                          <span className="hidden md:inline">Grid</span>
                          <span className="md:hidden">+/−</span>
                        </th>
                      )}
                      <th className="py-1 text-right font-normal">
                        {result.quali ? (
                          "Time"
                        ) : (
                          <button
                            type="button"
                            onClick={flipGaps}
                            className="min-h-8 underline decoration-dotted underline-offset-2"
                          >
                            {toCar ? "Interval" : "Leader"}
                          </button>
                        )}
                      </th>
                      {result.quali && (
                        <>
                          <th className="py-1 pl-3 text-right font-normal">Gap</th>
                          <th className="hidden py-1 pl-3 text-right font-normal md:table-cell">
                            Int
                          </th>
                          {["S1", "S2", "S3"].map((s) => (
                            <th
                              key={s}
                              className="hidden py-1 pl-3 text-right font-normal md:table-cell"
                            >
                              {s}
                            </th>
                          ))}
                        </>
                      )}
                      {!result.quali && (
                        <>
                          <th className="py-1 pl-3 text-right font-normal">Pts</th>
                          <th className="py-1 pl-3 text-right font-normal">Pits</th>
                          <th className="py-1 pl-3 font-normal">Tyres</th>
                          <th className="hidden py-1 pl-3 text-right font-normal md:table-cell">
                            Best
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {result.table.map((r, k) => {
                      const who = LEVELS[result.level].drivers[r.id]!;
                      const ahead = result.table[k - 1];
                      // Places gained from the grid, and the gap: to the leader or the car ahead.
                      const gained = r.grid - (k + 1);
                      const from = toCar && ahead ? ahead.time : leader;
                      return (
                        <tr
                          key={r.id}
                          className={`motion-safe:animate-rowin ${r.id ? "" : "bg-lamp"} ${k + 1 === result.cut ? "border-b border-accent" : ""}`}
                          style={{ animationDelay: `${1.1 + k * 0.05}s` }}
                        >
                          <td className="py-1 pl-2 text-soft">{k + 1}</td>
                          <td className="py-1">
                            <span className="flex items-center gap-2">
                              <span
                                className="h-3 w-1 shrink-0 rounded-full ring-1 ring-paper/25"
                                style={{
                                  background: LEVELS[result.level].colors[r.id >> 1],
                                }}
                              />
                              <span className="font-semibold">{who.code}</span>
                              <span className="hidden truncate text-soft md:inline">
                                {who.name}
                                <span className="ml-2 text-xs text-soft/70">
                                  {LEVELS[result.level].teams[r.id >> 1]}
                                </span>
                              </span>
                              {r.penalty ? (
                                <span className="rounded-sm bg-slow px-1 text-xs font-semibold text-ink">
                                  +{r.penalty / 1000}s
                                </span>
                              ) : null}
                              {r.paid ? (
                                <span className="text-xs text-soft">{r.paid / 1000}s served</span>
                              ) : null}
                              {r.drop ? (
                                <span className="rounded-sm bg-slow px-1 text-xs font-semibold text-ink">
                                  +{r.drop} grid
                                </span>
                              ) : null}
                            </span>
                          </td>
                          {!result.quali && (
                            <td className="py-1 pl-3 text-right">
                              <span className="hidden text-soft md:inline">P{r.grid} </span>
                              <span
                                className={`text-xs ${gained > 0 ? "text-go" : gained < 0 ? "text-accent" : "text-soft"}`}
                              >
                                {gained > 0 ? `▲${gained}` : gained < 0 ? `▼${-gained}` : "–"}
                              </span>
                            </td>
                          )}
                          <td className="py-1 pr-2 text-right">
                            {result.quali
                              ? r.time
                                ? fmt(r.time)
                                : "No time"
                              : r.dsq
                                ? "DSQ"
                                : r.out
                                  ? `DNF · ${r.out}`
                                  : r.down
                                    ? lapsDown(r.down)
                                    : k
                                      ? plus((r.time - from) / 1000)
                                      : fmt(r.time)}
                          </td>
                          {result.quali && (
                            <>
                              <td className="py-1 pl-3 text-right">
                                {k && r.time ? plus((r.time - leader) / 1000) : ""}
                              </td>
                              <td className="hidden py-1 pl-3 text-right md:table-cell">
                                {k && r.time && ahead?.time
                                  ? plus((r.time - ahead.time) / 1000)
                                  : ""}
                              </td>
                              {[0, 1, 2].map((s) => {
                                const ms = r.sectors?.[s] ?? 0;
                                return (
                                  <td
                                    key={s}
                                    className={`hidden py-1 pl-3 text-right md:table-cell ${ms && ms === bestSectors[s] ? "text-fl" : ""}`}
                                  >
                                    {ms ? secs(ms) : ""}
                                  </td>
                                );
                              })}
                            </>
                          )}
                          {!result.quali && (
                            <>
                              <td className="py-1 pl-3 text-right">
                                {(!r.out && !r.dsq && POINTS[k]) || ""}
                              </td>
                              <td className="py-1 pl-3 text-right">{r.stops}</td>
                              <td className="py-1 pl-3">
                                <span
                                  className="flex gap-1 font-semibold"
                                  aria-label={r.stints
                                    .map((t, i) => `${TYRES[t].name}, ${r.stintLaps[i]} laps`)
                                    .join(", then ")}
                                >
                                  {r.stints.map((t, i) => (
                                    <span key={i} className={TYRE_INK[t]} aria-hidden>
                                      {letter(t)}
                                      <span className="text-xs font-normal text-soft">
                                        {r.stintLaps[i]}
                                      </span>
                                    </span>
                                  ))}
                                </span>
                              </td>
                              <td className="hidden py-1 pr-2 pl-3 text-right md:table-cell">
                                <span className="inline-flex items-center gap-1.5">
                                  {result.fastest === r.id && (
                                    <span
                                      title="Fastest lap"
                                      className="size-2 rounded-full bg-fl"
                                    />
                                  )}
                                  {r.best ? fmt(r.best) : DASH}
                                </span>
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-x-4 text-sm text-soft">
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pointer-coarse:hidden">
          {CONTROLS.map(([keys, what]) => (
            <li key={what} className="flex items-center gap-1">
              {keys.map((k) => (
                <kbd key={k} className={kbd}>
                  {k}
                </kbd>
              ))}
              <span className="ml-0.5">{what}</span>
            </li>
          ))}
        </ul>
        <p className="hidden pointer-coarse:block">
          The throttle is automatic. ◀ ▶ to steer, hold Brake to slow down and reverse.
        </p>
        <button
          type="button"
          aria-expanded={rules}
          aria-controls="drive-rules"
          onClick={() => setRules((o) => !o)}
          className="ml-auto min-h-11 shrink-0 pl-4 font-semibold text-paper active:scale-[.96]"
        >
          Rules
        </button>
      </div>
      <p className="-mt-2 text-xs text-soft">
        {/* The smooth centrelines are the ones built from OpenStreetMap. */}
        {def.smooth ? (
          <>
            Track data: ©{" "}
            <a href="https://www.openstreetmap.org/copyright" className="underline">
              OpenStreetMap contributors
            </a>
            , ODbL.
          </>
        ) : (
          "Track data: TUMFTM racetrack-database, LGPL-3.0."
        )}
      </p>
    </main>
  );
}
