import type { Metadata } from "next";
import { Desktop } from "#components/desktop";

export const metadata: Metadata = {
  title: "About",
  description:
    "Product Engineer in Ludhiana, India. React, Next.js, TypeScript, Node.js, AWS — and a circuit simulator written in Rust.",
};

export default async function Page({ searchParams }: PageProps<"/about">) {
  const { l } = await searchParams;
  return (
    <Desktop view="about" layout={typeof l === "string" ? l : undefined} />
  );
}
