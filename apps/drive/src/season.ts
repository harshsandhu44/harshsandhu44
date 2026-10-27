// A career season's numbers from its rounds: points by round, head-to-heads, a driver's season,
// who can still win the title and, where this round can decide it, what each result does.
import { CARS, POINTS, SPRINT_POINTS, standings, type Round } from "./race.ts";

export const pointsOf = (sprints: boolean) => (sprints ? SPRINT_POINTS : POINTS);
// A driver's place in a round (0 for the winner), or null out of the race or disqualified.
export const placeIn = (r: Round, id: number) => (r.none.includes(id) ? null : r.order.indexOf(id));
// The slot it started from (0 for pole), where the round saved its classification.
export const gridIn = (r: Round, id: number) => {
  const g = r.table?.find((row) => row.id === id)?.grid;
  return g ? g - 1 : null;
};

// Each driver's points after each round: [id][k] after k + 1 rounds.
export function progression(rounds: Round[], sprints: boolean) {
  const pts = pointsOf(sprints);
  return [...Array(CARS).keys()].map((id) => {
    let sum = 0;
    return rounds.map((r) => (sum += pts[placeIn(r, id) ?? CARS] ?? 0));
  });
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

// A driver's season: starts, wins, podiums, poles, fastest laps, retirements, points, and the
// average grid slot and finish (1 for first; classified finishes only).
export function season(rounds: Round[], id: number, sprints: boolean) {
  const places = rounds.map((r) => placeIn(r, id));
  const finished = places.filter((p): p is number => p !== null);
  const grids = rounds.map((r) => gridIn(r, id)).filter((g): g is number => g !== null);
  const pts = pointsOf(sprints);
  return {
    starts: rounds.length,
    wins: finished.filter((p) => p === 0).length,
    podiums: finished.filter((p) => p < 3).length,
    poles: grids.filter((g) => g === 0).length,
    fastest: rounds.filter((r) => r.fastest === id).length,
    dnfs: places.length - finished.length,
    points: finished.reduce((s, p) => s + (pts[p] ?? 0), 0),
    best: finished.length ? Math.min(...finished) + 1 : null,
    grid: grids.length ? mean(grids)! + 1 : null,
    finish: finished.length ? mean(finished)! + 1 : null,
  };
}

// Two drivers head to head: qualifying (where saved), the race (the better place, a retirement
// behind any finish; both out counts for neither) and each one's season.
export function h2h(rounds: Round[], a: number, b: number, sprints: boolean) {
  const quali = [0, 0];
  const race = [0, 0];
  for (const r of rounds) {
    const [ga, gb] = [gridIn(r, a), gridIn(r, b)];
    if (ga !== null && gb !== null) quali[ga < gb ? 0 : 1]!++;
    const [pa, pb] = [placeIn(r, a) ?? Infinity, placeIn(r, b) ?? Infinity];
    if (pa !== pb) race[pa < pb ? 0 : 1]!++;
  }
  return { quali, race, a: season(rounds, a, sprints), b: season(rounds, b, sprints) };
}

// The title with `left` rounds to go: each driver's points, the most they can reach, whether that
// still catches the leader, and where they'd finish at their points a round so far.
export function outlook(rounds: Round[], sprints: boolean, left: number) {
  const { drivers } = standings(rounds, sprints);
  const top = pointsOf(sprints)[0]!;
  const lead = drivers[0]!.points;
  const rate = (p: number) => (rounds.length ? p / rounds.length : 0);
  return drivers.map(({ k, points }) => ({
    k,
    points,
    max: points + left * top,
    alive: points + left * top >= lead,
    projected: Math.round(points + rate(points) * left),
  }));
}

// Whether this round (with `left` to go, it included) can settle the title: the last always
// does, and before it, if the leader winning with the next driver scoring nothing would put him
// out of reach.
export function decidable(rounds: Round[], sprints: boolean, left: number) {
  if (left <= 0) return false;
  if (left === 1) return true;
  const [a, b] = standings(rounds, sprints).drivers;
  const top = pointsOf(sprints)[0]!;
  return a!.points + top - b!.points > (left - 1) * top;
}

// The champion if this round ends as `round` with `left` to go, it included, or null if it's
// still open. Before the last round a lead has to be out of reach (a tie could still go either
// way); at the last, countback settles a tie.
export function champion(rounds: Round[], round: Round, sprints: boolean, left: number) {
  const [a, b] = standings([...rounds, round], sprints).drivers;
  if (left <= 1) return a!.k;
  return a!.points - b!.points > (left - 1) * pointsOf(sprints)[0]! ? a!.k : null;
}

// What `me` needs this round: for each place that scores, the rivals that'd still beat them and
// the best each can finish without doing so (`below`, 0 for P1). One rival at a time, the rest
// scoring nothing, as the scenarios on TV are told. A place it can't be won from has `can: false`.
export type Need = { rival: number; below: number };
export function scenarios(rounds: Round[], me: number, sprints: boolean, left: number) {
  const pts = pointsOf(sprints);
  const out: { place: number; can: boolean; needs: Need[] }[] = [];
  // A round where `me` is at `p`, `rival` at `q` and nobody else scores.
  const wins = (p: number, rival: number, q: number) => {
    const order = [...Array(CARS).keys()].filter((id) => id !== me && id !== rival);
    const [first, second] =
      p < q
        ? [
            [p, me],
            [q, rival],
          ]
        : [
            [q, rival],
            [p, me],
          ];
    order.splice(first![0]!, 0, first![1]!);
    order.splice(second![0]!, 0, second![1]!);
    const none = order.filter((id) => id !== me && id !== rival);
    return champion(rounds, { order, none }, sprints, left) === me;
  };
  for (let p = 0; p < pts.length; p++) {
    let can = true;
    const needs: Need[] = [];
    for (let rival = 0; rival < CARS && can; rival++) {
      if (rival === me) continue;
      // The best place the rival can take with `me` still champion.
      let q = 0;
      while (q < CARS && (q === p || !wins(p, rival, q))) q++;
      if (q === CARS) can = false;
      else if (q > (p === 0 ? 1 : 0)) needs.push({ rival, below: q });
    }
    out.push({ place: p, can, needs: can ? needs : [] });
  }
  return out;
}
