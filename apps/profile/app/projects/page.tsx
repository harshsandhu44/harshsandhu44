import type { Metadata } from "next";
import { DATA } from "@/lib/constants";
import { siteConfig } from "@/config/site";
import { DividerRule, ArticleBlock } from "@/components/editorial";

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
    <div className="container py-8">
      {/* Compact masthead-style header */}
      <div className="border-t-[3px] border-double border-foreground pt-1 mb-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-center py-[2px]">
          Selected Works Archive
        </p>
      </div>
      <DividerRule variant="thin" className="mb-4" />

      {/* Featured section */}
      <section>
        <div className="border-t-2 border-foreground pt-1 mb-2">
          <span className="col-header-box">Featured</span>
        </div>

        <div className="grid grid-cols-1 md:newspaper-grid">
          <div className="md:col-span-2 newspaper-col-first">
            <ArticleBlock
              featured
              sectionLabel={featured[0]?.category ?? "PROJECT"}
              title={featured[0]?.title ?? ""}
              deck={featured[0]?.subtext ?? ""}
              tags={featured[0]?.tags ?? []}
              href={featured[0]?.link}
              body={featured[0]?.bodyCopy}
            />
          </div>
          {featured.slice(1, 3).map((project, i) => (
            <div
              key={project.id}
              className={i === featured.slice(1, 3).length - 1 ? "newspaper-col-last" : "newspaper-col"}
            >
              <ArticleBlock
                sectionLabel={project.category ?? "PROJECT"}
                title={project.title}
                deck={project.subtext}
                tags={project.tags}
                href={project.link}
                body={project.bodyCopy}
              />
            </div>
          ))}
        </div>

        {featured.length > 3 && (
          <>
            <DividerRule variant="thick" className="my-0" />
            <div className="grid grid-cols-1 md:newspaper-grid">
              {featured.slice(3).map((project, i) => (
                <div
                  key={project.id}
                  className={
                    i === 0
                      ? "newspaper-col-first"
                      : i === featured.slice(3).length - 1
                      ? "newspaper-col-last"
                      : "newspaper-col"
                  }
                >
                  <ArticleBlock
                    sectionLabel={project.category ?? "PROJECT"}
                    title={project.title}
                    deck={project.subtext}
                    tags={project.tags}
                    href={project.link}
                    body={project.bodyCopy}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {secondary.length > 0 && (
        <>
          <DividerRule variant="thick" className="my-4" />

          <section>
            <div className="border-t-2 border-foreground pt-1 mb-2">
              <span className="col-header-box">More Projects</span>
            </div>

            <div className="grid grid-cols-1 md:newspaper-grid">
              {secondary.map((project, i) => (
                <div
                  key={project.id}
                  className={
                    i === 0
                      ? "newspaper-col-first"
                      : i === secondary.length - 1
                      ? "newspaper-col-last"
                      : "newspaper-col"
                  }
                >
                  <ArticleBlock
                    sectionLabel={project.category ?? "PROJECT"}
                    title={project.title}
                    deck={project.subtext}
                    tags={project.tags}
                    href={project.link}
                    body={project.bodyCopy}
                  />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
