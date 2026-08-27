import { Desktop, DEFAULT_FOCUS, DEFAULT_LAYOUT } from "#components/desktop";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { l } = await searchParams;
  return (
    <Desktop
      view={DEFAULT_FOCUS}
      layout={typeof l === "string" ? l : undefined}
      defaultLayout={DEFAULT_LAYOUT}
      isEntry
    />
  );
}
