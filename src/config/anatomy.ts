export type Point = readonly [number, number, number];
export const CASE = {
  age: 68,
  weight: 80,
  lesion: 90,
  length: 14,
  reference: 3,
  center: 38,
} as const;
export const STAGES = [
  "Guide to aortic root",
  "Engage left main",
  "Cross the LAD lesion",
  "Pre-dilate",
  "Deploy stent",
  "Final angiogram",
] as const;
export const PROJECTIONS = [
  "RAO 30° / CRA 30°",
  "AP / CRA 35°",
  "LAO 45° / CRA 30°",
  "LAO 45° / CAU 30°",
  "RAO 30° / CAU 25°",
  "AP",
];
export const ANGLES: readonly (readonly [number, number])[] = [
  [-30, 30],
  [0, 35],
  [45, 30],
  [45, -30],
  [-30, -25],
  [0, 0],
];
// Shared junction coordinates ensure topological continuity; schematic units, not patient imaging.
const root: Point = [0, 2, 0];
const lm: Point = [-0.8, 1.3, 1.05];
const d1: Point = [-0.65, 0.1, 1.8];
const d2: Point = [-0.4, -0.8, 1.65];
export const CENTERLINES: Record<string, readonly Point[]> = {
  Aorta: [
    root,
    [0.15, 3, 0],
    [1.1, 3.7, -0.1],
    [2, 3, -0.3],
    [1.8, 1, -0.6],
    [1.5, -3, -0.7],
  ],
  "Right radial": [
    [5, -3, 0],
    [4.8, -0.5, 0],
    [4, 2, 0],
    [2, 3.4, 0],
    [1.1, 3.7, -0.1],
  ],
  LM: [root, [-0.4, 1.7, 0.65], lm],
  LAD: [lm, d1, d2, [0, -2, 0.9], [0.4, -2.7, 0.25]],
  LCx: [lm, [-1.8, 0.8, 0.65], [-2.1, -0.3, -0.3], [-1, -1.5, -1]],
  RCA: [root, [0.9, 1.4, 0.8], [1.8, 0.1, 1], [1.1, -1.7, 0.3]],
  D1: [d1, [-1.3, -0.1, 1.6], [-1.8, -0.8, 1]],
  D2: [d2, [-1.1, -1, 1.5], [-1.4, -1.6, 0.9]],
};
export const GUIDE_PATH: readonly Point[] = [
  ...CENTERLINES["Right radial"].slice(0, -1),
  CENTERLINES.Aorta[2],
  CENTERLINES.Aorta[1],
  root,
];
