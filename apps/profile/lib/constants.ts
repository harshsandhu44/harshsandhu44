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
      strike: "generic digital chaos", // The word to cross out
      replace: "systems", // The word to replace it with
      end: " for the web.",
    },
    subHeadline:
      "Product engineer focused on Rust, Next.js, and software that feels simple even when the engineering isn't.",
    statusBadge: "Currently optimizing my dotfiles (again).",
    cta: "See what I've been cooking",
  },

  selectedWorks: {
    title: "Selected Works",
    projects: [
      {
        id: "tinkersim",
        slug: "tinkersim",
        title: "TinkerSim",
        subtext:
          "Simulation workbench for testing distributed systems behavior. Built for engineers who need reproducible chaos.",
        longDescription:
          "TinkerSim is a simulation workbench that lets you model distributed systems, inject faults, and observe emergent behavior. Built with Rust compiled to WASM for near-native performance in the browser. Define your topology, configure failure modes, and replay scenarios deterministically.",
        tags: ["Rust", "WASM", "Simulation", "Nextjs", "Tailwind", "GSAP"],
        link: "https://tinkersim.com",
        image: "https://placehold.harshsandhu.com/api/img",
        featured: true,
      },
      {
        id: "gitpilot",
        slug: "gitpilot",
        title: "gitpilot",
        subtext:
          "AI-powered CLI that writes, explains, and reviews your git history. Ship faster with less cognitive overhead.",
        longDescription:
          "gitpilot is a Rust CLI that hooks into your git workflow to auto-generate commit messages, explain diffs in plain English, and surface risky changes before they land on main. Runs locally — no data leaves your machine.",
        tags: ["Rust", "CLI", "AI"],
        link: "https://crates.io/crates/gitpilot",
        image: "https://placehold.harshsandhu.com/api/img",
        featured: true,
      },
      {
        id: "placehold",
        slug: "placehold",
        title: "Placehold",
        subtext:
          "Zero-config placeholder image API. Instant SVG/PNG images for mockups and prototypes.",
        longDescription:
          "Placehold is a zero-config placeholder image API running on the Vercel Edge Runtime. Request any size, format, or color scheme and get back a crisp SVG or PNG instantly. Used by developers worldwide for mockups, wireframes, and loading state prototypes.",
        tags: ["Next.js", "API", "OSS"],
        link: "https://placehold.harshsandhu.com",
        image: "https://placehold.harshsandhu.com/api/img",
        featured: true,
      },
      {
        id: "termeme-cli",
        slug: "termeme-cli",
        title: "termeme-cli",
        subtext:
          "Terminal meme generator. Because devtools should have a sense of humor.",
        longDescription:
          "termeme-cli is a Rust CLI for generating memes directly in your terminal. Pipe in an image URL, pick a template, add your text, and get ASCII art or a rendered image back. Because every CI failure deserves a reaction.",
        tags: ["Rust", "CLI", "OSS"],
        link: "https://github.com/harshsandhu44/termeme-cli",
        image: "https://placehold.harshsandhu.com/api/img",
        featured: true,
      },
      {
        id: "panj-granth",
        slug: "panj-granth",
        title: "Panj Granth",
        subtext: "Digital archive and reader for Sikh scripture.",
        longDescription:
          "An offline-first reading experience for Panj Granthi. Designed for performance and peace of mind — full text search, bookmarks, and a distraction-free reader mode. Built with React Native and Expo.",
        tags: ["React Native", "Expo"],
        link: "https://github.com/harshsandhu44/panj-granth",
        image: "/images/projects/panj-granth.png",
        featured: false,
      },
      {
        id: "moodsync",
        slug: "moodsync",
        title: "MoodSync",
        subtext: "Mood-based playlist engine using Spotify API.",
        longDescription:
          "MoodSync uses psychoacoustics and your current mood to build the perfect Spotify playlist. Answer a few questions, and the engine curates tracks matched to your emotional state using audio feature analysis from the Spotify API.",
        tags: ["Next.js", "Web Audio API"],
        link: "https://moodsync.harshsandhu.com",
        image: "/images/projects/moodsync.png",
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
        description: "Currently making magic happen (literally).",
      },
      {
        company: "Dhan AI",
        role: "Sr. Software Engineer",
        period: "2022 - 2024",
        description: "Tamed the inventory beast for enterprise clients.",
      },
      {
        company: "Pragyaware Informatics",
        role: "Jr. Software Engineer",
        period: "2022",
        description: "Where it all started. Learned to pixel-peep.",
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
      catchphrase: "I live in the terminal and dream in Rust.",
      paragraphs: [
        "I'm a product engineer building developer tools, simulation systems, and fast web products. I care about software that feels simple even when the engineering underneath is anything but.",
        "I believe software shouldn't just work—it should feel effortlessly magical (and load in under 200ms).",
      ],
    },
    interests: [
      {
        id: "f1",
        title: "F1 Strategist",
        description:
          "I analyze race pace data for fun. Ask me about tire degradation.",
        tags: ["Data", "Racing"],
        icon: "🏎️",
        colSpan: 1,
        href: "https://www.formula1.com",
      },
      {
        id: "terminal",
        title: "Terminal Junkie",
        description:
          "I haven't touched a mouse in 3 days. Send help (or vim macros).",
        tags: ["Neovim", "Zsh", "Tmux"],
        icon: "⌨️",
        colSpan: 2, // Highlighted item
      },
      {
        id: "german",
        title: "Sprichst du Deutsch?",
        description:
          "Learning German. Level A2. Still struggling with 'der/die/das'.",
        tags: ["Learning", "A2"],
        icon: "🇩🇪",
        colSpan: 2, // Highlighted item
      },
      {
        id: "cycling",
        title: "Weekend Rider",
        description: "Cycling through Punjab to clear the cache (my brain).",
        tags: ["Strava", "Health"],
        icon: "🚴",
        colSpan: 1,
      },
    ] as BentoItem[],
    stack: {
      header: "My Weapons of Choice",
      categories: [
        {
          name: "Frontend",
          icon: LaptopIcon,
          items: ["React", "Next.js", "Tailwind", "Framer Motion"],
          desc: "The Bread & Butter",
        },
        {
          name: "Systems",
          icon: CpuIcon,
          items: ["Rust", "WASM", "CLI tooling", "Systems design"],
          desc: "Where it gets fast",
        },
        {
          name: "Backend",
          icon: ServerIcon,
          items: ["Node.js", "Python", "Go", "PostgreSQL"],
          desc: "The Heavy Lifting",
        },
        {
          name: "Infrastructure",
          icon: CloudIcon,
          items: ["AWS", "Docker", "Vercel", "Terraform"],
          desc: "The Cloud Kingdom",
        },
        {
          name: "Editor & Tools",
          icon: TerminalIcon,
          items: ["Zed", "Neovim", "Tmux", "LazyGit"],
          desc: "Speed matters",
        },
      ],
    },
  },

  footer: {
    tagline: "Don't be a stranger.",
    subTagline:
      "Whether it's a project inquiry or a debate about the latest F1 Grand Prix—my inbox is open.",
    cta: "Shoot me an email",
    hoverText: "I reply fast!",
  },
};
