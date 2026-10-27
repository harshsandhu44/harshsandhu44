// A career season on the grid screen, in tabs: the standings, every round's results, you against
// your teammate, your season, the title's outlook, points round by round, and any two drivers.
import { useState } from "react";
import { CARS, LEVELS, seated, standings, type Level, type Round } from "@/race";
import { fmt } from "@/track";
import { gridIn, h2h, outlook, placeIn, pointsOf, progression, scenarios, season } from "@/season";

const label = "text-sm text-soft";
const TABS = ["Standings", "Results", "Teammate", "Stats", "Projections", "Chart", "Compare"];

export type SeasonProps = {
  series: Level;
  seats: number[];
  rounds: Round[];
  calendar: string[];
  sprints: boolean;
  trackName: (id: string) => string;
};

export function Season(props: SeasonProps) {
  const [tab, setTab] = useState(0);
  return (
    <div className="mt-3">
      <div role="tablist" aria-label="Season" className="flex flex-wrap gap-1">
        {TABS.map((name, k) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`min-h-8 rounded-sm px-2 text-xs font-semibold ring-1 active:scale-[.97] ${tab === k ? "bg-lamp ring-paper" : "ring-paper/25"}`}
          >
            {name}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="mt-2">
        {tab === 0 && <Standings {...props} />}
        {tab === 1 && <Results {...props} />}
        {tab === 2 && <HeadToHead {...props} a={0} b={1} />}
        {tab === 3 && <Stats {...props} />}
        {tab === 4 && <Projections {...props} />}
        {tab === 5 && <Chart {...props} />}
        {tab === 6 && <Compare {...props} />}
      </div>
    </div>
  );
}

const codeOf = (series: Level, seats: number[], id: number) => seated(series, seats, id).code;
const colorOf = (series: Level, id: number) => LEVELS[series].colors[id >> 1]!;
const Swatch = ({ color }: { color: string }) => (
  <span className="h-3 w-1 shrink-0 rounded-full" style={{ background: color }} />
);

function List(props: {
  name: string;
  rows: { k: number; points: number }[];
  nameOf: (k: number) => string;
  color: (k: number) => string;
  mine: (k: number) => boolean;
}) {
  return (
    <div>
      <p className={label}>{props.name}</p>
      <ol className="mt-1 max-h-48 overflow-y-auto text-sm tabular-nums">
        {props.rows.map((r, i) => (
          <li
            key={r.k}
            className={`flex items-center gap-2 px-1 py-0.5 ${props.mine(r.k) ? "bg-lamp" : ""}`}
          >
            <span className="w-5 text-soft">{i + 1}</span>
            <Swatch color={props.color(r.k)} />
            <span className="truncate">{props.nameOf(r.k)}</span>
            <span className="ml-auto font-semibold">{r.points}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Standings({ series, seats, rounds, sprints }: SeasonProps) {
  const lv = LEVELS[series];
  const { drivers, teams } = standings(rounds, sprints);
  return (
    <div className="grid grid-cols-2 gap-3">
      <List
        name="Drivers"
        rows={drivers}
        nameOf={(id) => codeOf(series, seats, id)}
        color={(id) => colorOf(series, id)}
        mine={(id) => id === 0}
      />
      <List
        name="Teams"
        rows={teams}
        nameOf={(k) => lv.teams[k]!}
        color={(k) => lv.colors[k]!}
        mine={(k) => k === 0}
      />
    </div>
  );
}

// A place as the results table shows it: P and the place, or why there's none.
const cell = (r: Round, id: number) => {
  const p = placeIn(r, id);
  if (p !== null) return String(p + 1);
  return r.table?.find((row) => row.id === id)?.dsq ? "DSQ" : "Ret";
};

// Every driver's every round, in championship order: pole in bold, the fastest lap in purple. A
// round's name opens its classification.
function Results({ series, seats, rounds, calendar, sprints, trackName }: SeasonProps) {
  const [open, setOpen] = useState<number | null>(null);
  const { drivers } = standings(rounds, sprints);
  return (
    <>
      <div className="max-h-64 overflow-auto">
        <table className="text-xs tabular-nums">
          <thead className="sticky top-0 bg-ink text-soft">
            <tr>
              <th className="sticky left-0 bg-ink px-1 text-left font-normal">Driver</th>
              {calendar.map((id, k) => (
                <th key={k} className="px-0.5 font-normal">
                  <button
                    type="button"
                    disabled={!rounds[k]}
                    onClick={() => setOpen(open === k ? null : k)}
                    className={`min-h-6 w-8 rounded-sm ${open === k ? "bg-lamp text-paper" : ""} ${rounds[k] ? "underline decoration-dotted underline-offset-2" : ""}`}
                    title={trackName(id)}
                  >
                    {trackName(id).slice(0, 3)}
                  </button>
                </th>
              ))}
              <th className="px-1 text-right font-normal">Pts</th>
            </tr>
          </thead>
          <tbody>
            {drivers.map(({ k: id, points }) => (
              <tr key={id} className={id === 0 ? "bg-lamp" : ""}>
                <td className={`sticky left-0 px-1 ${id === 0 ? "bg-lamp" : "bg-ink"}`}>
                  <span className="flex items-center gap-1.5">
                    <Swatch color={colorOf(series, id)} />
                    {codeOf(series, seats, id)}
                  </span>
                </td>
                {calendar.map((_, k) => {
                  const r = rounds[k];
                  if (!r) return <td key={k} />;
                  const text = cell(r, id);
                  const pole = gridIn(r, id) === 0;
                  const scored =
                    placeIn(r, id) !== null && placeIn(r, id)! < pointsOf(sprints).length;
                  return (
                    <td
                      key={k}
                      className={`text-center ${r.fastest === id ? "text-fl" : scored ? "text-paper" : "text-soft"} ${pole ? "font-bold underline" : ""}`}
                    >
                      {text}
                    </td>
                  );
                })}
                <td className="px-1 text-right font-semibold">{points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-xs text-soft">
        <span className="font-bold underline">Bold</span> pole,{" "}
        <span className="text-fl">purple</span> fastest lap. A round&apos;s name opens it.
      </p>
      {open !== null && rounds[open] && (
        <Classification series={series} seats={seats} round={rounds[open]!} sprints={sprints} />
      )}
    </>
  );
}

function Classification({
  series,
  seats,
  round,
  sprints,
}: {
  series: Level;
  seats: number[];
  round: Round;
  sprints: boolean;
}) {
  const pts = pointsOf(sprints);
  const lead = round.table?.[0]?.time ?? 0;
  const ids = round.table?.map((r) => r.id) ?? round.order;
  return (
    <ol className="mt-2 max-h-56 overflow-y-auto text-xs tabular-nums">
      {ids.map((id, k) => {
        const row = round.table?.find((r) => r.id === id);
        const out = round.none.includes(id);
        return (
          <li key={id} className={`flex items-center gap-2 px-1 py-0.5 ${id ? "" : "bg-lamp"}`}>
            <span className="w-5 text-soft">{k + 1}</span>
            <Swatch color={colorOf(series, id)} />
            <span className="w-9 font-semibold">{codeOf(series, seats, id)}</span>
            {row && <span className="w-8 text-soft">P{row.grid}</span>}
            <span className="ml-auto">
              {!row
                ? out
                  ? "Ret"
                  : ""
                : row.dsq
                  ? "DSQ"
                  : row.out
                    ? `Ret · ${row.out}`
                    : row.down
                      ? `+${row.down} lap${row.down > 1 ? "s" : ""}`
                      : k
                        ? `+${((row.time - lead) / 1000).toFixed(3)}`
                        : fmt(row.time)}
            </span>
            {row && (
              <span className="w-10 text-right text-soft">
                {row.stints.map((t) => t[0]!.toUpperCase()).join("")}
              </span>
            )}
            <span className="w-6 text-right font-semibold">{(!out && pts[k]) || ""}</span>
          </li>
        );
      })}
    </ol>
  );
}

const avg = (n: number | null) => (n === null ? "–" : n.toFixed(1));

// Two drivers side by side, the better of each line lit.
function HeadToHead({
  series,
  seats,
  rounds,
  sprints,
  a,
  b,
}: SeasonProps & { a: number; b: number }) {
  if (!rounds.length) return <p className={label}>No rounds yet.</p>;
  const v = h2h(rounds, a, b, sprints);
  // Each line: its name, both values, and whether more (or less) is better.
  const lines: [string, number | null, number | null, boolean][] = [
    ["Qualifying", v.quali[0]!, v.quali[1]!, true],
    ["Race", v.race[0]!, v.race[1]!, true],
    ["Points", v.a.points, v.b.points, true],
    ["Wins", v.a.wins, v.b.wins, true],
    ["Podiums", v.a.podiums, v.b.podiums, true],
    ["Poles", v.a.poles, v.b.poles, true],
    ["Best finish", v.a.best, v.b.best, false],
    ["Average grid", v.a.grid, v.b.grid, false],
    ["Average finish", v.a.finish, v.b.finish, false],
    ["Retirements", v.a.dnfs, v.b.dnfs, false],
  ];
  const show = (n: number | null, k: string) =>
    n === null ? "–" : k.startsWith("Average") ? avg(n) : String(n);
  return (
    <table className="w-full text-sm tabular-nums">
      <thead className="text-xs text-soft">
        <tr>
          <th className="text-left font-normal" />
          {[a, b].map((id) => (
            <th key={id} className="w-16 text-right font-semibold text-paper">
              <span className="inline-flex items-center gap-1.5">
                <Swatch color={colorOf(series, id)} />
                {codeOf(series, seats, id)}
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lines.map(([name, x, y, more]) => {
          const win = x === null || y === null || x === y ? -1 : (more ? x > y : x < y) ? 0 : 1;
          return (
            <tr key={name}>
              <td className="py-0.5 text-soft">{name}</td>
              {[x, y].map((n, k) => (
                <td key={k} className={`text-right ${win === k ? "font-semibold text-go" : ""}`}>
                  {show(n, name)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Stats({ rounds, calendar, sprints, trackName }: SeasonProps) {
  if (!rounds.length) return <p className={label}>No rounds yet.</p>;
  const s = season(rounds, 0, sprints);
  const pts = pointsOf(sprints);
  const tiles: [string, string][] = [
    ["Points", String(s.points)],
    ["Wins", String(s.wins)],
    ["Podiums", String(s.podiums)],
    ["Poles", String(s.poles)],
    ["Fastest laps", String(s.fastest)],
    ["Retirements", String(s.dnfs)],
    ["Average grid", avg(s.grid)],
    ["Average finish", avg(s.finish)],
  ];
  return (
    <>
      <dl className="grid grid-cols-4 gap-2 text-center">
        {tiles.map(([name, value]) => (
          <div key={name} className="rounded-sm px-1 py-1.5 ring-1 ring-paper/25">
            <dd className="disp text-lg leading-none">{value}</dd>
            <dt className="mt-1 text-[11px] text-soft">{name}</dt>
          </div>
        ))}
      </dl>
      <ol className="mt-2 max-h-40 overflow-y-auto text-xs tabular-nums">
        {rounds.map((r, k) => {
          const p = placeIn(r, 0);
          return (
            <li key={k} className="flex gap-2 px-1 py-0.5">
              <span className="w-5 text-soft">{k + 1}</span>
              <span className="truncate">{trackName(r.track ?? calendar[k]!)}</span>
              <span className="ml-auto text-soft">
                {gridIn(r, 0) !== null ? `from P${gridIn(r, 0)! + 1}` : ""}
              </span>
              <span className="w-10 text-right">{p === null ? cell(r, 0) : `P${p + 1}`}</span>
              <span className="w-6 text-right font-semibold">{(p !== null && pts[p]) || ""}</span>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function Projections({ series, seats, rounds, calendar, sprints }: SeasonProps) {
  const left = calendar.length - rounds.length;
  const rows = outlook(rounds, sprints, left);
  const projected = rows.slice().sort((a, b) => b.projected - a.projected);
  return (
    <>
      <p className={label}>
        {left
          ? `${left} round${left > 1 ? "s" : ""} and ${left * pointsOf(sprints)[0]!} points left. ${rows.filter((r) => r.alive).length} can still win it.`
          : "The season's done."}
      </p>
      <table className="mt-1 w-full text-xs tabular-nums">
        <thead className="text-soft">
          <tr>
            <th className="text-left font-normal">Driver</th>
            <th className="text-right font-normal">Pts</th>
            <th className="text-right font-normal">Max</th>
            <th className="text-right font-normal">Projected</th>
            <th className="text-right font-normal">Title</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.k} className={r.k === 0 ? "bg-lamp" : ""}>
              <td>
                <span className="flex items-center gap-1.5">
                  <Swatch color={colorOf(series, r.k)} />
                  {codeOf(series, seats, r.k)}
                </span>
              </td>
              <td className="text-right font-semibold">{r.points}</td>
              <td className="text-right">{r.max}</td>
              <td className="text-right">
                {r.projected} <span className="text-soft">P{projected.indexOf(r) + 1}</span>
              </td>
              <td className={`text-right ${r.alive ? "text-go" : "text-soft"}`}>
                {r.alive ? "In it" : "Out"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-xs text-soft">
        Projected: points so far a round, for the rounds left.
      </p>
    </>
  );
}

// Where this round can settle the title, what each result does: yours if you can still win it,
// otherwise the leader's.
export function TitleScenarios(props: {
  series: Level;
  seats: number[];
  rounds: Round[];
  sprints: boolean;
  left: number;
}) {
  const { series, seats, rounds, sprints, left } = props;
  const mine = scenarios(rounds, 0, sprints, left);
  const alive = mine.some((s) => s.can);
  const who = alive ? 0 : standings(rounds, sprints).drivers[0]!.k;
  const list = alive ? mine : scenarios(rounds, who, sprints, left);
  const name = who ? codeOf(series, seats, who) : "You";
  const verb = left > 1 ? (who ? "clinches" : "clinch") : who ? "is champion" : "are champion";
  const can = list.filter((s) => s.can);
  return (
    <div className="mt-3 rounded-sm p-2 ring-1 ring-accent">
      <p className="text-xs font-semibold tracking-wide text-accent uppercase">
        {left > 1 ? "The title can be won here" : "Title decider"}
      </p>
      {can.length ? (
        <ul className="mt-1 text-sm">
          {can.map((s) => (
            <li key={s.place}>
              <span className="font-semibold">P{s.place + 1}</span>
              {": "}
              {name} {verb}
              {s.needs.length
                ? ` if ${s.needs
                    .map((n) =>
                      n.below >= pointsOf(sprints).length
                        ? `${codeOf(series, seats, n.rival)} doesn't score`
                        : `${codeOf(series, seats, n.rival)} is P${n.below + 1} or lower`,
                    )
                    .join(" and ")}`
                : ", whatever happens"}
              .
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm">
          {name} can&apos;t {left > 1 ? "clinch it" : "win it"} here.
        </p>
      )}
    </div>
  );
}

// Points round by round: the top six, you and your teammate, teammates' second car dashed.
function Chart({ series, seats, rounds, calendar, sprints }: SeasonProps) {
  if (!rounds.length) return <p className={label}>No rounds yet.</p>;
  const prog = progression(rounds, sprints);
  const { drivers } = standings(rounds, sprints);
  const shown = [...new Set([...drivers.slice(0, 6).map((r) => r.k), 0, 1])];
  const top = Math.max(1, ...shown.map((id) => prog[id]!.at(-1)!));
  const [W, H, L, R, T, B] = [320, 160, 4, 34, 6, 14];
  const x = (k: number) => L + ((W - L - R) * (k + 1)) / calendar.length;
  const y = (p: number) => T + (H - T - B) * (1 - p / top);
  // The end labels, top down, LABEL apart at least.
  const LABEL = 9;
  const at = new Map<number, number>();
  let prev = -Infinity;
  for (const id of shown.slice().sort((a, b) => prog[b]!.at(-1)! - prog[a]!.at(-1)!)) {
    prev = Math.max(y(prog[id]!.at(-1)!) + 3, prev + LABEL);
    at.set(id, prev);
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Points by round">
      <line x1={L} x2={W - R} y1={y(0)} y2={y(0)} stroke="currentColor" opacity={0.25} />
      <text x={L} y={H - 2} className="fill-soft text-[8px]">
        Round 1
      </text>
      <text x={W - R} y={H - 2} textAnchor="end" className="fill-soft text-[8px]">
        {calendar.length}
      </text>
      {shown.map((id) => {
        const pts = [0, ...prog[id]!];
        const d = pts.map((p, k) => `${k ? "L" : "M"}${k ? x(k - 1) : L},${y(p)}`).join("");
        const end = pts.at(-1)!;
        return (
          <g key={id}>
            <path
              d={d}
              fill="none"
              stroke={colorOf(series, id)}
              strokeWidth={id === 0 ? 2.5 : 1.5}
              strokeDasharray={id & 1 ? "4 3" : undefined}
              strokeLinejoin="round"
            />
            <text
              x={x(rounds.length - 1) + 3}
              y={at.get(id)}
              className={`text-[8px] ${id === 0 ? "fill-paper font-semibold" : "fill-soft"}`}
            >
              {codeOf(series, seats, id)} {end}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function Compare(props: SeasonProps) {
  const { series, seats } = props;
  const { drivers } = standings(props.rounds, props.sprints);
  const [a, setA] = useState(0);
  const [b, setB] = useState(drivers.find((r) => r.k !== 0)?.k ?? 1);
  const pick = (value: number, set: (n: number) => void, name: string) => (
    <select
      aria-label={name}
      value={value}
      onChange={(e) => set(+e.target.value)}
      className="min-h-9 rounded-sm bg-ink px-2 text-sm ring-1 ring-paper/25"
    >
      {[...Array(CARS).keys()].map((id) => (
        <option key={id} value={id}>
          {codeOf(series, seats, id)} · {seated(series, seats, id).name}
        </option>
      ))}
    </select>
  );
  return (
    <>
      <div className="mb-2 flex gap-2">
        {pick(a, setA, "First driver")}
        {pick(b, setB, "Second driver")}
      </div>
      {a === b ? (
        <p className={label}>Pick two different drivers.</p>
      ) : (
        <HeadToHead {...props} a={a} b={b} />
      )}
    </>
  );
}
