"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);
// Each page has only some of the targets below (no gantry on a case study); missing ones are fine.
gsap.config({ nullTargetWarn: false });

// Every GSAP effect in the design, driven by data attributes on server-rendered markup:
//   data-hero-word / data-gantry / data-hero-fade  intro on load (start states in globals.css)
//   data-section > data-rise                        staggered reveal when the section scrolls in
//   data-shutter="scroll" | "load" > data-zoom      clip-path wipe down, image settles from 1.12
//   data-parallax img, data-drift, data-lift        scrubbed with scroll
//   data-tilt                                       follows the pointer (desktop hover only)
//   data-tilt-hero, data-fword                      case-study hero window, footer wordmark
// Reduced motion skips all of it and the page renders static.
export function Motion({ className, children }: { className?: string; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      const once = (trigger: Element, start = "top 88%") => ({ trigger, start, once: true });
      const scrub = (
        trigger: Element,
        s: number | true,
        start = "top bottom",
        end = "bottom top",
      ) => ({
        trigger,
        start,
        end,
        scrub: s,
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const home = q("[data-gantry]").length > 0;
        gsap.fromTo(
          q("[data-hero-word]"),
          { y: 0, yPercent: 112 },
          { yPercent: 0, duration: 1.2, ease: "expo.out", stagger: 0.14, delay: 0.1 },
        );
        gsap.fromTo(
          q("[data-gantry]"),
          { scaleX: 0 },
          { scaleX: 1, duration: 0.9, ease: "expo.out", delay: 0.25 },
        );
        gsap.fromTo(
          q("[data-hero-fade]"),
          { y: 18, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.07,
            delay: home ? 0.55 : 0.35,
          },
        );

        q("[data-section]").forEach((sec) => {
          const items = sec.querySelectorAll("[data-rise]");
          if (!items.length) return;
          gsap.from(items, {
            y: 28,
            opacity: 0,
            duration: 0.9,
            ease: "power3.out",
            stagger: 0.075,
            scrollTrigger: once(sec),
          });
        });

        q<HTMLElement>("[data-shutter]").forEach((el) => {
          const onScroll = el.dataset.shutter === "scroll";
          gsap
            .timeline(onScroll ? { scrollTrigger: once(el) } : { delay: 0.5 })
            .fromTo(
              el,
              { clipPath: "inset(0% 0% 100% 0%)" },
              { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "expo.inOut" },
            )
            .from(
              el.querySelectorAll("[data-zoom]"),
              { scale: 1.12, duration: 1.5, ease: "expo.out" },
              0.15,
            );
        });

        q("[data-parallax] img").forEach((img) => {
          gsap.fromTo(
            img,
            { scale: 1.1, yPercent: -3 },
            { scale: 1, yPercent: 3, ease: "none", scrollTrigger: scrub(img, true) },
          );
        });
        q("[data-drift]").forEach((el, i) => {
          const d = i % 2 ? 1 : -1;
          gsap.fromTo(
            el,
            { xPercent: -3 * d },
            { xPercent: 3 * d, ease: "none", scrollTrigger: scrub(el, true) },
          );
        });
        q("[data-lift]").forEach((el, i) => {
          gsap.fromTo(
            el,
            { rotationX: 16, rotationY: i % 2 ? -6 : 6, y: 40, transformPerspective: 1800 },
            {
              rotationX: 0,
              rotationY: 0,
              y: 0,
              ease: "none",
              scrollTrigger: scrub(el, 0.6, "top bottom", "center 60%"),
            },
          );
        });
        q("[data-tilt-hero]").forEach((el) => {
          gsap.fromTo(
            el,
            { rotationX: 10, transformPerspective: 1800 },
            { rotationX: 0, ease: "none", scrollTrigger: scrub(el, 0.6, "top 85%", "center 50%") },
          );
        });
        q("[data-fword] svg").forEach((el) => {
          gsap.from(el, {
            yPercent: 45,
            opacity: 0,
            duration: 1.3,
            ease: "expo.out",
            scrollTrigger: once(el, "top bottom"),
          });
        });
      });

      mm.add(
        "(prefers-reduced-motion: no-preference) and (hover: hover) and (min-width: 861px)",
        () => {
          const tw = q("[data-tilt]")[0];
          const host = tw?.parentElement;
          if (!tw || !host) return;
          gsap.set(tw, { rotationY: -7, rotationX: 4, transformPerspective: 1800 });
          const move = (e: PointerEvent) => {
            const r = host.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            gsap.to(tw, {
              rotationY: px * 10,
              rotationX: -py * 8,
              duration: 0.6,
              ease: "power3.out",
              overwrite: "auto",
            });
          };
          const leave = () =>
            gsap.to(tw, {
              rotationY: -7,
              rotationX: 4,
              duration: 0.9,
              ease: "expo.out",
              overwrite: "auto",
            });
          host.addEventListener("pointermove", move);
          host.addEventListener("pointerleave", leave);
          return () => {
            host.removeEventListener("pointermove", move);
            host.removeEventListener("pointerleave", leave);
          };
        },
      );

      // Wide display type shifts layout once the fonts land; re-measure the triggers.
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope: root },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
