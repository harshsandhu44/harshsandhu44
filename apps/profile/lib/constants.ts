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
        title: "TinkerSim",
        subtext:
          "Electronics learning and circuit simulation platform built for visual, hands-on experimentation.",
        longDescription:
          "TinkerSim is a simulation-focused product for learning electronics by building and testing circuits visually. It combines a modern node-based canvas with browser-based circuit simulation, component systems, authentication, and a dedicated compiler service for Arduino workflows.",
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
        title: "GitPilot",
        subtext: "Rust CLI for the tedious parts of daily Git workflow.",
        longDescription:
          "GitPilot is a developer tool for quick repository inspection, PR summaries, pre-commit risk detection, and safe branch cleanup. It reflects my interest in workflow tooling that saves time without adding friction.",
        tags: ["Rust", "CLI", "Git", "Developer Tools"],
        link: "https://github.com/harshsandhu44/gitpilot",
        image: "https://placehold.harshsandhu.com/api/img",
        featured: true,
      },
      {
        id: "placehold",
        slug: "placehold",
        title: "Placehold",
        subtext:
          "Simple, fast placeholder image and text generator with a polished docs experience.",
        longDescription:
          "Placehold is a lightweight developer utility for generating placeholder images and lorem text. It includes API routes, documentation, and edge-ready image generation in a clean Next.js setup.",
        tags: ["Next.js", "TypeScript", "Tailwind", "Vercel OG"],
        link: "https://github.com/harshsandhu44/placehold",
        image: "https://placehold.harshsandhu.com/api/img",
        featured: true,
      },
      {
        id: "event-pilot",
        slug: "event-pilot",
        title: "EventPilot",
        subtext:
          "AI-powered event guide assistant with chat, voice interaction, and real-time updates.",
        longDescription:
          "EventPilot is a modern event experience product built as a monorepo. It combines AI chat, voice interaction, and live event navigation with a structured frontend and Firebase-backed data layer.",
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
        title: "Draw",
        subtext:
          "Whiteboard-style brainstorming app for sketching ideas quickly.",
        longDescription:
          "Draw is a lightweight visual thinking tool for rough ideation and fast brainstorming. It adds a more creative, interaction-heavy project to the portfolio mix.",
        tags: ["JavaScript", "Canvas", "Web App", "UI"],
        link: "https://github.com/harshsandhu44/draw",
        image: "https://placehold.harshsandhu.com/api/img",
        featured: false,
      },
      {
        id: "doot-app",
        slug: "doot-app",
        title: "Doot",
        subtext:
          "Feature-rich mobile dating app with onboarding, swiping, matching, and messaging.",
        longDescription:
          "Doot is a React Native mobile application built with Expo and Firebase. It includes authentication, profile flows, swiping, real-time messaging, and a more consumer-product style user experience.",
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
      },
      {
        company: "Dhan AI",
        role: "Sr. Software Engineer",
        period: "2022 - 2024",
        description:
          "Worked on enterprise-facing software and product engineering across fast-moving delivery cycles.",
      },
      {
        company: "Pragyaware Informatics",
        role: "Jr. Software Engineer",
        period: "2022",
        description:
          "Started professionally here, building the habits that shaped how I think about product and code.",
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
};
