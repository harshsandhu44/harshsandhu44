import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Hero } from "@/components/hero";
import { experience, howIWork, offTheClock, products, site, socials, stack } from "@/content";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-8">
      <Hero />

      <section aria-labelledby="work" className="border-t py-16">
        <h2 id="work" className="text-2xl font-semibold">
          Work
        </h2>
        <ul className="mt-8 space-y-12">
          {products.map((p) => (
            <li key={p.slug} className="grid gap-3 md:grid-cols-[1fr_2fr] md:gap-8">
              <h3 className="text-3xl font-semibold tracking-tight">{p.name}</h3>
              <div className="max-w-[65ch]">
                <p className="text-lg leading-relaxed">{p.pitch}</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {p.role}, {p.year}. {p.stack.join(", ")}.
                </p>
                <p className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  <Link href={`/work/${p.slug}`} className="link">
                    Read the case study
                  </Link>
                  <a href={p.url} className="link inline-flex items-center gap-1">
                    {p.domain}
                    <ArrowUpRight aria-hidden className="size-4" />
                  </a>
                </p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {experience.length > 0 && (
        <section aria-labelledby="experience" className="border-t py-16">
          <h2 id="experience" className="text-2xl font-semibold">
            Experience
          </h2>
          <ol className="mt-8 space-y-8">
            {experience.map((r) => (
              <li key={r.company + r.years} className="grid gap-1 md:grid-cols-[1fr_2fr] md:gap-8">
                <p className="text-muted-foreground">{r.years}</p>
                <div className="max-w-[65ch]">
                  <h3 className="text-lg font-semibold">
                    {r.title}, {r.company}
                  </h3>
                  <p className="mt-1 leading-relaxed">{r.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section aria-labelledby="how" className="grid gap-3 border-t py-16 md:grid-cols-[1fr_2fr] md:gap-8">
        <h2 id="how" className="text-2xl font-semibold">
          How I work
        </h2>
        <div className="max-w-[65ch] space-y-4 leading-relaxed">
          <p className="text-lg">{howIWork}</p>
          <p className="text-muted-foreground">Tools I reach for: {stack.join(", ")}.</p>
        </div>
      </section>

      <footer className="border-t py-16">
        <h2 className="text-2xl font-semibold">Email me</h2>
        <a
          href={`mailto:${site.email}`}
          className="link mt-4 inline-block font-heading text-3xl font-semibold break-all sm:text-5xl"
        >
          {site.email}
        </a>
        <ul className="mt-8 flex gap-6">
          {socials.map((s) => (
            <li key={s.name}>
              <a href={s.url} className="link">
                {s.name}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-12 text-sm text-muted-foreground">Off the clock: {offTheClock}</p>
      </footer>
    </main>
  );
}
