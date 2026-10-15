// Everything the site says lives here: the home page, the case studies and the metadata all read
// from this file.

export const site = {
  name: "Harsh Sandhu",
  role: "Product engineer",
  url: "https://harshsandhu.com",
  email: "me@harshsandhu.com",
  linkedin: "https://www.linkedin.com/in/harshsandhu95",
  description:
    "Product engineer with five years of experience. I take ideas from first sketch through architecture, launch and iteration.",
};

export const mailto = (subject: string) =>
  `mailto:${site.email}?subject=${encodeURIComponent(subject)}`;

export type Shot = { src: string; cap: string };

export type Product = {
  slug: string;
  name: string;
  // One line, used by the case-study header and the metadata.
  pitch: string;
  url: string;
  domain: string;
  role: string;
  year: string;
  stack: string[];
  // Home work list.
  kind: string;
  desc: string;
  card: { src: string; alt: string; cap: string };
  // Case study.
  hero: { src: string; alt: string };
  tldr: { k: string; v: string }[];
  nums: { n: string; l: string }[];
  problem: string[];
  problemShot: Shot;
  builtIntro?: string;
  built: string[];
  builtOutro: string[];
  decisions: { h: string; p: string; shot?: Shot }[];
  next: string;
};

// In this order on the home page, and the "Next case study" loop follows it.
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
    kind: "IELTS prep, 2026",
    desc: "IELTS prep that uses AI to mark writing and speaking, and plans each study day.",
    card: {
      src: "/work/bandzen/writing-feedback.png",
      alt: "bandzen writing report showing a band 7.5 estimate and a score for each criterion",
      cap: "bandzen, the writing report with an estimate for each criterion.",
    },
    hero: {
      src: "/work/bandzen/landing.png",
      alt: "bandzen landing page with a sample band estimate across all four modules",
    },
    tldr: [
      {
        k: "What it is",
        v: "Marks all four IELTS modules on demand, explains what is holding each one back, and turns that into a study plan for the day.",
      },
      {
        k: "Hardest part",
        v: "Grading writing and speaking honestly: writing against the band descriptors with validated, half-band output, speaking from the audio itself, and every result labelled an estimated band.",
      },
      {
        k: "Where it is now",
        v: "Live and paid, about four weeks after the first commit. PTE, TOEFL and DET are next.",
      },
    ],
    nums: [
      { n: "4", l: "IELTS modules marked on demand" },
      { n: "5", l: "apps in one Turborepo, each deployed separately" },
      { n: "40", l: "lessons in the curriculum" },
      { n: "4 wks", l: "from first commit to a live, paid product" },
    ],
    problem: [
      "Most IELTS candidates practise a lot and still don't know why their band won't move. Reading and Listening are easy to self-mark. Writing and Speaking are where scores stall, and getting them marked against the band descriptors usually means paying a tutor and waiting.",
      "bandzen marks all four modules on demand, explains what is holding each one back, and turns that into a study plan for the day.",
    ],
    problemShot: { src: "/work/bandzen/study-plan.png", cap: "Study plan dashboard" },
    builtIntro: "bandzen is a Turborepo monorepo with five apps that deploy separately:",
    built: [
      "The product (app.bandzen.com): a four-skill diagnostic, practice engines for every module, a full mock test, a 40-lesson curriculum, a study plan you can skip, move, pause and replan, progress charts, and an AI coach.",
      "A CMS for writing and publishing content, with a draft workflow, JSON import and a daily job that generates a draft and its listening audio.",
      "A staff app for institutions: cohorts, assignments, reports and seat billing.",
      "The marketing site and the docs.",
    ],
    builtOutro: [
      "Shared packages hold the database layer, the AI runtime (with one usage table for cost tracking), pricing and an exam registry that already describes PTE, TOEFL and DET alongside IELTS.",
      "It went from first commit to a live, paid product in about four weeks.",
    ],
    decisions: [
      {
        h: "Data isolation lives in code, not in database policies",
        p: "The browser holds no database credentials at all. One module is allowed to import the database client, and every query that touches a user's data takes the user id as its first argument. That puts the whole isolation story in a single file a reviewer can read in one sitting. Answer keys sit in their own table so a careless query can never leak them.",
        shot: { src: "/work/bandzen/writing-feedback.png", cap: "Writing feedback" },
      },
      {
        h: "Mark what you can with code, and the rest with evidence",
        p: "Reading and Listening are scored by plain, tested functions. Writing is graded against the band descriptors with validated structured output, clamped to half-band steps, and runs after the response is sent so a candidate can close the tab. Speaking is graded from the audio itself, so fluency and pronunciation come from what was said rather than a transcript. Every result is labelled an estimated band.",
      },
      {
        h: "Derive, don't store",
        p: "There are no summary tables. The study plan, trends and insights are recomputed from attempts on every read. A stored plan and the attempt behind it can drift apart. A derived one can't.",
        shot: { src: "/work/bandzen/coach.png", cap: "Coach" },
      },
      {
        h: "Access is one date comparison",
        p: "A candidate is Pro when their paid period ends in the future. Cancellations, payment retries and comped accounts all fall out of that without special cases. Only the expensive things (AI marking and coach messages) are metered. Reading stays unlimited, because that's the habit that turns into a paying candidate.",
      },
    ],
    next: "Expanding beyond IELTS to PTE, TOEFL and DET, which the exam registry was built for. PTE scoring already exists behind a feature flag. The speaking grader also has to move to new audio models before the current ones are retired in January 2027.",
  },
  {
    slug: "pitwall",
    name: "pitwall",
    pitch:
      "A Formula 1 dashboard for live timing, race weekends and replays of every session since 2023.",
    url: "https://f1.harshsandhu.com",
    domain: "f1.harshsandhu.com",
    role: "Solo build",
    year: "2026",
    stack: ["Next.js", "Cloudflare Workers", "Durable Objects", "D1", "OpenF1", "MapLibre"],
    kind: "Formula 1 dashboard, 2026",
    desc: "Live timing, race weekends and replays of every session since 2023.",
    card: {
      src: "/work/pitwall/replay.png",
      alt: "pitwall session replay with the track map and the live timing table",
      cap: "pitwall, a session replay with the track map and timing.",
    },
    hero: {
      src: "/work/pitwall/home.png",
      alt: "pitwall home with a countdown to the United States Grand Prix and the session schedule",
    },
    tldr: [
      {
        k: "What it is",
        v: "Live timing, race weekends and replays of every Formula 1 session since 2023, in one dashboard.",
      },
      {
        k: "Hardest part",
        v: "Live data for every viewer on free tiers: one Durable Object holds the only live connection, through an MQTT client I wrote for Workers.",
      },
      { k: "Where it is now", v: "Live at f1.harshsandhu.com. Car telemetry in replay is next." },
    ],
    nums: [
      { n: "2023", l: "every session since can be replayed" },
      { n: "1", l: "shared live connection, however many people watch" },
      { n: "~2,400", l: "Worker requests for one viewer through a two-hour race" },
      { n: "100,000", l: "free Worker requests a day, the limit it runs within" },
    ],
    problem: [
      "Following a Formula 1 weekend means hopping between a timing screen, a weather site, a standings table and a results archive. I wanted all of it in one place, and I wanted it to cost nothing to run.",
      "pitwall is that place. It shows the next weekend with a countdown and the weather at the circuit, live timing while a session is on track, and a replay of any session since 2023 on the same dashboard. It runs entirely on free tiers plus an OpenF1 sponsor account.",
    ],
    problemShot: { src: "/work/pitwall/replay.png", cap: "Session replay" },
    built: [
      "A static Next.js app with home, live, calendar, standings, race-weekend, driver, team and replay pages. Every page takes a query parameter for the season instead of a path segment, so the whole site stays a plain static export.",
      "A Cloudflare Worker API that fetches from OpenF1, Jolpica, Open-Meteo and RainViewer, validates and normalizes the data, and returns one response envelope that says whether the data is fresh, stale or unavailable, and why.",
      "Live timing with a timing tower, race-control messages, track weather and a track map with cars moving smoothly between polls.",
      "Session replay with playback controls and driver comparison, on the same panels as live.",
      "Race-weekend weather: observed radar, a cloud and wind map, and a forecast for each session.",
      "A dashboard of panels you can drag, resize and hide, with a menu for keyboard and touch users and layouts saved in the browser.",
    ],
    builtOutro: [],
    decisions: [
      {
        h: "One shared live connection",
        p: "OpenF1 streams live data over MQTT. Rather than have each visitor connect, a single Durable Object holds the only connection: it opens when the first person asks for live data, loads the session so far, applies messages as they arrive, and disconnects two minutes after the last request. mqtt.js doesn't run on Workers, so I wrote a minimal MQTT 3.1.1 client for it. One viewer polling through a two-hour race costs about 2,400 Worker requests, against a free limit of 100,000 a day.",
        shot: { src: "/work/pitwall/standings.png", cap: "Standings" },
      },
      {
        h: "Always serve a last good copy",
        p: "The Workers cache is per data centre, so every successful upstream response is also written to D1. A cache miss checks D1 before calling the upstream, and an expired copy is served straight away, marked stale, while a fresh one is fetched in the background. Each upstream gets refreshed about once per freshness window worldwide, and a request only waits on an upstream when no copy exists at all.",
      },
      {
        h: "Live and replay share one engine",
        p: "Live timing builds its timing tower with the same functions as replay, so the two can't disagree. Replays load car positions in 60-second windows with a second of overlap at each end, so interpolation never needs a neighbouring window. The browser keeps the current window and the next two. Cars are only interpolated between samples less than a second apart; past that they're shown as stale rather than guessed.",
        shot: { src: "/work/pitwall/calendar.png", cap: "Calendar" },
      },
      {
        h: "Move off Jolpica for 2023 onward",
        p: "Jolpica limits requests by IP, and every Worker reaches it from the same shared Cloudflare IP, so the deployed API was often refused. Everything from 2023 on now comes from OpenF1, broken into small units that are cached separately. Jolpica only fills older seasons, on demand. I checked the 2026 standings, points progression and wins against Jolpica, and they're identical.",
      },
    ],
    next: "Accessibility scored 100 in Lighthouse before the October redesign, and the audit needs re-running. After that comes car telemetry in replay: speed, throttle and brake traces for the driver comparison.",
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
    kind: "Electronics in the browser, 2026",
    desc: "Learn electronics by building a circuit and watching it run.",
    card: {
      src: "/work/tinkersim/editor.png",
      alt: "tinkersim circuit editor with a battery, a resistor and a red LED wired together",
      cap: "tinkersim, a battery, a resistor and an LED in the editor.",
    },
    hero: {
      src: "/work/tinkersim/landing.png",
      alt: "tinkersim landing page: build circuits, simulate reality",
    },
    tldr: [
      {
        k: "What it is",
        v: "A circuit simulator in the browser with 38 components and 38 guided lessons. Nothing to install.",
      },
      {
        k: "Hardest part",
        v: "Keeping a real SPICE engine from freezing a learner's tab: pre-flight checks, resets after a crash, and finally moving simulation to a server route.",
      },
      {
        k: "Where it is now",
        v: "Live at tinkersim.com, with organisation accounts. Microcontroller support is next.",
      },
    ],
    nums: [
      { n: "38", l: "components: 20 analog and 18 digital" },
      { n: "38", l: "lessons in seven categories" },
      { n: "338", l: "commits, with releases managed automatically" },
      { n: "3 mo", l: "to land those 338 commits" },
    ],
    problem: [
      "To simulate a circuit properly you normally install a desktop SPICE tool, and those tools are hostile to beginners. Students and hobbyists want to put a resistor next to an LED, press run, and see what happens.",
      "tinkersim is a circuit simulator in the browser. You drag components onto a canvas, wire them up, and see voltage, current, power and logic states with nothing to install. Guided lessons turn it into a learning path that schools and clubs can manage.",
    ],
    problemShot: { src: "/work/tinkersim/editor.png", cap: "Editor with a running circuit" },
    built: [
      "A canvas editor on React Flow with 38 components: 20 analog (from resistors to transistors, op-amps and regulators) and 18 digital (gates, flip-flops, counters, a seven-segment display). Wires route themselves around parts with an A* router.",
      "An analog engine that turns the drawing into a SPICE netlist, runs it on ngspice compiled to WebAssembly, and reports results in plain language. When a circuit would burn out a part, the part is flagged, and raw simulator errors become steps to fix them.",
      "A digital engine with three-state logic, edge-triggered flip-flops and cycle detection, which re-runs a moment after every edit.",
      "An inspector with waveform charts and a probe panel for watching up to five parts at once.",
      "38 lessons in seven categories, each with a starter circuit, objectives and a hint, plus organisation accounts with member management and per-organisation component permissions.",
    ],
    builtOutro: ["That was 338 commits over three months, with releases managed automatically."],
    decisions: [
      {
        h: "Move the simulator off the user's tab",
        p: "ngspice first ran in the browser. A malformed circuit could freeze the tab or leave the engine in a dead state, so I added a pre-flight check for problems like missing power or floating pins, and reset the engine after a crash. Later I moved simulation to an authenticated server route that runs one job at a time. That took the WebAssembly out of the client bundle entirely.",
        shot: { src: "/work/tinkersim/waveforms.png", cap: "Waveform inspector" },
      },
      {
        h: "Two engines side by side, not one co-simulation",
        p: "Each circuit is classified as analog, digital or mixed, and the right engine or engines run. Wires that cross between the two domains aren't simulated as a coupled signal. The editor warns about them instead. Coupling them properly is far harder, and learners get more from an honest warning than from a result that is quietly wrong.",
      },
      {
        h: "Save often, write rarely",
        p: "Autosave hashes only the parts of a circuit that matter (not what's selected or being dragged), debounces for three seconds with a thirty-second ceiling, and saves when the tab is hidden or closed. Storage later moved to Cloudflare D1 with a server-side write limit per project.",
      },
      {
        h: "Share links need no backend",
        p: "A shared circuit is compressed into the URL itself and validated when it's opened. Anyone can send a working circuit in a chat message, and a read-only embed lets teachers put one on a web page.",
        shot: { src: "/work/tinkersim/lessons.png", cap: "Lessons" },
      },
    ],
    next: "Microcontroller support is the big one. An Arduino prototype was built and then pulled until it's solid. After that: exporting SPICE files, assignment links that fork a circuit for each student, and an assistant that explains why a circuit behaves the way it does.",
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
    kind: "Pet routines, 2026",
    desc: "A shared routine board, so each pet is fed once, not twice.",
    card: {
      src: "/work/furbaby-board/board.png",
      alt: "furbaby board showing today's walks and meals for one dog",
      cap: "furbaby board, today for one dog.",
    },
    hero: {
      src: "/work/furbaby-board/landing.png",
      alt: "furbaby board landing page: nobody forgets, nobody double-feeds",
    },
    tldr: [
      {
        k: "What it is",
        v: "A shared board of what every pet in the house needs today, ticked off by whoever does it.",
      },
      {
        k: "Hardest part",
        v: "No double feeds when two people tap at once: a unique index lets the database decide who got there first, and every client calls the same rules.",
      },
      {
        k: "Where it is now",
        v: "Live on the web, Android, Alexa and AI assistants. A redesigned app shell is in progress.",
      },
    ],
    nums: [
      { n: "4", l: "clients on one set of rules: web, Android, MCP and Alexa" },
      { n: "15 min", l: "between runs of the reminder worker" },
      { n: "14 days", l: "of done, skipped and missed items on every pet record" },
      { n: "2", l: "payment rails: Razorpay on the web, Google Play in the app" },
    ],
    problem: [
      'In a house with pets, care is shared, and shared tasks get done zero times or twice. "Did anyone already feed Milo?" gets asked in the group chat every morning.',
      "furbaby board is a shared list of what's due today. You set the routine once: breakfast at 07:00, a walk at 08:30, thyroid meds at noon. Everyone in the household sees the same board, and each tick is signed with a name and a time. Care history builds up as a side effect.",
    ],
    problemShot: { src: "/work/furbaby-board/board.png", cap: "Today board" },
    built: [
      "A Next.js web app with the board, pets, household and plan screens, onboarding, and a printable care sheet for each pet.",
      "An Android app in Expo that talks to the same REST API and sends push reminders.",
      "Pet records: weights, vet visits, a 14-day grid of done, skipped and missed items, and minimum spacing between doses of a medicine.",
      "Reminders sent as web and mobile push by a scheduled worker every fifteen minutes.",
      'An MCP server so AI assistants can read the board and tick things off, and an Alexa skill so "Alexa, I fed Milo" works with your hands full.',
      "Subscriptions on two payment rails: Razorpay on the web and Google Play in the app.",
    ],
    builtOutro: [],
    decisions: [
      {
        h: "Expand recurrence at read time",
        p: "Routines store a recurrence rule and a clock time, and today's list is computed on every request. Nothing needs backfilling, and because the expansion only deals in dates, 07:00 stays 07:00 across daylight-saving changes. The 14-day history replays the rule backwards, so a missed day can be told apart from a day the routine never ran, without storing anything extra.",
        shot: { src: "/work/furbaby-board/pet.png", cap: "Pet record" },
      },
      {
        h: "Let the database settle races",
        p: "A unique index on routine and date means that if two people tap the same item at the same moment, the second one is told who got there first. No double feeds, enforced by the database rather than by hoping the UI stays in sync.",
        shot: { src: "/work/furbaby-board/reminders.png", cap: "Reminders and Alexa" },
      },
      {
        h: "One rule, every client",
        p: "The web app, the mobile API, the MCP tools and the Alexa skill all call the same functions. Household ownership checks and the no-double-tick rule are written once. Where a client can't be sure which household you mean (an assistant token belongs to a person, not a household), the tools refuse rather than guess.",
      },
      {
        h: "Voice should ask when it isn't sure",
        p: '"I fed Milo" ticks the item closest to now. If two doses are outstanding, Alexa asks which one, because a wrong tick would shift the spacing of the next dose.',
      },
    ],
    next: "A redesigned app shell is in progress, with a Today dashboard of one-tap tiles that reuse the Alexa logic for picking the right item, and free-text observations for noting how a pet is doing.",
  },
];

// Small things without a case study; shown as the last, full-width card in the work list.
export const tools = [
  {
    name: "muxx",
    kind: "Rust CLI",
    desc: "Opens or reattaches a tmux session for a project in one command.",
    stack: "Rust, tmux",
    url: "https://github.com/harshsandhu44/muxx",
    label: "Source on GitHub",
    bar: "~/code  ·  zsh",
    cap: "muxx, one command per project.",
  },
];

// "Shipped, not mocked up": figure a, b, c, d of the gallery grid, in that order.
export const gallery = [
  {
    domain: "tinkersim.com",
    src: "/work/tinkersim/waveforms.png",
    alt: "tinkersim charging a capacitor, with the voltage curve plotted in the inspector",
    cap: "tinkersim runs ngspice in the browser, so the waveform is the real simulation.",
    pos: "left top",
  },
  {
    domain: "furbabyboard.com",
    src: "/work/furbaby-board/pet.png",
    alt: "furbaby board routine list for one dog, with times for walks and meals",
    cap: "furbaby board, one pet's routine.",
    pos: "4% top",
  },
  {
    domain: "bandzen.com",
    src: "/work/bandzen/study-plan.png",
    alt: "bandzen study plan with an estimated band and today's practice tasks",
    cap: "bandzen plans the day around the band you need.",
    pos: "34% top",
  },
  {
    domain: "f1.harshsandhu.com",
    src: "/work/pitwall/home.png",
    alt: "pitwall home with a countdown to the United States Grand Prix and the session schedule",
    cap: "pitwall counts down to the next session in your own time zone.",
    pos: "left top",
  },
];

export const howIWork = [
  { word: "idea", detail: "worth building, or not" },
  { word: "data model", detail: "small and clean" },
  { word: "interface", detail: "the part people touch" },
  { word: "deploy", detail: "narrow, and working" },
  { word: "iterate", detail: "after launch, not instead" },
];

export const facts = [
  { k: "Role", v: "Product engineer" },
  { k: "Experience", v: "Five years" },
  { k: "Based in", v: "India" },
  { k: "Now", v: "Contract, MagicEdtech" },
];

export const about =
  "Since 2024 I have been a senior software engineer on contract with MagicEdtech, working for Spear Education, a continuing-education platform for dentists. I work across the React front end and the AWS GraphQL back end: self-service membership upgrades wired to NetSuite, CE credit tracking and certificates, the video player, study clubs and product analytics.";

export const stack = [
  ["TypeScript", "everywhere"],
  ["React, Next.js", "interfaces"],
  ["Node.js", "servers"],
  ["Postgres, Supabase", "data"],
  ["Drizzle", "schemas"],
  ["Tailwind CSS", "styling"],
  ["Rust", "tools"],
  ["AWS, Vercel", "hosting"],
];

export const offTheClock = [
  ["Formula 1", "hence pitwall"],
  ["Football", "weekends"],
  ["Astronomy", "clear nights"],
  ["Programming", "yes, also"],
];

export const socials = [
  { name: "GitHub", handle: "harshsandhu44", url: "https://github.com/harshsandhu44" },
  { name: "LinkedIn", handle: "harshsandhu95", url: site.linkedin },
  { name: "X", handle: "harshsandhu44", url: "https://x.com/harshsandhu44" },
];
