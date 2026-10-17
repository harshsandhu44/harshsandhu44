import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { mailto, products, site, type Shot } from "@/content";
import { CsIndex } from "@/components/cs-index";
import { Exploded } from "@/components/exploded";
import { Motion } from "@/components/motion";
import { Signature } from "@/components/signature";
import { Arrow, Legal, Win, Wordmark, btn, skip } from "@/components/ui";

export const dynamicParams = false;

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = products.find((x) => x.slug === slug);
  return p ? { title: p.name, description: p.pitch } : {};
}

const index: [string, string][] = [
  ["problem", "The problem"],
  ["built", "What I built"],
  ["decisions", "Key decisions"],
  ["next", "What's next"],
];

const sec = "max-w-none pb-[72px] md:pb-24 lg:max-w-[700px]";
const secH = "disp mb-5 text-[9vw] leading-[.95] md:mb-7 md:text-[clamp(36px,3.4vw,52px)]";
const para = "mb-5 text-[17px] leading-[1.6] md:text-[19px]";

function Fig({ shot, domain, rise }: { shot: Shot; domain: string; rise?: boolean }) {
  return (
    <figure
      data-section={rise || undefined}
      className="mt-4 mb-[72px] perspective-[1800px] md:mt-6 md:mb-[104px]"
    >
      <Win url={domain} data-lift>
        <div
          data-parallax
          className="relative aspect-[4/3] overflow-hidden rounded-lg bg-ink md:aspect-video"
        >
          <Image
            src={shot.src}
            alt={shot.cap}
            fill
            sizes="(min-width: 1024px) 75vw, 100vw"
            className="object-cover object-left-top will-change-transform"
          />
        </div>
      </Win>
      <figcaption data-rise={rise || undefined} className="mt-3.5 text-[15px] text-muted">
        {shot.cap}
      </figcaption>
    </figure>
  );
}

export default async function CaseStudy({ params }: PageProps<"/work/[slug]">) {
  const { slug } = await params;
  const i = products.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  const c = products[i]!;
  const n = products[(i + 1) % products.length]!;
  const subject = mailto(`About ${c.name}`);

  return (
    <Motion className="overflow-x-clip bg-bg text-ink">
      <a className={skip} href="#cs-content">
        Skip to the write-up
      </a>

      <header>
        <nav
          aria-label="Main"
          className="grid-12 on-dark items-center bg-ink pt-5 text-paper [--color-muted:var(--color-soft)]"
        >
          <Link
            href="/"
            className="col-[1/span_4] justify-self-start py-3 text-base font-semibold no-underline decoration-2 underline-offset-[6px] hover:underline"
          >
            {site.name}
          </Link>
          <div className="col-[5/-1] flex items-center justify-end gap-5 text-base md:gap-8">
            <Link
              href="/#work"
              className="hidden py-3 no-underline decoration-2 underline-offset-[6px] hover:underline md:inline"
            >
              All work
            </Link>
            <a className={`${btn} min-h-[46px] px-5 text-base`} href={subject}>
              Email me
            </a>
          </div>
        </nav>

        <div className="grid-12 on-dark items-end gap-y-8 bg-ink pt-14 pb-[88px] text-paper [--color-muted:var(--color-soft)] md:gap-y-10 md:pt-[88px] lg:pt-[120px]">
          <div className="col-span-full lg:col-[1/span_8]">
            <div className="mask block">
              <h1
                data-hero-word
                className="disp text-[12vw] leading-[.9] tracking-[-0.035em] md:text-[clamp(56px,7vw,120px)]"
              >
                {c.name}
              </h1>
            </div>
            <p
              data-hero-fade
              className="mt-5 max-w-[22em] text-[21px] leading-[1.25] tracking-[-0.01em] md:mt-7 md:text-[clamp(22px,2vw,30px)]"
            >
              {c.pitch}
            </p>
          </div>
          <div
            data-hero-fade
            className="relative col-span-full flex min-h-[200px] flex-col justify-between self-stretch overflow-hidden bg-carbon p-[18px] [--color-bg:var(--color-lamp)] [--color-ink:var(--color-paper)] [--color-surface:var(--color-lamp)] md:min-h-[240px] md:p-6 lg:col-[9/-1] lg:min-h-[300px]"
          >
            <Signature slug={c.slug} />
          </div>
          <dl
            data-hero-fade
            className="col-span-full grid grid-cols-1 gap-4 pt-7 md:mt-6 md:grid-cols-2 md:gap-x-6 md:gap-y-5 lg:grid-cols-[1fr_1fr_2.4fr_1.4fr] lg:gap-6"
          >
            {[
              ["Role", c.role],
              ["Year", c.year],
              ["Stack", c.stack.join(", ")],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[15px] text-muted">{k}</dt>
                <dd className="mt-1 text-[17px]">{v}</dd>
              </div>
            ))}
            <div>
              <dt className="text-[15px] text-muted">Live</dt>
              <dd className="mt-1 text-[17px]">
                <a href={c.url} className="underline underline-offset-4 hover:decoration-[3px]">
                  {c.domain}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative px-4 pb-10 perspective-[1800px] before:absolute before:inset-x-0 before:top-0 before:h-[45%] before:bg-ink md:px-6">
          <Win url={c.domain} data-tilt-hero className="z-[1] mx-auto max-w-[1392px]">
            <div
              data-shutter="load"
              className="relative aspect-[4/3] overflow-hidden rounded-lg bg-ink md:aspect-video"
            >
              <Image
                src={c.hero.src}
                alt={c.hero.alt}
                fill
                priority
                sizes="100vw"
                data-zoom
                className="object-cover object-top"
              />
            </div>
          </Win>
        </div>
      </header>

      <main id="cs-content">
        <section
          aria-labelledby="tldr"
          data-section
          className="bg-ink py-16 text-paper md:py-[88px]"
        >
          <div className="grid-12">
            <h2
              id="tldr"
              data-rise
              className="disp col-span-full mb-7 text-[9vw] leading-[.95] text-accent md:mb-9 md:text-[clamp(40px,3.6vw,56px)] lg:col-[1/span_3] lg:mb-0"
            >
              In short
            </h2>
            <dl className="col-span-full grid gap-6 md:gap-7 lg:col-[4/-1]">
              {c.tldr.map((r) => (
                <div
                  key={r.k}
                  data-rise
                  className="grid grid-cols-1 items-baseline gap-y-1.5 md:grid-cols-[minmax(0,3fr)_minmax(0,9fr)] md:gap-x-6"
                >
                  <dt className="text-base text-soft">{r.k}</dt>
                  <dd className="max-w-[34em] text-[19px] leading-[1.35] tracking-[-0.005em] md:text-[clamp(20px,1.7vw,25px)]">
                    {r.v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section
          aria-label="In numbers"
          data-section
          className="grid-12 gap-y-9 pt-[72px] pb-[88px] md:gap-y-10 md:pt-24 md:pb-[120px]"
        >
          {c.nums.map((x) => (
            <p key={x.l} data-rise className="col-span-6 lg:col-span-3">
              <b className="disp block text-[9vw] leading-[.95] tracking-[-0.03em] tabular-nums md:text-[clamp(40px,3.8vw,64px)]">
                {x.n}
              </b>
              <span className="mt-3 block max-w-[16em] text-base text-muted">{x.l}</span>
            </p>
          ))}
        </section>

        <div className="grid-12 items-start pb-36">
          <CsIndex items={index} />

          <div className="col-span-full min-w-0 lg:col-[4/-1]">
            <section id="problem" data-section className={sec}>
              <h2 data-rise className={secH}>
                The problem
              </h2>
              {c.problem.map((t) => (
                <p key={t} data-rise className={para}>
                  {t}
                </p>
              ))}
            </section>
            <Fig shot={c.problemShot} domain={c.domain} rise />

            <section id="built" data-section className={sec}>
              <h2 data-rise className={secH}>
                What I built
              </h2>
              {c.arch && <Exploded arch={c.arch} />}
              {c.builtIntro && (
                <p data-rise className={para}>
                  {c.builtIntro}
                </p>
              )}
              <ul className="mt-2 mb-6 grid gap-1">
                {c.built.map((t) => (
                  <li
                    key={t}
                    data-rise
                    className="relative py-4 pl-7 text-[17px] leading-[1.55] before:absolute before:top-[27px] before:left-0 before:size-3 before:bg-accent even:-mx-4 even:bg-surface even:pr-4 even:pl-11 even:before:left-4 md:text-lg"
                  >
                    {t}
                  </li>
                ))}
              </ul>
              {c.builtOutro.map((t) => (
                <p key={t} data-rise className={para}>
                  {t}
                </p>
              ))}
            </section>

            <section id="decisions" data-section className="pb-0">
              <h2 data-rise className={`${secH} max-w-[700px]`}>
                Key decisions
              </h2>
              {c.decisions.map((d) => (
                <div key={d.h}>
                  <div data-rise className="mb-14 max-w-[700px] pt-3">
                    <h3 className="disp mb-4 text-[clamp(24px,2vw,30px)] leading-[1.1] tracking-[-0.015em]">
                      {d.h}
                    </h3>
                    <p className={para}>{d.p}</p>
                  </div>
                  {d.shot && <Fig shot={d.shot} domain={c.domain} />}
                </div>
              ))}
            </section>

            <section id="next" data-section className={sec}>
              <h2 data-rise className={secH}>
                What&apos;s next
              </h2>
              <p data-rise className={para}>
                {c.next}
              </p>
            </section>
          </div>
        </div>

        <div
          data-section
          className="flex flex-wrap items-center justify-between gap-6 bg-surface px-4 py-10 md:px-6 md:py-14"
        >
          <p
            data-rise
            className="disp text-[8vw] leading-none tracking-[-0.02em] md:text-[clamp(30px,3.2vw,48px)]"
          >
            Want to talk about it?
          </p>
          <a data-rise className={btn} href={subject}>
            Email me
            <Arrow />
          </a>
        </div>

        <Link
          href={`/work/${n.slug}`}
          className="group/next grid grid-cols-12 items-center gap-x-4 overflow-hidden bg-accent px-4 pt-[72px] pb-[88px] text-white no-underline perspective-[1800px] md:gap-x-6 md:px-6 md:pt-24 md:pb-28"
        >
          <div className="col-span-full lg:col-[1/span_6]">
            <span className="mb-3.5 block text-[17px] font-medium">Next case study</span>
            <b className="disp block text-[12vw] leading-[.9] tracking-[-0.03em] transition-[translate] duration-500 ease-soft group-hover/next:translate-x-5 md:text-[clamp(52px,6vw,100px)]">
              {n.name}
            </b>
            <em className="mt-7 inline-flex items-center gap-2.5 text-[17px] font-semibold not-italic">
              {n.pitch}
              <Arrow size={20} className="duration-300 group-hover/next:translate-x-1.5" />
            </em>
          </div>
          <div
            aria-hidden
            className="col-span-full mt-10 md:col-[2/-1] md:mt-12 lg:col-[7/-1] lg:mt-0"
          >
            <Win
              url={n.domain}
              className="transition-transform duration-700 ease-soft [transform:rotateY(-6deg)_rotateX(3deg)] group-hover/next:[transform:rotateY(-4deg)_rotateX(2deg)_translateX(2%)] md:[transform:rotateY(-10deg)_rotateX(5deg)_translateX(6%)]"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-ink">
                <Image
                  src={n.hero.src}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover object-left-top"
                />
              </div>
            </Win>
          </div>
        </Link>
      </main>

      <footer className="chequer on-dark bg-ink pt-20 pb-[22px] text-paper md:pt-[120px]">
        <div className="px-4 md:px-6">
          <Wordmark />
        </div>
        <Legal>
          <Link href="/" className="underline-offset-4 hover:underline">
            Back to all work
          </Link>
        </Legal>
      </footer>
    </Motion>
  );
}
