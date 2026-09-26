// Everything the site says lives here. The home page, the case-study headers
// and the metadata all read from this file; the case-study prose lives in
// src/work/<slug>.mdx.

export const site = {
  name: "Harsh Sandhu",
  role: "Product engineer",
  url: "https://harshsandhu.com",
  email: "me@harshsandhu.com",
  description:
    "Product engineer with five years of experience. I take ideas from first sketch through architecture, launch and iteration.",
};

export type Product = {
  slug: string;
  name: string;
  pitch: string;
  url: string;
  domain: string;
  role: string;
  year: string;
  stack: string[];
  // 4 screens, in the order the hero cycles and the case study places them.
  shots: Shot[];
};

export type Shot = { src: string; caption: string };

export const products: Product[] = [
  {
    slug: "bandzen",
    name: "bandzen",
    pitch: "IELTS preparation that marks writing and speaking with AI and plans each study day.",
    url: "https://bandzen.com",
    domain: "bandzen.com",
    role: "Solo build",
    year: "2026",
    stack: ["Next.js", "Supabase", "Drizzle", "OpenAI", "Polar", "Turborepo"],
    shots: [
      { src: "/work/bandzen/landing.png", caption: "Landing page" },
      { src: "/work/bandzen/study-plan.png", caption: "Study plan dashboard" },
      { src: "/work/bandzen/writing-feedback.png", caption: "Writing feedback" },
      { src: "/work/bandzen/coach.png", caption: "Coach" },
    ],
  },
  {
    slug: "tinkersim",
    name: "tinkersim",
    pitch: "Learn electronics by building circuits in the browser and watching them run.",
    url: "https://tinkersim.com",
    domain: "tinkersim.com",
    role: "Solo build",
    year: "2026",
    stack: ["Next.js", "React Flow", "ngspice (WebAssembly)", "Cloudflare D1", "Drizzle", "Clerk"],
    shots: [
      { src: "/work/tinkersim/landing.png", caption: "Landing page" },
      { src: "/work/tinkersim/editor.png", caption: "Editor with a running circuit" },
      { src: "/work/tinkersim/waveforms.png", caption: "Waveform inspector" },
      { src: "/work/tinkersim/lessons.png", caption: "Lessons" },
    ],
  },
  {
    slug: "furbaby-board",
    name: "furbaby board",
    pitch: "A shared routine board so every pet in the house is fed once, not twice.",
    url: "https://furbabyboard.com",
    domain: "furbabyboard.com",
    role: "Solo build",
    year: "2026",
    stack: ["Next.js", "Expo", "Clerk", "Neon Postgres", "Drizzle", "MCP", "Alexa"],
    shots: [
      { src: "/work/furbaby-board/landing.png", caption: "Landing page" },
      { src: "/work/furbaby-board/board.png", caption: "Today board" },
      { src: "/work/furbaby-board/pet.png", caption: "Pet record" },
      { src: "/work/furbaby-board/reminders.png", caption: "Reminders and Alexa" },
    ],
  },
];

export type Role = { years: string; company: string; title: string; summary: string };

// The section hides itself when this is empty.
export const experience: Role[] = [
  {
    years: "2024 to now",
    company: "MagicEdtech",
    title: "Senior Software Engineer (contract)",
    summary:
      "Contracted to Spear Education, a continuing-education platform for dentists. I work across the React front end and the AWS GraphQL back end: self-service membership upgrades wired to NetSuite, CE credit tracking and certificates, the video player, study clubs, and product analytics.",
  },
];

export const howIWork =
  "I work across the whole product: the idea, the data model, the interface, the deploy, and the week after launch when real use shows what's wrong. I like small, clean architectures that keep the next change cheap, and I'd rather ship a narrow thing that works than a broad thing that almost does.";

export const stack = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Postgres",
  "Supabase",
  "Drizzle",
  "Tailwind CSS",
  "Rust",
  "AWS",
  "Vercel",
];

export const socials = [
  { name: "GitHub", url: "https://github.com/harshsandhu44" },
  { name: "LinkedIn", url: "https://www.linkedin.com/in/harshsandhu44" },
  { name: "X", url: "https://x.com/harshsandhu44" },
];

export const offTheClock = "Formula 1, football, astronomy, and more programming.";
