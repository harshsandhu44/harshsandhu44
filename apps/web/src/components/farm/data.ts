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

export const solids = [
  { x: 140, y: 190, w: 300, h: 132 },
  { x: 1120, y: 190, w: 330, h: 152 },
  { x: 1180, y: 660, w: 88, h: 54 },
  { x: 1030, y: 756, w: 352, h: 184 },
  { x: 876, y: 376, w: 76, h: 96 },
  { x: 692, y: 424, w: 48, h: 76 },
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
  { id: "house", x: 250, y: 300, w: 80, h: 40, label: "Knock on the door", act: "dialogue" },
  { id: "barn", x: 1235, y: 320, w: 100, h: 40, label: "Read the quest board", act: "quests" },
  { id: "chest", x: 1180, y: 714, w: 88, h: 30, label: "Open the chest", act: "bag" },
  { id: "board", x: 876, y: 472, w: 76, h: 30, label: "Study the skill tree", act: "skills" },
  { id: "mail", x: 692, y: 500, w: 48, h: 26, label: "Check the mailbox", act: "social" },
  { id: "p0", x: 170, y: 600, w: 230, h: 160, label: "gitpilot", act: "proj0" },
  { id: "p1", x: 430, y: 600, w: 230, h: 160, label: "placehold", act: "proj1" },
  { id: "p2", x: 170, y: 800, w: 230, h: 160, label: "tinkersim", act: "proj2" },
  { id: "p3", x: 430, y: 800, w: 230, h: 160, label: "pac0", act: "proj3" },
];
