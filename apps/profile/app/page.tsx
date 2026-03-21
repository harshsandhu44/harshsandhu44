import Link from "next/link";
import { Highlighter } from "@/components/ui/highlighter";
import { DATA } from "@/lib/constants";
import { AnchorLink } from "@/components/anchor-link";
import {
  LeadStory,
  DividerRule,
  ArticleBlock,
  ArchiveEntry,
} from "@/components/editorial";

export default function HomePage() {
  const projects = DATA.selectedWorks.projects;

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
              <Highlighter action="crossed-off">
                {DATA.hero.headline.strike}
              </Highlighter>
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
              <p className="col-header-box mb-2">Online</p>
              <div className="space-y-1 mt-2">
                <Link
                  href={DATA.global.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block font-mono text-xs uppercase tracking-widest hover:text-primary transition-colors"
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
              <p className="col-header-box mb-2">Status</p>
              <p className="font-mono text-xs italic text-muted-foreground/70 mt-2">
                {DATA.hero.statusBadge}
              </p>
            </div>
          </div>
        }
      />

      {/* Portfolio section */}
      <section className="py-8 container" id="section-journey">
        <div className="border-t-2 border-foreground pt-1 mb-4">
          <span className="col-header-box">Portfolio</span>
          <DividerRule className="mt-1" />
        </div>

        {/* Row 1 — TinkerSim (col-span-2) + GitPilot + Placehold */}
        <div className="grid grid-cols-1 md:newspaper-grid">
          <div className="md:col-span-2 newspaper-col-first">
            <ArticleBlock
              featured
              sectionLabel={projects[0].category ?? "PROJECT"}
              title={projects[0].title}
              deck={projects[0].subtext}
              tags={projects[0].tags}
              href={projects[0].link}
              body={projects[0].bodyCopy}
            />
          </div>
          <div className="newspaper-col">
            <ArticleBlock
              sectionLabel={projects[1].category ?? "PROJECT"}
              title={projects[1].title}
              deck={projects[1].subtext}
              tags={projects[1].tags}
              href={projects[1].link}
              body={projects[1].bodyCopy}
            />
          </div>
          <div className="newspaper-col-last">
            <ArticleBlock
              sectionLabel={projects[2].category ?? "PROJECT"}
              title={projects[2].title}
              deck={projects[2].subtext}
              tags={projects[2].tags}
              href={projects[2].link}
              body={projects[2].bodyCopy}
            />
          </div>
        </div>

        <DividerRule variant="thick" className="my-0" />

        {/* Row 2 — EventPilot (col-span-2) + Draw + Doot */}
        <div className="grid grid-cols-1 md:newspaper-grid">
          <div className="md:col-span-2 newspaper-col-first">
            <ArticleBlock
              sectionLabel={projects[3].category ?? "PROJECT"}
              title={projects[3].title}
              deck={projects[3].subtext}
              tags={projects[3].tags}
              href={projects[3].link}
              body={projects[3].bodyCopy}
            />
          </div>
          <div className="newspaper-col">
            <ArticleBlock
              sectionLabel={projects[4].category ?? "PROJECT"}
              title={projects[4].title}
              deck={projects[4].subtext}
              tags={projects[4].tags}
              href={projects[4].link}
              body={projects[4].bodyCopy}
            />
          </div>
          <div className="newspaper-col-last">
            <ArticleBlock
              sectionLabel={projects[5].category ?? "PROJECT"}
              title={projects[5].title}
              deck={projects[5].subtext}
              tags={projects[5].tags}
              href={projects[5].link}
              body={projects[5].bodyCopy}
            />
          </div>
        </div>
      </section>

      {/* Experience section */}
      <section className="py-8 container" id="section-experience">
        <div className="border-t-2 border-foreground pt-1 mb-4">
          <span className="col-header-box">Professional Record</span>
          <DividerRule className="mt-1" />
        </div>

        <div className="grid grid-cols-1 md:newspaper-grid-3">
          {DATA.experience.roles.map((role, i) => (
            <div
              key={role.company}
              className={
                i === 0
                  ? "newspaper-col-first"
                  : i === DATA.experience.roles.length - 1
                    ? "newspaper-col-last"
                    : "newspaper-col"
              }
            >
              <ArchiveEntry
                period={role.period}
                company={role.company}
                role={role.role}
                description={role.longDescription ?? role.description}
                suppressInternalBorder
              />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

HomePage.displayName = "HomePage";
