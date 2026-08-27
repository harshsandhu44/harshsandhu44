import type { Metadata } from "next";
import { Desktop } from "#components/desktop";

export const metadata: Metadata = {
  title: "Résumé",
  description:
    "Five years of shipped work: Magic EdTech, Dhan AI, Pragyaware. Full stack across React, TypeScript, Node.js and AWS.",
};

export default async function Page({ searchParams }: PageProps<"/resume">) {
  const { l } = await searchParams;
  return (
    <Desktop view="resume" layout={typeof l === "string" ? l : undefined} />
  );
}
