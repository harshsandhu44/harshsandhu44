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
      start: "I build pixel-perfect ",
      strike: "chaos", // The word to cross out
      replace: "systems", // The word to replace it with
      end: " for the web.",
    },
    subHeadline:
      "Full-Stack Engineer & Digital Architect. I turn coffee into clean code and complex problems into simple solutions.",
    statusBadge: "Currently optimizing my dotfiles (again).",
    cta: "See what I've been cooking",
  },

  selectedWorks: {
    title: "Selected Works",
    projects: [
      {
        id: "spear-education",
        title: "Teaching 50k Dentists to Scale",
        subtext: "React, AWS, and a whole lot of uptime.",
        tags: ["React", "AWS", "AppSync"],
        image: "/images/projects/spear.jpg",
      },
      {
        id: "wingos",
        title: "Ordering Fries, Faster.",
        subtext:
          "A SaaS platform for hungry customers. 1000+ weekly orders processed without a hiccup.",
        tags: ["Next.js", "Stripe", "SaaS"],
        image: "/images/projects/wingos.jpg",
      },
      {
        id: "moodsync",
        title: "Hacking Your Brainwaves",
        subtext: "Psychoacoustics meets Next.js. Yes, it actually works.",
        tags: ["Web Audio API", "Psychoacoustics", "Next.js"],
        link: "https://moodsync.harshsandhu.com",
        image: "/images/projects/moodsync.jpg",
      },
      {
        id: "panj-granth",
        title: "Spiritual Tech for the Soul",
        subtext:
          "An offline-first reading experience for the Guru Granth Sahib. Built for peace of mind (and performance).",
        tags: ["React Native", "Expo", "Mobile"],
        link: "https://github.com/harshsandhu44/panj-granth",
        image: "/images/projects/panj-granth.jpg",
      },
      {
        id: "soul-bible",
        title: "The Good Book, Reimagined",
        subtext:
          "Feature-rich Bible app with cloud sync. Because faith shouldn't have loading spinners.",
        tags: ["React Native", "TypeScript", "Cloud Sync"],
        link: "https://github.com/harshsandhu44/soul-bible",
        image: "/images/projects/soul-bible.jpg",
      },
    ],
  },

  experience: {
    header: "Where I’ve been delivering value",
    roles: [
      {
        company: "Magic EdTech",
        role: "React Expert",
        period: "2024 - Present",
        description: "Currently making magic happen (literally).",
      },
      {
        company: "Dhan AI",
        role: "Sr. Frontend Engineer",
        period: "2022 - 2024",
        description: "Tamed the inventory beast for enterprise clients.",
      },
      {
        company: "Pragyaware",
        role: "Frontend Developer",
        period: "2022",
        description: "Where it all started. Learned to pixel-peep.",
      },
    ],
  },

  about: {
    bio: {
      image: "/images/harsh-portrait.jpg", // Update path
      greeting: "Hi, I'm Harsh.",
      catchphrase: "I live in the terminal and dream in TypeScript.",
      paragraphs: [
        "By day, I’m architecting scalable SaaS platforms that handle millions of requests. By night, I’m probably tweaking my Neovim config, analyzing Formula 1 telemetry data, or wondering why my cat just pushed my coffee off the desk.",
        "I believe software shouldn't just work—it should feel effortlessly magical (and load in under 200ms).",
      ],
    },
    interests: [
      {
        icon: "🏎️",
        label: "F1 Strategist",
        desc: "I analyze race pace data for fun. Ask me about tire degradation.",
      },
      {
        icon: "⌨️",
        label: "Terminal Junkie",
        desc: "I haven't touched a mouse in 3 days. Send help (or vim macros).",
      },
      {
        icon: "🇩🇪",
        label: "Sprichst du Deutsch?",
        desc: "Learning German. Level A2. Still struggling with 'der/die/das'.",
      },
      {
        icon: "🚴",
        label: "Weekend Rider",
        desc: "Cycling through Punjab to clear the cache (my brain).",
      },
    ],
    stack: {
      header: "My Weapons of Choice",
      categories: [
        {
          name: "Frontend",
          items: "React & Next.js (The Bread & Butter)",
        },
        {
          name: "Backend",
          items: "Node, Python, & Go (The Heavy Lifting)",
        },
        {
          name: "Infrastructure",
          items: "AWS & Docker (The Cloud Kingdom)",
        },
        {
          name: "Editor",
          items: "Zed & Neovim (Speed matters)",
        },
      ],
    },
  },

  footer: {
    tagline: "Don't be a stranger.",
    subTagline:
      "Whether it's a project inquiry or a debate about the latest F1 Grand Prix—my inbox is open.",
    cta: "Shoot me an email →",
    hoverText: "I reply fast!",
  },
};
