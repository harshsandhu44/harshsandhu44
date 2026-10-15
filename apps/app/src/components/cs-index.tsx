"use client";

import { useEffect, useState } from "react";

// "On this page": the dot of the section in the reading band turns red.
export function CsIndex({ items }: { items: [id: string, label: string][] }) {
  const [on, setOn] = useState(items[0]![0]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setOn(e.target.id)),
      { rootMargin: "-35% 0px -60% 0px" },
    );
    items.forEach(([id]) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [items]);

  return (
    <ul
      aria-label="On this page"
      className="sticky top-8 col-[1/span_3] hidden self-start text-base lg:block"
    >
      {items.map(([id, label]) => (
        <li key={id}>
          <a
            href={`#${id}`}
            aria-current={on === id ? "location" : undefined}
            className="flex items-center gap-3 py-2 text-muted no-underline transition-colors duration-200 before:size-2.5 before:rounded-full before:bg-chrome before:transition-[background-color,scale] before:duration-300 before:ease-soft hover:text-ink aria-[current]:font-semibold aria-[current]:text-ink aria-[current]:before:scale-125 aria-[current]:before:bg-accent"
          >
            {label}
          </a>
        </li>
      ))}
    </ul>
  );
}
