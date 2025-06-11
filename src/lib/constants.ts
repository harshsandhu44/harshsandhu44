import { GithubIcon, InstagramIcon } from "@/components/icons";

export const NAV_LINKS = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Projects",
    href: "/projects",
  },
];

export const SOCIAL_LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/harshsandhu44",
    icon: GithubIcon,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/95_harshsandhu/",
    icon: InstagramIcon,
  },
];

export const PROJECTS = [
  {
    label: "MoodSync - A Mood-Adaptive Sound Frequency App",
    href: "/projects/mood-sync",
    description:
      "A mood-adaptive sound frequency app that uses the Web Audio API to generate sound frequencies based on the user's mood.",
    image: "/images/mood-sync.png",
    technologies: [
      "React",
      "Next.js",
      "Tailwind CSS",
      "TypeScript",
      "Web Audio API",
    ],
    github: "https://github.com/harshsandhu44/mood-sync",
    live: "https://moodsync.harshsandhu.com/",
  },
];
