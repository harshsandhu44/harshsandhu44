"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const rows = [
  { code: "HOM", name: "Home", href: "/", color: "#F7F7F7" },
  { code: "BZN", name: "bandzen", href: "/work/bandzen", color: "#3D7BF7" },
  { code: "PIT", name: "pitwall", href: "/work/pitwall", color: "#E10600" },
  { code: "TNK", name: "tinkersim", href: "/work/tinkersim", color: "#8FB8FF" },
  { code: "FUR", name: "furbaby board", href: "/work/furbaby-board", color: "#C9A27A" },
];

const cols =
  "grid grid-cols-[2.6em_5px_3.2em_minmax(0,1fr)_5.6em] items-center gap-x-2.5 md:grid-cols-[3.2em_6px_3.6em_minmax(0,1fr)_6.2em_6.6em] md:gap-x-3.5";
const row = `${cols} min-h-[52px] rounded-lg px-2.5 text-base md:min-h-14 md:px-3.5 md:text-[17px]`;

const round = (x: number) => Math.round(x * 1000) / 1000;
const lapTime = (x: number) => {
  const m = Math.floor(x / 60);
  return `${m}:${(x - m * 60).toFixed(3).padStart(6, "0")}`;
};
const pad = (x: number) => String(x).padStart(2, "0");

// A timing tower where every page of the site is a car, and the missing page is out of the race.
// Gaps and lap times jitter once a second (not under reduced motion); the starting values are fixed
// so the server and client render the same thing.
export function Tower() {
  const [s, setS] = useState({
    t: 0,
    gaps: [0, 1.482, 3.019, 5.66, 8.341],
    laps: [91.204, 91.877, 92.013, 91.655, 92.398],
  });

  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () =>
        setS(({ t, gaps, laps }) => {
          const g = [0];
          for (let i = 1; i < gaps.length; i++)
            g.push(round(Math.max(g[i - 1]! + 0.31, gaps[i]! + (Math.random() - 0.5) * 0.18)));
          const l = laps.slice();
          l[Math.floor(Math.random() * l.length)] = round(90.9 + Math.random() * 1.9);
          return { t: t + 1, gaps: g, laps: l };
        }),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  const fastest = s.laps.indexOf(Math.min(...s.laps));

  return (
    <section
      aria-labelledby="tower-h"
      className="col-span-full -mx-1.5 rounded-xl bg-ink p-1.5 text-paper tabular-nums shadow-tower md:mx-0 md:rounded-[14px] md:p-2.5 lg:col-[7/-1]"
    >
      <div className="flex items-center justify-between gap-4 px-2.5 py-3 text-sm text-soft md:px-3.5 md:pt-3.5 md:pb-4 md:text-[15px]">
        <span id="tower-h">
          <b className="font-semibold text-paper">harshsandhu.com</b> · Classification
        </span>
        <span className="flex items-center gap-2">
          <i aria-hidden className="size-2 animate-livepulse rounded-full bg-accent" />
          Live {pad(Math.floor(s.t / 60))}:{pad(s.t % 60)}
        </span>
      </div>
      <div aria-hidden className={`${cols} px-2.5 pb-2 text-[13px] text-soft md:px-3.5 md:pb-2.5`}>
        <span>Pos</span>
        <span />
        <span />
        <span>Page</span>
        <span className="text-right">Gap</span>
        <span className="hidden text-right md:block">Last lap</span>
      </div>
      <ol className="grid gap-1">
        {rows.map((r, i) => (
          <li key={r.code}>
            <Link
              href={r.href}
              style={{ animationDelay: `${(0.08 + i * 0.1).toFixed(2)}s` }}
              className={`${row} group/trow animate-rowin bg-carbon no-underline transition-[background-color,color,translate] duration-200 ease-soft hover:-translate-x-1.5 hover:bg-accent hover:text-white focus-visible:-translate-x-1.5 focus-visible:bg-accent focus-visible:text-white`}
            >
              <span className="font-semibold">P{i + 1}</span>
              <span
                aria-hidden
                className="h-[26px] w-[5px] rounded-[2px] md:w-1.5"
                style={{ background: r.color }}
              />
              <span className="font-semibold tracking-[.02em]">{r.code}</span>
              <span className="truncate text-soft group-hover/trow:text-white group-focus-visible/trow:text-white">
                {r.name}
              </span>
              <span className="text-right transition-colors duration-300 group-hover/trow:text-white">
                {i ? `+${s.gaps[i]!.toFixed(3)}` : "Leader"}
              </span>
              <span
                className={`hidden text-right transition-colors duration-300 group-hover/trow:text-white md:block ${i === fastest ? "text-fl" : ""}`}
              >
                {lapTime(s.laps[i]!)}
              </span>
            </Link>
          </li>
        ))}
        <li>
          <div
            aria-current="page"
            style={{ animationDelay: "0.65s" }}
            className={`${row} animate-dnf shadow-[inset_0_0_0_2px_var(--color-accent)]`}
          >
            <span className="font-semibold text-[#FF5A4F]">DNF</span>
            <span aria-hidden className="h-[26px] w-[5px] rounded-[2px] bg-accent md:w-1.5" />
            <span className="font-semibold tracking-[.02em]">404</span>
            <span className="truncate">This page</span>
            <span className="text-right text-[#FF5A4F]">Lap 404</span>
            <span className="hidden text-right md:block">—</span>
          </div>
        </li>
      </ol>
      <div className="flex justify-between gap-4 px-2.5 pt-3 pb-1 text-[13px] text-soft md:px-3.5 md:pt-3.5 md:pb-1.5 md:text-sm">
        <span className="flex items-center gap-2">
          <i aria-hidden className="size-2.5 rounded-[2px] bg-fl" />
          Fastest lap
        </span>
        <span>Pick any page to rejoin</span>
      </div>
    </section>
  );
}
