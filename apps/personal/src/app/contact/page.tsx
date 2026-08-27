import type { Metadata } from "next";
import { Desktop } from "#components/desktop";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Open to product, frontend, and developer-tooling conversations.",
};

export default async function Page({ searchParams }: PageProps<"/contact">) {
  const { l } = await searchParams;
  return (
    <Desktop view="contact" layout={typeof l === "string" ? l : undefined} />
  );
}
