import { MetadataRow } from "./metadata-row";
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

  return (
    <section id="section-hero" className="container py-24 min-h-screen flex flex-col justify-center">
      {/* Masthead metadata */}
      <MetadataRow
        className="mb-4"
        items={[
          { value: publication },
          { value: volume },
          { value: edition },
        ]}
      />

      <DividerRule variant="thick" className="mb-2" />

      <div className="mb-4">
        <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground text-center py-1">
          {tagline}
        </p>
      </div>

      <DividerRule variant="thin" className="mb-8" />

      {/* Lead story grid */}
      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8 md:gap-12">
        {/* Main content */}
        <div className="space-y-4">
          <div className="font-serif font-black text-5xl md:text-7xl leading-[1.05] tracking-tight">
            {headline}
          </div>

          <p className="font-sans text-lg leading-relaxed text-muted-foreground max-w-xl">
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

        {/* Side rail — hidden on mobile */}
        {sideRailContent && (
          <aside className="hidden md:flex flex-col gap-4 border-l border-border pl-8">
            {sideRailContent}
          </aside>
        )}
      </div>
    </section>
  );
}

LeadStory.displayName = "LeadStory";
