"use client";

import { Fragment, useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import { products, site } from "@/content";
import { Deck } from "@/components/frame";

const all = products.flatMap((p, pi) =>
  p.shots.map((s) => ({ ...s, pi, name: p.name, alt: `${p.name}: ${s.caption}` })),
);
const first = (pi: number) => all.findIndex((s) => s.pi === pi);

const reducedMotion = "(prefers-reduced-motion: reduce)";
const subscribe = (cb: () => void) => {
  const mq = matchMedia(reducedMotion);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const subscribeVisibility = (cb: () => void) => {
  document.addEventListener("visibilitychange", cb);
  return () => document.removeEventListener("visibilitychange", cb);
};

// The one bold move on the page: the frame cycles through every product's
// screens and the headline underlines whose screen is showing. Hovering or
// focusing a name pins that product's screens. Tapping navigates.
export function Hero() {
  // dir tells the deck how to move: 1 = next card, 0 = jump (hover, or a pinned loop wrapping).
  const [{ i, dir }, setPos] = useState<{ i: number; dir: 0 | 1 }>({ i: 0, dir: 0 });
  const [pinned, setPinned] = useState<number | null>(null);
  const [paused, setPaused] = useState<boolean | null>(null);
  const reduce = useSyncExternalStore(
    subscribe,
    () => matchMedia(reducedMotion).matches,
    () => false,
  );
  // A hidden tab runs no animation frames; don't advance cards nobody can see.
  const hidden = useSyncExternalStore(
    subscribeVisibility,
    () => document.hidden,
    () => false,
  );
  const isPaused = paused ?? reduce;
  const shot = all[i]!;

  useEffect(() => {
    if (isPaused || hidden) return;
    const t = setInterval(() => {
      setPos(({ i }) => {
        if (pinned === null) return { i: (i + 1) % all.length, dir: 1 };
        const next = i + 1;
        return all[next]?.pi === pinned ? { i: next, dir: 1 } : { i: first(pinned), dir: 0 };
      });
    }, 3000);
    return () => clearInterval(t);
  }, [isPaused, hidden, pinned]);

  const pin = (pi: number) => {
    setPinned(pi);
    if (shot.pi !== pi) setPos({ i: first(pi), dir: 0 });
  };

  return (
    <section className="grid items-center gap-10 pt-10 pb-20 md:grid-cols-[6fr_5fr] md:pt-16">
      <div>
        <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">
          I build products end to end. Right now:{" "}
          {products.map((p, pi) => (
            <Fragment key={p.slug}>
              <Link
                href={`/work/${p.slug}`}
                onPointerEnter={() => pin(pi)}
                onPointerLeave={() => setPinned(null)}
                onFocus={() => pin(pi)}
                onBlur={() => setPinned(null)}
                className={`underline decoration-[0.08em] underline-offset-[0.14em] transition-colors ${
                  shot.pi === pi ? "decoration-accent" : "decoration-natural/50"
                }`}
              >
                {p.name}
              </Link>
              {pi < products.length - 2 ? ", " : pi === products.length - 2 ? " and " : "."}
            </Fragment>
          ))}
        </h1>
        <p className="mt-6 max-w-[42ch] text-lg leading-relaxed text-muted-foreground">
          {site.description}
        </p>
        <a
          href={`mailto:${site.email}`}
          className="mt-8 inline-flex h-11 items-center rounded-lg bg-primary px-5 font-medium text-primary-foreground transition-transform active:scale-[0.98]"
        >
          Email me
        </a>
      </div>

      <figure>
        <Deck shots={all} active={i} dir={dir} sizes="(min-width: 768px) 45vw, 100vw" />
        <figcaption className="mt-4 flex items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>
            {shot.name}: {shot.caption}
          </span>
          <button
            type="button"
            onClick={() => setPaused(!isPaused)}
            aria-label={isPaused ? "Play slideshow" : "Pause slideshow"}
            className="-m-2 rounded-md p-2 transition-colors hover:text-foreground"
          >
            {isPaused ? (
              <Play aria-hidden className="size-4" />
            ) : (
              <Pause aria-hidden className="size-4" />
            )}
          </button>
        </figcaption>
      </figure>
    </section>
  );
}
