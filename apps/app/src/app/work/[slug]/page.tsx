import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { products, site } from "@/content";
import { CaseFrame, Shot } from "@/components/frame";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = products.find((x) => x.slug === slug);
  return p ? { title: p.name, description: p.pitch } : {};
}

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const p = products.find((x) => x.slug === slug);
  if (!p) notFound();
  const { default: Body } = await import(`@/work/${slug}.mdx`);

  return (
    <main className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-8 md:pt-16">
      <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">{p.name}</h1>
      <p className="mt-4 max-w-[48ch] text-xl leading-relaxed text-muted-foreground">{p.pitch}</p>

      <dl className="mt-8 grid gap-x-10 gap-y-4 text-sm sm:grid-cols-[auto_auto_1fr_auto]">
        <div>
          <dt className="text-muted-foreground">Role</dt>
          <dd>{p.role}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Year</dt>
          <dd>{p.year}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Stack</dt>
          <dd>{p.stack.join(", ")}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Live</dt>
          <dd>
            <a href={p.url} className="link inline-flex items-center gap-1">
              {p.domain}
              <ArrowUpRight aria-hidden className="size-4" />
            </a>
          </dd>
        </div>
      </dl>

      <div className="mt-16 md:grid md:grid-cols-[minmax(0,65ch)_1fr] md:gap-12">
        <article>
          <Body
            components={{
              Shot: ({ n }: { n: number }) => <Shot shot={p.shots[n - 1]!} n={n} name={p.name} />,
            }}
          />
        </article>
        <div className="hidden md:block">
          {/* Bleeds into the right margin so dense app screens stay legible. */}
          <div className="sticky top-24 w-[calc(100%+max(0px,(100vw-72rem)/2)+0.5rem)]">
            <CaseFrame shots={p.shots} name={p.name} />
          </div>
        </div>
      </div>

      <p className="mt-20 border-t pt-10 text-lg">
        Want to talk about it?{" "}
        <a href={`mailto:${site.email}`} className="link">
          Email me
        </a>
        .
      </p>
    </main>
  );
}
