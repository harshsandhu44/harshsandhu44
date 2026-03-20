import { BentoItem } from "@/components/ui/bento-grid";
import {
  LaptopIcon,
  ServerIcon,
  CloudIcon,
  TerminalIcon,
  CpuIcon,
} from "lucide-react";

export const DATA = {
  global: {
    name: "Harsh Sandhu",
    email: "me@harshsandhu.com",
    socials: {
      github: "https://github.com/harshsandhu44",
      linkedin: "https://linkedin.com/in/nyxfor13days",
      twitter: "https://x.com/harshsandhu44",
    },
  },

  hero: {
    headline: {
      start: "I build ",
      strike: "generic projects",
      replace: "valuable products",
      end: " with strong product thinking.",
    },
    subHeadline:
      "Product engineer focused on TypeScript, Rust, Next.js, Expo, and building software that feels fast, useful, and intentional.",
    statusBadge:
      "Currently focused on TinkerSim, Rust, and clean product engineering.",
    cta: "Explore selected work",
  },

  selectedWorks: {
    title: "Selected Works",
    projects: [
      {
        id: "tinkersim",
        slug: "tinkersim",
        category: "SIMULATION",
        title: "TinkerSim",
        subtext:
          "Electronics learning and circuit simulation platform built for visual, hands-on experimentation.",
        longDescription:
          "TinkerSim is a simulation-focused product for learning electronics by building and testing circuits visually. It combines a modern node-based canvas with browser-based circuit simulation, component systems, authentication, and a dedicated compiler service for Arduino workflows.",
        bodyCopy:
          "TinkerSim brings circuit experimentation into the browser with a node-based canvas that lets learners place, wire, and simulate components in real time. The platform includes a custom compiler service that translates diagrams into Arduino-compatible code, making the leap from simulation to hardware as short as possible. Authentication, component libraries, and a structured curriculum layer make it a complete learning environment rather than a one-off tool.",
        tags: [
          "Next.js",
          "React",
          "TypeScript",
          "Tailwind",
          "Rust",
          "Simulation",
        ],
        link: "https://github.com/harshsandhu44/tinkersim",
        image: "https://placehold.harshsandhu.com/api/img",
        featured: true,
      },
      {
        id: "gitpilot",
        slug: "gitpilot",
        category: "DEVELOPER TOOLS",
        title: "GitPilot",
        subtext: "Rust CLI for the tedious parts of daily Git workflow.",
        longDescription:
          "GitPilot is a developer tool for quick repository inspection, PR summaries, pre-commit risk detection, and safe branch cleanup. It reflects my interest in workflow tooling that saves time without adding friction.",
        bodyCopy:
          "GitPilot is a Rust CLI designed to remove the friction from daily Git operations. It handles repository inspection, generates concise PR summaries, detects risky pre-commit changes, and automates safe branch cleanup — all from a single binary with no configuration required. The goal was a tool that respects the engineer's time and stays out of the way.",
        tags: ["Rust", "CLI", "Git", "Developer Tools"],
        link: "https://github.com/harshsandhu44/gitpilot",
        image: "https://placehold.harshsandhu.com/api/img",
        featured: true,
      },
      {
        id: "placehold",
        slug: "placehold",
        category: "WEB PRODUCT",
        title: "Placehold",
        subtext:
          "Simple, fast placeholder image and text generator with a polished docs experience.",
        longDescription:
          "Placehold is a lightweight developer utility for generating placeholder images and lorem text. It includes API routes, documentation, and edge-ready image generation in a clean Next.js setup.",
        bodyCopy:
          "Placehold solves the mundane problem of placeholder content during development by exposing a clean API that generates sized images on demand. Built on Next.js with edge-ready image generation, it ships with its own documentation site so developers can integrate it without leaving the browser. The project prioritised a minimal API surface and zero-configuration setup.",
        tags: ["Next.js", "TypeScript", "Tailwind", "Vercel OG"],
        link: "https://github.com/harshsandhu44/placehold",
        image: "https://placehold.harshsandhu.com/api/img",
        featured: true,
      },
      {
        id: "event-pilot",
        slug: "event-pilot",
        category: "AI PRODUCT",
        title: "EventPilot",
        subtext:
          "AI-powered event guide assistant with chat, voice interaction, and real-time updates.",
        longDescription:
          "EventPilot is a modern event experience product built as a monorepo. It combines AI chat, voice interaction, and live event navigation with a structured frontend and Firebase-backed data layer.",
        bodyCopy:
          "EventPilot reimagines how attendees navigate live events by embedding an AI assistant directly into the event experience. The assistant handles natural-language queries via chat or voice, surfaces real-time schedule changes, and guides users through venue maps. A Firebase data layer keeps everything in sync while ElevenLabs voice synthesis makes interactions feel conversational rather than transactional.",
        tags: [
          "Next.js",
          "React",
          "TypeScript",
          "Firebase",
          "Gemini",
          "ElevenLabs",
        ],
        link: "https://github.com/harshsandhu44/event-pilot",
        image: "https://placehold.harshsandhu.com/api/img",
        featured: true,
      },
      {
        id: "draw",
        slug: "draw",
        category: "CREATIVE TOOLS",
        title: "Draw",
        subtext:
          "Whiteboard-style brainstorming app for sketching ideas quickly.",
        longDescription:
          "Draw is a lightweight visual thinking tool for rough ideation and fast brainstorming. It adds a more creative, interaction-heavy project to the portfolio mix.",
        bodyCopy:
          "Draw is a whiteboard tool optimised for speed — the kind of canvas you open when an idea needs to get out of your head before it disappears. Built on native Canvas APIs, it prioritises low-latency input and a minimal interface that stays out of the way.",
        tags: ["JavaScript", "Canvas", "Web App", "UI"],
        link: "https://github.com/harshsandhu44/draw",
        image: "https://placehold.harshsandhu.com/api/img",
        featured: false,
      },
      {
        id: "doot-app",
        slug: "doot-app",
        category: "MOBILE",
        title: "Doot",
        subtext:
          "Feature-rich mobile dating app with onboarding, swiping, matching, and messaging.",
        longDescription:
          "Doot is a React Native mobile application built with Expo and Firebase. It includes authentication, profile flows, swiping, real-time messaging, and a more consumer-product style user experience.",
        bodyCopy:
          "Doot is a full-featured dating app built with React Native and Expo, covering the entire user journey from onboarding and profile creation through card swiping, match management, and real-time messaging. Firestore backs the live data layer while the product focuses on keeping interactions smooth and the UI feeling native across iOS and Android.",
        tags: ["React Native", "Expo", "TypeScript", "Firebase", "Firestore"],
        link: "https://github.com/harshsandhu44/doot-app",
        image: "https://placehold.harshsandhu.com/api/img",
        featured: false,
      },
    ],
  },

  experience: {
    header: "Where I've been delivering value",
    roles: [
      {
        company: "Magic EdTech",
        role: "Sr. Software Engineer",
        period: "2024 - Present",
        description:
          "Building product experiences and shipping frontend-heavy systems with a focus on quality and usability.",
        longDescription:
          "At Magic EdTech I own the frontend architecture for learning products used by students across multiple markets. The work involves building component systems, optimising delivery performance, and collaborating closely with product and design to turn requirements into experiences that feel polished rather than just functional.",
      },
      {
        company: "Dhan AI",
        role: "Sr. Software Engineer",
        period: "2022 - 2024",
        description:
          "Worked on enterprise-facing software and product engineering across fast-moving delivery cycles.",
        longDescription:
          "Dhan AI moved fast and the role demanded both breadth and precision — shipping enterprise-facing features on tight cycles while keeping the codebase maintainable enough for the next sprint. I worked across the full product surface, from data-heavy dashboards to authentication and API integration layers.",
      },
      {
        company: "Pragyaware Informatics",
        role: "Jr. Software Engineer",
        period: "2022",
        description:
          "Started professionally here, building the habits that shaped how I think about product and code.",
        longDescription:
          "My first professional role, where I learned to write code that other people would need to read, debug, and extend. The experience instilled a respect for maintainability and clear intent that still shapes how I approach every project.",
      },
    ],
  },

  about: {
    bio: {
      image: {
        mobile: "/images/harshsandhu-mobile.jpg",
        desktop: "/images/harshsandhu-desktop.jpg",
      },
      greeting: "Hi, I'm Harsh.",
      catchphrase: "I build products, developer tools, and simulation systems.",
      paragraphs: [
        "I'm a product engineer who likes building software that is practical, sharp, and enjoyable to use. My work spans web applications, internal tools, simulation-heavy products, and developer workflows.",
        "A lot of my recent work sits at the intersection of TypeScript, Rust, Next.js, and product-focused engineering. I care about systems that are technically solid but still feel simple from the user's side.",
      ],
    },

    interests: [
      {
        id: "f1",
        title: "F1 & race strategy",
        description:
          "I follow Formula 1 like it's a systems design problem with tire degradation.",
        tags: ["F1", "Strategy"],
        icon: "🏎️",
        colSpan: 1,
        href: "https://www.formula1.com",
      },
      {
        id: "terminal",
        title: "Terminal-first workflow",
        description:
          "Neovim, shell tooling, and keyboard-heavy workflows are my default operating system.",
        tags: ["Neovim", "Tmux", "CLI"],
        icon: "⌨️",
        colSpan: 2,
      },
      {
        id: "football",
        title: "Football enjoyer",
        description:
          "I keep up with football because apparently one obsession with strategy wasn't enough.",
        tags: ["Football", "Analysis"],
        icon: "⚽",
        colSpan: 2,
      },
      {
        id: "astronomy",
        title: "Astronomy",
        description:
          "I like space, big questions, and staring at things that are objectively too far away to be useful.",
        tags: ["Space", "Curiosity"],
        icon: "🔭",
        colSpan: 1,
      },
    ] as BentoItem[],

    stack: {
      header: "Stack I Actually Reach For",
      categories: [
        {
          name: "Frontend",
          icon: LaptopIcon,
          items: ["React", "Next.js", "TypeScript", "Tailwind CSS"],
          desc: "Product-focused UI systems",
        },
        {
          name: "Simulation & Interactive Systems",
          icon: CpuIcon,
          items: [
            "React Flow",
            "WebAssembly",
            "Canvas UIs",
            "State-heavy apps",
          ],
          desc: "Visual tools and simulation products",
        },
        {
          name: "Developer Tools",
          icon: TerminalIcon,
          items: ["Rust", "CLI tooling", "Git workflows", "Automation"],
          desc: "Fast tools for engineers",
        },
        {
          name: "Backend & Data",
          icon: ServerIcon,
          items: ["Firebase", "APIs", "Auth systems", "Compiler services"],
          desc: "The useful plumbing",
        },
        {
          name: "Infra & Delivery",
          icon: CloudIcon,
          items: ["Docker", "Bun", "Turbo", "Vercel"],
          desc: "Shipping without drama",
        },
      ],
    },
  },

  footer: {
    tagline: "Let's build something useful.",
    subTagline:
      "Open to product, frontend, and developer-tooling conversations.",
    cta: "Send me an email",
    hoverText: "I usually reply pretty fast.",
  },

  editorial: {
    publication: "The Harsh Sandhu Daily",
    volume: "Vol. IV",
    edition: "No. 2026",
    tagline: "Product Engineering · Developer Tools · Simulation Systems",
    themeLabels: { light: "MORNING EDITION", dark: "NIGHT EDITION" },
    sectionLabels: {
      hero: "DISPATCH",
      works: "PORTFOLIO",
      experience: "PROFESSIONAL RECORD",
      about: "ABOUT THE AUTHOR",
    },
  },
};
