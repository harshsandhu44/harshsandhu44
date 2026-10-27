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
import { BAHRAIN_DATA } from "./bahrain.ts";
import { BARCELONA_DATA } from "./barcelona.ts";
import { BUDDH_DATA } from "./buddh.ts";
import { HUNGARORING_DATA } from "./hungaroring.ts";
import { MIAMI_DATA } from "./miami.ts";
import { MELBOURNE_DATA } from "./melbourne.ts";
import { MEXICO_DATA } from "./mexico.ts";
import { MONTREAL_DATA } from "./montreal.ts";
import { SHANGHAI_DATA } from "./shanghai.ts";
import { ZANDVOORT_DATA } from "./zandvoort.ts";
import { INTERLAGOS_DATA } from "./interlagos.ts";
import { LUSAIL_DATA } from "./lusail.ts";
import { MONACO_DATA } from "./monaco.ts";
import { MONZA_DATA } from "./monza.ts";
import { PORTIMAO_DATA } from "./portimao.ts";
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
    laps: 53,
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
    wing: 1,
  },
  {
    id: "spa",
    name: "Spa",
    length: 7004,
    laps: 44,
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
    wing: 2,
    proEdge: 1.2,
    legendsEdge: 1.235,
  },
  {
    id: "silverstone",
    name: "Silverstone",
    length: 5891,
    laps: 52,
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
    wing: 4,
    proEdge: 1.27,
    legendsEdge: 1.315,
  },
  {
    id: "interlagos",
    name: "Interlagos",
    length: 4309,
    laps: 71,
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
    wing: 3,
    proEdge: 1.22,
    legendsEdge: 1.27,
  },
  {
    id: "redbullring",
    name: "Red Bull Ring",
    length: 4318,
    laps: 71,
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
    wing: 3,
    proEdge: 1.25,
    legendsEdge: 1.29,
  },
  {
    id: "austin",
    name: "Austin",
    length: 5513,
    laps: 56,
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
    wing: 4,
    proEdge: 1.355,
    legendsEdge: 1.395,
  },
  {
    id: "lasvegas",
    name: "Las Vegas",
    length: 6201,
    laps: 50,
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
    wing: 2,
    proEdge: 1.45,
    legendsEdge: 1.49,
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
    laps: 58,
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
    wing: 3,
    proEdge: 1.255,
    legendsEdge: 1.27,
    setting: "desert",
    sky: "sunset",
    smooth: true,
  },
  {
    id: "monaco",
    name: "Monaco",
    length: 3337,
    laps: 78,
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
    wing: 5,
    proEdge: 1.28,
    legendsEdge: 1.305,
    runoff: 3,
    setting: "riviera",
    smooth: true,
  },
  {
    id: "lusail",
    name: "Lusail",
    length: 5419,
    laps: 57,
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
    wing: 3,
    proEdge: 1.225,
    legendsEdge: 1.25,
    setting: "desert",
    sky: "night",
    smooth: true,
  },
  {
    id: "zandvoort",
    name: "Zandvoort",
    length: 4307,
    laps: 72,
    data: ZANDVOORT_DATA,
    // Named as on the OpenStreetMap ways, the two after Scheivlak as one.
    corners: [
      { name: "Tarzanbocht", turnIn: 325, at: 430, boards: true },
      { name: "Gerlachbocht", turnIn: 680, at: 735, boards: false },
      { name: "Hugenholtzbocht", turnIn: 825, at: 884, boards: false },
      { name: "Hunserug", turnIn: 1129, at: 1174, boards: false },
      { name: "Rob Slotemakerbocht", turnIn: 1284, at: 1479, boards: false },
      { name: "Scheivlak", turnIn: 1654, at: 1769, boards: false },
      { name: "Mastersbocht", turnIn: 2069, at: 2343, boards: false },
      { name: "CM.com bocht", turnIn: 2483, at: 2613, boards: false },
      { name: "Hans Ernst chicane", turnIn: 3143, at: 3282, boards: true },
      { name: "Arie Luyendykbocht", turnIn: 3712, at: 3907, boards: false },
    ],
    // The main straight, and the run to the Hans Ernst chicane.
    zones: [
      { detect: 3907, from: -300, to: 300 },
      { detect: 2613, from: 2700, to: 2960 },
    ],
    // ponytail: the real lane's on the right, squeezed between the straight and Hugenholtz, and
    // runs on past Tarzan; here, with no room for it there, it's on the left and rejoins before.
    pit: { side: -1, in: -190, from: -110, to: 160, out: 240 },
    stands: [...row(10, -260, -170), ...corner(-1, 430)],
    seed: 1952,
    grip: 0.381,
    stop: 0.193,
    wear: 1.0,
    wing: 4,
    proEdge: 1.203,
    legendsEdge: 1.235,
  },
  {
    id: "hungaroring",
    name: "Hungaroring",
    length: 4381,
    laps: 70,
    data: HUNGARORING_DATA,
    // Numbered, by eye from the curvature; the Turn 6 and 7 chicane is one.
    corners: [
      { name: "Turn 1", turnIn: 535, at: 595, boards: true },
      { name: "Turn 2", turnIn: 1024, at: 1074, boards: false },
      { name: "Turn 3", turnIn: 1259, at: 1299, boards: false },
      { name: "Turn 4", turnIn: 1739, at: 1779, boards: false },
      { name: "Turn 5", turnIn: 1939, at: 1994, boards: false },
      { name: "Turns 6–7", turnIn: 2304, at: 2348, boards: false },
      { name: "Turn 8", turnIn: 2513, at: 2568, boards: false },
      { name: "Turn 9", turnIn: 2633, at: 2698, boards: false },
      { name: "Turn 10", turnIn: 2853, at: 2903, boards: false },
      { name: "Turn 11", turnIn: 3018, at: 3073, boards: false },
      { name: "Turn 12", turnIn: 3453, at: 3503, boards: true },
      { name: "Turn 13", turnIn: 3673, at: 3773, boards: false },
      { name: "Turn 14", turnIn: 3937, at: 3987, boards: false },
    ],
    // The main straight, and Turn 3 to Turn 4.
    zones: [
      { detect: 3987, from: -180, to: 500 },
      { detect: 1299, from: 1360, to: 1640 },
    ],
    // On the right. ponytail: the real lane leaves before Turn 14; here it's on the main straight.
    pit: { side: 1, in: -190, from: -110, to: 160, out: 250 },
    stands: [...row(-10, -200, -110, -20, 70), ...corner(-1, 595)],
    seed: 1986,
    grip: 0.412,
    stop: 0.178,
    wear: 0.9,
    wing: 5,
    proEdge: 1.216,
    legendsEdge: 1.222,
  },
  {
    id: "barcelona",
    name: "Barcelona",
    length: 4655,
    laps: 66,
    data: BARCELONA_DATA,
    // By their sponsors' names, as the circuit has them; Turns 7 and 8 together.
    corners: [
      { name: "Elf", turnIn: 780, at: 940, boards: true },
      { name: "Renault", turnIn: 1034, at: 1174, boards: false },
      { name: "Repsol", turnIn: 1649, at: 1709, boards: false },
      { name: "Seat", turnIn: 2058, at: 2138, boards: false },
      { name: "Turns 7–8", turnIn: 2493, at: 2643, boards: false },
      { name: "Campsa", turnIn: 2823, at: 2933, boards: false },
      { name: "La Caixa", turnIn: 3427, at: 3487, boards: true },
      { name: "Banc Sabadell", turnIn: 3652, at: 3742, boards: false },
      { name: "The chicane", turnIn: 3971, at: 4141, boards: false },
      { name: "New Holland", turnIn: 4255, at: 4325, boards: false },
    ],
    // The main straight, and the back straight.
    zones: [
      { detect: 4325, from: -200, to: 740 },
      { detect: 2933, from: 3010, to: 3400 },
    ],
    // On the right. ponytail: the real lane leaves before New Holland; here it's on the main straight.
    pit: { side: 1, in: -210, from: -130, to: 140, out: 230 },
    stands: [...row(-10, -200, -110, -20, 70), ...corner(-1, 845)],
    seed: 1991,
    grip: 0.425,
    stop: 0.189,
    wear: 1.2,
    wing: 4,
    proEdge: 1.193,
    legendsEdge: 1.24,
  },
  {
    id: "bahrain",
    name: "Bahrain",
    length: 5412,
    laps: 57,
    data: BAHRAIN_DATA,
    // Numbered, as at Sakhir.
    corners: [
      { name: "Turn 1", turnIn: 695, at: 740, boards: true },
      { name: "Turn 2", turnIn: 800, at: 840, boards: false },
      { name: "Turn 3", turnIn: 920, at: 955, boards: false },
      { name: "Turn 4", turnIn: 1490, at: 1534, boards: true },
      { name: "Turn 5", turnIn: 1774, at: 1809, boards: false },
      { name: "Turn 6", turnIn: 1844, at: 1894, boards: false },
      { name: "Turn 7", turnIn: 1964, at: 2018, boards: false },
      { name: "Turn 8", turnIn: 2213, at: 2268, boards: false },
      { name: "Turns 9–10", turnIn: 2573, at: 2732, boards: false },
      { name: "Turn 11", turnIn: 3407, at: 3452, boards: true },
      { name: "Turn 12", turnIn: 3722, at: 3842, boards: false },
      { name: "Turn 13", turnIn: 4021, at: 4136, boards: false },
      { name: "Turn 14", turnIn: 4886, at: 4931, boards: true },
      { name: "Turn 15", turnIn: 4981, at: 5016, boards: false },
    ],
    // The main straight, Turn 3 to Turn 4, and Turn 10 to Turn 11.
    zones: [
      { detect: 5016, from: -340, to: 660 },
      { detect: 955, from: 1010, to: 1460 },
      { detect: 2732, from: 2800, to: 3380 },
    ],
    // On the right.
    pit: { side: 1, in: -200, from: -120, to: 150, out: 240 },
    stands: [...row(-10, -200, -110, -20, 70), ...corner(-1, 740)],
    seed: 2004,
    grip: 0.305,
    stop: 0.167,
    wear: 1.2,
    wing: 3,
    proEdge: 1.26,
    legendsEdge: 1.293,
    setting: "desert",
    sky: "night",
  },
  {
    id: "mexico",
    name: "Mexico City",
    length: 4304,
    laps: 71,
    data: MEXICO_DATA,
    // Turns 1 to 3 together, the esses (7 to 11) and the stadium (13 to 16).
    corners: [
      { name: "Turn 1", turnIn: 795, at: 965, boards: true },
      { name: "Turn 4", turnIn: 1635, at: 1675, boards: true },
      { name: "Turn 5", turnIn: 1705, at: 1759, boards: false },
      { name: "Turn 6", turnIn: 1844, at: 1894, boards: false },
      { name: "The esses", turnIn: 2194, at: 2718, boards: false },
      { name: "Turn 12", turnIn: 2858, at: 2903, boards: false },
      { name: "Foro Sol", turnIn: 3239, at: 3567, boards: true },
      { name: "Peraltada", turnIn: 3592, at: 3642, boards: false },
    ],
    // The main straight, and Turn 3 to Turn 4.
    zones: [
      { detect: 3642, from: -400, to: 760 },
      { detect: 1109, from: 1150, to: 1610 },
    ],
    // On the right.
    pit: { side: 1, in: -300, from: -220, to: 60, out: 160 },
    stands: [...row(-10, -200, -110, -20, 70), ...corner(-1, 826)],
    seed: 1963,
    grip: 0.354,
    stop: 0.206,
    wear: 0.8,
    wing: 3,
    proEdge: 1.235,
    legendsEdge: 1.291,
  },
  {
    id: "montreal",
    name: "Montreal",
    length: 4361,
    laps: 70,
    data: MONTREAL_DATA,
    // The chicanes as pairs, as they're raced.
    corners: [
      { name: "Senna", turnIn: 215, at: 349, boards: true },
      { name: "Turns 3–4", turnIn: 685, at: 784, boards: false },
      { name: "Turn 5", turnIn: 959, at: 994, boards: false },
      { name: "Turns 6–7", turnIn: 1209, at: 1329, boards: false },
      { name: "Turns 8–9", turnIn: 1984, at: 2063, boards: true },
      { name: "L'Épingle", turnIn: 2648, at: 2708, boards: true },
      { name: "Wall of Champions", turnIn: 3873, at: 3943, boards: true },
    ],
    // The main straight, the Casino straight, and Turn 9 to the hairpin.
    zones: [
      { detect: 3943, from: -370, to: 20 },
      { detect: 2708, from: 2880, to: 3850 },
      { detect: 2063, from: 2140, to: 2480 },
    ],
    // On the right. ponytail: the real lane rejoins at Turn 2; here it's before the Senna.
    pit: { side: 1, in: -370, from: -290, to: -20, out: 70 },
    stands: [...row(-10, -200, -110, -20, 70), ...corner(1, 260)],
    seed: 1978,
    grip: 0.319,
    stop: 0.176,
    wear: 0.8,
    wing: 2,
    proEdge: 1.261,
    legendsEdge: 1.314,
  },
  {
    id: "melbourne",
    name: "Melbourne",
    length: 5303,
    laps: 58,
    data: MELBOURNE_DATA,
    // Numbered as before 2021, with the Turn 9 and 10 chicane.
    corners: [
      { name: "Turn 1", turnIn: 335, at: 375, boards: true },
      { name: "Turn 2", turnIn: 405, at: 525, boards: false },
      { name: "Turn 3", turnIn: 1060, at: 1110, boards: true },
      { name: "Turn 4", turnIn: 1200, at: 1255, boards: false },
      { name: "Turn 5", turnIn: 1435, at: 1475, boards: false },
      { name: "Turn 6", turnIn: 1860, at: 1890, boards: false },
      { name: "Turn 7", turnIn: 1959, at: 1999, boards: false },
      { name: "Turns 9–10", turnIn: 2519, at: 2629, boards: true },
      { name: "Turn 11", turnIn: 3319, at: 3364, boards: false },
      { name: "Turn 12", turnIn: 3449, at: 3479, boards: false },
      { name: "Turn 13", turnIn: 4134, at: 4164, boards: true },
      { name: "Turn 14", turnIn: 4369, at: 4419, boards: false },
      { name: "Turn 15", turnIn: 4639, at: 4684, boards: false },
      { name: "Turn 16", turnIn: 4764, at: 4819, boards: false },
    ],
    // The main straight, and Turn 2 to Turn 3.
    zones: [
      { detect: 4819, from: -370, to: 300 },
      { detect: 525, from: 600, to: 1030 },
    ],
    // ponytail: on the right, from memory (OpenStreetMap doesn't map Albert Park's lane).
    pit: { side: 1, in: -230, from: -150, to: 120, out: 210 },
    stands: [...row(-10, -200, -110, -20, 70), ...corner(-1, 375)],
    seed: 1996,
    grip: 0.299,
    stop: 0.154,
    wear: 0.9,
    wing: 3,
    proEdge: 1.253,
    legendsEdge: 1.295,
  },
  {
    id: "shanghai",
    name: "Shanghai",
    length: 5451,
    laps: 56,
    data: SHANGHAI_DATA,
    // Numbered, by eye from the curvature; the snail (1 to 3) as one.
    corners: [
      { name: "Turns 1–3", turnIn: 480, at: 884, boards: true },
      { name: "Turn 4", turnIn: 1314, at: 1349, boards: false },
      { name: "Turn 6", turnIn: 1544, at: 1594, boards: true },
      { name: "Turns 7–8", turnIn: 1653, at: 1943, boards: false },
      { name: "Turns 9–10", turnIn: 2248, at: 2667, boards: false },
      { name: "Turn 11", turnIn: 3107, at: 3152, boards: true },
      { name: "Turns 12–13", turnIn: 3180, at: 3222, boards: false },
      { name: "Turn 14", turnIn: 4761, at: 4796, boards: true },
      { name: "Turn 15", turnIn: 4861, at: 4896, boards: false },
      { name: "Turn 16", turnIn: 5141, at: 5166, boards: false },
    ],
    // The main straight, and the back straight.
    zones: [
      { detect: 5166, from: -220, to: 450 },
      { detect: 3222, from: 3620, to: 4730 },
    ],
    // On the right. ponytail: the real lane rejoins after Turn 1; here it's before it.
    pit: { side: 1, in: -230, from: -150, to: 120, out: 210 },
    stands: [...row(-10, -200, -110, -20, 70), ...corner(-1, 815)],
    seed: 2004,
    grip: 0.365,
    stop: 0.143,
    wear: 1.1,
    wing: 4,
    proEdge: 1.211,
    legendsEdge: 1.237,
  },
  {
    id: "portimao",
    name: "Portimão",
    length: 4653,
    laps: 66,
    data: PORTIMAO_DATA,
    // Named as on the OpenStreetMap ways, numbered between.
    corners: [
      { name: "Turn 1", turnIn: 630, at: 675, boards: true },
      { name: "Turn 2", turnIn: 790, at: 835, boards: false },
      { name: "Curva Lagos", turnIn: 940, at: 995, boards: false },
      { name: "Turn 4", turnIn: 1070, at: 1140, boards: false },
      { name: "Curva da Torre VIP", turnIn: 1660, at: 1715, boards: true },
      { name: "Turn 6", turnIn: 1905, at: 1955, boards: false },
      { name: "Turn 7", turnIn: 2125, at: 2185, boards: false },
      { name: "Curva Samsung", turnIn: 2270, at: 2330, boards: false },
      { name: "Curva Craig Jones", turnIn: 2635, at: 2690, boards: false },
      { name: "Curva Portimão", turnIn: 2875, at: 3015, boards: false },
      { name: "Turn 11", turnIn: 3160, at: 3240, boards: false },
      { name: "Turn 13", turnIn: 3380, at: 3450, boards: false },
      { name: "Curva Sagres", turnIn: 3595, at: 3655, boards: false },
      { name: "Curva Galp", turnIn: 3960, at: 4030, boards: false },
    ],
    // The main straight, and Turn 4 to the Torre VIP.
    zones: [
      { detect: 4030, from: -290, to: 600 },
      { detect: 1140, from: 1205, to: 1640 },
    ],
    // On the right. ponytail: the real lane runs the whole straight; here it's shorter.
    pit: { side: 1, in: -290, from: -210, to: 60, out: 150 },
    stands: [...row(-10, -200, -110, -20, 70), ...corner(-1, 675)],
    seed: 2020,
    grip: 0.325,
    stop: 0.199,
    wear: 1.0,
    wing: 4,
    proEdge: 1.227,
    legendsEdge: 1.27,
    smooth: true,
  },
  {
    id: "miami",
    name: "Miami",
    length: 5412,
    laps: 57,
    data: MIAMI_DATA,
    // Numbered, by eye from the curvature; the flat-out kinks (8 to 10, 16) left out.
    corners: [
      { name: "Turn 1", turnIn: 200, at: 250, boards: true },
      { name: "Turn 2", turnIn: 300, at: 350, boards: false },
      { name: "Turn 3", turnIn: 385, at: 425, boards: false },
      { name: "Turns 4–6", turnIn: 935, at: 1155, boards: false },
      { name: "Turn 7", turnIn: 1220, at: 1510, boards: false },
      { name: "Turn 11", turnIn: 2925, at: 2980, boards: true },
      { name: "Turns 12–13", turnIn: 3015, at: 3290, boards: false },
      { name: "Turns 14–15", turnIn: 3310, at: 3415, boards: false },
      { name: "Turn 17", turnIn: 4680, at: 4735, boards: true },
      { name: "Turn 18", turnIn: 4819, at: 4869, boards: false },
      { name: "Turn 19", turnIn: 4994, at: 5134, boards: false },
    ],
    // The main straight, Turn 10 to Turn 11, and the back straight to Turn 17.
    zones: [
      { detect: 5134, from: -190, to: 190 },
      { detect: 1510, from: 2460, to: 2900 },
      { detect: 3415, from: 3470, to: 4660 },
    ],
    // On the right. ponytail: the real lane leaves after Turn 18 and rejoins after Turn 2; here
    // it's on the main straight, which leaves it little room.
    pit: { side: 1, in: -200, from: -125, to: 135, out: 195 },
    stands: [...row(-10, -200, -110, -20, 70), ...corner(-1, 250)],
    seed: 2022,
    grip: 0.359,
    stop: 0.151,
    wear: 1.0,
    wing: 2,
    proEdge: 1.272,
    legendsEdge: 1.283,
    smooth: true,
  },
  {
    id: "buddh",
    name: "Buddh",
    length: 5125,
    laps: 60,
    data: BUDDH_DATA,
    // Numbered, by eye from the curvature; Turns 10 and 11 as one.
    corners: [
      { name: "Turn 1", turnIn: 305, at: 355, boards: true },
      { name: "Turn 2", turnIn: 405, at: 455, boards: false },
      { name: "Turn 3", turnIn: 680, at: 735, boards: true },
      { name: "Turn 4", turnIn: 1965, at: 2015, boards: true },
      { name: "Turn 5", turnIn: 2511, at: 2571, boards: true },
      { name: "Turn 6", turnIn: 2636, at: 2691, boards: false },
      { name: "Turn 7", turnIn: 2715, at: 2745, boards: false },
      { name: "Turn 8", turnIn: 2866, at: 2916, boards: false },
      { name: "Turn 9", turnIn: 2946, at: 2986, boards: false },
      { name: "Turns 10–11", turnIn: 3216, at: 3566, boards: false },
      { name: "Turn 12", turnIn: 3856, at: 3921, boards: false },
      { name: "Turn 13", turnIn: 3996, at: 4036, boards: false },
      { name: "Turn 14", turnIn: 4246, at: 4336, boards: false },
      { name: "Turn 16", turnIn: 4656, at: 4721, boards: false },
    ],
    // The main straight, and the back straight to Turn 4.
    zones: [
      { detect: 4721, from: -310, to: 290 },
      { detect: 735, from: 790, to: 1920 },
    ],
    // On the right.
    pit: { side: 1, in: -320, from: -240, to: 30, out: 120 },
    stands: [...row(-10, -200, -110, -20, 70), ...corner(-1, 355)],
    seed: 2011,
    grip: 0.343,
    stop: 0.15,
    wear: 1.0,
    wing: 3,
    proEdge: 1.249,
    legendsEdge: 1.29,
    smooth: true,
  },
];

// Each circuit is built the first time it's picked: the racing line, the speed profiles and the
// park take tens of milliseconds.
const built = new Map<string, Track>();
// A career season's rounds, in 2026's calendar order: Yas Marina is the finale.
export const CALENDAR = [
  "melbourne",
  "shanghai",
  "bahrain",
  "miami",
  "montreal",
  "monaco",
  "barcelona",
  "redbullring",
  "silverstone",
  "spa",
  "hungaroring",
  "zandvoort",
  "monza",
  "portimao",
  "austin",
  "mexico",
  "interlagos",
  "buddh",
  "lasvegas",
  "lusail",
  "yasmarina",
];
// The first seasons' ten rounds, for a season saved before each kept its own calendar.
export const FIRST_CALENDAR = [
  "monaco",
  "redbullring",
  "silverstone",
  "spa",
  "monza",
  "portimao",
  "austin",
  "interlagos",
  "lasvegas",
  "lusail",
  "yasmarina",
];
export const getTrack = (id: string) => {
  const def = TRACKS.find((t) => t.id === id) ?? TRACKS[0]!;
  let t = built.get(def.id);
  if (!t) built.set(def.id, (t = buildTrack(def)));
  return t;
};
