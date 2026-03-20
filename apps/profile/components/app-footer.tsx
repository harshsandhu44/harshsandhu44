import Link from "next/link";
import { DATA } from "@/lib/constants";
import { DividerRule } from "@/components/editorial";

export function AppFooter() {
  const { tagline, subTagline, cta } = DATA.footer;
  const { email } = DATA.global;
  const { edition, volume } = DATA.editorial;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background border-t-2 border-foreground">
      <div className="container py-16 space-y-8">
        <DividerRule variant="thick" label="NOTICE BOARD" />

        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-8">
          <div className="space-y-3">
            <p className="font-mono text-xs uppercase tracking-widest opacity-60">
              PERSONAL ADVERTISEMENT
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold leading-tight">
              {tagline}
            </h2>
            <p className="font-sans text-base opacity-75">{subTagline}</p>
          </div>

          <div className="flex flex-col justify-end gap-3">
            <Link
              href={`mailto:${email}`}
              className="font-mono text-sm uppercase tracking-widest hover:opacity-70 transition-opacity"
            >
              {cta} →
            </Link>
            <div className="font-mono text-xs space-y-1 opacity-60">
              <p>GITHUB / harshsandhu44</p>
              <p>LINKEDIN / nyxfor13days</p>
            </div>
          </div>
        </div>

        <DividerRule variant="thin" />

        <p className="font-mono text-xs opacity-40 text-center">
          {edition} · {volume} · {year}
        </p>
      </div>
    </footer>
  );
}

AppFooter.displayName = "AppFooter";
