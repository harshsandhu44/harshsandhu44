"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Win } from "@/components/ui";

export type WorkItem = {
  name: string;
  kind: string;
  desc: string;
  stack: string;
  site: string;
  siteLabel: string;
  bar: string;
  cap: string;
  caseHref?: string;
  img?: { src: string; alt: string };
};

function Term({ className = "" }) {
  return (
    <div className={`absolute inset-0 flex items-center text-[#E8E8EC] ${className}`}>
      <pre className="m-0 font-mono text-[clamp(14px,1.35vw,20px)] leading-[1.75] whitespace-pre-wrap">
        <code>
          <span className="text-[#A0A0AA]"># open or reattach a project&apos;s tmux session</span>
          {"\n"}
          <span className="text-accent">$</span> muxx tinkersim
        </code>
      </pre>
    </div>
  );
}

// The work list. On desktop, hovering or focusing a project swaps the sticky preview beside it;
// below that each project carries its own window.
export function Work({ items }: { items: WorkItem[] }) {
  const [active, setActive] = useState(0);

  return (
    <div className="grid-12">
      <div className="col-span-full grid grid-cols-1 gap-y-[72px] md:grid-cols-2 md:gap-x-5 md:gap-y-16 lg:col-[1/span_6] lg:block">
        {items.map((p, i) => (
          <div
            key={p.name}
            data-rise
            data-active={i === active || undefined}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            className={`group/proj lg:pt-2.5 lg:pb-10 ${i === items.length - 1 ? "md:col-span-2" : ""}`}
          >
            <Win url={p.bar} data-lift className="mb-[22px] md:mb-[26px] lg:hidden">
              <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-ink">
                {p.img ? (
                  <Image
                    src={p.img.src}
                    alt={p.img.alt}
                    fill
                    sizes="(min-width: 641px) 50vw, 100vw"
                    className="object-cover object-left-top"
                  />
                ) : (
                  <Term className="px-[7%]" />
                )}
              </div>
            </Win>
            <div className="flex flex-wrap items-baseline gap-x-3.5 gap-y-1 md:gap-5">
              <a
                href={p.site}
                className="disp inline-block text-[8.6vw] leading-[1.02] tracking-[-0.02em] no-underline transition-[color,translate] duration-[250ms,400ms] ease-soft md:text-[clamp(30px,4.4vw,44px)] lg:text-[clamp(34px,3.6vw,56px)] lg:text-muted lg:group-data-active/proj:translate-x-3.5 lg:group-data-active/proj:text-ink"
              >
                {p.name}
              </a>
              <span className="text-[15px] text-muted">{p.kind}</span>
            </div>
            <p className="mt-2.5 mb-1.5 max-w-[33em] text-[17px]">{p.desc}</p>
            <p className="mb-1.5 max-w-[36em] text-[15px] text-muted">{p.stack}</p>
            <div className="flex gap-7 text-[15px] font-medium">
              <a href={p.site} className={tl}>
                {p.siteLabel}
              </a>
              {p.caseHref && (
                <Link href={p.caseHref} className={tl}>
                  Case study
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky top-24 col-[7/-1] hidden self-start perspective-[1800px] lg:block">
        <Win
          url={items[active]!.bar}
          data-tilt
          className="motion-safe:[transform:rotateY(-7deg)_rotateX(4deg)]"
        >
          <div
            data-shutter="scroll"
            className="relative aspect-[16/10] overflow-hidden rounded-lg bg-ink"
          >
            <div data-zoom className="absolute inset-0">
              {items.map((p, i) =>
                p.img ? (
                  <Image
                    key={p.name}
                    src={p.img.src}
                    alt={p.img.alt}
                    fill
                    sizes="50vw"
                    className={`object-cover object-left-top [transition:opacity_.3s_ease,scale_.6s_var(--ease-soft)] ${i === active ? "scale-100 opacity-100" : "scale-[1.02] opacity-0"}`}
                  />
                ) : (
                  <Term
                    key={p.name}
                    className={`px-[9%] transition-opacity duration-300 ${i === active ? "opacity-100" : "opacity-0"}`}
                  />
                ),
              )}
            </div>
          </div>
        </Win>
        <p className="mt-4 text-[15px] text-muted">{items[active]!.cap}</p>
      </div>
    </div>
  );
}

const tl =
  "py-2.5 underline decoration-1 underline-offset-[5px] transition-[text-decoration-thickness] duration-150 hover:decoration-[3px]";
