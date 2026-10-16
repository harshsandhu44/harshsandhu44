// The GitHub numbers behind the blueprint section on the home page. One GraphQL call, cached for an
// hour. The token is the owner's, so private contributions are counted (as counts only, no repo
// names). Without a token, or if GitHub fails, it returns null and the section isn't rendered.

export const handle = "harshsandhu44";

export type Level =
  "NONE" | "FIRST_QUARTILE" | "SECOND_QUARTILE" | "THIRD_QUARTILE" | "FOURTH_QUARTILE";
export type Day = {
  date: string;
  contributionCount: number;
  contributionLevel: Level;
  weekday: number;
};
type Repo = { languages: { edges: { size: number; node: { name: string } }[] } };

const query = `query($login: String!) {
  user(login: $login) {
    createdAt
    repositories(ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, first: 100) {
      totalCount
      nodes { languages(first: 10) { edges { size node { name } } } }
    }
    contributionsCollection {
      totalCommitContributions
      contributionCalendar {
        totalContributions
        weeks { contributionDays { date contributionCount contributionLevel weekday } }
      }
    }
  }
}`;

export async function getGarage() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return null;
  try {
    const res = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: { Authorization: `bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { login: handle } }),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const { data } = await res.json();
    const u = data?.user;
    if (!u) return null;

    const cal = u.contributionsCollection.contributionCalendar;
    const weeks: Day[][] = cal.weeks.map((w: { contributionDays: Day[] }) => w.contributionDays);
    const days = weeks.flat();
    return {
      weeks,
      contributions: cal.totalContributions as number,
      commits: u.contributionsCollection.totalCommitContributions as number,
      repos: u.repositories.totalCount as number,
      since: new Date(u.createdAt).getUTCFullYear(),
      streak: currentStreak(days),
      longest: longestStreak(days),
      best: bestDay(days),
      weekday: busiestWeekday(days),
      languages: languageMix(u.repositories.nodes),
      fetchedAt: new Date().toISOString().slice(0, 10),
    };
  } catch {
    return null;
  }
}

export type Garage = NonNullable<Awaited<ReturnType<typeof getGarage>>>;

// Days in a row up to the last day in the calendar (today). An empty today doesn't break the
// streak yet, so counting starts from yesterday.
export function currentStreak(days: Pick<Day, "contributionCount">[]) {
  let i = days.length - 1;
  if (days[i]?.contributionCount === 0) i--;
  let n = 0;
  for (; i >= 0 && days[i]!.contributionCount > 0; i--) n++;
  return n;
}

export function longestStreak(days: Pick<Day, "contributionCount">[]) {
  let best = 0;
  let run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return best;
}

export function bestDay(days: Pick<Day, "date" | "contributionCount">[]) {
  return days.reduce((a, b) => (b.contributionCount > a.contributionCount ? b : a));
}

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function busiestWeekday(days: Pick<Day, "weekday" | "contributionCount">[]) {
  const totals = Array<number>(7).fill(0);
  for (const d of days) totals[d.weekday]! += d.contributionCount;
  return weekdays[totals.indexOf(Math.max(...totals))]!;
}

// Bytes of code per language across the repos: the top four, then everything else as Other.
// Percentages are rounded so they still add up to 100.
export function languageMix(repos: Repo[]) {
  const bytes = new Map<string, number>();
  for (const r of repos)
    for (const e of r.languages.edges)
      bytes.set(e.node.name, (bytes.get(e.node.name) ?? 0) + e.size);
  const total = [...bytes.values()].reduce((a, b) => a + b, 0);
  if (!total) return [];
  const sorted = [...bytes].sort((a, b) => b[1] - a[1]);
  const rows = sorted
    .slice(0, 4)
    .map(([name, size]) => ({ name, pct: Math.round((size / total) * 100) }));
  const rest = 100 - rows.reduce((a, r) => a + r.pct, 0);
  if (sorted.length > 4 && rest > 0) rows.push({ name: "Other", pct: rest });
  else rows[0]!.pct += rest;
  return rows;
}
