import {
  LaptopIcon,
  ServerIcon,
  CloudIcon,
  TerminalIcon,
  CpuIcon,
} from "lucide-react";
import { type BentoItem } from "@/components/ui/bento-grid";

export const about = {
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
        items: [
          "Firebase",
          "AWS",
          "Cloudflare",
          "APIs",
          "Auth systems",
          "Compiler services",
        ],
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
};
