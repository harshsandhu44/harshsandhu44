// Driving aids, as in the F1 games: the racing line coloured for your speed with the braking point
// marked on it, and a steering assist that brings the car back to the line on the straights.
import { brakeAt, CAR_HALF_LENGTH, CAR_HALF_WIDTH, TOP, type Input, type Track } from "./track.ts";
import { aim, carGrip, type Race, type Racer } from "./race.ts";

export type Line = "off" | "corners" | "full";
// A shade for each point of the line: hidden, flat out, a corner coming you'll need to slow for,
// and brake now.
export const [HIDE, GO, SOON, BRAKE] = [0, 1, 2, 3] as const;
// How far ahead the line's coloured for your speed, and how long before the braking point the
// zone turns red.
const LOOK = 1000;
const LEAD = 0.5;
// With the line on corners, it's shown where the profile on new tyres is under TOP (the braking
// zones and the corners themselves) and EXIT m on.
const EXIT = 80;
const masks = new WeakMap<Track, boolean[]>();
const cornersOf = (track: Track) => {
  const { CUM, LENGTH, PATH, limitAt } = track;
  let mask = masks.get(track);
  if (mask) return mask;
  const N = PATH.length;
  const slow = PATH.map((_, i) => limitAt(i, 1, 1) < TOP - 0.5);
  mask = slow.slice();
  // Twice round, so a corner just before the line carries on past it.
  let last = -Infinity;
  for (let k = 0; k < 2 * N; k++) {
    const i = k % N;
    const m = CUM[i]! + (k >= N ? LENGTH : 0);
    if (slow[i]) last = m;
    else if (m - last < EXIT) mask[i] = true;
  }
  masks.set(track, mask);
  return mask;
};

// The line's shades into `out` (one a point) for a car `m` m round the lap at `v` m/s on grip
// `g`, and how far ahead its braking point is, if it has one in sight. Over the next LOOK m, the
// fastest the car can be at each point and still slow for everything after it, as track.ts's
// profile but not stopping at TOP, as the 2026 power runs past it: where you're quicker than
// that is the zone to brake for, and it starts at the braking point.
export function guide(track: Track, g: number, v: number, m: number, mode: Line, out: Uint8Array) {
  const { CUM, LENGTH, PATH, atDist, limitAt } = track;
  const N = PATH.length;
  const mask = cornersOf(track);
  for (let i = 0; i < N; i++)
    out[i] = mode === "full" || (mode === "corners" && mask[i]) ? GO : HIDE;
  const at = atDist(m);
  const ahead: number[] = [];
  const dist: number[] = [];
  for (let k = 1; k < N; k++) {
    const i = (at + k) % N;
    const d = (((CUM[i]! - m) % LENGTH) + LENGTH) % LENGTH;
    if (d > LOOK) break;
    ahead.push(i);
    dist.push(d);
  }
  const can = ahead.map((i) => {
    const l = limitAt(i, g, 1);
    return l >= TOP - 0.01 ? Infinity : l;
  });
  for (let k = can.length - 2; k >= 0; k--) {
    const next = can[k + 1]!;
    if (next === Infinity) continue;
    const reach = Math.sqrt(next * next + 2 * g * brakeAt(next) * (dist[k + 1]! - dist[k]!));
    can[k] = Math.min(can[k]!, reach);
  }
  const first = can.findIndex((c) => c < v);
  if (first < 0) return null;
  // The first zone red once you're within LEAD of its braking point; any later ones in sight
  // yellow, as you'll be slowing for them too.
  const now = dist[first]! <= v * LEAD;
  let zone = true;
  for (let k = first; k < can.length; k++)
    if (can[k]! < v) out[ahead[k]!] = zone && now ? BRAKE : SOON;
    else zone = false;
  return dist[first]!;
}

// The steering assist: with no steering asked for and no corner within CLEAR m, a gentle pull
// (at most PULL of full lock) towards the racing line. Never into a car alongside, and not on the
// pit side of the track from the pit entry's approach, where you might be heading in.
const CLEAR = 150;
const PULL = 0.3;
export function assist(race: Race, me: Racer, input: Input): Input {
  const { HALF, LENGTH, PIT_IN, PIT_OUT, PIT_SIDE, RACING, atDist, lateral, limitAt, pointAt } =
    race.track;
  const { car } = me;
  if (input.steer || me.pit || me.pitting || car.v < 10) return input;
  const m = me.p * LENGTH;
  const g = carGrip(race, me);
  for (let d = 0; d <= CLEAR; d += 10) if (limitAt(atDist(m + d), g, 1) < TOP - 0.5) return input;
  const s = race.track.signed(me.p);
  const now = lateral(car.x, car.y, me.p);
  if (s > PIT_IN - CLEAR && s < PIT_OUT && PIT_SIDE * now > 0) return input;
  const look = m + 10 + car.v * 0.5;
  const i = atDist(look);
  let to = Math.max(-HALF[i]! + 1.5, Math.min(HALF[i]! - 1.5, RACING[i]!));
  const blocked = race.racers.some((o) => {
    if (o === me || o.out || Math.abs(o.dist - me.dist) > 2 * CAR_HALF_LENGTH + 2) return false;
    const lo = lateral(o.car.x, o.car.y, o.p);
    return (lo - now) * (to - now) > 0 && Math.abs(lo - now) < 2 * CAR_HALF_WIDTH + 1.5;
  });
  if (blocked) to = now;
  return { ...input, steer: Math.max(-PULL, Math.min(PULL, aim(car, pointAt(look, to)))) };
}
