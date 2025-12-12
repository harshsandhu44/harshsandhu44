import Link from "next/link";
import { ArrowBigDownIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Highlighter } from "@/components/ui/highlighter";
import BentoGrid from "@/components/ui/bento-grid";
import { DATA } from "@/lib/constants";

export default function HomePage() {
  const projectItems = DATA.selectedWorks.projects.map((project) => ({
    id: project.id,
    title: project.title,
    description: project.subtext,
    image: project.image,
    href: project.link,
    tags: project.tags,
    colSpan: project.id === "spear-education" ? 2 : (1 as 2 | 1 | 3),
  }));

  return (
    <div className="mx-auto px-2 md:px-4 max-w-7xl">
      <section
        className="relative py-24 min-h-dvh flex flex-col md:items-center justify-center md:text-center space-y-4"
        id="hero-section"
      >
        <Badge variant="outline" className="px-3 py-1 italic">
          {DATA.hero.statusBadge}
        </Badge>
        <h1 className="text-5xl md:text-7xl font-black max-w-prose">
          {DATA.hero.headline.start}
          <div className="inline-block relative">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm text-primary font-cursive">
              {DATA.hero.headline.replace}
            </span>
            <Highlighter action="crossed-off">
              {DATA.hero.headline.strike}
            </Highlighter>
          </div>
          {DATA.hero.headline.end}
        </h1>
        <p className="text-xl max-w-prose">{DATA.hero.subHeadline}</p>
        <Button asChild className="mt-4" size="lg">
          <Link href="#journey-section">
            {DATA.hero.cta} <ArrowBigDownIcon />
          </Link>
        </Button>
      </section>

      <section
        className="py-24 min-h-dvh flex flex-col md:items-center justify-center space-y-16"
        id="journey-section"
      >
        <h2 className="text-4xl md:text6xl font-black md:text-center max-w-prose">
          {DATA.selectedWorks.title}
        </h2>
        <BentoGrid items={projectItems} />
      </section>
    </div>
  );
}

HomePage.displayName = "HomePage";
