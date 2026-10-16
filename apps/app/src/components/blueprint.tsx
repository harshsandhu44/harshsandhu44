import Image from "next/image";
import { getGarage, handle, type Day, type Garage, type Level } from "@/github";

const panel = "border border-white/70";
const label = "font-mono text-[13px] uppercase tracking-[0.08em]";
const fmt = (n: number) => n.toLocaleString("en-US");
const date = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });

// Live GitHub numbers drawn as an F1 technical drawing. Renders nothing if the data is unavailable.
export async function Blueprint() {
  const g = await getGarage();
  if (!g) return null;

  return (
    <section
      id="telemetry"
      aria-labelledby="telemetry-h"
      data-section
      className="blueprint grid-12 gap-y-4 py-[72px] text-white md:gap-y-5 md:py-24 lg:h-svh lg:min-h-[680px] lg:grid-rows-[auto_minmax(0,1fr)_auto_auto] lg:gap-y-4 lg:py-6"
    >
      <header
        data-rise
        className={`${panel} col-span-full grid gap-5 p-4 md:row-start-1 md:grid-cols-[1fr_auto] md:items-end md:p-6 lg:grid-cols-[auto_1fr_auto] lg:gap-10 lg:p-4`}
      >
        <div>
          <h2
            id="telemetry-h"
            className="disp text-[clamp(34px,4.4vw,64px)] leading-none lg:text-[clamp(36px,3vw,52px)]"
          >
            Built lap by lap
          </h2>
          <a
            href={`https://github.com/${handle}`}
            className="mt-3 inline-block font-mono text-lg underline-offset-4 hover:underline lg:mt-1.5"
          >
            @{handle}
          </a>
        </div>
        <p className="max-w-[26em] text-[17px] md:col-span-full md:row-start-2 lg:col-span-1 lg:row-start-auto">
          Every commit from the last twelve months, straight from GitHub.
        </p>
        <dl
          className={`${label} grid grid-cols-[auto_auto] gap-x-6 gap-y-1 border-white/70 md:border-l md:pl-6`}
        >
          <dt>Scale</dt>
          <dd>1:20</dd>
          <dt>Sheet</dt>
          <dd>1/1</dd>
          <dt>Date</dt>
          <dd>
            <time dateTime={g.fetchedAt}>{g.fetchedAt}</time>
          </dd>
        </dl>
      </header>

      <View
        name="front"
        className="hidden aspect-[4/3] md:col-span-6 md:row-start-2 md:flex lg:col-span-3 lg:aspect-auto lg:min-h-0"
      />
      <View
        name="side"
        className="col-span-full aspect-[16/6] md:row-start-3 lg:col-[4/span_6] lg:row-start-2 lg:aspect-auto lg:min-h-0"
      />
      <View
        name="rear"
        className="hidden aspect-[4/3] md:col-[7/-1] md:row-start-2 md:flex lg:col-[10/-1] lg:aspect-auto lg:min-h-0"
      />

      <Gauges g={g} />
      <View
        name="top"
        className="col-span-full aspect-[16/8] md:row-start-5 lg:col-[4/span_6] lg:row-start-3 lg:aspect-auto lg:min-h-0"
      />
      <Telemetry g={g} />
      <Languages g={g} />
      <Specs g={g} />
    </section>
  );
}

// One drawing of the car from public/blueprint, scaled to fit its frame and wiped in on scroll.
// Static files rather than inline SVG: the paths are about 190KB, which would otherwise ship in
// both the HTML and the RSC payload. next/image lazy-loads them; SVGs skip the optimiser.
function View({ name, className }: { name: string; className: string }) {
  return (
    <figure data-rise className={`relative flex flex-col ${className}`}>
      <div data-shutter="scroll" className="relative min-h-0 flex-1 overflow-hidden">
        <Image
          data-zoom
          src={`/blueprint/${name}.svg`}
          alt=""
          fill
          unoptimized
          className="object-contain"
        />
      </div>
      <figcaption className={`${label} mt-2`}>{name} view</figcaption>
    </figure>
  );
}

function Gauges({ g }: { g: Garage }) {
  const rows = [
    { part: "Power unit", what: "Contributions", n: fmt(g.contributions), unit: "last year" },
    { part: "Chassis", what: "Original repos", n: fmt(g.repos), unit: "public" },
    { part: "Drivetrain", what: "Commits", n: fmt(g.commits), unit: "last year" },
    {
      part: "Race consistency",
      what: "Current streak",
      n: fmt(g.streak),
      unit: g.streak === 1 ? "day" : "days",
    },
  ];
  return (
    <ul className="col-span-full grid grid-cols-2 gap-3 md:col-span-6 md:row-start-4 md:grid-cols-1 lg:col-span-3 lg:row-start-3 lg:grid-cols-2">
      {rows.map((r) => (
        <li key={r.part} data-rise className={`${panel} p-3 md:p-4 lg:p-3`}>
          <p className={label}>
            {r.part}
            <span className="block text-white/75">{r.what}</span>
          </p>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2 lg:mt-1">
            <span className="disp text-[clamp(36px,4vw,56px)] tabular-nums lg:text-[clamp(28px,2.2vw,40px)]">
              {r.n}
            </span>
            <span className={`${label} text-white/75`}>{r.unit}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

const levels: Record<Level, string> = {
  NONE: "shadow-[inset_0_0_0_1px_rgb(255_255_255/0.3)]",
  FIRST_QUARTILE: "bg-white/25",
  SECOND_QUARTILE: "bg-white/50",
  THIRD_QUARTILE: "bg-white/75",
  FOURTH_QUARTILE: "bg-white",
};
const cell = "size-[11px]";
const grid = "grid w-max grid-cols-[repeat(53,11px)] grid-rows-[16px_repeat(7,11px)] gap-[3px]";

// The contribution calendar. On a phone it scrolls, starting at the newest weeks: the scroller is
// right-to-left so it opens at its end, and the grid inside reads left to right again.
function Telemetry({ g }: { g: Garage }) {
  const months = g.weeks.flatMap((w, i) => {
    const m = w[0]!.date.slice(0, 7);
    return i && m !== g.weeks[i - 1]![0]!.date.slice(0, 7)
      ? [{ i, name: date(w[0]!.date, { month: "short" }) }]
      : [];
  });
  return (
    <div
      data-rise
      className={`${panel} col-span-full min-w-0 p-4 md:row-start-6 md:p-5 lg:col-span-7 lg:p-4 lg:row-start-4`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h3 className={label}>Contribution telemetry</h3>
        <p className={label}>
          <span className="disp text-xl tabular-nums normal-case">{fmt(g.contributions)}</span> in
          the last year
        </p>
      </div>
      <div className="mt-4 flex gap-2 lg:mt-3">
        <div
          aria-hidden
          className={`${label} grid grid-rows-[16px_repeat(7,11px)] gap-[3px] text-[10px] leading-[11px]`}
        >
          <span className="row-start-3">Mon</span>
          <span className="row-start-5">Wed</span>
          <span className="row-start-7">Fri</span>
        </div>
        <div dir="rtl" className="overflow-x-auto [scrollbar-width:thin]">
          <div
            dir="ltr"
            role="img"
            aria-label={`${fmt(g.contributions)} contributions in the last year, best day ${fmt(g.best.contributionCount)}`}
            className={grid}
          >
            {months.map((m) => (
              <span
                key={m.i}
                className={`${label} text-[10px] whitespace-nowrap`}
                style={{ gridRow: 1, gridColumn: `${m.i + 1} / span 3` }}
              >
                {m.name}
              </span>
            ))}
            {g.weeks.map((w, i) =>
              w.map((d: Day) => (
                <span
                  key={d.date}
                  title={`${d.contributionCount} on ${d.date}`}
                  className={`${cell} ${levels[d.contributionLevel]}`}
                  style={{ gridRow: d.weekday + 2, gridColumn: i + 1 }}
                />
              )),
            )}
          </div>
        </div>
      </div>
      <p aria-hidden className={`${label} mt-4 flex items-center lg:mt-3 gap-[3px] text-[11px]`}>
        <span className="mr-2">Less</span>
        {Object.values(levels).map((c) => (
          <span key={c} className={`${cell} ${c}`} />
        ))}
        <span className="ml-2">More</span>
      </p>
    </div>
  );
}

const hatch = [0.85, 0.6, 0.4, 0.25, 0.12];

function Languages({ g }: { g: Garage }) {
  return (
    <div
      data-rise
      className={`${panel} col-span-full p-4 md:row-start-7 md:p-5 lg:col-[8/-1] lg:p-4 lg:row-start-4`}
    >
      <h3 className={label}>Primary language mix</h3>
      <div className="mt-4 flex h-7 lg:mt-3 border border-white/70" aria-hidden>
        {g.languages.map((l, i) => (
          <span
            key={l.name}
            className="border-white/70 not-last:border-r"
            style={{
              width: `${l.pct}%`,
              backgroundImage: `repeating-linear-gradient(-45deg, rgb(255 255 255 / ${hatch[i]}) 0 2px, transparent 2px 6px)`,
            }}
          />
        ))}
      </div>
      <ul className="mt-4 grid lg:mt-3 grid-cols-3 gap-x-4 gap-y-3 md:grid-cols-5">
        {g.languages.map((l) => (
          <li key={l.name}>
            <span className={`${label} block truncate`}>{l.name}</span>
            <span className="disp text-2xl tabular-nums">{l.pct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Specs({ g }: { g: Garage }) {
  const rows = [
    ["Driver", `@${handle}`],
    ["Engine", g.languages[0]?.name ?? "None yet"],
    ["On track since", String(g.since)],
    [
      "Best day",
      `${fmt(g.best.contributionCount)} on ${date(g.best.date, { day: "numeric", month: "short", year: "numeric" })}`,
    ],
    ["Longest streak", `${fmt(g.longest)} days`],
    ["Most active day", g.weekday],
  ];
  return (
    <div
      data-rise
      className={`${panel} col-span-full md:col-[7/-1] md:row-start-4 lg:col-[10/-1] lg:row-start-3`}
    >
      <h3 className={`${label} border-b border-white/70 p-3 md:p-4 lg:p-3`}>
        Vehicle specifications
      </h3>
      <dl className="grid grid-cols-[auto_1fr] text-[15px]">
        {rows.map(([k, v]) => (
          <div
            key={k}
            className="col-span-full grid grid-cols-subgrid gap-4 px-3 py-2.5 md:px-4 lg:py-1.5"
          >
            <dt className={label}>{k}</dt>
            <dd className="text-right font-mono">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
