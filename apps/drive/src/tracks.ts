// The circuits to pick from, in the picker's order. Corners, Straight Mode zones (the old DRS
// zones) and pit lanes are read off each centreline's curvature and placed against OpenStreetMap
// by hand; metres are round the lap from the line. Pit lanes are simplified to the main straight
// on their real side. Grip counts for more or less of a lap from track to track, so proEdge sets
// pro's extra grip on each one to lap as close to a clean lap as at Monza, so pro is as hard on
// every track; legendsEdge does the same for legends against pro.
import { INTERLAGOS_DATA } from "./interlagos.ts";
import { MONZA_DATA } from "./monza.ts";
import { REDBULLRING_DATA } from "./redbullring.ts";
import { SILVERSTONE_DATA } from "./silverstone.ts";
import { SPA_DATA } from "./spa.ts";
import { RUNOFF, buildTrack, type Track, type TrackDef } from "./track.ts";

// Stands m round the lap, the given gap off the tarmac (negative on the left).
const row = (gap: number, ...ms: number[]) => ms.map((m): [number, number] => [m, gap]);
// Four behind the barrier on the outside of a corner, either side of its apex.
const corner = (side: 1 | -1, at: number) =>
  row(side * (RUNOFF + 2), at - 130, at - 45, at + 45, at + 130);

export const TRACKS: TrackDef[] = [
  {
    id: "monza",
    name: "Monza",
    length: 5793,
    data: MONZA_DATA,
    corners: [
      { name: "Rettifilo", turnIn: 590, at: 665, boards: true },
      { name: "Curva Grande", turnIn: 1000, at: 1300, boards: false },
      { name: "Roggia", turnIn: 1800, at: 1880, boards: true },
      { name: "Lesmo 1", turnIn: 2170, at: 2290, boards: false },
      { name: "Lesmo 2", turnIn: 2530, at: 2590, boards: false },
      { name: "Ascari", turnIn: 3610, at: 3835, boards: true },
      { name: "Parabolica", turnIn: 4795, at: 4920, boards: true },
    ],
    // The main straight, and Lesmo 2 to Ascari.
    zones: [
      { detect: 4920, from: -650, to: 440 },
      { detect: 2590, from: 2700, to: 3460 },
    ],
    // After the Parabolica, rejoining before the Rettifilo.
    pit: { side: 1, in: -420, from: -300, to: 120, out: 220 },
    stands: [...row(-10, -200, -110, -20, 70), ...corner(-1, 4920)],
    seed: 1922,
    grip: 0.259,
    stop: 0.248,
  },
  {
    id: "spa",
    name: "Spa",
    length: 7004,
    data: SPA_DATA,
    corners: [
      { name: "La Source", turnIn: 330, at: 365, boards: true },
      { name: "Eau Rouge", turnIn: 1014, at: 1029, boards: false },
      { name: "Raidillon", turnIn: 1084, at: 1254, boards: false },
      { name: "Les Combes", turnIn: 2359, at: 2493, boards: true },
      { name: "Malmedy", turnIn: 2588, at: 2643, boards: false },
      { name: "Bruxelles", turnIn: 2953, at: 2978, boards: true },
      { name: "Speakers", turnIn: 3233, at: 3273, boards: false },
      { name: "Pouhon", turnIn: 3743, at: 3987, boards: false },
      { name: "Fagnes", turnIn: 4417, at: 4637, boards: true },
      { name: "Stavelot", turnIn: 4882, at: 5186, boards: false },
      { name: "Blanchimont", turnIn: 5916, at: 6181, boards: false },
      { name: "Bus Stop", turnIn: 6696, at: 6721, boards: true },
    ],
    // The main straight, and the Kemmel straight.
    zones: [
      { detect: 6721, from: -170, to: 290 },
      { detect: 365, from: 1300, to: 2320 },
    ],
    // ponytail: the real lane leaves in the Bus Stop and rejoins after La Source; here it's
    // between them, so it never crosses a chicane.
    pit: { side: 1, in: -200, from: -125, to: 140, out: 240 },
    stands: [...row(-10, -140, -50, 40, 130), ...corner(-1, 365)],
    seed: 1921,
    grip: 0.396,
    stop: 0.105,
    proEdge: 1.23,
    legendsEdge: 1.26,
  },
  {
    id: "silverstone",
    name: "Silverstone",
    length: 5891,
    data: SILVERSTONE_DATA,
    corners: [
      { name: "Abbey", turnIn: 275, at: 295, boards: false },
      { name: "Farm", turnIn: 480, at: 545, boards: false },
      { name: "Village", turnIn: 755, at: 794, boards: true },
      { name: "The Loop", turnIn: 910, at: 944, boards: false },
      { name: "Aintree", turnIn: 1114, at: 1144, boards: false },
      { name: "Brooklands", turnIn: 1799, at: 1904, boards: true },
      { name: "Luffield", turnIn: 1989, at: 2079, boards: false },
      { name: "Woodcote", turnIn: 2334, at: 2348, boards: false },
      { name: "Copse", turnIn: 2918, at: 3033, boards: false },
      { name: "Maggotts", turnIn: 3488, at: 3513, boards: false },
      { name: "Becketts", turnIn: 3588, at: 3918, boards: false },
      { name: "Chapel", turnIn: 4053, at: 4093, boards: false },
      { name: "Stowe", turnIn: 4863, at: 4983, boards: true },
      { name: "Vale", turnIn: 5392, at: 5417, boards: true },
      { name: "Club", turnIn: 5457, at: 5677, boards: false },
    ],
    // The Wellington and Hangar straights.
    zones: [
      { detect: 794, from: 1190, to: 1760 },
      { detect: 3918, from: 4140, to: 4820 },
    ],
    // ponytail: the real lane leaves at Vale and rejoins after Farm; here it's on the Hamilton
    // straight between Club and Abbey.
    pit: { side: 1, in: -205, from: -125, to: 140, out: 215 },
    stands: [...row(-10, -120, -30, 60, 150), ...corner(-1, 2079)],
    seed: 1948,
    grip: 0.422,
    stop: 0.121,
    proEdge: 1.19,
    legendsEdge: 1.21,
  },
  {
    id: "interlagos",
    name: "Interlagos",
    length: 4309,
    data: INTERLAGOS_DATA,
    corners: [
      { name: "Senna S", turnIn: 280, at: 464, boards: true },
      { name: "Curva do Sol", turnIn: 499, at: 634, boards: false },
      { name: "Descida do Lago", turnIn: 1369, at: 1618, boards: true },
      { name: "Ferradura", turnIn: 1988, at: 2168, boards: false },
      { name: "Laranjinha", turnIn: 2283, at: 2327, boards: false },
      { name: "Pinheirinho", turnIn: 2402, at: 2457, boards: false },
      { name: "Bico de Pato", turnIn: 2717, at: 2781, boards: true },
      { name: "Mergulho", turnIn: 2876, at: 3021, boards: false },
      { name: "Junção", turnIn: 3221, at: 3266, boards: true },
      { name: "Café", turnIn: 3365, at: 3390, boards: false },
    ],
    // The main straight, and the Reta Oposta.
    zones: [
      { detect: 3266, from: -500, to: 230 },
      { detect: 464, from: 800, to: 1320 },
    ],
    // On the inside, the left, up the hill from Junção. ponytail: the real lane rejoins after
    // Curva do Sol; here it's back before the Senna S.
    pit: { side: -1, in: -420, from: -300, to: 120, out: 220 },
    stands: [...row(10, -200, -110, -20, 70), ...row(RUNOFF + 2, 245, 330)],
    seed: 1940,
    grip: 0.324,
    stop: 0.258,
    proEdge: 1.23,
    legendsEdge: 1.26,
  },
  {
    id: "redbullring",
    name: "Red Bull Ring",
    length: 4318,
    data: REDBULLRING_DATA,
    // Only Turns 1 and 9 keep their names; the rest are sponsors' and change.
    corners: [
      { name: "Niki Lauda", turnIn: 430, at: 450, boards: true },
      { name: "Turn 3", turnIn: 1359, at: 1394, boards: true },
      { name: "Turn 4", turnIn: 2168, at: 2208, boards: true },
      { name: "Turn 5", turnIn: 2298, at: 2468, boards: false },
      { name: "Turn 6", turnIn: 2637, at: 2737, boards: false },
      { name: "Turn 7", turnIn: 2957, at: 3097, boards: false },
      { name: "Turn 8", turnIn: 3142, at: 3217, boards: false },
      { name: "Jochen Rindt", turnIn: 3731, at: 3786, boards: false },
      { name: "Turn 10", turnIn: 3966, at: 3986, boards: true },
    ],
    // Three: the main straight, up to Turn 3, and down to Turn 4.
    zones: [
      { detect: 3786, from: -260, to: 380 },
      { detect: 450, from: 560, to: 1300 },
      { detect: 1394, from: 1700, to: 2120 },
    ],
    // ponytail: the real lane leaves after Turn 9 and rejoins after Turn 1; here it's on the
    // main straight.
    pit: { side: 1, in: -285, from: -195, to: 120, out: 220 },
    stands: [...row(-10, -170, -80, 10, 100), ...corner(-1, 1394)],
    seed: 1969,
    grip: 0.305,
    stop: 0.199,
    proEdge: 1.29,
    legendsEdge: 1.33,
  },
];

// Each circuit is built the first time it's picked: the racing line, the speed profiles and the
// park take tens of milliseconds.
const built = new Map<string, Track>();
export const getTrack = (id: string) => {
  const def = TRACKS.find((t) => t.id === id) ?? TRACKS[0]!;
  let t = built.get(def.id);
  if (!t) built.set(def.id, (t = buildTrack(def)));
  return t;
};
