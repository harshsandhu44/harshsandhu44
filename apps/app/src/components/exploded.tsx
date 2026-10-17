"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { Arch, Layer } from "@/content";
import type { Drawing } from "@/exploded";

gsap.registerPlugin(ScrollTrigger);

const LAYER_NAMES: [Layer, string][] = [
  ["client", "Apps"],
  ["compute", "Compute"],
  ["data", "Data"],
  ["external", "Services"],
];

// The product's architecture as an exploded-assembly drawing: it pulls apart as it scrolls through
// the viewport and leans toward the pointer. Numbered balloons key it to the parts list below,
// which is also what screen readers get and all that shows if WebGL is missing. three.js loads
// when the figure comes near, from exploded.ts.
export function Exploded({ arch }: { arch: Arch }) {
  const [on, setOn] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "ready" | "failed">("idle");
  const fig = useRef<HTMLDivElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const balloons = useRef<HTMLSpanElement[]>([]);
  const drawing = useRef<Drawing | null>(null);

  useEffect(() => {
    const frame = fig.current!;
    let dead = false;
    let stop = () => {};
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e?.isIntersecting) return;
        io.disconnect();
        import("@/exploded")
          .then(({ createExploded }) => {
            if (dead) return;
            const accent = getComputedStyle(document.documentElement)
              .getPropertyValue("--color-accent")
              .trim();
            const d = createExploded(host.current!, arch, accent, (pts) =>
              pts.forEach((p, i) => {
                const b = balloons.current[i];
                // Centre the 22px circle on the leader's end; the name hangs off to the right.
                if (b) b.style.transform = `translate(${p.x - 11}px, ${p.y - 11}px)`;
              }),
            );
            drawing.current = d;
            setStatus("ready");

            if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
              d.setProgress(1);
              stop = d.dispose;
              return;
            }
            const st = ScrollTrigger.create({
              trigger: frame,
              start: "top 80%",
              end: "bottom 40%",
              scrub: true,
              onUpdate: (s) => d.setProgress(s.progress),
            });
            d.setProgress(st.progress);
            // Touch scrolls the page, so only a hovering pointer turns the drawing.
            const hover = matchMedia("(hover: hover)").matches;
            const move = (ev: PointerEvent) => {
              const r = frame.getBoundingClientRect();
              d.setOrbit(((ev.clientX - r.left) / r.width) * 2 - 1);
              setOn(d.pick(ev.clientX, ev.clientY));
            };
            const leave = () => {
              d.setOrbit(0);
              setOn(null);
            };
            if (hover) {
              frame.addEventListener("pointermove", move);
              frame.addEventListener("pointerleave", leave);
            }
            stop = () => {
              st.kill();
              frame.removeEventListener("pointermove", move);
              frame.removeEventListener("pointerleave", leave);
              d.dispose();
            };
          })
          .catch(() => !dead && setStatus("failed"));
      },
      { rootMargin: "50% 0px" },
    );
    io.observe(frame);
    return () => {
      dead = true;
      io.disconnect();
      stop();
      drawing.current = null;
    };
  }, [arch]);

  useEffect(() => drawing.current?.highlight(on), [on, status]);

  // A tap on the drawing picks the part under it, or clears.
  const tap = (ev: MouseEvent) => {
    const d = drawing.current;
    if (d) setOn(d.pick(ev.clientX, ev.clientY));
  };
  const toggle = (id: string) => setOn((x) => (x === id ? null : id));

  return (
    <div data-rise className="mb-10">
      {status !== "failed" && (
        <figure className="mb-6">
          <div
            ref={fig}
            onClick={tap}
            className="blueprint relative aspect-[4/3] overflow-hidden rounded-lg md:aspect-[16/10]"
          >
            <div ref={host} aria-hidden className="absolute inset-0" />
            <div
              aria-hidden
              className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${status === "ready" ? "opacity-100" : "opacity-0"}`}
            >
              {arch.parts.map((p, i) => (
                <span
                  key={p.id}
                  ref={(el) => {
                    if (el) balloons.current[i] = el;
                  }}
                  className="absolute top-0 left-0 flex items-center gap-1.5 font-mono text-[12px] text-white"
                >
                  <b
                    className={`flex size-[22px] items-center justify-center rounded-full border border-white font-normal transition-colors duration-200 ${on === p.id ? "bg-accent" : "bg-print"}`}
                  >
                    {i + 1}
                  </b>
                  {/* Names would run into the next part; the list carries them, so only the lit one shows. */}
                  {on === p.id && (
                    <span className="bg-print px-1 whitespace-nowrap uppercase">{p.label}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
          <figcaption className="mt-3.5 text-[15px] text-muted">
            Exploded view, {arch.parts.length} parts
          </figcaption>
        </figure>
      )}

      <h3 className="mb-2 font-semibold">Parts list</h3>
      <dl className="grid gap-x-6 gap-y-5 md:grid-cols-2">
        {LAYER_NAMES.map(([layer, name]) => {
          const rows = arch.parts.filter((p) => p.layer === layer);
          if (!rows.length) return null;
          return (
            <div key={layer}>
              <dt className="text-[15px] text-muted">{name}</dt>
              {rows.map((p) => {
                // Parts are listed top layer first, so this matches the balloon.
                const item = arch.parts.indexOf(p) + 1;
                return (
                  <dd
                    key={p.id}
                    onPointerEnter={(ev) => ev.pointerType === "mouse" && setOn(p.id)}
                    onPointerLeave={(ev) => ev.pointerType === "mouse" && setOn(null)}
                    onClick={() => toggle(p.id)}
                    className={`-mx-2 grid grid-cols-[1.75rem_1fr] rounded-sm px-2 py-1 text-base transition-colors duration-200 ${on === p.id ? "bg-surface" : ""}`}
                  >
                    <span className="font-mono text-[14px] leading-6 text-muted tabular-nums">
                      {item}
                    </span>
                    <span>
                      {p.label} <span className="text-muted">{p.tech}</span>
                    </span>
                  </dd>
                );
              })}
            </div>
          );
        })}
      </dl>
    </div>
  );
}
