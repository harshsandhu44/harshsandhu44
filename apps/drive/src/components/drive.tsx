"use client";

import { useEffect, useRef, useState } from "react";
import { createEngine, type Engine } from "@/engine";
import type { Scene } from "@/scene";
import {
  CAP,
  CARS,
  DISTANCES,
  GRID,
  LEVELS,
  TYRES,
  colorOf,
  driver,
  gap,
  grip,
  newQuali,
  newRace,
  order,
  qualiDelta,
  qualiOrder,
  results,
  stintLaps,
  teamPlan,
  tick,
  towShare,
  wrongWay,
  type Level,
  type Race,
  type Racer,
  type Tyre,
} from "@/race";
import { TOP, fmt, gear } from "@/track";
import { TRACKS, getTrack } from "@/tracks";

// Your record per track. v2: Monza's real-length track; the v1 keys hold bests from the old short
// one. ponytail: the old `-sectors-v2` keys are left in storage, unread.
const BEST = (id: string) => `${id}-best-v2`;
// The rest kept Monza's names from when it was the only track, so picks carry over.
const TRACK = "drive-track";
const SOUND = "monza-sound";
const LEVEL = "monza-level";
const LAPS = "monza-laps";
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

const zero = { transform: "scaleX(0)" };
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
// The team's plan as the grid screen shows it: "M → H, box lap 3".
const planText = ({ at, tyres }: { at: number[]; tyres: Tyre[] }) =>
  `${tyres.map(letter).join(" → ")}, box lap ${at.join(" and ")}`;
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
  [["Space"], "Overtake"],
  [["P"], "Pause"],
];
const RULES: [string, string][] = [
  [
    "Start",
    "You start tenth, or qualify for your slot: one flying lap on softs from a rolling start, and the grid lines up by lap time. Track limits, the pit lane or abandoning the lap leaves you without a time, at the back. Go when the lights go out. Amateur races the F3 grid, intermediate F2 and pro F1: on the racing line, with the fewest mistakes and a little more grip than your car. Legends is the world champions: no mistakes, and a perfect race only just keeps up.",
  ],
  [
    "Tyres & pits",
    "Softs grip most, hards last longest, and a set lasts the same share of the race at any distance, less on tracks hard on tyres like Silverstone and Spa. Grip fades slowly, then falls off a cliff in the last quarter of a set's life. A new set is cold for its first half lap. You must run two compounds, so everyone stops at least once: finish on one and you're disqualified. The team plans your race on the grid screen and calls you in, but when you box is up to you: press 1, 2 or 3 any time to pick the next set. The pit lane leaves the main straight before the line: turn in and the team drives you to your box and back out. Only your teammate can hold you up there.",
  ],
  [
    "Safety Car & failures",
    "Cars break down (about one in twenty-five a race, yours too), crash out on a big hit, take lasting damage from smaller ones, and puncture from contact or a set run to nothing; a puncture limps back to the box. A car stopped off the track brings the Virtual Safety Car: everyone is held to the same speed. A crash, or a car stopped on the track, brings the Safety Car: the field queues behind it with no passing, and racing starts again at the line once it's gone in. Your car is held to both for you, and a stop under either costs less. When a car a lap up catches you, the blue flag lets it by.",
  ],
  [
    "Track limits",
    "All four wheels off the track deletes the lap. The third time brings the black and white flag, then 5 s and 10 s penalties.",
  ],
  [
    "2026 power",
    "Straight Mode flattens the wings on the straights for every car, every lap, until you brake. The 4 MJ battery deploys by itself flat out, at 350 kW in the zones and 250 kW elsewhere, and recharges off the throttle (most on the brakes) and in the pit lane, up to 8.5 MJ a lap. Run it flat and the car super clips: it harvests at full throttle and loses speed (the reading turns red). From lap 2, within a second of the car ahead at a detection line (the painted line with the Overtake board), Overtake Mode is ready: Space for full power and more speed to the end of the next straight, and the next lap harvests faster, up to 9 MJ (the bar turns green).",
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
const label = "text-sm text-soft";
const sector = "rounded-sm bg-lamp px-1.5 py-0.5 text-sm text-soft md:px-2 md:text-[15px]";
const secs = (ms: number) => (ms / 1000).toFixed(3);
// A gap in seconds as F1 shows it: seconds under a minute, then minutes too.
const plus = (s: number, dp = 3) => {
  const v = Math.round(s * 10 ** dp) / 10 ** dp;
  const sec = (v % 60).toFixed(dp);
  return v < 60 ? `+${sec}` : `+${Math.floor(v / 60)}:${sec.padStart(dp + 3, "0")}`;
};
const lapsDown = (n: number) => `+${n} lap${n > 1 ? "s" : ""}`;

// A race's classification, or qualifying's, where each row's time is its lap (0 for none).
type Result = {
  quali: boolean;
  table: ReturnType<typeof results>;
  fastest: number | null;
  level: Level;
  laps: number;
};

// The team's word at the flag.
const debrief = (pos: number) =>
  pos === 1
    ? "P1! Get in there!"
    : pos <= 5
      ? `Good job, P${pos}.`
      : `P${pos}. We'll get them next time.`;
// And at the end of qualifying.
const qualiWord = (pos: number, timed: boolean) =>
  !timed
    ? "No time. We start from the back."
    : pos === 1
      ? "Pole! What a lap."
      : `P${pos}. Let's go racing.`;
// Out of the race or disqualified, there's no position to talk about.
const raceWord = (table: Result["table"]) => {
  const k = table.findIndex((r) => !r.id);
  const me = table[k]!;
  return me.out
    ? "Retired. We'll get them next time."
    : me.dsq
      ? "Disqualified. We had to run two compounds."
      : debrief(k + 1);
};
const radio = ({ quali, table }: Result) => {
  const k = table.findIndex((r) => !r.id);
  return quali ? qualiWord(k + 1, !!table[k]!.best) : raceWord(table);
};

// The whole page. three.js (in scene.ts) loads on mount and draws the circuit; the race
// (race.ts) runs in one rAF loop here, which writes the HUD straight to the DOM so React doesn't
// re-render every frame.
export default function Drive() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [result, setResult] = useState<Result | null>(null);
  const [rules, setRules] = useState(false);
  const [sound, setSound] = useState(() => read(SOUND, false));
  const engine = useRef<Engine | null>(null);
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
  const [level, setLevel] = useState<Level>(() => {
    const l: string = read(LEVEL, "intermediate");
    return l in LEVELS ? (l as Level) : "intermediate";
  });
  const [laps, setLaps] = useState(() => {
    const n: number = read(LAPS, DISTANCES[0]!);
    return DISTANCES.includes(n) ? n : DISTANCES[0]!;
  });
  // The grid for the next race, as driver ids front to back: GRID (you P10) until you qualify,
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
  const lapsRef = useRef(laps);
  const regrid = useRef<() => void>(() => {});
  const go = useRef<(t: Tyre) => void>(() => {});
  const qualify = useRef<() => void>(() => {});
  const abandon = useRef<() => void>(() => {});
  const quit = useRef<() => void>(() => {});
  const fit = useRef<(t: Tyre) => void>(() => {});
  const fitWrap = useRef<HTMLDivElement>(null);
  const fitLabel = useRef<HTMLSpanElement>(null);
  const fitEls = useRef<HTMLButtonElement[]>([]);
  // The touch controls' state, read by the frame loop. `touch` is whether they drive the car.
  const pad = useRef({ touch: false, left: false, right: false, brake: false, ot: false });
  const tyreName = useRef<HTMLSpanElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const map = useRef<HTMLCanvasElement>(null);
  const lapName = useRef<HTMLSpanElement>(null);
  const lapEl = useRef<HTMLSpanElement>(null);
  const posEl = useRef<HTMLSpanElement>(null);
  const timeEl = useRef<HTMLSpanElement>(null);
  const lastEl = useRef<HTMLSpanElement>(null);
  const bestEl = useRef<HTMLSpanElement>(null);
  const sectorEls = useRef<HTMLSpanElement[]>([]);
  const nearEl = useRef<HTMLDivElement>(null);
  const waitEl = useRef<HTMLDivElement>(null);
  const waitHead = useRef<HTMLParagraphElement>(null);
  const waitText = useRef<HTMLParagraphElement>(null);
  const skip = useRef<() => void>(() => {});
  const pauseEl = useRef<HTMLDivElement>(null);
  const abandonEl = useRef<HTMLButtonElement>(null);
  const quitEl = useRef<HTMLButtonElement>(null);
  const togglePause = useRef<() => void>(() => {});
  const towerEl = useRef<HTMLDivElement>(null);
  const towerEls = useRef<HTMLDivElement[]>([]);
  const modeEl = useRef<HTMLDivElement>(null);
  const lampEls = useRef<HTMLSpanElement[]>([]);
  const lightsEl = useRef<HTMLDivElement>(null);
  const bannerEl = useRef<HTMLDivElement>(null);
  const speedEl = useRef<HTMLSpanElement>(null);
  const nextEl = useRef<HTMLSpanElement>(null);
  const gearEl = useRef<HTMLSpanElement>(null);
  const thrEl = useRef<HTMLSpanElement>(null);
  const brkEl = useRef<HTMLSpanElement>(null);
  const tyreEl = useRef<HTMLSpanElement>(null);
  const tyreText = useRef<HTMLSpanElement>(null);
  const limiterEl = useRef<HTMLSpanElement>(null);
  const straightEl = useRef<HTMLSpanElement>(null);
  const otEl = useRef<HTMLSpanElement>(null);
  const scEl = useRef<HTMLSpanElement>(null);
  const blueEl = useRef<HTMLSpanElement>(null);
  const otPad = useRef<HTMLButtonElement>(null);
  const batEl = useRef<HTMLSpanElement>(null);
  const batText = useRef<HTMLSpanElement>(null);
  const limitsEl = useRef<HTMLDivElement>(null);
  const rcEl = useRef<HTMLDivElement>(null);
  const rcLabel = useRef<HTMLSpanElement>(null);
  const rcFlag = useRef<HTMLSpanElement>(null);
  const rcLight = useRef<HTMLSpanElement>(null);
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

  const toggleSound = () => {
    const on = !sound;
    setSound(on);
    write(SOUND, on);
    engine.current?.stop();
    engine.current = on ? createEngine() : null;
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
    };
    const paintOf = (id: number) => colorOf(race, id) || C.accent;
    const flat = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const track = getTrack(trackId);
    const { LENGTH, ZONES, atDist, dirAt, limitAt, nextCorner } = track;
    const { box, outline } = SHAPES.get(trackId)!;
    const road = new Path2D(outline);

    let record: number = read(BEST(trackId), 0);
    // Your quickest clean time through each sector this race.
    let mine = [0, 0, 0];

    // The race runs through these phases. The grid screen waits for your tyres (the flyover
    // plays behind it), then the lights come on a second apart and go out after an unannounced
    // pause, as in the hero. Qualifying runs the same phases with `quali` set: your race (`race`,
    // just you) and the computer's, one car each, ticked together. Its grid waits in `nextGrid`
    // for the classification's button.
    let race: Race;
    let quali: Race[] | null = null;
    let nextGrid: number[] | null = null;
    let scene: Scene | null = null;
    let phase: "grid" | "lights" | "racing" = "grid";
    let phaseAt = 0;
    let pause = 0;
    let thr = 0;
    let brk = 0;
    let board = 0;
    let msgAt = -Infinity;
    let skipping = false;
    let paused = false;
    const still = { gas: false, brake: false, steer: 0 };
    const keys = new Set<string>();
    // A touch screen starts on the touch controls, so the throttle's on from the lights.
    const p = pad.current;
    p.touch = matchMedia("(pointer: coarse)").matches;

    // F1's colours: purple the quickest anyone's been this race, green your own best, yellow slower.
    const paintSector = (i: number, text: string, cls: "fl" | "pb" | "slow" | "") => {
      const el = sectorEls.current[i]!;
      el.lastChild!.textContent = text;
      el.classList.toggle("bg-fl", cls === "fl");
      el.classList.toggle("bg-go", cls === "pb");
      el.classList.toggle("bg-slow", cls === "slow");
      el.classList.toggle("bg-lamp", cls === "");
      el.classList.toggle("text-soft", cls === "");
      el.classList.toggle("text-ink", cls !== "");
    };

    const ac = new AbortController();
    const on = { signal: ac.signal };
    const key = (e: KeyboardEvent) => KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key.toLowerCase() === "p") return togglePause.current();
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

    // Minimap: about 600 m round you, heading up. The road in one pale stroke, a dot per car in
    // its colour, and yours in the accent with a ring, on top.
    const drawMap = () => {
      const w = mv.clientWidth;
      const s = w / 600;
      const me = race.racers[0]!;
      mctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      mctx.clearRect(0, 0, w, w);
      mctx.translate(w / 2, w / 2);
      mctx.scale(s, s);
      mctx.rotate(-dirAt(me.p) - Math.PI / 2);
      mctx.translate(box.x - me.car.x, box.y - me.car.y);
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

    // The tower and the phone's gaps, twice a second rather than every frame. The tower shows as
    // many rows as fit above the speed panel: the top n, or once you're out of them the top n - 3
    // and the cars either side of you.
    const drawBoard = () => {
      const run = order(race);
      const me = race.racers[0]!;
      const at = run.indexOf(me);
      const first = towerEls.current[0]!;
      const room = gearEl.current!.parentElement!.getBoundingClientRect().top - 8;
      const n = Math.max(3, Math.floor((room - first.getBoundingClientRect().top) / 20));
      const cut = at > n - 2;
      // Every 5 s the tower moves on: gaps to the leader, to the car ahead, then each car's tyres
      // and laps on them.
      const mode = (["Leader", "Interval", "Tyres"] as const)[Math.floor(race.t / 5000) % 3]!;
      modeEl.current!.textContent = mode;
      posEl.current!.textContent = `P${at + 1}`;
      // Laps down: by distance while running (to the leader's, which stops at the flag), and by
      // laps once in.
      const lead = Math.min(run[0]!.dist, race.laps * LENGTH);
      run.forEach((r, k) => {
        const row = towerEls.current[k]!;
        row.hidden = cut ? k >= n - 3 && Math.abs(k - at) > 1 : k >= n;
        row.classList.toggle("border-t", cut && k === at - 1);
        const [sw, code, fl, pen, right] = row.children as unknown as HTMLElement[];
        const [tyre, g] = right!.children as unknown as HTMLElement[];
        sw!.style.background = paintOf(r.id);
        code!.textContent = driver(race, r.id).code;
        fl!.hidden = race.fastest?.id !== r.id;
        pen!.hidden = !r.penalty;
        pen!.textContent = `+${r.penalty / 1000}s`;
        tyre!.hidden = mode !== "Tyres" || !!r.out;
        tyre!.textContent = letter(r.tyre);
        tyre!.className = `font-semibold ${TYRE_INK[r.tyre]}`;
        row.classList.toggle("opacity-50", !!r.out);
        const down = r.finish !== null ? race.laps - r.laps : Math.floor((lead - r.dist) / LENGTH);
        // Order is by distance and gaps by checkpoint, so a car just out of the pits can time in
        // ahead of the car it's behind; floor the interval at 0.
        const behind = () =>
          Math.max(0, gap(race, r) - (mode === "Interval" ? gap(race, run[k - 1]!) : 0));
        g!.textContent = r.out
          ? "OUT"
          : mode === "Tyres"
            ? String(r.laps - r.set)
            : !k
              ? "Leader"
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
        lapsRef.current,
        true,
      );
      quali = null;
      towerEl.current!.hidden = false;
      lapName.current!.textContent = "Lap";
      posEl.current!.classList.remove("text-go");
      scene?.paint(LEVELS[race.level].colors);
      phase = "grid";
      setGrid(true);
      pause = 200 + Math.random() * 2800;
      for (const i of [0, 1, 2]) paintSector(i, "", "");
      mine = [0, 0, 0];
      lastEl.current!.textContent = DASH;
      bestEl.current!.textContent = DASH;
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
    togglePause.current = () => {
      if (phase === "grid" || race.done) return;
      paused = !paused;
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
    // Out of qualifying onto its grid; out of a race, back to P10.
    again.current = () => {
      const g = nextGrid ?? GRID;
      nextGrid = null;
      lineupRef.current = g;
      setLineup(g);
      setResult(null);
      start();
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
      if (read(SOUND, false)) engine.current ??= createEngine();
    };
    go.current = (t) => {
      const me = race.racers[0]!;
      const plan = teamPlan(race.laps, track, t);
      [me.tyre, me.stints, me.stops, me.plan] = [t, [t], plan.at, plan.tyres];
      drawBoard();
      launch();
    };
    qualify.current = () => {
      quali = newQuali(track, levelRef.current);
      race = quali[0]!;
      towerEl.current!.hidden = true;
      nearEl.current!.textContent = "";
      lapName.current!.textContent = "Quali";
      showDelta();
      launch();
    };
    // The set for your next stop, any time until it's on.
    fit.current = (t) => {
      const me = race.racers[0]!;
      if (!quali && me.finish === null && !me.out && !(me.pit && me.served)) me.fit = t;
    };

    let raf = 0;
    let last = performance.now();
    const ro = new ResizeObserver(() => {
      scene?.resize(cv.clientWidth, cv.clientHeight);
      mv.width = mv.clientWidth * devicePixelRatio;
      mv.height = mv.clientHeight * devicePixelRatio;
    });

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
        const split = tick(race, { gas, brake, steer, ot }, dt);
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
            const table = qualiOrder(quali).map(({ id, best }) => ({
              id,
              time: best,
              down: 0,
              best,
              penalty: 0,
              stints: [],
              stops: 0,
              out: null,
              dsq: false,
            }));
            nextGrid = table.map((r) => r.id);
            const res = {
              quali: true,
              table,
              level: race.level,
              laps: lapsRef.current,
              fastest: null,
            };
            race.msgs.push({ kind: "radio", id: 0, text: radio(res) });
            setResult(res);
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
          paintSector(s, secs(split.ms), fl ? "fl" : pb ? "pb" : "slow");
        }
        if (split?.lap) {
          const l = lastEl.current!;
          l.textContent = fmt(split.lap);
          l.classList.toggle("line-through", !split.valid);
          l.classList.toggle("text-accent", !split.valid);
          if (me.best) bestEl.current!.textContent = fmt(me.best);
          if (split.valid && (!record || split.lap < record)) {
            record = split.lap;
            write(BEST(trackId), record);
          }
        }
        if (race.done && !wasDone && !quali) {
          const table = results(race);
          race.msgs.push({ kind: "radio", id: 0, text: raceWord(table) });
          const { level, laps, fastest } = race;
          setResult({ quali: false, table, level, laps, fastest: fastest?.id ?? null });
        }
        if (t - board > 500) {
          board = t;
          if (quali) showDelta();
          else drawBoard();
        }
        // The classification waits for the whole field to take the flag, or retire.
        const waiting = !quali && (me.finish !== null || !!me.out) && !race.done;
        waitEl.current!.hidden = !waiting;
        if (waiting) {
          const left = race.racers.filter((r) => r.finish === null && !r.out).length;
          const text = `Waiting for ${left} to finish`;
          if (waitText.current!.textContent !== text) waitText.current!.textContent = text;
          waitHead.current!.textContent = me.out ? "Retired" : "Chequered flag";
        }
      }

      lapEl.current!.textContent = quali ? "" : `${Math.min(me.laps + 1, race.laps)}/${race.laps}`;
      const time = timeEl.current!;
      // Zero until a rolling start reaches the line.
      const { start: from } = me.lap;
      time.textContent = fmt(
        phase === "racing" && me.finish === null && !me.out && from !== null ? race.t - from : 0,
      );
      time.classList.toggle("text-accent", me.lap.invalid);

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
      gearEl.current!.textContent = String(gear(car.v));
      thrEl.current!.style.transform = `scaleX(${thr})`;
      brkEl.current!.style.transform = `scaleX(${brk})`;
      const tyre = tyreEl.current!;
      tyre.style.transform = `scaleX(${me.life})`;
      tyre.classList.toggle("bg-go", me.life > 0.6);
      tyre.classList.toggle("bg-slow", me.life <= 0.6 && me.life > 0.3);
      tyre.classList.toggle("bg-accent", me.life <= 0.3);
      tyreText.current!.textContent = `${Math.round(me.life * 100)}%`;
      const name = tyreName.current!;
      if (name.textContent !== letter(me.tyre)) {
        name.textContent = letter(me.tyre);
        name.className = `w-3 font-semibold ${TYRE_INK[me.tyre]}`;
      }
      // The next set: on track to pick ahead, in the lane what's going on.
      const fitting =
        phase === "racing" && !quali && me.finish === null && !me.out && !(me.pit && me.served);
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
      const say = me.stop > 0 ? me.stop.toFixed(1) : wrongWay(me) ? "Wrong way" : "";
      if (banner.textContent !== say) banner.textContent = say;
      banner.hidden = !say;
      banner.classList.toggle("text-accent", me.stop <= 0);

      // Race Control: one message at a time for 3.5 s. A backlog drops other cars' track-limit
      // notes first, so yours and the flags always get through.
      while (race.msgs.length > 3) {
        const k = race.msgs.findIndex((m) => m.id && m.kind === "limits");
        if (k < 0) break;
        race.msgs.splice(k, 1);
      }
      if (t - msgAt > 3500) {
        const m = race.msgs.shift();
        rcEl.current!.hidden = !m;
        if (m) {
          msgAt = t;
          rcLabel.current!.textContent = m.kind === "radio" ? "Radio · HAR" : "Race Control";
          rcLabel.current!.classList.toggle("text-accent", m.kind === "radio");
          rcFlag.current!.hidden = m.kind !== "flag";
          // Yellow for the Safety Car and the VSC, green when it's racing again.
          const light = rcLight.current!;
          light.hidden = m.kind !== "sc";
          light.classList.toggle("bg-go", m.text === "Green flag");
          light.classList.toggle("bg-slow", m.text !== "Green flag");
          rcText.current!.textContent = m.text;
        }
      }
      const limits = limitsEl.current!;
      limits.hidden = !me.strikes;
      limits.textContent = `Track limits ${me.strikes}`;
      limits.classList.toggle("text-accent", me.strikes >= 3);
      limits.classList.toggle("text-soft", me.strikes < 3);
      straightEl.current!.hidden = !me.straight;
      const sc = scEl.current!;
      const n = race.neutral?.kind;
      sc.hidden = !n;
      if (n && sc.textContent !== n.toUpperCase()) sc.textContent = n.toUpperCase();
      blueEl.current!.hidden = !me.blue;
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
      engine.current?.set(paused ? 0 : Math.abs(car.v) / TOP, paused ? 0 : thr);

      // Each team's crew: out for a car in the lane, at the car while it's stopped.
      const crews = new Array<number>(CARS / 2).fill(0);
      for (const r of race.racers)
        if (!r.out) crews[r.id >> 1] = Math.max(crews[r.id >> 1]!, r.stop > 0 ? 2 : r.pit ? 1 : 0);
      scene!.frame(
        race.racers.map((r) => r.car),
        race.racers.map(towShare),
        steer,
        paused ? 0 : dt,
        crews,
        race.racers.map((r) => !!r.out && !r.wreck),
        race.sc?.car ?? null,
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
      engine.current?.stop();
      engine.current = null;
    };
  }, [trackId]);

  const shown = status === "ready" ? "" : "opacity-0";
  const leader = result?.table[0]?.time ?? 0;

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
          onClick={toggleSound}
          aria-pressed={sound}
          className="ml-auto min-h-11 pl-4 text-soft active:scale-[.96]"
        >
          Sound {sound ? "on" : "off"}
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

        <div
          className={`pointer-events-none absolute top-2 left-2 flex flex-col gap-2 transition-opacity duration-300 md:top-3 md:left-3 ${shown}`}
        >
          <div className={`${panel} p-2.5 md:p-3.5`}>
            <div className="flex items-baseline gap-3">
              <span ref={posEl} className="disp text-[26px] leading-none md:text-[32px]">
                P{slot}
              </span>
              <span className={label}>
                <span ref={lapName}>Lap</span>{" "}
                <span ref={lapEl} className="text-paper">
                  1/{laps}
                </span>
              </span>
              <span ref={timeEl} className="disp text-[20px] leading-none md:text-[24px]">
                0:00.000
              </span>
            </div>
            <div className="mt-2 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  ref={(el) => {
                    if (el) sectorEls.current[i] = el;
                  }}
                  className={sector}
                >
                  S{i + 1} <span />
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-4 text-sm md:text-[15px]">
              <span className="text-soft">
                Last{" "}
                <span ref={lastEl} className="text-paper">
                  {DASH}
                </span>
              </span>
              <span className="text-soft">
                Best{" "}
                <span ref={bestEl} className="text-paper">
                  {DASH}
                </span>
              </span>
            </div>
            <div className="mt-1 text-sm text-soft md:text-[15px]">
              Next{" "}
              <span ref={nextEl} className="text-paper">
                Rettifilo
              </span>
            </div>
            <div ref={nearEl} className="mt-1 text-sm text-paper md:hidden" />
            <div ref={limitsEl} hidden className="mt-1 text-sm text-soft md:text-[15px]" />
          </div>

          <div ref={towerEl} className={`${panel} hidden w-48 py-1.5 text-sm md:block`}>
            <div
              ref={modeEl}
              className="px-3 pb-0.5 text-right text-xs font-semibold tracking-wide text-soft uppercase"
            >
              Leader
            </div>
            {Array.from({ length: CARS }, (_, k) => (
              <div
                key={k}
                ref={(el) => {
                  if (el) towerEls.current[k] = el;
                }}
                className="flex items-center gap-2 border-paper/25 px-3 leading-5 whitespace-nowrap"
              >
                <span className="h-3 w-1 shrink-0 rounded-full ring-1 ring-paper/25" />
                <span className="shrink-0 font-semibold" />
                <span hidden title="Fastest lap" className="size-2 shrink-0 rounded-full bg-fl" />
                <span
                  hidden
                  className="shrink-0 rounded-sm bg-slow px-1 text-xs font-semibold text-ink"
                />
                <span className="ml-auto flex gap-1.5 text-right text-soft">
                  <span hidden />
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
            ref={rcFlag}
            hidden
            className="h-5 w-7 shrink-0 rounded-[2px] bg-[linear-gradient(135deg,var(--color-ink)_50%,var(--color-paper)_50%)] ring-1 ring-paper"
          />
          <span ref={rcLight} hidden className="h-5 w-7 shrink-0 rounded-[2px] bg-slow" />
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
            <p className={`${label} mt-1 whitespace-nowrap pointer-coarse:hidden`}>P to resume</p>
          </div>
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
            onClick={() => togglePause.current()}
            className="min-h-11 rounded-md bg-paper px-4 font-semibold text-ink active:scale-[.98]"
          >
            Resume
          </button>
        </div>

        <div
          className={`${panel} pointer-events-none absolute top-2 right-2 p-2 transition-opacity duration-300 md:top-3 md:right-3 md:p-3 ${shown}`}
        >
          <canvas ref={map} className="block size-28 md:size-40" />
        </div>

        <div
          className={`${panel} pointer-events-none absolute bottom-2 left-2 flex items-center gap-3 p-2.5 transition-opacity duration-300 pointer-coarse:bottom-20 md:bottom-3 md:left-3 md:gap-4 md:p-3.5 md:pointer-coarse:bottom-21 ${shown}`}
        >
          <span
            ref={gearEl}
            className="disp grid size-11 place-items-center rounded-md bg-paper text-[26px] text-ink md:size-13 md:text-[32px]"
          >
            1
          </span>
          <div className="w-28 md:w-36">
            <div className="flex items-baseline gap-1.5">
              <span ref={speedEl} className="disp text-[22px] leading-none md:text-[26px]">
                0
              </span>
              <span className={label}>km/h</span>
              <span
                ref={limiterEl}
                hidden
                className="ml-auto rounded-sm bg-slow px-1 text-xs font-semibold text-ink"
              >
                PIT
              </span>
            </div>
            <div className="mt-1 flex h-5 items-center gap-1 text-xs font-semibold">
              <span ref={straightEl} hidden className="rounded-sm bg-go px-1 text-ink">
                Straight
              </span>
              <span ref={otEl} hidden className="rounded-sm px-1 text-paper">
                Overtake
              </span>
              <span ref={scEl} hidden className="rounded-sm bg-slow px-1 text-ink">
                SC
              </span>
              <span ref={blueEl} hidden className="rounded-sm bg-print px-1 text-paper">
                Blue flag
              </span>
            </div>
            <span ref={thrEl} className="mt-2 block h-1.5 origin-left bg-go" style={zero} />
            <span ref={brkEl} className="mt-1 block h-1.5 origin-left bg-accent" style={zero} />
            <div className="mt-1.5 grid grid-cols-[auto_auto_1fr_auto] items-center gap-x-2 gap-y-1 text-xs text-soft">
              Tyres
              <span ref={tyreName} className="w-3 font-semibold text-slow">
                M
              </span>
              <span className="h-1.5 bg-lamp">
                <span ref={tyreEl} className="block h-full origin-left bg-go" />
              </span>
              <span ref={tyreText} className="w-8 text-right text-paper">
                100%
              </span>
              Battery
              <span />
              <span className="h-1.5 bg-lamp">
                <span ref={batEl} className="block h-full origin-left bg-paper" />
              </span>
              <span ref={batText} className="text-right whitespace-nowrap text-paper">
                4.0 MJ
              </span>
            </div>
            <div
              ref={fitWrap}
              hidden
              className="pointer-events-auto mt-2 flex items-center gap-1.5"
            >
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
              <div role="radiogroup" aria-label="Laps" className="mt-2 grid grid-cols-4 gap-2">
                {DISTANCES.map((n) => (
                  <button
                    key={n}
                    type="button"
                    role="radio"
                    aria-checked={laps === n}
                    onClick={() => {
                      setLaps(n);
                      write(LAPS, n);
                      unqualify();
                      lapsRef.current = n;
                      regrid.current();
                    }}
                    className={`min-h-11 rounded-md text-sm ring-1 active:scale-[.98] ${laps === n ? "bg-lamp font-semibold ring-paper" : "ring-paper/25"}`}
                  >
                    {n} laps
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
              <p className={`${label} mt-2`}>
                Team plan{" "}
                <span className="text-paper">{planText(teamPlan(laps, built, tyre))}</span>
              </p>
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
                1, 2 or 3 to pick, Enter to line up.
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
                {def.name} · {result.quali ? "Qualifying" : `${result.laps} laps`} ·{" "}
                {LEVELS[result.level].series} grid
              </p>
              <div
                className="mt-1 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 motion-safe:animate-rowin"
                style={{ animationDelay: "1s" }}
              >
                <div>
                  <p className="disp text-[28px] leading-none md:text-[36px]">
                    {result.quali ? "Qualifying" : "Classification"}
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
                    {radio(result)}
                  </p>
                </div>
                <button
                  type="button"
                  autoFocus
                  onClick={() => again.current()}
                  className="min-h-11 w-full rounded-md bg-paper px-6 font-semibold text-ink active:scale-[.98] md:w-auto"
                >
                  {result.quali ? "To the grid" : "Race again"}
                </button>
              </div>
              <div className="mt-4 min-h-0 flex-1 overflow-y-auto">
                <table className="w-full text-left text-sm tabular-nums md:text-[15px]">
                  <thead className="sticky top-0 z-10 bg-pit text-xs text-soft">
                    <tr>
                      <th className="w-8 py-1 font-normal">Pos</th>
                      <th className="py-1 font-normal">Driver</th>
                      <th className="py-1 text-right font-normal">Time</th>
                      {!result.quali && (
                        <>
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
                      return (
                        <tr
                          key={r.id}
                          className={`motion-safe:animate-rowin ${r.id ? "" : "bg-lamp"}`}
                          style={{ animationDelay: `${1.1 + k * 0.05}s` }}
                        >
                          <td className="py-1 pl-2 text-soft">{k + 1}</td>
                          <td className="py-1">
                            <span className="flex items-center gap-2">
                              <span
                                className="h-3 w-1 shrink-0 rounded-full ring-1 ring-paper/25"
                                style={{
                                  background:
                                    LEVELS[result.level].colors[r.id >> 1] || "var(--color-accent)",
                                }}
                              />
                              <span className="font-semibold">{who.code}</span>
                              <span className="hidden truncate text-soft md:inline">
                                {who.name}
                              </span>
                              {r.penalty ? (
                                <span className="rounded-sm bg-slow px-1 text-xs font-semibold text-ink">
                                  +{r.penalty / 1000}s
                                </span>
                              ) : null}
                            </span>
                          </td>
                          <td className="py-1 pr-2 text-right">
                            {result.quali && !r.time
                              ? "No time"
                              : r.dsq
                                ? "DSQ"
                                : r.out
                                  ? `DNF · ${r.out}`
                                  : r.down
                                    ? lapsDown(r.down)
                                    : k
                                      ? plus((r.time - leader) / 1000)
                                      : fmt(r.time)}
                          </td>
                          {!result.quali && (
                            <>
                              <td className="py-1 pl-3 text-right">{r.stops}</td>
                              <td className="py-1 pl-3">
                                <span
                                  className="flex gap-1 font-semibold"
                                  aria-label={r.stints.map((t) => TYRES[t].name).join(", then ")}
                                >
                                  {r.stints.map((t, i) => (
                                    <span key={i} className={TYRE_INK[t]} aria-hidden>
                                      {letter(t)}
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
      <p className="-mt-2 text-xs text-soft">Track data: TUMFTM racetrack-database, LGPL-3.0.</p>
    </main>
  );
}
