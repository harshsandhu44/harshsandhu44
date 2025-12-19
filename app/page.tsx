"use client";

import { useRef } from "react";
import { ArrowBigDownIcon, BriefcaseIcon, CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Highlighter } from "@/components/ui/highlighter";
import BentoGrid from "@/components/ui/bento-grid";
import { DATA } from "@/lib/constants";
import { BlurFade } from "@/components/ui/blur-fade";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AnchorLink } from "@/components/anchor-link";
import { useAnimateOnScroll } from "@/lib/animations";

export default function HomePage() {
  const containerRef = useRef(null);
  useAnimateOnScroll(containerRef);

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
    <div ref={containerRef} className="mx-auto px-4 max-w-7xl">
      <section
        className="relative py-24 min-h-screen flex flex-col md:items-center justify-center md:text-center space-y-4"
        id="section-hero"
      >
        <Badge variant="outline" className="px-3 py-1 italic">
          {DATA.hero.statusBadge}
        </Badge>
        <h1 className="text-5xl md:text-7xl font-black max-w-prose">
          {DATA.hero.headline.start}
          <div className="inline-block relative">
            <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-sm text-primary font-cursive">
              {DATA.hero.headline.replace}
            </span>{" "}
            <Highlighter action="crossed-off">
              {DATA.hero.headline.strike}
            </Highlighter>
          </div>
          {DATA.hero.headline.end}
        </h1>
        <p className="text-xl max-w-prose">{DATA.hero.subHeadline}</p>
        <AnchorLink
          href="#journey-section"
          className={buttonVariants({ size: "lg" })}
        >
          {DATA.hero.cta} <ArrowBigDownIcon />
        </AnchorLink>
      </section>

      <section
        className="py-24 min-h-dvh flex flex-col md:items-center justify-center space-y-16"
        id="section-journey"
      >
        <h2 className="text-4xl md:text6xl font-black md:text-center max-w-prose">
          {DATA.selectedWorks.title}
        </h2>
        <BentoGrid items={projectItems} />
      </section>

      <section
        className="py-24 min-h-dvh flex flex-col md:items-center justify-center space-y-16"
        id="section-experience"
      >
        <h2 className="text-4xl md:text6xl font-black md:text-center max-w-prose">
          {DATA.experience.header}
        </h2>
        <div className="flex flex-col gap-8 relative pl-6 border-l border-muted">
          {DATA.experience.roles.map((item, index) => (
            <BlurFade
              key={item.company + index}
              delay={0.2 + index * 0.1}
              inView
              className="relative"
            >
              {/* Timeline Dot */}
              <span className="absolute -left-[29.5px] top-4 flex h-6 w-6 items-center justify-center rounded-full bg-background border border-muted ring-4 ring-background">
                <BriefcaseIcon className="h-3 w-3 text-muted-foreground" />
              </span>

              <Card className="shadow-none border-none bg-transparent pt-0">
                <CardHeader className="p-0 mb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex flex-col">
                      <CardTitle className="text-base font-semibold">
                        {item.company}
                      </CardTitle>
                      <CardDescription className="text-sm font-medium">
                        {item.role}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="secondary"
                      className="w-fit text-xs font-normal"
                    >
                      <CalendarIcon className="mr-1 h-3 w-3" />
                      {item.period}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-0 text-muted-foreground text-sm">
                  {item.description}
                </CardContent>
              </Card>
            </BlurFade>
          ))}
        </div>
      </section>
    </div>
  );
}

HomePage.displayName = "HomePage";
