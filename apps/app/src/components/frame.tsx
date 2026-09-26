"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MotionConfig, motion } from "motion/react";
import type { Shot as ShotData } from "@/content";

const DEPTH = 3; // cards visible in the stack
const PEEK = 18; // px each card behind peeks above the one in front
// Soft, slightly underdamped: cards settle with a little give, like paper.
const spring = { type: "spring", stiffness: 120, damping: 17, mass: 0.9 } as const;
const fadeIn = { duration: 0.4, ease: "easeOut" } as const;
// The leaving card stays solid while it drops, then fades; fading from the
// start blends it into the card behind it.
const fadeOut = { duration: 0.5, ease: "easeIn" } as const;
const card =
  "overflow-hidden rounded-xl border bg-muted shadow-[0_24px_48px_-24px_oklch(0.2_0.03_115/0.45)]";

// Where a card rests k places from the top. k = DEPTH is the slot behind the
// stack where cards fade in and out; k = -1 is the slot in front of it, below
// the top card. Cards stay opaque (see-through layers turn to mud); a scrim
// fades the ones behind.
const slot = (k: number) => ({
  y: -k * PEEK,
  scale: 1 - k * 0.06,
  opacity: k >= 0 && k < DEPTH ? 1 : 0,
});
const behind = slot(DEPTH);
const below = { ...slot(-1), y: PEEK * 3.5, scale: 1.05 };
// Keyframes that start from a fixed slot, so a card never travels visibly from
// wherever it last faded out.
const from = (a: ReturnType<typeof slot>, b: ReturnType<typeof slot>) => ({
  y: [a.y, b.y],
  scale: [a.scale, b.scale],
  opacity: [a.opacity, b.opacity],
});

// Screenshots as a stack of cards moving towards you. Next (dir 1): every card
// steps forward a slot, the top card carries on down and fades out, and a new
// card fades in at the back. Previous (dir -1) runs it backwards. A jump
// (dir 0) just springs each card to its new slot.
// Shared by the hero and the case-study sticky frame.
export function Deck({
  shots,
  active,
  dir,
  sizes,
}: {
  shots: { src: string; alt: string }[];
  active: number;
  dir: -1 | 0 | 1;
  sizes: string;
}) {
  const n = shots.length;

  return (
    // Reduced motion: transforms snap, only the opacity fades.
    <MotionConfig reducedMotion="user">
      <div className="relative aspect-[16/9]" style={{ marginTop: (DEPTH - 1) * PEEK }}>
        {shots.map((s, j) => {
          const p = (j - active + n) % n;
          const leaving = dir === 1 && p === n - 1; // was on top, exits below
          const k = leaving ? -1 : Math.min(p, DEPTH);
          const target = leaving
            ? below
            : dir === 1 && p === DEPTH - 1
              ? from(behind, slot(p)) // joins at the back
              : dir === -1 && p === 0
                ? from(below, slot(0)) // comes back in from below
                : slot(k);
          return (
            <motion.div
              key={s.src}
              initial={false}
              animate={{
                ...target,
                transition: {
                  ...spring,
                  delay: dir ? Math.max(k, 0) * 0.04 : 0,
                  opacity: leaving ? fadeOut : fadeIn,
                },
              }}
              style={{
                transformOrigin: "50% 0%",
                zIndex: leaving ? DEPTH + 1 : p < DEPTH ? DEPTH - p : 0,
              }}
              className={`absolute inset-0 ${card}`}
              aria-hidden={p > 0}
            >
              <Image
                src={s.src}
                alt={p === 0 ? s.alt : ""}
                fill
                priority={j === 0}
                sizes={sizes}
                className="object-cover object-top"
              />
              <div
                style={{ opacity: Math.max(k, 0) * 0.35 }}
                className="pointer-events-none absolute inset-0 bg-background transition-opacity duration-400 motion-reduce:transition-none"
              />
            </motion.div>
          );
        })}
      </div>
    </MotionConfig>
  );
}

// Placed in the MDX before the prose it illustrates. Inline card on mobile;
// on desktop it's an invisible marker that CaseFrame watches.
export function Shot({ shot, n, name }: { shot: ShotData; n: number; name: string }) {
  return (
    <figure data-shot={n} className="my-10 md:my-0 md:h-px">
      <MotionConfig reducedMotion="user">
        <motion.div
          initial={{ opacity: 0, y: 32, rotate: n % 2 ? -1.5 : 1.5 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={spring}
          className={`relative aspect-[16/9] md:hidden ${card}`}
        >
          <Image
            src={shot.src}
            alt={`${name}: ${shot.caption}`}
            fill
            sizes="100vw"
            className="object-cover object-top"
          />
        </motion.div>
      </MotionConfig>
      <figcaption className="mt-3 text-sm text-muted-foreground md:hidden">
        {shot.caption}
      </figcaption>
    </figure>
  );
}

// Desktop sticky deck: shows the last Shot marker that has scrolled above the
// middle of the viewport.
export function CaseFrame({ shots, name }: { shots: ShotData[]; name: string }) {
  const [{ active, dir }, setState] = useState<{ active: number; dir: -1 | 0 | 1 }>({
    active: 0,
    dir: 0,
  });

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("[data-shot]")];
    // Fires whenever a marker crosses the middle line, in either direction.
    const io = new IntersectionObserver(
      () => {
        const passed = els.filter((el) => el.getBoundingClientRect().top < innerHeight / 2);
        const next = passed.length ? Number(passed.at(-1)!.dataset.shot) - 1 : 0;
        setState((s) =>
          s.active === next
            ? s
            : { active: next, dir: next === s.active + 1 ? 1 : next === s.active - 1 ? -1 : 0 },
        );
      },
      { rootMargin: "0px 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <figure>
      <Deck
        shots={shots.map((s) => ({ src: s.src, alt: `${name}: ${s.caption}` }))}
        active={active}
        dir={dir}
        sizes="(min-width: 1152px) 560px, 45vw"
      />
      <figcaption className="mt-4 text-sm text-muted-foreground">
        {shots[active]!.caption}
      </figcaption>
    </figure>
  );
}
