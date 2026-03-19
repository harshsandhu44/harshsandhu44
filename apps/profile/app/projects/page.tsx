import type { Metadata } from "next";
import { DATA } from "@/lib/constants";
import { ProjectCard } from "@/components/project-card";
import { siteConfig } from "@/config/site";

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
    <div className="container py-24 space-y-20">
      <div className="space-y-4 md:text-center">
        <h1 className="text-5xl md:text-7xl font-black">Projects</h1>
        <p className="text-xl text-muted-foreground max-w-prose md:mx-auto">
          Things I&apos;ve built — developer tools, simulation systems, and
          experiments.
        </p>
      </div>

      <section className="space-y-8">
        <h2 className="text-2xl font-bold">Featured</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {featured.map((project) => (
            <ProjectCard
              key={project.id}
              slug={project.slug}
              title={project.title}
              subtext={project.subtext}
              tags={project.tags}
              link={project.link}
              featured
            />
          ))}
        </div>
      </section>

      {secondary.length > 0 && (
        <section className="space-y-8">
          <h2 className="text-2xl font-bold">More Projects</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {secondary.map((project) => (
              <ProjectCard
                key={project.id}
                slug={project.slug}
                title={project.title}
                subtext={project.subtext}
                tags={project.tags}
                link={project.link}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
