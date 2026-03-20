import Link from "next/link";
import { Highlighter } from "@/components/ui/highlighter";
import { DATA } from "@/lib/constants";
import { AnchorLink } from "@/components/anchor-link";
import {
  LeadStory,
  SectionLabel,
  DividerRule,
  ArticleBlock,
  ArchiveEntry,
} from "@/components/editorial";

export default function HomePage() {
  const featuredProjects = DATA.selectedWorks.projects.filter((p) => p.featured);

  return (
    <>
      <LeadStory
        headline={
          <>
            {DATA.hero.headline.start}
            <span className="inline-block relative">
              <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm text-primary font-cursive whitespace-nowrap">
                {DATA.hero.headline.replace}
              </span>{" "}
              <Highlighter action="crossed-off">{DATA.hero.headline.strike}</Highlighter>
            </span>
            {DATA.hero.headline.end}
          </>
        }
        deck={DATA.hero.subHeadline}
        byline={`${DATA.global.name} — Product Engineer`}
        statusNote={DATA.hero.statusBadge}
        cta={
          <AnchorLink
            href="#section-journey"
            className="font-mono text-sm uppercase tracking-widest border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors inline-flex items-center gap-2"
          >
            {DATA.hero.cta} ↓
          </AnchorLink>
        }
        sideRailContent={
          <div className="space-y-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-2">
                Online
              </p>
              <div className="space-y-1">
                <Link
                  href={DATA.global.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-mono text-xs uppercase tracking-[0.1em] hover:text-primary transition-colors"
                >
                  GitHub ↗
                </Link>
                <Link
                  href={DATA.global.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-mono text-xs uppercase tracking-[0.1em] hover:text-primary transition-colors"
                >
                  LinkedIn ↗
                </Link>
                <Link
                  href={DATA.global.socials.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-mono text-xs uppercase tracking-[0.1em] hover:text-primary transition-colors"
                >
                  Twitter/X ↗
                </Link>
              </div>
            </div>
            <DividerRule />
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground mb-1">
                Status
              </p>
              <p className="font-mono text-xs italic text-muted-foreground/70">
                {DATA.hero.statusBadge}
              </p>
            </div>
          </div>
        }
      />

      <section
        className="py-24 container"
        id="section-journey"
      >
        <div className="flex items-center gap-4 mb-8">
          <SectionLabel ruled>PORTFOLIO</SectionLabel>
          <DividerRule className="flex-1" />
        </div>

        {/* Lead project — full width */}
        {featuredProjects[0] && (
          <ArticleBlock
            featured
            sectionLabel={featuredProjects[0].category ?? "PROJECT"}
            title={featuredProjects[0].title}
            deck={featuredProjects[0].subtext}
            tags={featuredProjects[0].tags}
            href={featuredProjects[0].link}
          />
        )}

        <DividerRule className="my-2" />

        {/* Grid of remaining featured projects */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          {featuredProjects.slice(1).map((p) => (
            <div key={p.id} className="md:px-6 first:pl-0 last:pr-0">
              <ArticleBlock
                sectionLabel={p.category ?? "PROJECT"}
                title={p.title}
                deck={p.subtext}
                tags={p.tags}
                href={p.link}
              />
            </div>
          ))}
        </div>
      </section>

      <section
        className="py-24 container"
        id="section-experience"
      >
        <div className="flex items-center gap-4 mb-8">
          <SectionLabel ruled>PROFESSIONAL RECORD</SectionLabel>
          <DividerRule className="flex-1" />
        </div>

        <div className="divide-y divide-border">
          {DATA.experience.roles.map((role) => (
            <ArchiveEntry
              key={role.company}
              period={role.period}
              company={role.company}
              role={role.role}
              description={role.description}
            />
          ))}
        </div>
      </section>
    </>
  );
}

HomePage.displayName = "HomePage";
