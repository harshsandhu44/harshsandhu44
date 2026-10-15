import type { CSSProperties } from "react";

const label = "m-0 text-[15px] text-muted";

const check = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    aria-hidden
    className="size-4"
  >
    <path d="M5 12l5 5L19 7" />
  </svg>
);

// The small animated panel in each case-study header: the product's idea in one moving picture.
export function Signature({ slug }: { slug: string }) {
  if (slug === "bandzen")
    return (
      <>
        <p className={label}>Sample report from the bandzen landing page</p>
        <div className="my-auto flex items-end gap-[18px]">
          <b className="disp text-[clamp(72px,7vw,120px)] leading-[.85] tracking-[-0.03em] tabular-nums">
            7.0
          </b>
          <span className="pb-2.5 text-base text-muted">estimated band</span>
        </div>
        <div aria-hidden className="grid gap-2.5">
          {[
            ["Listening", "89%", "8.0"],
            ["Reading", "83%", "7.5"],
            ["Speaking", "78%", "7.0"],
            ["Writing", "72%", "6.5"],
          ].map(([k, w, v]) => (
            <div key={k} className="grid grid-cols-[7.5em_1fr_2em] items-center gap-2.5 text-sm">
              <span>{k}</span>
              <i
                style={{ "--w": w } as CSSProperties}
                className="relative block h-2 overflow-hidden bg-[#3a3a46] after:absolute after:inset-0 after:w-(--w) after:origin-left after:animate-bar after:bg-ink"
              />
              <span>{v}</span>
            </div>
          ))}
        </div>
      </>
    );

  if (slug === "tinkersim")
    return (
      <>
        <p className={label}>A battery, a resistor and an LED, running</p>
        <svg
          viewBox="0 0 320 190"
          role="img"
          aria-label="A loop circuit of a 9 volt battery, a 470 ohm resistor and a red LED, with current flowing around it"
          className="my-auto block h-auto w-full"
        >
          <path d="M40 40 H280 V150 H40 Z" className="fill-none stroke-ink stroke-3" />
          <path
            d="M40 40 H280 V150 H40 Z"
            className="animate-flow fill-none stroke-accent stroke-5 [stroke-dasharray:3_22] [stroke-linecap:round]"
          />
          <rect
            x="16"
            y="74"
            width="48"
            height="44"
            rx="6"
            className="fill-surface stroke-ink stroke-3"
          />
          <path
            d="M30 88 V104 M40 82 V110 M50 88 V104"
            stroke="currentColor"
            strokeWidth="3"
            fill="none"
            className="text-ink"
          />
          <rect
            x="128"
            y="24"
            width="64"
            height="32"
            rx="6"
            className="fill-surface stroke-ink stroke-3"
          />
          <path
            d="M136 40 l6 -8 l8 16 l8 -16 l8 16 l8 -16 l6 8"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="none"
            className="text-ink"
          />
          <rect
            x="256"
            y="76"
            width="48"
            height="44"
            rx="6"
            className="fill-surface stroke-ink stroke-3"
          />
          <path d="M268 86 L292 98 L268 110 Z" className="animate-led fill-accent" />
          <g className="fill-muted font-sans text-[13px]">
            <text x="12" y="138">
              9 V
            </text>
            <text x="140" y="74">
              470 Ω
            </text>
            <text x="262" y="138">
              LED
            </text>
          </g>
        </svg>
      </>
    );

  if (slug === "furbaby-board")
    return (
      <>
        <p className={label}>Milo, today</p>
        <ul className="my-auto grid gap-2">
          {[
            ["Breakfast", "07:00", "tickbox-1"],
            ["Walk", "08:30", "tickbox-2"],
            ["Thyroid meds", "12:00", ""],
          ].map(([k, t, anim]) => (
            <li
              key={k}
              className="grid grid-cols-[28px_1fr_auto] items-center gap-3 bg-bg px-3.5 py-3 text-base"
            >
              <span
                className={`tickbox flex size-6 items-center justify-center rounded-md text-white ${anim}`}
              >
                {check}
              </span>
              <span>{k}</span>
              <small className="text-[13px] text-muted">{t}</small>
            </li>
          ))}
        </ul>
      </>
    );

  return (
    <>
      <p className={label}>Lights out, every session since 2023</p>
      <div
        aria-hidden
        className="sig-lights my-auto flex items-center justify-between rounded-[10px] bg-pit px-5 py-[18px]"
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="aspect-square w-[16%] rounded-full bg-lamp" />
        ))}
      </div>
    </>
  );
}
