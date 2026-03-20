import type { Metadata } from "next";
import { DATA } from "@/lib/constants";
import { siteConfig } from "@/config/site";
import { SectionLabel, DividerRule, ArticleBlock } from "@/components/editorial";

export const metadata: Metadata = {
  title: "Projects",
  description: `A collection of projects by Harsh Sandhu — developer tools, simulation systems, and fast web products.`,
  openGraph: {
    title: `Projects | ${siteConfig.name}`,
    description: `A collection of projects by Harsh Sandhu — developer tools, simulation systems, and fast web products.`,
    url: `${siteConfig.url}/projects`,
  },
};

export default function ProjectsPage() {
  const featured = DATA.selectedWorks.projects.filter((p) => p.featured);
  const secondary = DATA.selectedWorks.projects.filter((p) => !p.featured);

  return (
    <div className="container py-24 space-y-16">
      <div className="space-y-4">
        <h1 className="font-serif font-bold text-6xl md:text-7xl tracking-tight">
          Projects
        </h1>
        <p className="font-sans text-xl text-muted-foreground max-w-prose">
          Things I&apos;ve built — developer tools, simulation systems, and
          experiments.
        </p>
      </div>

      <section className="space-y-0">
        <div className="flex items-center gap-4 mb-8">
          <SectionLabel ruled>FEATURED</SectionLabel>
          <DividerRule className="flex-1" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          {featured.map((project, i) => (
            <div key={project.id} className={i > 0 ? "md:pl-8" : "md:pr-8"}>
              <ArticleBlock
                sectionLabel={project.category ?? "PROJECT"}
                title={project.title}
                deck={project.subtext}
                tags={project.tags}
                href={project.link}
                featured={i === 0}
              />
            </div>
          ))}
        </div>
      </section>

      {secondary.length > 0 && (
        <section className="space-y-0">
          <div className="flex items-center gap-4 mb-8">
            <SectionLabel ruled>MORE PROJECTS</SectionLabel>
            <DividerRule className="flex-1" />
          </div>
          <div className="divide-y divide-border">
            {secondary.map((project) => (
              <ArticleBlock
                key={project.id}
                sectionLabel={project.category ?? "PROJECT"}
                title={project.title}
                deck={project.subtext}
                tags={project.tags}
                href={project.link}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
