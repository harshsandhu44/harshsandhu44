import type { Metadata } from "next";
import { Desktop } from "#components/desktop";

export const metadata: Metadata = {
  title: "Work",
  description:
    "Selected projects — TinkerSim, GitPilot, Placehold, EventPilot and more.",
};

export default async function Page({ searchParams }: PageProps<"/work">) {
  const { l } = await searchParams;
  return <Desktop view="work" layout={typeof l === "string" ? l : undefined} />;
}
