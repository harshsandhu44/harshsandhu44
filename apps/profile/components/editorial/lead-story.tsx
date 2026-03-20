import { DividerRule } from "./divider-rule";
import { DATA } from "@/lib/constants";

interface LeadStoryProps {
  headline: React.ReactNode;
  deck: string;
  byline: string;
  statusNote?: string;
  cta?: React.ReactNode;
  sideRailContent?: React.ReactNode;
}

export function LeadStory({
  headline,
  deck,
  byline,
  statusNote,
  cta,
  sideRailContent,
}: LeadStoryProps) {
  const { edition, volume, publication, tagline } = DATA.editorial;
  const dateStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section id="section-hero" className="container section-newspaper">
      {/* Masthead — Tier 1 */}
      <div className="grid grid-cols-3 items-baseline border-b border-foreground pb-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em]">
          {volume} · {edition}
        </span>
        <span className="font-serif font-black text-2xl md:text-3xl text-center">
          {publication}
        </span>
        <span className="font-mono text-[10px] text-right">{dateStr}</span>
      </div>

      {/* Masthead — Tier 2 */}
      <div className="border-t-[3px] border-double border-foreground border-b border-foreground py-[2px]">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-center">
          {tagline}
        </p>
      </div>

      {/* Masthead — Tier 3 */}
      <div className="border-b border-border py-1 flex justify-between">
        <span className="font-mono text-[10px]">{dateStr}</span>
        <span className="font-mono text-[10px]">harshsandhu.com</span>
      </div>

      {/* Hero grid — 4 cols */}
      <div className="grid grid-cols-1 md:newspaper-grid mt-4">
        {/* Main content — spans 3 cols */}
        <div className="md:col-span-3 newspaper-col-first space-y-3">
          <div className="font-serif font-black text-4xl md:text-6xl leading-[1.0] tracking-tight">
            {headline}
          </div>

          <p className="newspaper-body text-muted-foreground">
            {deck}
          </p>

          <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
            {byline}
          </p>

          {statusNote && (
            <p className="font-mono text-xs italic text-muted-foreground/70 border-l-2 border-primary pl-3">
              {statusNote}
            </p>
          )}

          {cta && <div className="pt-2">{cta}</div>}
        </div>

        {/* Side rail */}
        {sideRailContent && (
          <aside className="newspaper-col-last flex flex-col gap-4 mt-4 md:mt-0">
            {sideRailContent}
          </aside>
        )}
      </div>
    </section>
  );
}

LeadStory.displayName = "LeadStory";
