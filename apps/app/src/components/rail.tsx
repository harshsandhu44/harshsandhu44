"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Desktop section rail: one tick per h2 in <main>. The tick for the section
// you're reading is longer and apricot; clicking a tick scrolls to its heading.
export function Rail() {
  const pathname = usePathname();
  const [heads, setHeads] = useState<HTMLElement[]>([]);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const els = [...document.querySelectorAll<HTMLElement>("main h2")];
    // Same rule as CaseFrame: the last heading above the middle of the viewport.
    // The observer fires once on observe, which also fills in the ticks.
    // ponytail: a short last section may never cross the middle; add a bottom-of-page check if it shows.
    const io = new IntersectionObserver(
      () => {
        setHeads(els);
        setActive(els.filter((el) => el.getBoundingClientRect().top < innerHeight / 2).length - 1);
      },
      { rootMargin: "0px 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  if (heads.length < 2) return null;

  return (
    <nav
      aria-label="Sections"
      className="fixed top-1/2 left-2 z-10 hidden -translate-y-1/2 lg:block"
    >
      <ul>
        {heads.map((el, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => el.scrollIntoView()}
              aria-label={el.textContent ?? undefined}
              aria-current={i === active ? "location" : undefined}
              className="group block py-2 pr-2"
            >
              <span
                className={`block h-0.5 rounded-full transition-all duration-300 ${
                  i === active
                    ? "w-5 bg-accent"
                    : "w-3 bg-natural/40 group-hover:bg-foreground group-focus-visible:bg-foreground"
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
