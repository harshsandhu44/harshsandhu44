// Content for the pixel-farm portfolio. Ported verbatim from the Claude Design
// project "Pixel Farm Portfolio" (ff464567-…), which seeded it from the GitHub
// profile README. This is the single source of truth: the game and the
// crawlable fallback (portfolio-fallback.tsx) both read from here.
//
// The tinkersim "season" and any "Lv / Year" flavor are filled in live from
// lib/farm-clock.ts by each consumer, not baked in here.

export type Project = {
  name: string;
  kind: string;
  desc: string;
  status: string;
  stack: string;
  season: string;
  url: string;
  sprite: string;
};

export const projects: Project[] = [
  {
    name: "gitpilot",
    kind: "Rust CLI",
    desc: "Rust CLI for daily Git workflow automation. The chore-doer of the farm: the small repetitive motions of a working day, folded into one command.",
    status: "Shipped",
    stack: "rust",
    season: "Perennial",
    url: "https://github.com/harshsandhu44/gitpilot",
    sprite: "url(sprites/seasons.png) -288px 0/704px 384px",
  },
  {
    name: "placehold",
    kind: "Developer tool",
    desc: "Placeholder image and text generator for developers. Fast filler so a layout can be judged before the real content exists.",
    status: "Shipped",
    stack: "typescript · next.js",
    season: "Spring",
    url: "https://github.com/harshsandhu44/placehold",
    sprite: "url(sprites/seasons.png) -352px 0/704px 384px",
  },
  {
    name: "tinkersim",
    kind: "Electronics learning + simulation",
    desc: "Electronics learning and simulation. An interactive system for building circuits and watching them behave, aimed at learning by tinkering.",
    status: "In season · current focus",
    stack: "typescript · react · simulation",
    season: "current focus", // card/fallback replace this with a live farm-clock label
    url: "https://github.com/harshsandhu44/tinkersim",
    sprite: "url(sprites/seasons.png) -416px -32px/704px 384px",
  },
  {
    name: "pac0",
    kind: "Generative animation",
    desc: "Pac-Man style contribution graph animation. A commit history, eaten one square at a time.",
    status: "Shipped",
    stack: "typescript · svg",
    season: "Summer",
    url: "https://github.com/harshsandhu44/pac0",
    sprite: "url(sprites/seasons.png) -384px 0/704px 384px",
  },
];

export const lines: string[] = [
  "Harsh looks up from a half-finished CLI tool, wipes his hands, and nods at you.",
  "I'm a Product Engineer working across full-stack product development, AI-powered applications, simulation systems, and consumer software.",
  "My work sits at the intersection of software engineering, product thinking, user experience, and modern infrastructure.",
  "I enjoy taking products from an early idea through architecture, implementation, deployment, and iteration.",
  "Anything you want to know? The plots out back are all open.",
];

export type Item = {
  tag: string;
  name: string;
  qty: string;
  color: string;
  desc: string;
};

export const items: Item[] = [
  {
    tag: "TS",
    name: "typescript",
    qty: "x9",
    color: "#2f74c0",
    desc: "Language · the default choice for product work.",
  },
  {
    tag: "JS",
    name: "javascript",
    qty: "x9",
    color: "#a8871f",
    desc: "Language · everywhere, still.",
  },
  {
    tag: "RS",
    name: "rust",
    qty: "x7",
    color: "#a3452f",
    desc: "Language · systems-oriented tooling and CLIs.",
  },
  {
    tag: "NX",
    name: "next.js",
    qty: "x8",
    color: "#2b1d16",
    desc: "Framework · full-stack product surfaces.",
  },
  {
    tag: "RE",
    name: "react",
    qty: "x9",
    color: "#2f7a8a",
    desc: "Framework · interactive interfaces.",
  },
  {
    tag: "TW",
    name: "tailwind",
    qty: "x8",
    color: "#2f8a9c",
    desc: "Styling · fast, consistent UI.",
  },
  {
    tag: "DK",
    name: "docker",
    qty: "x6",
    color: "#2f74c0",
    desc: "Infra · reproducible environments.",
  },
  { tag: "AWS", name: "aws", qty: "x6", color: "#8a5a2b", desc: "Infra · deployment and hosting." },
  {
    tag: "—",
    name: "empty",
    qty: "",
    color: "#b9a888",
    desc: "Empty slot. Room for the next thing.",
  },
  {
    tag: "—",
    name: "empty",
    qty: "",
    color: "#b9a888",
    desc: "Empty slot. Room for the next thing.",
  },
];

export type Branch = { name: string; nodes: string[]; focus: string[] };

export const branches: Branch[] = [
  { name: "PRODUCT", nodes: ["product thinking", "architecture", "iteration"], focus: [] },
  { name: "WEB", nodes: ["full-stack", "user experience", "consumer software"], focus: [] },
  {
    name: "SYSTEMS",
    nodes: ["rust tooling", "modern infrastructure", "clean architecture"],
    focus: ["rust tooling", "clean architecture"],
  },
  {
    name: "SIMULATION",
    nodes: ["interactive systems", "electronics sim", "AI-powered apps"],
    focus: ["electronics sim"],
  },
];

export type Social = {
  name: string;
  handle: string;
  url: string;
  icon: string;
  fg: string;
  fallback: string;
};

export const socials: Social[] = [
  {
    name: "GitHub",
    handle: "harshsandhu44",
    url: "https://github.com/harshsandhu44",
    icon: "#2b1d16",
    fg: "#f7e7c3",
    fallback: "GH",
  },
  {
    name: "LinkedIn",
    handle: "in/harshsandhu44",
    url: "https://www.linkedin.com/in/harshsandhu44",
    icon: "url(sprites/social.png) -400px 0/480px 80px",
    fg: "#2b1d16",
    fallback: "",
  },
  {
    name: "X",
    handle: "@harshsandhu44",
    url: "https://x.com/harshsandhu44",
    icon: "url(sprites/social.png) -160px 0/480px 80px",
    fg: "#2b1d16",
    fallback: "",
  },
  {
    name: "Email",
    handle: "say hello",
    url: "mailto:me@harshsandhu.com",
    icon: "#8ed14f",
    fg: "#2b1d16",
    fallback: "@",
  },
];

export type Quest = { title: string; objective: string; reward: string };

export const quests: Quest[] = [
  {
    title: "Build TinkerSim",
    objective: "electronics learning + simulation",
    reward: "a tool people learn from",
  },
  {
    title: "Sharpen Rust",
    objective: "rust and systems-oriented tooling",
    reward: "faster, smaller, sturdier",
  },
  {
    title: "Keep the architecture clean",
    objective: "clean product architecture",
    reward: "changes stay cheap",
  },
];

export const done: { title: string; objective: string }[] = [
  { title: "gitpilot", objective: "rust CLI for daily git workflow automation" },
  { title: "placehold", objective: "placeholder image and text generator" },
  { title: "pac0", objective: "pac-man contribution graph animation" },
];

export const interests = "formula 1 · football · astronomy · programming";

// EmanuelleDev asset-pack license requires visible credit wherever the art ships.
export const artCredit = {
  text: "Farm art by EmanuelleDev",
  url: "https://emanuelledev.itch.io",
};

// --- world geometry (only the game uses these) ---
//
// The world is WORLD_W×WORLD_H (see farm-portfolio.tsx). A dirt crossroads
// splits it into four zones that all front the path: farmhouse yard (NW),
// barn + animal pen (NE), fenced project field (SW), village square (SE).
// Coordinates were tuned against screenshots — nudge them, not the structure.

export const WORLD_W = 1920;
export const WORLD_H = 1200;

// Buildings are whole-image sprites from the Farm RPG Tiny Asset Pack, built by
// scripts/build-sprites.sh. `l/t/w/h` is the on-screen rect in world space;
// `solids` below carries the matching walk blockers (walls only, so you can
// stand under an eave). Sprite refs are bare `sprites/…` — `S()` rewrites them.
export type Building = { id: string; sprite: string; l: number; t: number; w: number; h: number };

export const buildings: Building[] = [
  { id: "house", sprite: "sprites/house.png", l: 430, t: 170, w: 224, h: 168 },
  { id: "barn", sprite: "sprites/barn.png", l: 1120, t: 180, w: 170, h: 166 },
  { id: "greenhouse", sprite: "sprites/greenhouse.png", l: 1330, t: 180, w: 126, h: 168 },
  { id: "silo", sprite: "sprites/silo.png", l: 1500, t: 208, w: 70, h: 132 },
  { id: "board", sprite: "sprites/noticeboard.png", l: 1004, t: 664, w: 38, h: 42 },
  { id: "mailbox", sprite: "sprites/mailbox.png", l: 574, t: 492, w: 20, h: 32 },
  { id: "chest", sprite: "sprites/chest.png", l: 676, t: 300, w: 45, h: 42 },
];

// decorative village cottages + shopfront — backdrop only, no interaction
export const cottages = [
  { sprite: "sprites/cottage-a.png", l: 1044, t: 690, w: 125, h: 88 },
  { sprite: "sprites/cottage-b.png", l: 1226, t: 680, w: 125, h: 88 },
  { sprite: "sprites/shop.png", l: 1558, t: 700, w: 72, h: 95 },
];

// decorative trees (no collision — the farmer walks behind them)
export const trees = [
  { sprite: "sprites/tree-pine.png", l: 40, t: 60, w: 68, h: 92 },
  { sprite: "sprites/tree-pine.png", l: 60, t: 1060, w: 68, h: 92 },
  { sprite: "sprites/tree-pine.png", l: 1820, t: 120, w: 68, h: 92 },
  { sprite: "sprites/tree-pine.png", l: 1840, t: 1040, w: 68, h: 92 },
  { sprite: "sprites/tree-maple.png", l: 300, t: 60, w: 44, h: 68 },
  { sprite: "sprites/tree-maple.png", l: 780, t: 70, w: 44, h: 68 },
  { sprite: "sprites/tree-maple.png", l: 1720, t: 560, w: 44, h: 68 },
];

// dirt/brick path rects, rendered under everything as a tiled sprite
export type PathRect = { l: number; t: number; w: number; h: number };
export const paths: PathRect[] = [
  { l: 0, t: 552, w: 1920, h: 96 }, // horizontal road, full width
  { l: 896, t: 0, w: 96, h: 1200 }, // vertical road, full height
  { l: 1000, t: 648, w: 700, h: 300 }, // village-square plaza (SE)
  { l: 512, t: 340, w: 52, h: 216 }, // spur: farmhouse door → road
  { l: 1184, t: 340, w: 52, h: 216 }, // spur: barn door → road
  { l: 406, t: 636, w: 64, h: 116 }, // spur: road → project-field gate
];

// wooden fence runs. `dir` "h" tiles left→right, "v" tiles top→down. Collision
// boxes are derived (see fenceSolids) so the farmer can't cross a rail.
export type Fence = { l: number; t: number; len: number; dir: "h" | "v" };
export const fences: Fence[] = [
  // project field (SW) — north edge split for a gate at x 400–480
  { l: 150, t: 740, len: 250, dir: "h" },
  { l: 480, t: 740, len: 224, dir: "h" },
  { l: 150, t: 1124, len: 554, dir: "h" },
  { l: 150, t: 740, len: 384, dir: "v" },
  { l: 688, t: 740, len: 400, dir: "v" },
  // animal pen (NE) — closed rectangle east of the barn spur
  { l: 1330, t: 360, len: 240, dir: "h" },
  { l: 1330, t: 520, len: 240, dir: "h" },
  { l: 1330, t: 360, len: 176, dir: "v" },
  { l: 1554, t: 360, len: 176, dir: "v" },
];

export const fenceSolids = fences.map((f) =>
  f.dir === "h" ? { x: f.l, y: f.t + 4, w: f.len, h: 8 } : { x: f.l + 4, y: f.t, w: 8, h: f.len },
);

export const solids = [
  { x: 452, y: 250, w: 180, h: 78 }, // house walls
  { x: 1128, y: 262, w: 150, h: 78 }, // barn walls
  { x: 1338, y: 262, w: 106, h: 78 }, // greenhouse
  { x: 1506, y: 268, w: 58, h: 58 }, // silo
  { x: 1006, y: 684, w: 34, h: 20 }, // notice board
  { x: 576, y: 518, w: 22, h: 20 }, // mailbox
  { x: 678, y: 320, w: 40, h: 22 }, // chest
  { x: 1326, y: 856, w: 56, h: 36 }, // fountain base
  { x: 1048, y: 736, w: 118, h: 46 }, // cottage a
  { x: 1230, y: 726, w: 118, h: 46 }, // cottage b
  { x: 1560, y: 742, w: 70, h: 48 }, // shop
  { x: 1540, y: 880, w: 44, h: 26 }, // market stall
];

export type Spot = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  act: string;
};

export const spots: Spot[] = [
  { id: "house", x: 476, y: 392, w: 100, h: 46, label: "Knock on the door", act: "dialogue" },
  { id: "barn", x: 1156, y: 396, w: 88, h: 40, label: "Read the quest board", act: "quests" },
  { id: "chest", x: 672, y: 334, w: 56, h: 28, label: "Open the chest", act: "bag" },
  { id: "board", x: 990, y: 692, w: 62, h: 30, label: "Study the skill tree", act: "skills" },
  { id: "mail", x: 560, y: 506, w: 52, h: 30, label: "Check the mailbox", act: "social" },
  { id: "p0", x: 170, y: 760, w: 230, h: 150, label: "gitpilot", act: "proj0" },
  { id: "p1", x: 430, y: 760, w: 230, h: 150, label: "placehold", act: "proj1" },
  { id: "p2", x: 170, y: 950, w: 230, h: 150, label: "tinkersim", act: "proj2" },
  { id: "p3", x: 430, y: 950, w: 230, h: 150, label: "pac0", act: "proj3" },
];

// Flavour NPCs — talk with E, reuse the typewriter dialogue. NO portfolio facts
// (project names, tools, contact) so portfolio-fallback.tsx still covers those.
export type Npc = {
  id: string;
  sprite: string; // 4-frame front strip, 32px cells (128x32)
  portrait: string; // 64x64 dialogue bust
  name: string; // dialogue name tag
  label: string; // interact-bubble text
  x: number;
  y: number; // feet, world coords (x is the start for pacers)
  w: number;
  h: number; // collision box
  face: 1 | -1;
  walkFps: number; // sprite frames per second
  lines: string[];
  pace?: { from: number; to: number; speed: number }; // world px, px/s
};

export const npcs: Npc[] = [
  {
    id: "neighbour",
    sprite: "sprites/npc-neighbour.png",
    portrait: "sprites/portrait-neighbour.png",
    name: "Odell · the next farm over",
    label: "Talk to Odell",
    x: 486,
    y: 700,
    w: 22,
    h: 10,
    face: 1,
    walkFps: 4,
    lines: [
      "Morning. Your plots are coming in nicer than mine this year — don't tell anyone I said so.",
      "Rain's due Thursday. Good week to let things sit and grow on their own.",
      "Stop by when the greenhouse is warm. Always room for one more cup of coffee.",
    ],
  },
  {
    id: "kid",
    sprite: "sprites/npc-kid.png",
    portrait: "sprites/portrait-kid.png",
    name: "Pip",
    label: "Talk to Pip",
    x: 1210,
    y: 918,
    w: 16,
    h: 8,
    face: 1,
    walkFps: 8,
    pace: { from: 1210, to: 1440, speed: 44 },
    lines: [
      "You walked the whole crossroads? I can do it in twelve seconds. Watch.",
      "The fountain ate my coin. I'm pretty sure it owes me a wish now.",
      "If you see a brown dog around here, he's mine. Sort of. He decides.",
    ],
  },
  {
    id: "shopkeeper",
    sprite: "sprites/npc-shopkeeper.png",
    portrait: "sprites/portrait-shopkeeper.png",
    name: "Gaston · market cart",
    label: "Talk to Gaston",
    x: 1556,
    y: 900,
    w: 22,
    h: 10,
    face: -1,
    walkFps: 4,
    lines: [
      "Fresh off the cart, still warm. First one's on the house for a new face.",
      "I set up here every market day. The fountain's good company and the light's better.",
      "Take your time looking around — the square's the best part of this whole farm.",
    ],
  },
];
