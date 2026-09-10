"use client";

/* eslint-disable @next/next/no-img-element --
   The world sprites are tiny local pixel-art PNGs scaled by non-integer factors
   with `image-rendering: pixelated`. next/image would resample them (blurring the
   pixels) and adds layout wrappers that fight the absolutely-positioned world. */

// Walkable pixel-art farm portfolio. Ported from the Claude Design project
// "Pixel Farm Portfolio" (ff464567-…): the x-dc template + `class Component`
// game loop, translated to a React class component (React Compiler skips
// classes, so this needs no "use no memo"). World geometry stays as inline
// positional data; repeated visual treatments and every `style-hover` live in
// farm.module.css. Real content comes from ./data; the crawlable version of it
// is <PortfolioFallback/>, rendered alongside this on the page.

import React from "react";
import styles from "./farm.module.css";
import { farmClock } from "@/lib/farm-clock";
import {
  projects,
  lines,
  items,
  branches,
  socials,
  quests,
  done,
  interests,
  artCredit,
  solids,
  spots,
  buildings,
  trees,
  type Spot,
} from "./data";

const SPEED = 210; // px/s walk speed (design "Feel" prop, default)
const START_NIGHT = false;
const SCANLINES = false;

// idempotent: "sprites/x.png" -> "/sprites/x.png", but "/sprites/x.png" unchanged
const S = (bg: string) => bg.replace(/(?<!\/)sprites\//, "/sprites/");

// farmer.png: three stacked rows of 32x32 front-facing cells (built by
// scripts/build-sprites.sh from the pack's paper-doll layers). Frames advance
// on a JS clock in loop(); reduced motion freezes idle/walk to frame 0.
// idle and walk are cropped to the front-facing run of each pack strip (the
// pack turns the character away to "look around" partway through both) — see
// build-sprites.sh. So idle = 4 cells (breathing bob), walk = 12.
const FARMER_ANIMS = {
  idle: { row: 0, frames: 4, fps: 4 },
  walk: { row: 1, frames: 12, fps: 10 },
  act: { row: 2, frames: 16, fps: 14 },
} as const;
type FarmerAnim = keyof typeof FARMER_ANIMS;
const ACT_MS = 380; // the reach pose holds this long before its overlay opens

type World = { l: number; t: number; w: number; h: number; bg: string };

// decorative sprite scatter across the world (all /sprites/seasons.png cells)
const BUSHES: World[] = [
  { l: 60, t: 40, w: 96, h: 64, bg: "url(sprites/seasons.png) 0 -320px/704px 384px" },
  { l: 520, t: 120, w: 160, h: 64, bg: "url(sprites/seasons.png) -128px -320px/704px 384px" },
  { l: 960, t: 64, w: 96, h: 64, bg: "url(sprites/seasons.png) 0 -320px/704px 384px" },
  { l: 1480, t: 420, w: 96, h: 64, bg: "url(sprites/seasons.png) 0 -320px/704px 384px" },
  { l: 40, t: 920, w: 96, h: 64, bg: "url(sprites/seasons.png) 0 -320px/704px 384px" },
];

const SCATTER: World[] = [
  { l: 600, t: 230, w: 32, h: 32, bg: "url(sprites/seasons.png) 0 0/704px 384px" },
  { l: 660, t: 300, w: 32, h: 32, bg: "url(sprites/seasons.png) -96px 0/704px 384px" },
  { l: 470, t: 390, w: 32, h: 32, bg: "url(sprites/seasons.png) -288px 0/704px 384px" },
  { l: 530, t: 430, w: 32, h: 32, bg: "url(sprites/seasons.png) -352px 0/704px 384px" },
  { l: 900, t: 180, w: 32, h: 32, bg: "url(sprites/seasons.png) -384px 0/704px 384px" },
  { l: 980, t: 300, w: 32, h: 32, bg: "url(sprites/seasons.png) -416px 0/704px 384px" },
  { l: 1060, t: 230, w: 32, h: 32, bg: "url(sprites/seasons.png) -352px -32px/704px 384px" },
  { l: 860, t: 600, w: 32, h: 32, bg: "url(sprites/seasons.png) -448px -32px/704px 384px" },
  { l: 940, t: 660, w: 32, h: 32, bg: "url(sprites/seasons.png) -288px -288px/704px 384px" },
  { l: 1000, t: 600, w: 32, h: 32, bg: "url(sprites/seasons.png) -320px -288px/704px 384px" },
  { l: 120, t: 420, w: 32, h: 32, bg: "url(sprites/seasons.png) -96px -224px/704px 384px" },
  { l: 180, t: 460, w: 32, h: 32, bg: "url(sprites/seasons.png) -32px -224px/704px 384px" },
  { l: 1400, t: 640, w: 32, h: 32, bg: "url(sprites/seasons.png) -224px -224px/704px 384px" },
  { l: 1460, t: 700, w: 32, h: 32, bg: "url(sprites/seasons.png) -96px -224px/704px 384px" },
  { l: 700, t: 860, w: 32, h: 32, bg: "url(sprites/seasons.png) -288px -288px/704px 384px" },
  { l: 640, t: 920, w: 32, h: 32, bg: "url(sprites/seasons.png) -320px -288px/704px 384px" },
  { l: 1180, t: 180, w: 32, h: 32, bg: "url(sprites/seasons.png) -416px -32px/704px 384px" },
  { l: 300, t: 960, w: 32, h: 32, bg: "url(sprites/seasons.png) -352px 0/704px 384px" },
];

// project plots: pen of bobbing critters + a signboard, keyed to a project
type Plot = {
  l: number;
  t: number;
  label: string;
  gold?: boolean;
  labelW: number;
  sprite: string;
  dur: number;
  animals: [number, number, number][]; // x, y, delay
};
const PLOTS: Plot[] = [
  {
    l: 170,
    t: 600,
    label: "gitpilot",
    labelW: 130,
    dur: 1.4,
    sprite: "url(sprites/seasons.png) -288px 0/704px 384px",
    animals: [
      [22, 44, 0],
      [96, 44, 0.3],
      [170, 44, 0.6],
      [22, 104, 0.9],
      [96, 104, 1.1],
    ],
  },
  {
    l: 430,
    t: 600,
    label: "placehold",
    labelW: 140,
    dur: 1.5,
    sprite: "url(sprites/seasons.png) -352px 0/704px 384px",
    animals: [
      [22, 44, 0],
      [96, 44, 0.4],
      [170, 44, 0.8],
      [96, 104, 1.2],
    ],
  },
  {
    l: 170,
    t: 800,
    label: "tinkersim · in season",
    labelW: 196,
    dur: 1.2,
    gold: true,
    sprite: "url(sprites/seasons.png) -416px -32px/704px 384px",
    animals: [
      [22, 44, 0],
      [96, 44, 0.25],
      [170, 44, 0.5],
      [22, 104, 0.75],
      [96, 104, 1],
      [170, 104, 1.25],
    ],
  },
  {
    l: 430,
    t: 800,
    label: "pac0",
    labelW: 110,
    dur: 1.7,
    sprite: "url(sprites/seasons.png) -384px 0/704px 384px",
    animals: [
      [22, 44, 0],
      [96, 44, 0.5],
      [170, 104, 1],
    ],
  },
];

type State = {
  screen: "title" | "farm";
  overlay: null | "dialogue" | "project" | "menu";
  tab: "quests" | "bag" | "skills" | "social";
  proj: number;
  night: boolean | null;
  px: number;
  py: number;
  facing: 1 | -1;
  promptId: string | null;
  typed: number;
  line: number;
  vw: number;
  vh: number;
  hover: number;
  anim: FarmerAnim;
  frame: number;
};

export class FarmPortfolio extends React.Component<object, State> {
  override state: State = {
    screen: "title",
    overlay: null,
    tab: "quests",
    proj: 0,
    night: null,
    px: 784,
    py: 640,
    facing: 1,
    promptId: null,
    typed: 0,
    line: 0,
    vw: 1200,
    vh: 760,
    hover: 0,
    anim: "idle",
    frame: 0,
  };

  keys: Record<string, boolean> = {};
  rootRef = React.createRef<HTMLDivElement>();
  raf = 0;
  last = 0;
  typer: ReturnType<typeof setInterval> | undefined;
  actUntil = 0;
  actTimer: ReturnType<typeof setTimeout> | undefined;
  clock = farmClock();

  onKey = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    const map: Record<string, string> = {
      arrowup: "up",
      w: "up",
      arrowdown: "down",
      s: "down",
      arrowleft: "left",
      a: "left",
      arrowright: "right",
      d: "right",
    };
    if (e.type === "keydown") {
      if (map[k]) {
        this.keys[map[k]] = true;
        e.preventDefault();
      }
      if (this.state.screen === "title" && (k === "enter" || k === " ")) {
        this.startGame();
        e.preventDefault();
        return;
      }
      if (k === "escape") {
        this.close();
        return;
      }
      if (k === "m") {
        e.preventDefault();
        this.setState({ overlay: "menu" });
        return;
      }
      if (k === "e" || k === " " || k === "enter") {
        e.preventDefault();
        if (this.state.overlay === "dialogue") this.next();
        else this.act();
      }
    } else if (map[k]) {
      this.keys[map[k]] = false;
    }
  };
  onResize = () => this.measure();

  override componentDidMount() {
    window.addEventListener("keydown", this.onKey);
    window.addEventListener("keyup", this.onKey);
    window.addEventListener("resize", this.onResize);
    this.measure();
    this.raf = requestAnimationFrame(this.loop);
  }

  override componentWillUnmount() {
    window.removeEventListener("keydown", this.onKey);
    window.removeEventListener("keyup", this.onKey);
    window.removeEventListener("resize", this.onResize);
    cancelAnimationFrame(this.raf);
    clearInterval(this.typer);
    clearTimeout(this.actTimer);
  }

  reduceMotion() {
    return (
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  measure() {
    const el = this.rootRef.current;
    const w = (el && el.clientWidth) || window.innerWidth || 1200;
    const h = (el && el.clientHeight) || window.innerHeight || 760;
    if (w !== this.state.vw || h !== this.state.vh) this.setState({ vw: w, vh: h });
  }

  loop = (t: number) => {
    this.measure();
    const dt = Math.min(50, t - (this.last || t)) / 1000;
    this.last = t;
    if (this.state.screen === "farm" && !this.state.overlay) {
      const k = this.keys;
      let dx = 0,
        dy = 0;
      if (k.left) dx -= 1;
      if (k.right) dx += 1;
      if (k.up) dy -= 1;
      if (k.down) dy += 1;
      const up: Partial<State> = {};
      let moving = false;
      if (dx || dy) {
        const l = Math.hypot(dx, dy) || 1;
        const sp = SPEED * dt;
        const nx = Math.max(20, Math.min(1580, this.state.px + (dx / l) * sp));
        const ny = Math.max(60, Math.min(990, this.state.py + (dy / l) * sp));
        if (!this.hit(nx, this.state.py)) {
          up.px = nx;
          if (dx) up.facing = dx > 0 ? 1 : -1;
        }
        if (!this.hit(this.state.px, ny)) up.py = ny;
        moving = up.px !== undefined || up.py !== undefined;
      }

      // farmer animation: reach pose while acting, else walk/idle by movement
      const anim: FarmerAnim = t < this.actUntil ? "act" : moving ? "walk" : "idle";
      const cfg = FARMER_ANIMS[anim];
      const frame =
        this.reduceMotion() && anim !== "act" ? 0 : Math.floor((t / 1000) * cfg.fps) % cfg.frames;
      if (anim !== this.state.anim) up.anim = anim;
      if (frame !== this.state.frame) up.frame = frame;

      if (Object.keys(up).length) this.setState(up as State);
      this.checkPrompt();
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  hit(x: number, y: number) {
    const fx = x - 10,
      fy = y - 12,
      fw = 20,
      fh = 12;
    return solids.some((s) => fx < s.x + s.w && fx + fw > s.x && fy < s.y + s.h && fy + fh > s.y);
  }

  checkPrompt() {
    const { px, py } = this.state;
    const pad = 46;
    let found: string | null = null;
    for (const s of spots) {
      if (px > s.x - pad && px < s.x + s.w + pad && py > s.y - pad && py < s.y + s.h + pad) {
        found = s.id;
        break;
      }
    }
    if (found !== this.state.promptId) this.setState({ promptId: found });
  }

  spot(): Spot | undefined {
    return spots.find((s) => s.id === this.state.promptId);
  }

  act = () => {
    if (this.state.screen !== "farm" || this.state.overlay) return;
    const s = this.spot();
    if (!s) return;
    const open = () => {
      if (s.act === "dialogue") this.talk();
      else if (s.act.startsWith("proj"))
        this.setState({ overlay: "project", proj: +s.act.slice(4) });
      else this.setState({ overlay: "menu", tab: s.act as State["tab"] });
    };
    // play the reach pose, then open — unless reduced motion, then open now
    clearTimeout(this.actTimer);
    if (this.reduceMotion()) return open();
    this.actUntil = performance.now() + ACT_MS;
    this.actTimer = setTimeout(open, ACT_MS - 60);
  };

  talk = () => {
    clearInterval(this.typer);
    this.setState({ overlay: "dialogue", line: 0, typed: 0 }, () => this.type());
  };

  type() {
    clearInterval(this.typer);
    if (this.reduceMotion()) {
      this.setState((s) => ({ typed: (lines[s.line] || "").length }));
      return;
    }
    this.typer = setInterval(() => {
      const full = lines[this.state.line] || "";
      if (this.state.typed >= full.length) {
        clearInterval(this.typer);
        return;
      }
      this.setState((s) => ({ typed: s.typed + 1 }));
    }, 22);
  }

  next = () => {
    const full = lines[this.state.line] || "";
    if (this.state.typed < full.length) {
      clearInterval(this.typer);
      this.setState({ typed: full.length });
      return;
    }
    if (this.state.line >= lines.length - 1) return;
    this.setState(
      (s) => ({ line: s.line + 1, typed: 0 }),
      () => this.type(),
    );
  };

  close = () => {
    clearInterval(this.typer);
    if (this.state.overlay) this.setState({ overlay: null });
    else if (this.state.screen === "farm") this.setState({ overlay: "menu", tab: "quests" });
  };

  startGame = () => this.setState({ screen: "farm", overlay: null, px: 784, py: 640 });
  startAtBoard = () =>
    this.setState({ screen: "farm", px: 860, py: 520, overlay: "menu", tab: "skills" });
  goTitle = () => this.setState({ screen: "title", overlay: null });
  toggleNight = () => this.setState((s) => ({ night: !(s.night ?? START_NIGHT) }));
  nextProject = () => this.setState((s) => ({ proj: (s.proj + 1) % projects.length }));
  openTab = (tab: State["tab"]) => this.setState({ overlay: "menu", tab });
  pad = (dir: string, on: boolean) => () => {
    this.keys[dir] = on;
  };

  override render() {
    const s = this.state;
    const night = s.night ?? START_NIGHT;
    const { vw, vh } = s;
    const cx = vw >= 1600 ? (1600 - vw) / 2 : -Math.max(0, Math.min(1600 - vw, s.px - vw / 2));
    const cy = vh >= 1000 ? (1000 - vh) / 2 : -Math.max(0, Math.min(1000 - vh, s.py - vh / 2));
    const sp = this.spot();
    const p = projects[s.proj]!;
    const projSeason =
      p.name === "tinkersim" ? `${this.clock.seasonLabel}, year ${this.clock.year}` : p.season;
    const it = items[s.hover] || items[0]!;
    const camT = `translate3d(${Math.round(cx)}px,${Math.round(cy)}px,0)`;
    const playerT = `translate3d(${Math.round(s.px - 16)}px,${Math.round(s.py - 30)}px,0) scale(${1.35 * s.facing},1.35)`;
    const farmerBgPos = `${-s.frame * 32}px ${-FARMER_ANIMS[s.anim].row * 32}px`;
    // float the prompt above the farmer's head — spots now sit on top of the
    // building sprites, so anchoring to the spot would bury the bubble in a roof
    const promptT = sp
      ? `translate3d(${Math.round(s.px - 90)}px,${Math.round(s.py - 108)}px,0)`
      : "translate3d(-999px,0,0)";
    const typedLine = (lines[s.line] || "").slice(0, s.typed);
    const atLast = s.line >= lines.length - 1;
    const tabBg = (t: string) => (s.tab === t ? "#f7e7c3" : "#c9a06a");

    return (
      <div ref={this.rootRef} className={styles.root}>
        {/* ---------------- FARM WORLD ---------------- */}
        {s.screen === "farm" && (
          <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: 1600,
                height: 1000,
                willChange: "transform",
                transform: camT,
              }}
            >
              <div
                className={styles.px}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "url(/sprites/grass.png)",
                  backgroundSize: "32px 32px",
                }}
              />
              {/* fences */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 496,
                  width: 1600,
                  height: 64,
                  background: "#b98252",
                  boxShadow: "inset 0 4px 0 #cf9a67,inset 0 -4px 0 #96603a",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 752,
                  top: 0,
                  width: 64,
                  height: 1000,
                  background: "#b98252",
                  boxShadow: "inset 4px 0 0 #cf9a67,inset -4px 0 0 #96603a",
                }}
              />
              {/* trees — behind buildings and the farmer, no collision */}
              {trees.map((tr, i) => (
                <img
                  key={`tree${i}`}
                  className={styles.px}
                  src={S(tr.sprite)}
                  alt=""
                  style={{
                    position: "absolute",
                    left: tr.l,
                    top: tr.t,
                    width: tr.w,
                    height: tr.h,
                  }}
                />
              ))}

              {BUSHES.map((b, i) => (
                <div
                  key={`b${i}`}
                  className={styles.px}
                  style={{
                    position: "absolute",
                    left: b.l,
                    top: b.t,
                    width: b.w,
                    height: b.h,
                    background: S(b.bg),
                  }}
                />
              ))}
              {SCATTER.map((b, i) => (
                <div
                  key={`s${i}`}
                  className={styles.px}
                  style={{
                    position: "absolute",
                    left: b.l,
                    top: b.t,
                    width: b.w,
                    height: b.h,
                    background: S(b.bg),
                  }}
                />
              ))}

              {/* buildings — whole-image sprites from the asset pack (see data.ts) */}
              {buildings.map((b) => (
                <img
                  key={b.id}
                  className={styles.px}
                  src={S(b.sprite)}
                  alt=""
                  style={{
                    position: "absolute",
                    left: b.l,
                    top: b.t,
                    width: b.w,
                    height: b.h,
                  }}
                />
              ))}
              {/* project plots */}
              {PLOTS.map((plot, i) => (
                <div
                  key={`plot${i}`}
                  style={{
                    position: "absolute",
                    left: plot.l,
                    top: plot.t,
                    width: 230,
                    height: 160,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "#6b4529",
                      border: "4px solid #4a2f1f",
                      boxShadow: plot.gold
                        ? "inset 0 0 0 4px #7e5533,0 0 0 4px #f2c14e"
                        : "inset 0 0 0 4px #7e5533",
                      backgroundImage:
                        "repeating-linear-gradient(90deg,#6b4529 0 24px,#5c3a22 24px 32px)",
                    }}
                  />
                  {plot.animals.map(([ax, ay, delay], j) => (
                    <div
                      key={j}
                      className={styles.px}
                      style={{
                        position: "absolute",
                        left: ax,
                        top: ay,
                        width: 32,
                        height: 32,
                        background: S(plot.sprite),
                        animation: `bob ${plot.dur}s steps(2) ${delay}s infinite`,
                      }}
                    />
                  ))}
                  <div
                    style={{
                      position: "absolute",
                      left: 16,
                      top: -30,
                      width: plot.labelW,
                      height: 30,
                      background: plot.gold ? "#f2c14e" : "#c9a06a",
                      border: "4px solid #4a2f1f",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      letterSpacing: ".5px",
                    }}
                  >
                    {plot.label}
                  </div>
                </div>
              ))}

              {/* player — farmer.png sprite; frame/row from state, mirror via facing */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 20,
                  height: 6,
                  background: "rgba(0,0,0,.26)",
                  borderRadius: "50%",
                  transform: `translate3d(${Math.round(s.px - 10)}px,${Math.round(s.py - 5)}px,0)`,
                }}
              />
              <div
                className={styles.px}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  width: 32,
                  height: 32,
                  willChange: "transform",
                  transform: playerT,
                  backgroundImage: "url(/sprites/farmer.png)",
                  backgroundPosition: farmerBgPos,
                  backgroundRepeat: "no-repeat",
                }}
              />

              {/* interact prompt */}
              {sp && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 2,
                    animation: "bob 1s steps(2) infinite",
                    transform: promptT,
                  }}
                >
                  <div
                    className={styles.panelSm}
                    style={{
                      padding: "1px 8px 3px",
                      fontSize: 13,
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      color: "#3b2a1a",
                    }}
                  >
                    {sp.label}
                  </div>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      background: "#f2c14e",
                      border: "4px solid #4a2f1f",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    E
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background: "linear-gradient(180deg,#101a3c,#241a3c)",
                opacity: night ? 0.55 : 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                boxShadow: "inset 0 0 160px rgba(20,10,0,.35)",
              }}
            />
          </div>
        )}

        {/* ---------------- HUD ---------------- */}
        {s.screen === "farm" && (
          <>
            <div
              style={{
                position: "absolute",
                left: 16,
                top: 16,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  background: "#f7e7c3",
                  border: "4px solid #4a2f1f",
                  boxShadow: "inset 0 0 0 4px #e3c793,0 6px 0 rgba(0,0,0,.35)",
                  padding: "10px 14px",
                  minWidth: 190,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: ".5px" }}>
                  HARSHSANDHU FARM
                </div>
                <div
                  className={styles.mono}
                  style={{ fontSize: 19, lineHeight: 1, color: "#6b4529", marginTop: 4 }}
                >
                  {this.clock.dateLabel} · Year {this.clock.year}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
                  <div
                    className={styles.px}
                    style={{
                      width: 24,
                      height: 24,
                      background: S("url(sprites/bars.png) -72px -96px/288px 240px"),
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      height: 14,
                      background: "#6b4529",
                      border: "3px solid #4a2f1f",
                      padding: 1,
                    }}
                  >
                    <div style={{ width: "78%", height: "100%", background: "#8ed14f" }} />
                  </div>
                </div>
                <div
                  className={styles.mono}
                  style={{ fontSize: 17, color: "#8a5a2b", marginTop: 2 }}
                >
                  energy · shipping {projects.length} repos
                </div>
              </div>
              <button
                type="button"
                aria-label="Toggle day / night"
                onClick={this.toggleNight}
                style={{
                  width: 64,
                  height: 64,
                  background: "#f7e7c3",
                  border: "4px solid #4a2f1f",
                  boxShadow: "inset 0 0 0 4px #e3c793,0 6px 0 rgba(0,0,0,.35)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <div
                  className={styles.px}
                  style={{
                    width: 32,
                    height: 32,
                    background: night
                      ? S("url(sprites/weather.png) -96px -64px/320px 96px")
                      : S("url(sprites/weather.png) 0 0/320px 96px"),
                  }}
                />
              </button>
            </div>

            <div
              style={{
                position: "absolute",
                right: 16,
                top: 16,
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "flex-end",
              }}
            >
              <div
                className={styles.mono}
                style={{
                  background: "#f7e7c3",
                  border: "4px solid #4a2f1f",
                  boxShadow: "inset 0 0 0 4px #e3c793,0 6px 0 rgba(0,0,0,.35)",
                  padding: "8px 12px",
                  fontSize: 19,
                  lineHeight: 1.2,
                  textAlign: "right",
                  maxWidth: 230,
                }}
              >
                WASD / arrows to walk
                <br />E to interact · M for menu
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className={styles.btn}
                  style={hudBtn}
                  onClick={() => this.openTab("quests")}
                >
                  QUESTS
                </button>
                <button
                  type="button"
                  className={styles.btn}
                  style={hudBtn}
                  onClick={() => this.openTab("bag")}
                >
                  BAG
                </button>
                <button type="button" className={styles.btn} style={hudBtn} onClick={this.goTitle}>
                  SAVE
                </button>
              </div>
            </div>

            {/* touch d-pad */}
            <div
              style={{
                position: "absolute",
                left: 16,
                bottom: 16,
                display: "grid",
                gridTemplateColumns: "repeat(3,52px)",
                gridTemplateRows: "repeat(3,52px)",
                gap: 4,
                opacity: 0.9,
              }}
            >
              <div />
              <div
                style={dpad}
                onPointerDown={this.pad("up", true)}
                onPointerUp={this.pad("up", false)}
                onPointerLeave={this.pad("up", false)}
              >
                ▲
              </div>
              <div />
              <div
                style={dpad}
                onPointerDown={this.pad("left", true)}
                onPointerUp={this.pad("left", false)}
                onPointerLeave={this.pad("left", false)}
              >
                ◀
              </div>
              <div />
              <div
                style={dpad}
                onPointerDown={this.pad("right", true)}
                onPointerUp={this.pad("right", false)}
                onPointerLeave={this.pad("right", false)}
              >
                ▶
              </div>
              <div />
              <div
                style={dpad}
                onPointerDown={this.pad("down", true)}
                onPointerUp={this.pad("down", false)}
                onPointerLeave={this.pad("down", false)}
              >
                ▼
              </div>
              <div />
            </div>

            <div
              style={{
                position: "absolute",
                right: 16,
                bottom: 16,
                width: 76,
                height: 76,
                background: "#f2c14e",
                border: "4px solid #4a2f1f",
                boxShadow: "inset 0 -6px 0 #cf9a2f",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 700,
                cursor: "pointer",
                touchAction: "none",
              }}
              onPointerDown={this.act}
            >
              A
            </div>
          </>
        )}

        {/* ---------------- TITLE ---------------- */}
        {s.screen === "title" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg,#2a3b6d 0%,#4a5a8c 45%,#7b6a86 68%,#c98a5e 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              padding: 20,
              overflow: "auto",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 120,
                background: "#3f6b3a",
                boxShadow: "inset 0 6px 0 #4d7f45",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 100,
                height: 40,
                background: "repeating-linear-gradient(90deg,#3f6b3a 0 32px,#4d7f45 32px 64px)",
                animation: "drift 6s linear infinite",
                opacity: 0.6,
              }}
            />
            <div
              className={styles.px}
              style={{
                position: "absolute",
                right: "10%",
                top: "12%",
                width: 64,
                height: 64,
                background: S("url(sprites/weather.png) -192px -128px/640px 192px"),
                animation: "bob 3s steps(2) infinite",
              }}
            />

            <div style={{ position: "relative", textAlign: "center" }}>
              <div
                className={styles.mono}
                style={{ fontSize: 22, color: "#f2c14e", letterSpacing: 4 }}
              >
                A PRODUCT ENGINEER&apos;S
              </div>
              <div
                style={{
                  fontSize: "clamp(34px,7vw,76px)",
                  fontWeight: 700,
                  color: "#f7e7c3",
                  lineHeight: 1,
                  letterSpacing: 2,
                  textShadow: "6px 6px 0 #2b1d16",
                }}
              >
                HARSHSANDHU44
              </div>
              <div
                className={styles.mono}
                style={{ fontSize: 24, color: "#f7e7c3", letterSpacing: 2, marginTop: 6 }}
              >
                web · systems · simulation
              </div>
            </div>

            <div
              style={{
                position: "relative",
                width: "min(560px,100%)",
                background: "#f7e7c3",
                border: "4px solid #4a2f1f",
                boxShadow:
                  "inset 0 0 0 4px #e3c793,inset 0 0 0 8px #cba876,0 10px 0 rgba(0,0,0,.35)",
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: 1, color: "#8a5a2b" }}>
                LOAD SAVE FILE
              </div>

              <div className={styles.pick} style={saveRow} onClick={this.startGame}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: "#7a4f2c",
                    border: "4px solid #4a2f1f",
                    position: "relative",
                    flex: "none",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 14,
                      top: 20,
                      width: 28,
                      height: 22,
                      background: "#e8b98d",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 10,
                      top: 12,
                      width: 36,
                      height: 8,
                      background: "#4d7f45",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 20,
                      top: 28,
                      width: 4,
                      height: 4,
                      background: "#2b1d16",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      left: 32,
                      top: 28,
                      width: 4,
                      height: 4,
                      background: "#2b1d16",
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>
                    Harsh Sandhu{" "}
                    <span className={styles.mono} style={{ fontSize: 18, color: "#6b4529" }}>
                      · Lv {this.clock.level}
                    </span>
                  </div>
                  <div
                    className={styles.mono}
                    style={{ fontSize: 19, lineHeight: 1.15, color: "#6b4529" }}
                  >
                    Harshsandhu Farm · {projects.length} repos tended
                    <br />
                    Current quest: TinkerSim
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 4,
                    flex: "none",
                  }}
                >
                  <div style={{ display: "flex", gap: 2 }}>
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className={styles.px}
                        style={{
                          width: 20,
                          height: 20,
                          background: S("url(sprites/bars.png) -60px 0/240px 200px"),
                        }}
                      />
                    ))}
                  </div>
                  <div className={styles.mono} style={{ fontSize: 17, color: "#8a5a2b" }}>
                    3 hearts
                  </div>
                </div>
              </div>

              <div className={styles.pick} style={saveRow} onClick={this.startAtBoard}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: "#c9a06a",
                    border: "4px solid #4a2f1f",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    textAlign: "center",
                    lineHeight: 1.1,
                    flex: "none",
                  }}
                >
                  SKILL
                  <br />
                  TREE
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700 }}>Skip to the skill tree</div>
                  <div className={styles.mono} style={{ fontSize: 19, color: "#6b4529" }}>
                    typescript · rust · next.js · docker · aws
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "center",
                  background: "#ded0b4",
                  border: "4px solid #6b5a44",
                  padding: 12,
                  opacity: 0.75,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: "#b9a888",
                    border: "4px solid #6b5a44",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 700,
                    flex: "none",
                  }}
                >
                  ?
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#6b5a44" }}>Empty slot</div>
                  <div className={styles.mono} style={{ fontSize: 19, color: "#6b5a44" }}>
                    resume · not yet planted
                  </div>
                </div>
              </div>
            </div>

            <div
              className={styles.mono}
              style={{
                position: "relative",
                fontSize: 22,
                color: "#f7e7c3",
                letterSpacing: 2,
                animation: "blink 1.2s steps(1) infinite",
              }}
            >
              ▸ PRESS ENTER TO PLAY
            </div>
          </div>
        )}

        {/* ---------------- DIALOGUE ---------------- */}
        {s.overlay === "dialogue" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(20,12,8,.45)",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              padding: 20,
            }}
          >
            <div style={{ width: "min(880px,100%)", animation: "rise .18s steps(3)" }}>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
                <img
                  className={styles.px}
                  src="/sprites/portrait.png"
                  alt=""
                  style={{
                    width: 96,
                    height: 96,
                    border: "4px solid #4a2f1f",
                    flex: "none",
                    marginBottom: -4,
                    zIndex: 2,
                  }}
                />
                <div
                  style={{
                    background: "#f2c14e",
                    border: "4px solid #4a2f1f",
                    padding: "4px 14px 6px",
                    fontSize: 15,
                    fontWeight: 700,
                    marginLeft: -4,
                    marginBottom: -4,
                    zIndex: 1,
                  }}
                >
                  Harsh · farmer, product engineer
                </div>
              </div>
              <div
                className={styles.panel}
                style={{
                  boxShadow: "0 10px 0 rgba(0,0,0,.35)",
                  padding: "18px 22px",
                  minHeight: 170,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 16,
                }}
              >
                <div
                  className={styles.mono}
                  style={{
                    fontSize: "clamp(20px,2.4vw,27px)",
                    lineHeight: 1.25,
                    color: "#2b1d16",
                    textWrap: "pretty",
                  }}
                >
                  {typedLine}
                  <span style={{ animation: "blink .9s steps(1) infinite" }}>_</span>
                </div>
                {atLast ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <button
                      type="button"
                      className={styles.btn}
                      style={choice}
                      onClick={() => this.openTab("quests")}
                    >
                      ▸ What are you working on?
                    </button>
                    <button
                      type="button"
                      className={styles.btn}
                      style={choice}
                      onClick={() => this.openTab("bag")}
                    >
                      ▸ Show me your tools
                    </button>
                    <button
                      type="button"
                      className={styles.btn}
                      style={choice}
                      onClick={() => this.openTab("social")}
                    >
                      ▸ How do I reach you?
                    </button>
                    <button
                      type="button"
                      className={styles.btn}
                      style={choice}
                      onClick={this.close}
                    >
                      ▸ Goodbye
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div className={styles.mono} style={{ fontSize: 19, color: "#8a5a2b" }}>
                      SPACE to continue · ESC to leave
                    </div>
                    <button
                      type="button"
                      aria-label="Continue"
                      style={{
                        width: 26,
                        height: 26,
                        background: "#f2c14e",
                        border: "4px solid #4a2f1f",
                        cursor: "pointer",
                        animation: "bob 1s steps(2) infinite",
                      }}
                      onClick={this.next}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- PROJECT CARD ---------------- */}
        {s.overlay === "project" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(20,12,8,.45)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              overflow: "auto",
            }}
          >
            <div
              style={{
                width: "min(680px,100%)",
                background: "#f7e7c3",
                border: "4px solid #4a2f1f",
                boxShadow:
                  "inset 0 0 0 4px #e3c793,inset 0 0 0 8px #cba876,0 10px 0 rgba(0,0,0,.35)",
                padding: 20,
                animation: "rise .18s steps(3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    border: "4px solid #4a2f1f",
                    background: "#6b4529",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flex: "none",
                  }}
                >
                  <div
                    className={styles.px}
                    style={{ width: 32, height: 32, background: S(p.sprite) }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "clamp(22px,3vw,30px)", fontWeight: 700, lineHeight: 1 }}>
                    {p.name}
                  </div>
                  <div className={styles.mono} style={{ fontSize: 20, color: "#8a5a2b" }}>
                    {p.kind}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  className={styles.btn}
                  style={{
                    width: 36,
                    height: 36,
                    border: "4px solid #4a2f1f",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    cursor: "pointer",
                    flex: "none",
                  }}
                  onClick={this.close}
                >
                  ✕
                </button>
              </div>

              <div
                className={styles.mono}
                style={{ fontSize: 23, lineHeight: 1.3, marginTop: 16, textWrap: "pretty" }}
              >
                {p.desc}
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))",
                  gap: 10,
                  marginTop: 16,
                }}
              >
                <div style={metaCell}>
                  <div className={styles.mono} style={metaKey}>
                    STATUS
                  </div>
                  <div style={metaVal}>{p.status}</div>
                </div>
                <div style={metaCell}>
                  <div className={styles.mono} style={metaKey}>
                    GROWN WITH
                  </div>
                  <div style={metaVal}>{p.stack}</div>
                </div>
                <div style={metaCell}>
                  <div className={styles.mono} style={metaKey}>
                    SEASON
                  </div>
                  <div style={metaVal}>{projSeason}</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                <a
                  className={styles.btnGold}
                  style={{
                    border: "4px solid #4a2f1f",
                    boxShadow: "inset 0 -4px 0 #cf9a2f",
                    padding: "10px 16px",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#2b1d16",
                  }}
                  target="_blank"
                  rel="noreferrer"
                  href={p.url}
                >
                  ▸ VISIT REPO
                </a>
                <button
                  type="button"
                  className={styles.btn}
                  style={{
                    border: "4px solid #4a2f1f",
                    boxShadow: "inset 0 -4px 0 #b98252",
                    padding: "10px 16px",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onClick={this.nextProject}
                >
                  ▸ NEXT PLOT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ---------------- MENU ---------------- */}
        {s.overlay === "menu" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(20,12,8,.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <div
              style={{
                width: "min(920px,100%)",
                maxHeight: "92vh",
                display: "flex",
                flexDirection: "column",
                animation: "rise .18s steps(3)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  flexWrap: "wrap",
                  marginBottom: -4,
                  position: "relative",
                  zIndex: 2,
                }}
              >
                {(["quests", "bag", "skills", "social"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={styles.tab}
                    style={{
                      border: "4px solid #4a2f1f",
                      padding: "8px 16px",
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      background: tabBg(t),
                    }}
                    onClick={() => this.openTab(t)}
                  >
                    {t === "quests"
                      ? "QUESTS"
                      : t === "bag"
                        ? "BAG"
                        : t === "skills"
                          ? "SKILL TREE"
                          : "MAILBOX"}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.btn}
                  style={{
                    marginLeft: "auto",
                    border: "4px solid #4a2f1f",
                    padding: "8px 14px",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  onClick={this.close}
                >
                  ✕ ESC
                </button>
              </div>
              <div
                style={{
                  background: "#f7e7c3",
                  border: "4px solid #4a2f1f",
                  boxShadow:
                    "inset 0 0 0 4px #e3c793,inset 0 0 0 8px #cba876,0 10px 0 rgba(0,0,0,.35)",
                  padding: 22,
                  overflow: "auto",
                }}
              >
                {s.tab === "quests" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div style={sectionLabel}>ACTIVE</div>
                    {quests.map((q, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 14,
                          background: "#e9d4a6",
                          border: "4px solid #4a2f1f",
                          padding: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 40,
                            height: 40,
                            background: "#f2c14e",
                            border: "4px solid #4a2f1f",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 18,
                            fontWeight: 700,
                            flex: "none",
                          }}
                        >
                          !
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 17, fontWeight: 700 }}>{q.title}</div>
                          <div
                            className={styles.mono}
                            style={{ fontSize: 20, lineHeight: 1.25, color: "#4a2f1f" }}
                          >
                            {q.objective}
                          </div>
                          <div className={styles.mono} style={{ fontSize: 18, color: "#8a5a2b" }}>
                            reward: {q.reward}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div style={{ ...sectionLabel, marginTop: 6 }}>COMPLETED</div>
                    {done.map((d, i) => (
                      <div
                        key={i}
                        style={{
                          display: "flex",
                          gap: 14,
                          alignItems: "center",
                          background: "#ded0b4",
                          border: "4px solid #6b5a44",
                          padding: "10px 12px",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            background: "#8ed14f",
                            border: "4px solid #4a2f1f",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 16,
                            fontWeight: 700,
                            flex: "none",
                          }}
                        >
                          ✓
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 16, fontWeight: 700 }}>{d.title}</div>
                          <div className={styles.mono} style={{ fontSize: 19, color: "#4a2f1f" }}>
                            {d.objective}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {s.tab === "bag" && (
                  <div>
                    <div style={{ ...sectionLabel, marginBottom: 12 }}>
                      TOOLS &amp; SEEDS · hover a slot
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill,minmax(84px,1fr))",
                        gap: 10,
                      }}
                    >
                      {items.map((item, i) => (
                        <div
                          key={i}
                          className={styles.pick}
                          style={{
                            aspectRatio: "1",
                            border: "4px solid #4a2f1f",
                            boxShadow: "inset 0 -6px 0 #cba876",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 2,
                            cursor: "pointer",
                            position: "relative",
                          }}
                          onMouseEnter={() => this.setState({ hover: i })}
                          onClick={() => this.setState({ hover: i })}
                        >
                          <div
                            style={{
                              fontSize: 20,
                              fontWeight: 700,
                              lineHeight: 1,
                              color: item.color,
                            }}
                          >
                            {item.tag}
                          </div>
                          <div
                            className={styles.mono}
                            style={{
                              fontSize: 15,
                              color: "#6b4529",
                              textAlign: "center",
                              lineHeight: 1,
                              padding: "0 4px",
                            }}
                          >
                            {item.name}
                          </div>
                          <div
                            className={styles.mono}
                            style={{
                              position: "absolute",
                              right: 3,
                              bottom: 2,
                              fontSize: 14,
                              color: "#8a5a2b",
                            }}
                          >
                            {item.qty}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div
                      style={{
                        marginTop: 16,
                        background: "#e9d4a6",
                        border: "4px solid #4a2f1f",
                        padding: 12,
                        minHeight: 78,
                      }}
                    >
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{it.name}</div>
                      <div
                        className={styles.mono}
                        style={{ fontSize: 21, lineHeight: 1.25, color: "#4a2f1f" }}
                      >
                        {it.desc}
                      </div>
                    </div>
                  </div>
                )}

                {s.tab === "skills" && (
                  <div>
                    <div style={{ ...sectionLabel, marginBottom: 14 }}>
                      SKILL TREE · gold nodes are current focus
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
                        gap: 16,
                      }}
                    >
                      {branches.map((b, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            gap: 0,
                          }}
                        >
                          <div
                            style={{
                              background: "#4a2f1f",
                              color: "#f7e7c3",
                              border: "4px solid #4a2f1f",
                              padding: 8,
                              textAlign: "center",
                              fontSize: 15,
                              fontWeight: 700,
                            }}
                          >
                            {b.name}
                          </div>
                          {b.nodes.map((n, j) => (
                            <div
                              key={j}
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                              }}
                            >
                              <div style={{ width: 8, height: 16, background: "#4a2f1f" }} />
                              <div
                                className={styles.mono}
                                style={{
                                  width: "100%",
                                  border: "4px solid #4a2f1f",
                                  padding: "8px 10px",
                                  textAlign: "center",
                                  fontSize: 20,
                                  lineHeight: 1.15,
                                  background: b.focus.includes(n) ? "#f2c14e" : "#e9d4a6",
                                }}
                              >
                                {n}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {s.tab === "social" && (
                  <div>
                    <div style={{ ...sectionLabel, marginBottom: 12 }}>
                      MAILBOX · friendship unlocks conversation
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {socials.map((so, i) => (
                        <a
                          key={i}
                          className={styles.pick}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            border: "4px solid #4a2f1f",
                            padding: 12,
                            color: "#2b1d16",
                          }}
                          target={so.url.startsWith("mailto:") ? undefined : "_blank"}
                          rel="noreferrer"
                          href={so.url}
                        >
                          <div
                            className={styles.px}
                            style={{
                              width: 40,
                              height: 40,
                              border: "4px solid #4a2f1f",
                              flex: "none",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 14,
                              fontWeight: 700,
                              background: so.icon.startsWith("url(") ? S(so.icon) : so.icon,
                              color: so.fg,
                            }}
                          >
                            {so.fallback}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 17, fontWeight: 700 }}>{so.name}</div>
                            <div className={styles.mono} style={{ fontSize: 19, color: "#6b4529" }}>
                              {so.handle}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: 2, flex: "none" }}>
                            {[0, 1].map((h) => (
                              <div
                                key={h}
                                className={styles.px}
                                style={{
                                  width: 20,
                                  height: 20,
                                  background: S("url(sprites/bars.png) -60px 0/240px 200px"),
                                }}
                              />
                            ))}
                            <div
                              className={styles.px}
                              style={{
                                width: 20,
                                height: 20,
                                background: S("url(sprites/bars.png) -100px 0/240px 200px"),
                              }}
                            />
                          </div>
                        </a>
                      ))}
                    </div>
                    <div
                      className={styles.mono}
                      style={{ fontSize: 20, color: "#8a5a2b", marginTop: 14 }}
                    >
                      Interests, for small talk: {interests}
                    </div>
                    <div
                      className={styles.mono}
                      style={{ fontSize: 17, color: "#8a5a2b", marginTop: 10 }}
                    >
                      <a href={artCredit.url} target="_blank" rel="noreferrer">
                        {artCredit.text} — emanuelledev.itch.io
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {SCANLINES && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background:
                "repeating-linear-gradient(0deg,rgba(0,0,0,.12) 0 2px,transparent 2px 4px)",
              mixBlendMode: "multiply",
            }}
          />
        )}
      </div>
    );
  }
}

const hudBtn: React.CSSProperties = {
  border: "4px solid #4a2f1f",
  boxShadow: "inset 0 -4px 0 #b98252",
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};
const dpad: React.CSSProperties = {
  background: "#f7e7c3",
  border: "4px solid #4a2f1f",
  boxShadow: "inset 0 -4px 0 #cba876",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 18,
  fontWeight: 700,
  touchAction: "none",
  cursor: "pointer",
};
const saveRow: React.CSSProperties = {
  display: "flex",
  gap: 14,
  alignItems: "center",
  border: "4px solid #4a2f1f",
  padding: 12,
  cursor: "pointer",
};
const choice: React.CSSProperties = {
  border: "4px solid #4a2f1f",
  boxShadow: "inset 0 -4px 0 #b98252",
  padding: "10px 14px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};
const metaCell: React.CSSProperties = {
  background: "#e9d4a6",
  border: "4px solid #4a2f1f",
  padding: "8px 10px",
};
const metaKey: React.CSSProperties = { fontSize: 17, color: "#8a5a2b" };
const metaVal: React.CSSProperties = { fontSize: 15, fontWeight: 700 };
const sectionLabel: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: 1,
  color: "#8a5a2b",
};

export default FarmPortfolio;
