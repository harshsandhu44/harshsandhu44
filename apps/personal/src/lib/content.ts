import { createReader } from "@keystatic/core/reader";
import config from "../../keystatic.config";

/* Keystatic is git-backed, so this reads files off disk at build time. No runtime
 * fetch — which is the whole reason the shell can complete paths synchronously. */
const reader = createReader(process.cwd(), config);

export type Profile = Awaited<ReturnType<typeof getProfile>>;
export type Skills = Awaited<ReturnType<typeof getSkills>>;
export type Experience = Awaited<ReturnType<typeof getExperience>>[number];
export type Project = Awaited<ReturnType<typeof getProjects>>[number];
export type Education = Awaited<ReturnType<typeof getEducation>>[number];

function required<T>(value: T | null, what: string): T {
  if (value === null) throw new Error(`Missing content: ${what}`);
  return value;
}

export async function getProfile() {
  return required(await reader.singletons.profile.read(), "profile");
}

export async function getSkills() {
  return required(await reader.singletons.skills.read(), "skills");
}

async function all<K extends "experience" | "projects" | "education">(key: K) {
  const slugs = await reader.collections[key].list();
  const entries = await Promise.all(
    slugs.map(async (slug) => {
      const entry = required(
        await reader.collections[key].read(slug),
        `${key}/${slug}`,
      );
      return { slug, ...entry };
    }),
  );
  return entries.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

export async function getExperience() {
  return all("experience");
}

export async function getEducation() {
  return all("education");
}

export async function getProjects() {
  return all("projects");
}

export async function getProject(slug: string) {
  const entry = await reader.collections.projects.read(slug);
  return entry ? { slug, ...entry } : null;
}
