import { Fragment, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  about,
  facts,
  gallery,
  howIWork,
  offTheClock,
  products,
  site,
  socials,
  stack,
  tools,
} from "@/content";
import { Blueprint } from "@/components/blueprint";
import { Gantry } from "@/components/gantry";
import { Menu } from "@/components/menu";
import { Motion } from "@/components/motion";
import {
  Arrow,
  ArrowUpRight,
  Avail,
  Legal,
  Win,
  Wordmark,
  btn,
  btnGhost,
  h2,
  skip,
} from "@/components/ui";
import { Work, type WorkItem } from "@/components/work";
import { Mark, marks } from "@/wordmark";

// The GitHub section refreshes hourly.
export const revalidate = 3600;

const navLink = "py-3 no-underline decoration-2 underline-offset-[6px] hover:underline";
const section = "py-[104px] md:py-32 lg:py-[168px]";
const sectionHead = "mb-10 md:mb-16";

const work: WorkItem[] = [
  ...products.map((p) => ({
    name: p.name,
    kind: p.kind,
    desc: p.desc,
    stack: p.stack.join(", "),
    site: p.url,
    siteLabel: p.domain,
    bar: p.domain,
    cap: p.card.cap,
    caseHref: `/work/${p.slug}`,
    img: { src: p.card.src, alt: p.card.alt },
  })),
  ...tools.map((t) => ({
    name: t.name,
    kind: t.kind,
    desc: t.desc,
    stack: t.stack,
    site: t.url,
    siteLabel: t.label,
    bar: t.bar,
    cap: t.cap,
  })),
];

// Gallery figures a–d: the grid columns and ratios at each size.
const figs = [
  { col: "md:col-[1/span_6] lg:col-[1/span_8]", frame: "lg:aspect-[16/10]" },
  { col: "md:col-[7/-1] lg:col-[9/-1]", frame: "lg:aspect-[4/5]" },
  { col: "md:col-[1/span_6] md:mt-14 lg:col-[1/span_4] lg:mt-20", frame: "lg:aspect-[4/5]" },
  { col: "md:col-[7/-1] md:mt-14 lg:col-[5/-1] lg:mt-20", frame: "lg:aspect-[16/10]" },
];

const contactRow =
  "group/row flex items-center justify-between gap-6 px-4 pt-5 pb-[22px] disp text-[6.4vw] leading-none tracking-[-0.02em] no-underline transition-colors duration-250 md:px-6 md:pt-[30px] md:pb-[34px] md:text-[clamp(32px,4.2vw,64px)]";
const rowLink = `${contactRow} hover:bg-accent hover:text-white`;

function RowMeta({ children }: { children: string }) {
  return (
    // The design leaves this in the display face's italic 800; set back to body text.
    <span className="hidden items-center gap-2.5 font-sans text-lg font-normal tracking-normal text-muted not-italic [font-stretch:100%] group-hover/row:text-white md:flex">
      {children}
      <ArrowUpRight className="duration-300 group-hover/row:translate-x-1 group-hover/row:-translate-y-1" />
    </span>
  );
}

export default function Home() {
  return (
    <Motion className="overflow-x-clip bg-bg text-ink">
      <a className={skip} href="#work">
        Skip to work
      </a>

      <header
        id="top"
        className="on-dark relative grid min-h-[min(100svh,780px)] grid-rows-[auto_1fr_auto] bg-ink text-paper md:min-h-[max(640px,100svh)]"
      >
        <nav aria-label="Main" className="grid-12 items-center pt-3 md:pt-5">
          <a
            href="#top"
            data-hero-fade
            className={`col-span-5 justify-self-start text-base font-semibold ${navLink}`}
          >
            {site.name}
          </a>
          <div data-hero-fade className="col-[7/-1] hidden justify-between gap-4 text-base md:flex">
            <a href="#work" className={navLink}>
              Work
            </a>
            <a href="#how" className={navLink}>
              How I work
            </a>
            <a href="#about" className={navLink}>
              About
            </a>
            <a href="#contact" className={navLink}>
              Contact
            </a>
          </div>
          <Menu />
        </nav>

        <div className="flex items-center justify-center px-4 pt-4 pb-6 short:px-4 short:pt-2 short:pb-4 md:px-6 md:pt-6 md:pb-24">
          <h1 className="sr-only">
            {site.name}, {site.role.toLowerCase()}
          </h1>
          <div className="disp flex flex-col items-stretch gap-[.08em] text-center text-[14vw] leading-[.9] whitespace-nowrap text-paper short:text-[12vw] md:flex-row md:items-center md:gap-[.16em] md:text-[clamp(48px,7.6vw,128px)] md:leading-[.92]">
            <span className="mask self-center" aria-hidden>
              <span data-hero-word>
                <Mark m={marks.harsh} className="block h-[.772em] w-auto" />
              </span>
            </span>
            <Gantry />
            <span className="mask self-center" aria-hidden>
              <span data-hero-word>
                <Mark m={marks.sandhu} className="block h-[.772em] w-auto" />
              </span>
            </span>
          </div>
        </div>

        <div className="grid-12 items-end gap-y-4 pb-6 md:gap-y-6 md:pb-7">
          <p
            data-hero-fade
            className="order-3 col-span-full pt-2 text-base text-soft md:order-none md:col-[1/span_5] md:pt-0 lg:col-[1/span_4]"
          >
            Right now:{" "}
            {products.map((p, i) => (
              <Fragment key={p.slug}>
                <Link
                  href={`/work/${p.slug}`}
                  className="text-paper underline underline-offset-4 hover:decoration-[3px]"
                >
                  {p.name}
                </Link>
                {i < products.length - 2 ? ", " : i === products.length - 2 ? " and " : "."}
              </Fragment>
            ))}
          </p>
          <p
            data-hero-fade
            className="order-1 col-span-full text-[clamp(20px,1.6vw,24px)] leading-[1.35] font-medium tracking-[-0.01em] md:order-none md:col-[6/-1] lg:col-[5/span_5]"
          >
            I build products end to end.
            <span className="mt-1.5 block max-w-[30em] text-base leading-normal font-normal tracking-normal short:hidden md:mt-2.5 md:text-[17px]">
              Product engineer, five years in. I take an idea from the first sketch through
              architecture, launch and every lap after it.
            </span>
            <Avail className="mt-2.5 md:mt-3.5" />
          </p>
          <div
            data-hero-fade
            className="order-2 col-span-full flex gap-2.5 md:order-none md:flex-wrap md:justify-self-start lg:col-[10/-1] lg:justify-end lg:justify-self-end"
          >
            <a
              className={`${btn} flex-auto justify-between px-[18px] md:flex-none md:px-[26px]`}
              href={`mailto:${site.email}?subject=Hello%20Harsh`}
            >
              Email me
              <Arrow />
            </a>
            <a className={`${btnGhost} flex-none gap-2 md:gap-3`} href={site.linkedin}>
              LinkedIn
              <ArrowUpRight />
            </a>
          </div>
        </div>
      </header>

      <main>
        <section id="work" data-section className={section}>
          <div className="grid-12">
            <div data-rise className="col-span-full mb-14 md:col-[1/span_9] lg:col-[1/span_6]">
              <h2 className={h2}>Solo builds, 2026</h2>
              <p className="mt-4 max-w-[30em] text-[17px] text-muted">
                Four products I designed, built and shipped alone, plus one small tool I use every
                day.
              </p>
            </div>
          </div>
          <Work items={work} />
        </section>

        <section aria-labelledby="gal-h" data-section className="pb-[104px] md:pb-32 lg:pb-[168px]">
          <div className="grid-12">
            <div
              data-rise
              className={`col-span-full md:col-[1/span_9] lg:col-[1/span_5] ${sectionHead}`}
            >
              <h2 id="gal-h" className={h2}>
                Shipped, not mocked up
              </h2>
              <p className="mt-4 text-[17px] text-muted">
                Every screen on this page is the real product, captured from production.
              </p>
            </div>
          </div>
          <div className="-mt-6 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto overscroll-x-contain px-4 pt-6 pb-12 [scrollbar-width:none] md:mt-0 md:grid md:snap-none md:grid-cols-12 md:gap-x-5 md:overflow-visible md:px-6 md:py-0 lg:gap-x-6">
            {gallery.map((g, i) => (
              <figure
                key={g.src}
                data-rise
                className={`flex-[0_0_84%] snap-start perspective-[1800px] ${figs[i]!.col}`}
              >
                <Win url={g.domain} data-lift>
                  <div
                    data-parallax
                    className={`relative aspect-[4/3] overflow-hidden rounded-lg bg-ink ${figs[i]!.frame}`}
                  >
                    <Image
                      src={g.src}
                      alt={g.alt}
                      fill
                      sizes="(min-width: 1024px) 66vw, (min-width: 641px) 50vw, 84vw"
                      className="object-cover will-change-transform"
                      style={{ objectPosition: g.pos }}
                    />
                  </div>
                </Win>
                <figcaption className="mt-3.5 text-[15px] text-muted">{g.cap}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section
          id="how"
          aria-labelledby="how-h"
          data-section
          className="overflow-hidden bg-accent px-4 py-[72px] text-white md:px-6 md:pt-24 md:pb-[88px]"
        >
          <h2 id="how-h" className="sr-only">
            How I work
          </h2>
          <ul className="disp">
            {howIWork.map((h) => (
              <li
                key={h.word}
                data-rise
                className="group/p block pb-[22px] md:flex md:items-baseline md:justify-between md:gap-6 md:pb-0"
              >
                <span data-drift className="block will-change-transform">
                  <span className="inline-block text-[11vw] leading-[.96] tracking-[-0.03em] transition-[translate,color] duration-450 ease-soft group-hover/p:translate-x-6 group-hover/p:text-ink md:text-[clamp(52px,7.6vw,124px)]">
                    {h.word}
                  </span>
                </span>
                <span className="mt-1.5 block text-left text-base md:mt-0 md:text-right md:text-[19px] md:whitespace-nowrap">
                  {h.detail}
                </span>
              </li>
            ))}
          </ul>
          <p
            data-rise
            className="mt-10 max-w-[24em] text-[clamp(22px,2.2vw,32px)] leading-[1.25] tracking-[-0.01em] md:mt-[72px]"
          >
            I work across the whole product. I would rather ship one narrow release that works than
            a broad one that half does.
          </p>
        </section>

        <section
          id="about"
          aria-labelledby="about-h"
          data-section
          className="pt-[104px] pb-20 md:pt-32 md:pb-[120px] lg:pt-[168px]"
        >
          <h2 id="about-h" className="sr-only">
            About
          </h2>
          <div className="grid-12">
            <dl
              data-rise
              className="col-span-full grid grid-cols-2 content-start gap-[22px] md:col-[1/span_4] md:grid-cols-1 lg:col-[1/span_3]"
            >
              {facts.map((f) => (
                <div key={f.k}>
                  <dt className="text-[15px] text-muted">{f.k}</dt>
                  <dd className="mt-0.5 text-[17px]">{f.v}</dd>
                </div>
              ))}
            </dl>
            <p
              data-rise
              className="col-span-full mt-10 text-[clamp(20px,1.75vw,26px)] leading-[1.38] tracking-[-0.005em] md:col-[5/-1] md:mt-0 lg:col-[5/span_7]"
            >
              {about}
            </p>
          </div>
          <div className="grid-12 mt-[72px] md:mt-24 lg:mt-32">
            <p
              data-rise
              className="col-span-full text-base text-muted md:mb-9 lg:col-[1/span_3] lg:mb-0"
            >
              What I reach for, and what I do when I am not building.
            </p>
            <List title="Stack" rows={stack} className="md:col-[1/span_6] lg:col-[5/span_3]" />
            <List
              title="Off the clock"
              rows={offTheClock}
              className="md:col-[7/-1] lg:col-[9/span_3]"
            />
          </div>
        </section>

        <Blueprint />

        <section id="contact" aria-labelledby="contact-h" data-section>
          <div
            data-rise
            className="flex flex-col gap-2 px-4 pb-5 md:flex-row md:items-baseline md:justify-between md:gap-6 md:px-6 md:pb-7"
          >
            <h2 id="contact-h" className={h2}>
              Get in touch
            </h2>
            <p className="text-[17px] text-muted">Email is the fastest way to reach me.</p>
          </div>
          <div>
            <a data-rise href={`mailto:${site.email}`} className={`${rowLink} bg-surface`}>
              {site.email}
              <RowMeta>Email</RowMeta>
            </a>
            {socials.map((s, i) => (
              <a
                key={s.name}
                data-rise
                href={s.url}
                className={`${rowLink} ${i % 2 ? "bg-surface" : "bg-bg"}`}
              >
                {s.name}
                <RowMeta>{s.handle}</RowMeta>
              </a>
            ))}
            <div
              data-rise
              className={`${contactRow} bg-accent text-white md:justify-start md:bg-surface md:text-ink`}
            >
              Say hello
              {/* On the phone the row itself is red, so the button goes ink to stay visible. */}
              <a
                href={`mailto:${site.email}?subject=Hello%20Harsh`}
                aria-label="Email Harsh"
                className="ml-6 inline-flex size-14 items-center justify-center rounded-full bg-ink text-white transition-[rotate,scale,background-color] duration-300 ease-soft hover:-rotate-45 hover:bg-ink active:scale-[.94] md:size-[.9em] md:bg-accent"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="square"
                  aria-hidden
                  className="size-[22px] md:size-[.4em]"
                >
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="chequer on-dark grid gap-y-14 bg-ink pt-20 pb-[22px] text-paper [--focus:var(--color-accent)] md:gap-y-[72px] md:pt-[120px] lg:gap-y-24">
        <div className="grid-12">
          <FootCol title="Work">
            {products.map((p) => (
              <li key={p.slug}>
                <a href={p.url} className={footLink}>
                  {p.name}
                </a>
              </li>
            ))}
            {tools.map((t) => (
              <li key={t.name}>
                <a href={t.url} className={footLink}>
                  {t.name}
                </a>
              </li>
            ))}
          </FootCol>
          <FootCol title="Elsewhere">
            {socials.map((s) => (
              <li key={s.name}>
                <a href={s.url} className={footLink}>
                  {s.name}
                </a>
              </li>
            ))}
          </FootCol>
          <FootCol title="Contact">
            <li>
              <a href={`mailto:${site.email}`} className={footLink}>
                {site.email}
              </a>
            </li>
            <li>Based in India</li>
          </FootCol>
          <FootCol title="This page">
            <li>
              <a href="#top" className={footLink}>
                Back to the start lights
              </a>
            </li>
            <li>Designed and built end to end</li>
          </FootCol>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-8 px-4 md:px-6">
          <p className="disp text-[8vw] leading-none tracking-[-0.02em] md:text-[clamp(30px,3.4vw,52px)]">
            Lights out, and away we build.
          </p>
          <a className={btn} href={`mailto:${site.email}?subject=Let%27s%20build%20something`}>
            Start a project
            <Arrow />
          </a>
        </div>
        <div>
          <div data-fword className="px-4 md:px-6">
            <Wordmark />
          </div>
          <Legal>
            <span>{site.role}</span>
          </Legal>
        </div>
      </footer>
    </Motion>
  );
}

function List({ title, rows, className }: { title: string; rows: string[][]; className: string }) {
  return (
    <ul data-rise className={`col-span-full mt-8 text-base md:mt-0 ${className}`}>
      <li className="flex justify-between gap-4 pt-1.5 pb-3.5 font-semibold">{title}</li>
      {rows.map(([k, v]) => (
        <li key={k} className="flex justify-between gap-4 py-1.5">
          <span>{k}</span>
          <span className="text-muted">{v}</span>
        </li>
      ))}
    </ul>
  );
}

const footLink =
  "inline-block py-1 no-underline underline-offset-4 hover:text-paper hover:underline";

function FootCol({ title, children }: { title: string; children: ReactNode }) {
  return (
    <ul className="col-span-6 mb-8 text-base text-soft md:mb-7 lg:col-span-3 lg:mb-0 [&>li]:py-[3px]">
      <li className="!pb-2.5 font-semibold text-paper">{title}</li>
      {children}
    </ul>
  );
}
