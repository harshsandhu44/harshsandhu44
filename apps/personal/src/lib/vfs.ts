import {
  getProfile,
  getSkills,
  getExperience,
  getEducation,
  getProjects,
} from "#lib/content";

export type VfsFile = {
  path: string;
  /** Plain text, exactly what `cat` prints and what `grep` searches. */
  text: string;
  /** True when a pane exists for this path, so `open` can refuse honestly. */
  openable: boolean;
};

export type Vfs = {
  files: VfsFile[];
  profile: { name: string; role: string; location: string; tagline: string };
  stack: string[];
};

/* Built on the server from the same Keystatic reads the panes use. The shell
 * therefore cannot list a file the panes do not render, or miss one they do. */
export async function buildVfs(): Promise<Vfs> {
  const [profile, skills, experience, education, projects] = await Promise.all([
    getProfile(),
    getSkills(),
    getExperience(),
    getEducation(),
    getProjects(),
  ]);

  const files: VfsFile[] = [
    {
      path: "/about",
      openable: true,
      text: [
        `${profile.name} — ${profile.role}`,
        profile.location,
        profile.tagline,
        "",
        profile.summary,
        "",
        ...skills.groups.map((g) => `${g.name}: ${g.items.join(", ")}`),
      ].join("\n"),
    },
    {
      path: "/resume",
      openable: true,
      text: [
        ...experience.map((job) =>
          [
            `${job.start} — ${job.end || "present"}  ${job.role}`,
            `  ${job.company}${job.location ? ` · ${job.location}` : ""}${job.mode ? ` · ${job.mode}` : ""}`,
            ...job.bullets.map((b) => `  · ${b}`),
            `  ${job.stack.join(", ")}`,
          ].join("\n"),
        ),
        "",
        ...education.map(
          (e) =>
            `${e.start} — ${e.end}  ${e.degree}, ${e.field} · ${e.institution}`,
        ),
      ].join("\n\n"),
    },
    {
      path: "/work",
      openable: true,
      text: projects
        .map((p) => `${p.year}  ${p.name}${p.featured ? " *" : ""}`)
        .join("\n"),
    },
    ...projects.map((p) => ({
      path: `/work/${p.slug}`,
      // Case studies are v2; until then the entry lists but does not open.
      openable: false,
      text: [`${p.name} (${p.year})`, "", p.blurb, "", p.stack.join(", ")].join(
        "\n",
      ),
    })),
    {
      path: "/contact",
      openable: true,
      text: [
        `email  ${profile.email}`,
        `phone  ${profile.phone}`,
        `based  ${profile.location}`,
        "",
        ...profile.links.map((l) => `${l.label}  ${l.href}`),
      ].join("\n"),
    },
  ];

  return {
    files,
    profile: {
      name: profile.name,
      role: profile.role,
      location: profile.location,
      tagline: profile.tagline,
    },
    stack: skills.groups.flatMap((g) => g.items),
  };
}
