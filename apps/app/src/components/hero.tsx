"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { products, site } from "@/content";

// The one bold move on the page: each product name in the headline swaps its
// screenshot into the frame on hover or keyboard focus. Tapping navigates.
export function Hero() {
  const [active, setActive] = useState(0);

  return (
    <section className="grid items-center gap-10 pt-10 pb-20 md:grid-cols-[6fr_5fr] md:pt-16">
      <div>
        <h1 className="text-4xl leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem]">
          I build products end to end. Right now:{" "}
          {products.map((p, i) => (
            <Fragment key={p.slug}>
              <Link
                href={`/work/${p.slug}`}
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={`underline decoration-[0.08em] underline-offset-[0.14em] transition-colors ${
                  active === i ? "decoration-accent" : "decoration-natural/50"
                }`}
              >
                {p.name}
              </Link>
              {i < products.length - 2 ? ", " : i === products.length - 2 ? " and " : "."}
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

      <div className="relative aspect-[16/9] overflow-hidden rounded-lg border bg-muted">
        {products.map((p, i) => (
          <Image
            key={p.slug}
            src={p.image}
            alt={`${p.name} landing page`}
            aria-hidden={active !== i}
            fill
            priority={i === 0}
            sizes="(min-width: 768px) 55vw, 100vw"
            className={`object-cover object-top transition-opacity duration-300 motion-reduce:transition-none ${
              active === i ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
