// The circuits to pick from, in the picker's order. Corners, Straight Mode zones (the old DRS
// zones) and pit lanes are read off each centreline's curvature and placed against OpenStreetMap
// by hand; metres are round the lap from the line. Pit lanes are simplified to the main straight
// on their real side. Grip counts for more or less of a lap from track to track, so proEdge sets
// pro's extra grip on each one to lap as close to a clean lap as at Monza, so pro is as hard on
// every track; where the player has set a clean qualifying lap it puts pro's pole on that lap
// instead (race.check.ts POLE), or 1% off it on the five newest so pro isn't only for them.
// legendsEdge does the same for legends against pro. Wear is how hard each is on tyres, by eye
// from Pirelli's ratings: Lusail, Silverstone and Spa the hardest, Monaco the easiest. The street
// circuits (Monaco, Las Vegas) have their walls close, so their stands are nearer too.
import { AUSTIN_DATA } from "./austin.ts";
import { INTERLAGOS_DATA } from "./interlagos.ts";
import { LUSAIL_DATA } from "./lusail.ts";
import { MONACO_DATA } from "./monaco.ts";
import { MONZA_DATA } from "./monza.ts";
import { REDBULLRING_DATA } from "./redbullring.ts";
import { SILVERSTONE_DATA } from "./silverstone.ts";
import { SPA_DATA } from "./spa.ts";
import { RUNOFF, buildTrack, type Track, type TrackDef } from "./track.ts";
import { VEGAS_DATA } from "./vegas.ts";
import { YAS_DATA } from "./yasmarina.ts";

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
    wear: 0.8,
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
    wear: 1.2,
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
    grip: 0.364,
    stop: 0.138,
    wear: 1.25,
    proEdge: 1.29,
    legendsEdge: 1.325,
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
    wear: 1,
    proEdge: 1.23,
    legendsEdge: 1.27,
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
    wear: 0.85,
    proEdge: 1.29,
    legendsEdge: 1.34,
  },
  {
    id: "austin",
    name: "Austin",
    length: 5513,
    data: AUSTIN_DATA,
    // Numbered, as at COTA.
    corners: [
      { name: "Turn 1", turnIn: 480, at: 560, boards: true },
      { name: "Turn 2", turnIn: 730, at: 841, boards: false },
      { name: "Turn 3", turnIn: 1041, at: 1076, boards: false },
      { name: "Turn 4", turnIn: 1131, at: 1166, boards: false },
      { name: "Turn 5", turnIn: 1216, at: 1251, boards: false },
      { name: "Turn 6", turnIn: 1326, at: 1486, boards: false },
      { name: "Turn 7", turnIn: 1596, at: 1631, boards: false },
      { name: "Turn 8", turnIn: 1736, at: 1776, boards: false },
      { name: "Turn 9", turnIn: 1866, at: 1891, boards: false },
      { name: "Turn 10", turnIn: 2066, at: 2086, boards: false },
      { name: "Turn 11", turnIn: 2451, at: 2491, boards: true },
      { name: "Turn 12", turnIn: 3657, at: 3687, boards: true },
      { name: "Turn 13", turnIn: 3873, at: 3913, boards: false },
      { name: "Turn 14", turnIn: 3978, at: 4008, boards: false },
      { name: "Turn 15", turnIn: 4113, at: 4208, boards: false },
      { name: "Turn 16", turnIn: 4383, at: 4413, boards: false },
      { name: "Turn 17", turnIn: 4478, at: 4518, boards: false },
      { name: "Turn 18", turnIn: 4588, at: 4729, boards: false },
      { name: "Turn 19", turnIn: 4924, at: 4964, boards: false },
      { name: "Turn 20", turnIn: 5219, at: 5254, boards: false },
    ],
    // The main straight, and the back straight.
    zones: [
      { detect: 5254, from: -190, to: 440 },
      { detect: 2491, from: 2570, to: 3610 },
    ],
    // On the inside, the left. ponytail: the real lane leaves before Turn 20 and rejoins after
    // Turn 1; here it's on the main straight.
    pit: { side: -1, in: -190, from: -110, to: 180, out: 280 },
    stands: [...row(10, -200, -110, -20, 70), ...corner(1, 560)],
    seed: 2012,
    grip: 0.394,
    stop: 0.138,
    wear: 1.1,
    proEdge: 1.36,
    legendsEdge: 1.38,
  },
  {
    id: "lasvegas",
    name: "Las Vegas",
    length: 6201,
    data: VEGAS_DATA,
    // Numbered, as on the Strip; the kinks between go unnamed.
    corners: [
      { name: "Turn 1", turnIn: 110, at: 155, boards: true },
      { name: "Turn 3", turnIn: 350, at: 380, boards: false },
      { name: "Turn 5", turnIn: 1420, at: 1440, boards: true },
      { name: "Turn 7", turnIn: 1745, at: 1895, boards: false },
      { name: "Turn 8", turnIn: 1934, at: 1959, boards: false },
      { name: "Turn 9", turnIn: 2044, at: 2094, boards: false },
      { name: "Turn 11", turnIn: 2409, at: 2564, boards: false },
      { name: "Turn 12", turnIn: 3064, at: 3089, boards: true },
      { name: "Turn 14", turnIn: 4999, at: 5014, boards: true },
      { name: "Turn 16", turnIn: 5119, at: 5154, boards: false },
      { name: "Turn 17", turnIn: 5858, at: 5978, boards: false },
    ],
    // Three: Koval Lane, the Strip and Harmon Avenue.
    zones: [
      { detect: 5154, from: 5220, to: 5840 },
      { detect: 380, from: 630, to: 1360 },
      { detect: 3089, from: 3150, to: 4970 },
    ],
    // On the left. ponytail: the real lane rejoins after Turn 1; here it's back before it.
    pit: { side: -1, in: -400, from: -310, to: -50, out: 50 },
    stands: [...row(8, -200, -110, -20, 70), ...row(8, 25, 110, 200, 285)],
    seed: 2023,
    grip: 0.305,
    stop: 0.162,
    wear: 0.7,
    proEdge: 1.49,
    legendsEdge: 1.55,
    runoff: 6,
    setting: "strip",
    sky: "night",
    sphere: [-51, -1290],
    smooth: true,
  },
  {
    id: "yasmarina",
    name: "Yas Marina",
    length: 5281,
    data: YAS_DATA,
    // Numbered, as at Yas Marina since its 2021 rework.
    corners: [
      { name: "Turn 1", turnIn: 260, at: 300, boards: true },
      { name: "Turn 2", turnIn: 510, at: 550, boards: false },
      { name: "Turn 3", turnIn: 645, at: 775, boards: false },
      { name: "Turn 5", turnIn: 1285, at: 1360, boards: true },
      { name: "Turn 6", turnIn: 2535, at: 2560, boards: true },
      { name: "Turn 7", turnIn: 2600, at: 2624, boards: false },
      { name: "Turn 9", turnIn: 3534, at: 3604, boards: true },
      { name: "Turn 10", turnIn: 3984, at: 4014, boards: false },
      { name: "Turn 11", turnIn: 4114, at: 4149, boards: false },
      { name: "Turn 12", turnIn: 4254, at: 4284, boards: false },
      { name: "Turn 13", turnIn: 4359, at: 4399, boards: false },
      { name: "Turn 14", turnIn: 4474, at: 4509, boards: false },
      { name: "Turn 15", turnIn: 4749, at: 4809, boards: false },
      { name: "Turn 16", turnIn: 4949, at: 5029, boards: false },
    ],
    // Down to Turn 6, and on to Turn 9.
    zones: [
      { detect: 775, from: 1440, to: 2490 },
      { detect: 2624, from: 2680, to: 3490 },
    ],
    // ponytail: the real lane runs on past Turn 1 and crosses under the track to rejoin on the
    // left; here it's back on the right before Turn 1.
    pit: { side: 1, in: -260, from: -180, to: 90, out: 190 },
    stands: [...row(-10, -200, -110, -20, 70), ...corner(1, 1360)],
    seed: 2009,
    grip: 0.392,
    stop: 0.136,
    wear: 0.9,
    proEdge: 1.27,
    legendsEdge: 1.28,
    setting: "desert",
    sky: "sunset",
    smooth: true,
  },
  {
    id: "monaco",
    name: "Monaco",
    length: 3337,
    data: MONACO_DATA,
    corners: [
      { name: "Sainte Dévote", turnIn: 190, at: 210, boards: true },
      { name: "Massenet", turnIn: 663, at: 758, boards: false },
      { name: "Casino", turnIn: 858, at: 893, boards: false },
      { name: "Mirabeau", turnIn: 1093, at: 1133, boards: true },
      { name: "Grand Hotel Hairpin", turnIn: 1178, at: 1253, boards: false },
      { name: "Mirabeau Bas", turnIn: 1303, at: 1343, boards: false },
      { name: "Portier", turnIn: 1393, at: 1418, boards: false },
      { name: "Nouvelle Chicane", turnIn: 2058, at: 2113, boards: true },
      { name: "Tabac", turnIn: 2338, at: 2368, boards: false },
      { name: "Piscine", turnIn: 2543, at: 2723, boards: false },
      { name: "La Rascasse", turnIn: 2868, at: 2903, boards: false },
      { name: "Anthony Noghes", turnIn: 2960, at: 2995, boards: false },
    ],
    // Only the main straight, as in F1.
    zones: [{ detect: 2903, from: -170, to: 170 }],
    // The real lane leaves at Anthony Noghes and rejoins after Sainte Dévote, between the main
    // straight and the harbour. ponytail: here it's back before Sainte Dévote.
    pit: { side: 1, in: -320, from: -245, to: 20, out: 110 },
    stands: [...row(-8, -200, -110, -20, 70), ...row(-8, 2520, 2600, 2680, 2760)],
    seed: 1929,
    grip: 0.373,
    stop: 0.159,
    wear: 0.6,
    proEdge: 1.29,
    legendsEdge: 1.315,
    runoff: 3,
    setting: "riviera",
    smooth: true,
  },
  {
    id: "lusail",
    name: "Lusail",
    length: 5419,
    data: LUSAIL_DATA,
    // Numbered, as at Lusail; Turn 11's a flat-out kink.
    corners: [
      { name: "Turn 1", turnIn: 365, at: 470, boards: true },
      { name: "Turn 2", turnIn: 690, at: 780, boards: false },
      { name: "Turn 3", turnIn: 955, at: 990, boards: false },
      { name: "Turn 4", turnIn: 1345, at: 1395, boards: false },
      { name: "Turn 5", turnIn: 1515, at: 1565, boards: false },
      { name: "Turn 6", turnIn: 1820, at: 1875, boards: true },
      { name: "Turn 7", turnIn: 2185, at: 2335, boards: false },
      { name: "Turn 8", turnIn: 2415, at: 2455, boards: false },
      { name: "Turn 9", turnIn: 2575, at: 2620, boards: false },
      { name: "Turn 10", turnIn: 2780, at: 2835, boards: true },
      { name: "Turn 12", turnIn: 3410, at: 3486, boards: false },
      { name: "Turn 13", turnIn: 3616, at: 3661, boards: false },
      { name: "Turn 14", turnIn: 3826, at: 3871, boards: false },
      { name: "Turn 15", turnIn: 4141, at: 4181, boards: false },
      { name: "Turn 16", turnIn: 4586, at: 4641, boards: false },
    ],
    // Only the main straight, as in F1.
    zones: [{ detect: 4641, from: -620, to: 320 }],
    // ponytail: the real lane leaves before Turn 16 and rejoins just before Turn 1; here it's on
    // the main straight.
    pit: { side: 1, in: -420, from: -300, to: 120, out: 220 },
    stands: [...row(-10, -200, -110, -20, 70), ...corner(-1, 470)],
    seed: 2021,
    grip: 0.434,
    stop: 0.219,
    wear: 1.3,
    proEdge: 1.23,
    legendsEdge: 1.26,
    setting: "desert",
    sky: "night",
    smooth: true,
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
