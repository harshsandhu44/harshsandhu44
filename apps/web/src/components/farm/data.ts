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

// Buildings are whole-image sprites from the Farm RPG Tiny Asset Pack, built by
// scripts/build-sprites.sh. `l/t/w/h` is the on-screen rect in world space;
// `solids` below carries the matching walk blockers (walls only, so you can
// stand under an eave). Sprite refs are bare `sprites/…` — `S()` rewrites them.
export type Building = { id: string; sprite: string; l: number; t: number; w: number; h: number };

export const buildings: Building[] = [
  { id: "house", sprite: "sprites/house.png", l: 176, t: 150, w: 224, h: 168 },
  { id: "barn", sprite: "sprites/barn.png", l: 1150, t: 150, w: 170, h: 166 },
  { id: "greenhouse", sprite: "sprites/greenhouse.png", l: 1030, t: 756, w: 126, h: 168 },
  { id: "silo", sprite: "sprites/silo.png", l: 1210, t: 792, w: 70, h: 132 },
  { id: "board", sprite: "sprites/noticeboard.png", l: 872, t: 352, w: 60, h: 66 },
  { id: "mailbox", sprite: "sprites/mailbox.png", l: 686, t: 428, w: 48, h: 48 },
  { id: "chest", sprite: "sprites/chest.png", l: 1174, t: 666, w: 50, h: 50 },
];

// decorative trees (no collision — the farmer walks behind them)
export const trees = [
  { sprite: "sprites/tree-pine.png", l: 60, t: 350, w: 68, h: 92 },
  { sprite: "sprites/tree-pine.png", l: 40, t: 892, w: 68, h: 92 },
  { sprite: "sprites/tree-pine.png", l: 1476, t: 118, w: 68, h: 92 },
  { sprite: "sprites/tree-maple.png", l: 556, t: 120, w: 44, h: 68 },
  { sprite: "sprites/tree-maple.png", l: 980, t: 86, w: 44, h: 68 },
  { sprite: "sprites/tree-maple.png", l: 1500, t: 636, w: 44, h: 68 },
];

export const solids = [
  { x: 200, y: 250, w: 176, h: 66 }, // house walls
  { x: 1164, y: 236, w: 142, h: 72 }, // barn walls
  { x: 1044, y: 850, w: 100, h: 72 }, // greenhouse
  { x: 1216, y: 862, w: 60, h: 58 }, // silo
  { x: 876, y: 386, w: 50, h: 28 }, // notice board
  { x: 690, y: 450, w: 40, h: 24 }, // mailbox
  { x: 1180, y: 690, w: 40, h: 24 }, // chest
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
  { id: "house", x: 256, y: 306, w: 64, h: 34, label: "Knock on the door", act: "dialogue" },
  { id: "barn", x: 1200, y: 292, w: 66, h: 34, label: "Read the quest board", act: "quests" },
  { id: "chest", x: 1172, y: 708, w: 54, h: 28, label: "Open the chest", act: "bag" },
  { id: "board", x: 868, y: 410, w: 66, h: 26, label: "Study the skill tree", act: "skills" },
  { id: "mail", x: 682, y: 468, w: 56, h: 24, label: "Check the mailbox", act: "social" },
  { id: "p0", x: 170, y: 600, w: 230, h: 160, label: "gitpilot", act: "proj0" },
  { id: "p1", x: 430, y: 600, w: 230, h: 160, label: "placehold", act: "proj1" },
  { id: "p2", x: 170, y: 800, w: 230, h: 160, label: "tinkersim", act: "proj2" },
  { id: "p3", x: 430, y: 800, w: 230, h: 160, label: "pac0", act: "proj3" },
];
