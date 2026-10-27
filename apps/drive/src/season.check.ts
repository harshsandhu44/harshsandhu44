// Self-check for a season's numbers. Run: node src/season.check.ts
import assert from "node:assert/strict";
import { CARS, type Round } from "./race.ts";
import { champion, decidable, h2h, outlook, progression, scenarios, season } from "./season.ts";

// A round finishing in `first` then everyone else by id, with `none` out.
const round = (first: number[], none: number[] = []): Round => ({
  order: [...first, ...[...Array(CARS).keys()].filter((id) => !first.includes(id))],
  none,
});

// Two rounds: 2 wins then 3 wins, you (0) second both times, 1 fourth.
const two = [round([2, 0, 3]), round([3, 0, 2])];
assert.deepEqual(
  progression(two, false)
    .slice(0, 4)
    .map((p) => p.at(-1)),
  [36, 24, 40, 40],
  "points after each round",
);
const me = season(two, 0, false);
assert.equal(me.points, 36);
assert.equal(me.podiums, 2);
assert.equal(me.wins, 0);
assert.equal(me.finish, 2);
const vs = h2h([...two, round([0, 1]), round([1], [0])], 0, 1, false);
assert.deepEqual(vs.race, [3, 1], "a finish beats a retirement");

// The title: with one round to go, 2 and 3 tied on 40 and you on 36.
assert.ok(decidable(two, false, 1), "the last round decides it");
const look = outlook(two, false, 1);
assert.ok(look.find((r) => r.k === 0)!.alive, "36 + 25 still catches 40");
assert.ok(!look.find((r) => r.k === 8)!.alive, "4 + 25 doesn't");
// Win it and you're champion unless 2 or 3 is second (40 + 18 = 58 < 61, so no: you win
// whatever). Second, either of them winning beats you.
const s = scenarios(two, 0, false, 1);
assert.deepEqual(s[0], { place: 0, can: true, needs: [] }, "a win does it");
const p2 = s[1]!;
assert.ok(p2.can, "second can still do it");
assert.deepEqual(
  p2.needs.filter((n) => n.rival === 2 || n.rival === 3).map((n) => n.below),
  [3, 3],
  "if 2 and 3 are both fourth or lower (40 + 15 = 55 > 54)",
);
assert.equal(s[9]!.can, false, "tenth can't");
// Not decidable before the last with a close fight; a tie at the end goes on countback.
assert.ok(!decidable(two, false, 3), "not with three to go");
const rest = [...Array(CARS).keys()].filter((id) => id !== 9 && id !== 10);
const tie = champion(two, round([9, 10], rest), false, 1);
assert.equal(tie, 2, "2 and 3 tied on points and places: the lower index first");
console.log("season: ok");
