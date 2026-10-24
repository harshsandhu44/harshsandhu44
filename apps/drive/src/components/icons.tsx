// The HUD's icons, F1-game style: 16-unit line drawings in the text's colour.
import type { ReactNode } from "react";

const Icon = ({ className = "", children }: { className?: string; children: ReactNode }) => (
  <svg
    viewBox="0 0 16 16"
    aria-hidden
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`size-4 shrink-0 ${className}`}
  >
    {children}
  </svg>
);
type P = { className?: string };

// Lap times, the fastest lap and time penalties.
export const Stopwatch = ({ className }: P) => (
  <Icon className={className}>
    <circle cx="8" cy="9.5" r="5" />
    <path d="M8 9.5V7M6.5 2h3M8 2v2.5M12.2 4.8l1-1" />
  </Icon>
);
// The engineer on the radio.
export const Headset = ({ className }: P) => (
  <Icon className={className}>
    <path d="M3 10V8a5 5 0 0 1 10 0v2" />
    <rect x="2" y="9" width="3" height="4.5" rx="1" fill="currentColor" />
    <rect x="11" y="9" width="3" height="4.5" rx="1" fill="currentColor" />
    <path d="M12.5 13.5c0 1-1.5 1.5-3.5 1.5" />
  </Icon>
);
// A flag on a pole, filled: the blue flag, green, yellow.
export const Flag = ({ className }: P) => (
  <Icon className={className}>
    <path d="M3.5 15V1.5" />
    <path d="M3.5 2h9l-2 3 2 3h-9z" fill="currentColor" />
  </Icon>
);
// Black and white, for track limits' flag.
export const Warned = ({ className }: P) => (
  <Icon className={className}>
    <path d="M3.5 15V1.5" />
    <path d="M3.5 2h9v6h-9z" />
    <path d="M3.5 8h9V2z" fill="currentColor" />
  </Icon>
);
// The Safety Car.
export const Car = ({ className }: P) => (
  <Icon className={className}>
    <path d="M1.5 11.5 3.2 7.5h9.6l1.7 4v1.5h-13z" />
    <path d="M5 7.5 6 5h4l1 2.5" />
    <circle cx="4.5" cy="13" r="1.2" fill="currentColor" />
    <circle cx="11.5" cy="13" r="1.2" fill="currentColor" />
  </Icon>
);
// Track limits.
export const Warning = ({ className }: P) => (
  <Icon className={className}>
    <path d="M8 2 15 14H1z" />
    <path d="M8 6.5V9.5" />
    <circle cx="8" cy="11.8" r=".4" fill="currentColor" />
  </Icon>
);
// The battery, and Overtake.
export const Bolt = ({ className }: P) => (
  <Icon className={className}>
    <path d="M9.5 1 3.5 9h4l-1 6 6-8h-4z" fill="currentColor" />
  </Icon>
);
// The rear wing.
export const Wing = ({ className }: P) => (
  <Icon className={className}>
    <path d="M1.5 4h13l-1 3h-11z" fill="currentColor" />
    <path d="M5 7v6M11 7v6" />
  </Icon>
);
// Damage.
export const Wrench = ({ className }: P) => (
  <Icon className={className}>
    <path d="M10.5 1.8a3.5 3.5 0 0 0-3.1 5L2 12.2 3.8 14l5.4-5.4a3.5 3.5 0 0 0 5-3.1l-2.3 1.2-1.9-1.9 1.2-2.3z" />
  </Icon>
);
// The pit lane and its limiter.
export const Pit = ({ className }: P) => (
  <Icon className={className}>
    <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" />
    <path d="M6 12V4.5h2.5a2 2 0 0 1 0 4H6" />
  </Icon>
);
// Out of the race.
export const Out = ({ className }: P) => (
  <Icon className={className}>
    <circle cx="8" cy="8" r="6.5" />
    <path d="m5.5 5.5 5 5m0-5-5 5" />
  </Icon>
);
// Straight Mode: the wing open, for less drag.
export const Straight = ({ className }: P) => (
  <Icon className={className}>
    <path d="m4 8.5 4-4 4 4M4 13l4-4 4 4" />
  </Icon>
);
// Settings.
export const Cog = ({ className }: P) => (
  <Icon className={className}>
    <circle cx="8" cy="8" r="2.2" />
    <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M3.4 12.6l1.4-1.4M11.2 4.8l1.4-1.4" />
    <circle cx="8" cy="8" r="4.6" />
  </Icon>
);
// A tyre's compound, as the F1 roundel: a ring round its letter, in its colour.
export const Roundel = ({ letter, className }: P & { letter: string }) => (
  <svg viewBox="0 0 16 16" aria-hidden className={`size-4 shrink-0 ${className ?? ""}`}>
    <circle cx="8" cy="8" r="6.3" fill="none" stroke="currentColor" strokeWidth="2.4" />
    <text
      x="8"
      y="11.2"
      textAnchor="middle"
      fontSize="8.5"
      fontWeight="800"
      fill="currentColor"
      className="font-sans"
    >
      {letter}
    </text>
  </svg>
);
// Your car from above, between its four tyres' readings.
export const Chassis = ({ className }: P) => (
  <svg viewBox="0 0 12 28" aria-hidden className={className} fill="currentColor">
    <path d="M5 0h2l.6 6H9v2H7.8l.4 10H10v5H8.5L8 28H4l-.5-5H2v-5h1.8l.4-10H3V6h1.4z" />
  </svg>
);
