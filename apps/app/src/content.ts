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
  image: string;
};

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
    image: "/work/bandzen.png",
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
    image: "/work/tinkersim.png",
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
    image: "/work/furbaby-board.png",
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
