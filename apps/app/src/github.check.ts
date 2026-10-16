// Self-check for the derived GitHub stats. Run: node src/github.check.ts
import assert from "node:assert/strict";
import { bestDay, busiestWeekday, currentStreak, languageMix, longestStreak } from "./github.ts";

const day = (date: string, contributionCount: number, weekday: number) => ({
  date,
  contributionCount,
  weekday,
});
const days = [
  day("2026-10-10", 3, 6),
  day("2026-10-11", 0, 0),
  day("2026-10-12", 9, 1),
  day("2026-10-13", 2, 2),
  day("2026-10-14", 4, 3),
  day("2026-10-15", 1, 4),
  day("2026-10-16", 0, 5), // today, nothing yet
];

assert.equal(currentStreak(days), 4, "an empty today doesn't break the streak");
assert.equal(currentStreak([...days, day("2026-10-17", 0, 6)]), 0, "two empty days do");
assert.equal(longestStreak(days), 4);
assert.equal(bestDay(days).date, "2026-10-12");
assert.equal(busiestWeekday(days), "Monday");

const repo = (langs: [string, number][]) => ({
  languages: { edges: langs.map(([name, size]) => ({ size, node: { name } })) },
});
const mix = languageMix([
  repo([
    ["TypeScript", 5000],
    ["CSS", 300],
  ]),
  repo([
    ["Rust", 2000],
    ["Shell", 100],
    ["Ruby", 50],
    ["Python", 25],
  ]),
]);
assert.deepEqual(
  mix.map((l) => l.name),
  ["TypeScript", "Rust", "CSS", "Shell", "Other"],
);
assert.equal(
  mix.reduce((a, l) => a + l.pct, 0),
  100,
);
assert.deepEqual(languageMix([]), []);

console.log("github stats: ok");
