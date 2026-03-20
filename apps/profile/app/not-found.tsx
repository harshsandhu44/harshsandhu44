"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DividerRule, SectionLabel, MetadataRow } from "@/components/editorial";

export default function NotFound() {
  const path = usePathname();
  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl space-y-6">
        <MetadataRow
          items={[
            { value: "THE HARSH SANDHU DAILY" },
            { label: "FILED", value: date },
          ]}
        />

        <DividerRule variant="double" />

        <div className="py-2 text-center">
          <SectionLabel>BREAKING — ERROR 404</SectionLabel>
        </div>

        <DividerRule variant="double" />

        <div className="space-y-4 pt-2">
          <h1 className="font-serif font-black text-6xl md:text-8xl leading-none tracking-tight">
            STORY NOT FOUND
          </h1>

          <DividerRule variant="thick" />

        <p className="font-serif text-xl md:text-2xl text-muted-foreground leading-relaxed italic">
            Requested dispatch at{" "}
            <span className="font-mono text-base not-italic text-foreground bg-muted px-1">
              {path}
            </span>{" "}
            could not be located in our archives.
          </p>

          <p className="font-sans text-base text-muted-foreground leading-relaxed">
            Our editorial team has searched the archives extensively. The story
            you seek may have been retracted, relocated to a different section,
            or simply never filed. We regret the inconvenience.
          </p>
        </div>

        <DividerRule variant="thin" />

        <div className="flex items-center justify-between pt-2">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted-foreground">
            LATE EDITION · CORRECTION ISSUED
          </span>
          <Link
            href="/"
            className="font-mono text-xs uppercase tracking-widest hover:text-primary transition-colors"
          >
            Return to Front Page →
          </Link>
        </div>
      </div>
    </div>
  );
}
