// Live flavor for the pixel-farm portfolio. The design hard-coded "Fall 10 ·
// Year 26" and "Lv 26"; we compute them from the current date instead.
//
// Lv  = age this year (currentYear - BIRTH_YEAR). Birth month/day unknown, so
//       it ticks over on Jan 1 rather than the actual birthday.
// Year = calendar year mod 100.
// Season = meteorological season; dayOfSeason = day of the month.

const BIRTH_YEAR = 1999;

const SEASONS = ["Winter", "Spring", "Summer", "Fall"] as const;

export type FarmClock = {
  seasonLabel: string;
  dayOfSeason: number;
  /** e.g. "Fall 10" */
  dateLabel: string;
  year: number;
  level: number;
};

export function farmClock(now: Date = new Date()): FarmClock {
  const month = now.getMonth(); // 0-11
  const seasonLabel = SEASONS[Math.floor(((month + 1) % 12) / 3)]!;
  const dayOfSeason = now.getDate();
  return {
    seasonLabel,
    dayOfSeason,
    dateLabel: `${seasonLabel} ${dayOfSeason}`,
    year: now.getFullYear() % 100,
    level: now.getFullYear() - BIRTH_YEAR,
  };
}
