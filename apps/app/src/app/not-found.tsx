import type { Metadata } from "next";
import Link from "next/link";
import { mailto, site } from "@/content";
import { Tower } from "@/components/tower";
import { Arrow, btn, btnGhost } from "@/components/ui";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="relative grid grid-rows-[auto_1fr_auto] overflow-x-clip bg-bg text-ink md:min-h-svh lg:before:absolute lg:before:inset-y-0 lg:before:left-0 lg:before:w-[calc(50%-12px)] lg:before:bg-ink [&>*]:relative [&>*]:z-[1]">
      <nav
        aria-label="Main"
        className="grid-12 on-dark items-center bg-ink pt-3 md:pt-5 lg:bg-transparent"
      >
        <Link
          href="/"
          className="col-span-5 justify-self-start py-3 text-base font-semibold text-paper no-underline"
        >
          {site.name}
        </Link>
      </nav>

      <main className="grid-12 items-center gap-y-9 pb-12 md:gap-y-12 md:pb-16 lg:pt-14 lg:pb-[72px]">
        <div className="on-dark col-span-full -mx-4 bg-ink px-4 pt-4 pb-10 text-paper md:-mx-6 md:px-6 md:pt-6 md:pb-14 lg:col-[1/span_5] lg:m-0 lg:bg-transparent lg:p-0">
          <h1 className="disp text-[13vw] tracking-[-0.03em] md:text-[clamp(52px,5.4vw,92px)]">
            Page not found.
          </h1>
          <p className="mt-[18px] mb-6 max-w-[25em] text-[17px] leading-[1.55] md:mt-7 md:mb-9 md:text-[19px]">
            The link may be wrong, or the page has moved. Everything else is still running, so pick
            a page from the tower.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link href="/" className={`${btn} flex-auto justify-between md:flex-none`}>
              Back to the pit lane
              <Arrow />
            </Link>
            <a
              className={`${btnGhost} flex-auto justify-between md:flex-none`}
              href={mailto("Broken link on harshsandhu.com")}
            >
              Report the link
            </a>
          </div>
        </div>
        <Tower />
      </main>

      <div className="flex flex-col gap-1 px-4 pb-6 text-sm text-muted md:flex-row md:justify-between md:gap-4 md:px-6">
        <span className="lg:text-soft">© 2026 {site.name}</span>
        <span>Error 404</span>
      </div>
    </div>
  );
}
