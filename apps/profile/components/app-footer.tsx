import Link from "next/link";
import { DATA } from "@/lib/constants";

export function AppFooter() {
  const { tagline, subTagline, cta } = DATA.footer;
  const { email, socials } = DATA.global;
  const { edition, volume, publication } = DATA.editorial;
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background border-t-2 border-foreground">
      <div className="container py-6">
        {/* Masthead */}
        <div className="border-t-[3px] border-double border-background/40 pt-1 mb-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-center py-[2px] opacity-60">
            Personal Notices
          </p>
        </div>
        <div className="border-b border-background/20 mb-4" />

        {/* 3-column classified ads */}
        <div className="grid grid-cols-1 md:grid-cols-3">
          {/* Col 1 — Professional ad */}
          <div className="border-r border-background/20 pr-4 pb-4 md:pb-0">
            <span
              className="inline-block border border-background/40 px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.15em] mb-3"
            >
              Professional Ad
            </span>
            <h2 className="font-serif text-2xl md:text-3xl font-bold leading-tight mt-2">
              {tagline}
            </h2>
            <p className="font-mono text-xs opacity-75 mt-2">{subTagline}</p>
            <Link
              href={`mailto:${email}`}
              className="font-mono text-xs uppercase tracking-widest hover:opacity-70 transition-opacity mt-3 inline-block"
            >
              {cta} →
            </Link>
          </div>

          {/* Col 2 — Online */}
          <div className="border-r border-background/20 px-4 py-4 md:py-0">
            <span
              className="inline-block border border-background/40 px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.15em] mb-3"
            >
              Online
            </span>
            <div className="space-y-2 mt-2">
              <Link
                href={socials.github}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-mono text-xs uppercase tracking-[0.1em] opacity-75 hover:opacity-100 transition-opacity"
              >
                GitHub / harshsandhu44 ↗
              </Link>
              <Link
                href={socials.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-mono text-xs uppercase tracking-[0.1em] opacity-75 hover:opacity-100 transition-opacity"
              >
                LinkedIn / nyxfor13days ↗
              </Link>
              <Link
                href={socials.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="block font-mono text-xs uppercase tracking-[0.1em] opacity-75 hover:opacity-100 transition-opacity"
              >
                X (Twitter) / harshsandhu44 ↗
              </Link>
            </div>
          </div>

          {/* Col 3 — Colophon */}
          <div className="pl-4 pt-4 md:pt-0">
            <span
              className="inline-block border border-background/40 px-2 py-[2px] font-mono text-[10px] uppercase tracking-[0.15em] mb-3"
            >
              Colophon
            </span>
            <div className="space-y-1 mt-2">
              <p className="font-serif font-bold text-sm">{publication}</p>
              <p className="font-mono text-xs opacity-60">{volume} · {edition}</p>
              <p className="font-mono text-xs opacity-60">© {year} Harsh Sandhu</p>
              <p className="font-mono text-xs opacity-40 mt-3">
                Built with Next.js & Tailwind CSS
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

AppFooter.displayName = "AppFooter";
