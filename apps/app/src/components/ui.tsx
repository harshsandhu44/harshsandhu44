import type { ComponentProps, ReactNode } from "react";
import { site } from "@/content";

// Buttons read --fg/--fgi, so the same classes work on light pages and inside `on-dark` sections.
const btnBase =
  "group/btn inline-flex min-h-[54px] items-center gap-3 px-[26px] text-[17px] font-semibold no-underline transition-[background-color,color,scale] duration-200 active:scale-[.98]";
export const btn = `${btnBase} bg-accent text-white hover:bg-(--fg) hover:text-(--fgi)`;
export const btnGhost = `${btnBase} text-(--fg) shadow-[inset_0_0_0_2px_var(--fg)] hover:bg-(--fg) hover:text-(--fgi)`;

const icon = "flex-none transition-transform duration-250 ease-soft";

export function Arrow({ size = 18, className = "group-hover/btn:translate-x-1" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="square"
      aria-hidden
      className={`${icon} ${className}`}
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function ArrowUpRight({
  size = 16,
  className = "group-hover/btn:translate-x-[3px] group-hover/btn:-translate-y-[3px]",
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
      className={`${icon} ${className}`}
    >
      <path d="M7 17L17 7M9 7h8v8" />
    </svg>
  );
}

// A browser window around a screenshot: three dots and a URL pill.
export function Win({
  url,
  className = "",
  children,
  ...rest
}: ComponentProps<"div"> & { url: string }) {
  return (
    <div
      className={`relative rounded-xl bg-white px-1.5 pb-1.5 shadow-win transform-3d will-change-transform md:rounded-[14px] md:px-2 md:pb-2 lg:rounded-2xl lg:px-2.5 lg:pb-2.5 ${className}`}
      {...rest}
    >
      <div aria-hidden className="flex h-[30px] items-center gap-[7px] px-1.5 md:h-[34px] lg:h-10">
        <i className="size-2 flex-none rounded-full bg-chrome md:size-2.5" />
        <i className="size-2 flex-none rounded-full bg-chrome md:size-2.5" />
        <i className="size-2 flex-none rounded-full bg-chrome md:size-2.5" />
        <span className="mr-2 ml-2.5 flex h-5 min-w-0 flex-1 items-center justify-center overflow-hidden rounded-md bg-pill text-xs leading-none whitespace-nowrap text-muted md:mr-5 md:ml-3 md:h-[22px] lg:mr-[50px] lg:ml-[18px] lg:h-6 lg:text-[13px]">
          {url}
        </span>
      </div>
      {children}
    </div>
  );
}

export function Avail({ className = "" }) {
  return (
    <span
      className={`flex items-center gap-2.5 text-[15px] leading-[1.4] font-medium tracking-normal md:text-base ${className}`}
    >
      <i
        aria-hidden
        className="relative size-2.5 flex-none rounded-full bg-go after:absolute after:inset-0 after:animate-ping after:rounded-full after:bg-go"
      />
      Open to contract or full-time product work
    </span>
  );
}

// The footer's full-width "Harsh Sandhu", stretched to fit with textLength.
export function Wordmark() {
  return (
    <svg
      viewBox="0 0 1000 176"
      role="img"
      aria-label="Harsh Sandhu"
      className="block h-auto w-full overflow-visible"
    >
      <text
        x="0"
        y="158"
        textLength="1000"
        lengthAdjust="spacingAndGlyphs"
        fontWeight="800"
        fontStyle="italic"
        fontSize="188"
        fill="currentColor"
        style={{ fontFamily: "var(--font-archivo)", fontStretch: "125%" }}
      >
        Harsh Sandhu
      </text>
    </svg>
  );
}

export const skip =
  "absolute top-4 -left-[9999px] z-[5] focus:left-6 focus:bg-ink focus:px-4 focus:py-3 focus:text-paper";
export const h2 = "disp text-[clamp(34px,2.8vw,40px)] leading-none";

export function Legal({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 px-4 pt-[22px] text-sm text-soft md:flex-row md:justify-between md:gap-4 md:px-6">
      <span>© 2026 {site.name}</span>
      {children}
    </div>
  );
}
