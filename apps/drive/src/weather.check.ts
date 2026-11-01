// Self-check for the weather: the water, the grip curves' crossovers, the dry line, the forecast
// and wet races run headless. Run: node src/weather.check.ts
import assert from "node:assert/strict";
import {
  aquaplane,
  bestKind,
  clearLine,
  climate,
  drawWeather,
  fixedWeather,
  meanWater,
  rainAt,
  SECTIONS,
  tickWeather,
  traction,
  waterAt,
  wetGrip,
} from "./weather.ts";
import { TRACKS, getTrack } from "./tracks.ts";
import {
  carGrip,
  GRID,
  heatTyres,
  HIGH_T,
  legalSets,
  LOW_T,
  newRace,
  tick,
  type Tyre,
} from "./race.ts";

const seeded = (s: number) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const still = { gas: false, brake: false, steer: 0, ot: false };
const DT = 1 / 30;
const monza = getTrack("monza");

// Every track has a climate, wettest at Spa and driest in the desert.
for (const def of TRACKS) assert.ok(climate(def.id) > 0 && climate(def.id) < 1, def.id);
assert.ok(climate("spa") > climate("monza") && climate("monza") > climate("bahrain"));

// The curves: slicks in the dry, inters on a damp track, wets once it's soaked.
assert.equal(bestKind(0), "slick");
assert.equal(bestKind(0.2), "inter");
assert.equal(bestKind(1), "wet");
assert.equal(wetGrip("slick", 0), 1, "a dry slick is as tuned");
assert.ok(Math.abs(wetGrip("inter", 0.1) - 0.87) < 1e-9, "blended between depths");

// Deep water floats a slick at speeds a wet tyre holds on through, and not in the shallows.
assert.ok(aquaplane("slick", 1, 80) < aquaplane("inter", 1, 80));
assert.equal(aquaplane("wet", 1, 80), 1);
assert.equal(aquaplane("slick", 0.2, 90), 1);
// The wet takes traction out of slow corners, less with speed; a dry road none.
assert.equal(traction(1, 0), 1);
assert.ok(traction(0.4, 10) < traction(0.4, 60) && traction(0.4, 10) < 1);

// Water settles at the level of the rain: a shower doesn't soak the track however long it lasts.
{
  const w = fixedWeather(0, 0.4);
  for (let t = 0; t < 1_000_000; t += 100) tickWeather(w, 100);
  assert.ok(Math.abs(w.water[0]! - 0.4) < 0.01, `settles at the rain (${w.water[0]})`);
}
// Rain only falls under a cell, and water follows it: up in the rain, down after.
{
  const w = fixedWeather(0);
  w.cells = [{ from: 60_000, to: 300_000, at: 0.1, drift: 0, width: 0.1, rate: 1 }];
  assert.equal(rainAt(w, 3, 0), 0, "nothing before it starts");
  assert.ok(rainAt(w, 3, 200_000) > 0.9, "under it");
  assert.equal(rainAt(w, 15, 200_000), 0, "not across the lap");
  for (let t = 0; t < 240_000; t += 100) tickWeather(w, 100);
  assert.ok(w.water[3]! > 0.5, `wet under the cell (${w.water[3]})`);
  assert.equal(w.water[15], 0, "dry across the lap");
  assert.ok(w.any);
  const peak = w.water[3]!;
  for (let t = 0; t < 400_000; t += 100) tickWeather(w, 100);
  assert.ok(w.water[3]! < peak, "dries once it's passed");
}
// The dry line: cars clear water on it, not off it, and rain washes it back.
{
  const w = fixedWeather(0.4);
  for (let n = 0; n < 40; n++) clearLine(w, 5, 1);
  assert.ok(waterAt(w, 5, 0) < 0.4 * 0.6, "on the line, less water");
  assert.equal(waterAt(w, 5, 4), 0.4, "off it, all of it");
  w.cells = [{ from: -1e6, to: 1e12, at: 0, drift: 0, width: 2, rate: 1 }];
  const on = w.line[5]!;
  for (let t = 0; t < 10_000; t += 100) tickWeather(w, 100);
  assert.ok(w.line[5]! < on, "rain washes it back");
}
// Draws: Dry has nothing, Wet starts wet, and the same seed draws the same weekend.
assert.equal(drawWeather("spa", "dry", 1e6).cells.length, 0);
assert.ok(meanWater(drawWeather("spa", "wet", 1e6, seeded(3))) > 0.4);
assert.deepEqual(
  drawWeather("spa", "auto", 1e6, seeded(5)),
  drawWeather("spa", "auto", 1e6, seeded(5)),
);
{
  let wet = 0;
  const r = seeded(11);
  for (let k = 0; k < 400; k++) wet += +!!drawWeather("spa", "auto", 1e6, r).cells.length;
  let desert = 0;
  for (let k = 0; k < 400; k++) desert += +!!drawWeather("bahrain", "auto", 1e6, r).cells.length;
  assert.ok(wet > 150 && desert < 40, `Spa ${wet} of 400, Bahrain ${desert}`);
}
// A wet tyre runs waive the two-compound rule; a slick alone doesn't.
assert.ok(legalSets(["inter"]) && legalSets(["soft", "wet"]) && legalSets(["soft", "hard"]));
assert.ok(!legalSets(["soft", "soft"]));

// Heat: a slick on a wet track falls out of its window from below, a wet tyre stays near it, and
// on a dry road wet tyres overheat.
{
  const heat = (tyre: Tyre, water: number) => {
    const race = newRace(monza, GRID, seeded(7), "medium", "pro");
    const r = race.racers[10]!;
    r.tyre = tyre;
    for (let k = 0; k < 500; k++) heatTyres(race, r, still, 0, 1, 10, water);
    return r.temps[0]!;
  };
  assert.ok(heat("medium", 1) < LOW_T - 20, "a slick goes cold in standing water");
  assert.ok(heat("wet", 1) > heat("medium", 1) + 15, "a wet tyre holds its heat");
  assert.ok(
    heat("wet", 0) > HIGH_T && heat("inter", 0) > LOW_T + 20,
    "wet tyres cook on a dry road",
  );
}

// A lap alone at each depth on each tyre: the crossovers hold on a real lap, grip in carGrip follows
// the water, and the car still gets round.
const lap = (tyre: Tyre, water: number, id = 2) => {
  const race = newRace(
    monza,
    GRID,
    seeded(7),
    "medium",
    "pro",
    20,
    false,
    undefined,
    undefined,
    fixedWeather(water, water),
  );
  race.racers = race.racers.filter((r) => r.id === id);
  const r = race.racers[0]!;
  [r.tyre, r.stints, r.stops, r.plan] = [tyre, [tyre], [], [tyre]];
  race.slips = false;
  for (let f = 0; f < 800 / DT && r.laps < 3; f++) {
    [r.stops, r.plan, r.life] = [[], [tyre], 1];
    tick(race, still, DT);
  }
  return r.best;
};
{
  const dry = lap("medium", 0);
  const inters = [lap("inter", 0.2), lap("medium", 0.2)];
  const soaked = [lap("wet", 1), lap("inter", 1), lap("medium", 1)];
  console.log(`Monza: dry ${dry}, damp I/M ${inters}, soaked W/I/M ${soaked}`);
  assert.ok(dry > 0 && soaked.every((x) => x > 0), "gets round");
  assert.ok(inters[0]! < inters[1]!, "inters beat slicks when damp");
  assert.ok(soaked[0]! < soaked[1]! && soaked[1]! < soaked[2]!, "wets, then inters, then slicks");
  assert.ok(
    soaked[0]! / dry > 1.08 && soaked[0]! / dry < 1.5,
    `a soaked lap ${soaked[0]! / dry}x dry`,
  );
  assert.ok(lap("wet", 0) > dry, "wets are slower on a dry road");
}
// Grip's lower on the same set at a wet point; no weather, no change.
{
  const dry = newRace(monza, GRID, seeded(7), "medium", "pro");
  const wet = newRace(
    monza,
    GRID,
    seeded(7),
    "medium",
    "pro",
    undefined,
    false,
    undefined,
    undefined,
    fixedWeather(0.5),
  );
  assert.ok(carGrip(wet, wet.racers[3]!) < carGrip(dry, dry.racers[3]!));
}
assert.equal(SECTIONS, 30);
console.log("weather: ok");
