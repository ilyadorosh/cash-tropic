// data/cryonics.ts
export interface Point {
  /** years since 1950 (or any epoch you like) */
  year: number;
  /** temperature in °C */
  temp: number;
}

/**
 * Sample cryonics temperature timeline.
 *  – 1950: normal ambient (20 °C)
 *  – 1970: first cryopreservation attempts (−80 °C)
 *  – 1990: vitrification breakthrough (−150 °C)
 *  – 2010: modern vitrification (−196 °C, liquid nitrogen)
 *  – 2025: projected future tech (−210 °C)
 */
export const cryoTemps: Point[] = [
  { year: 0,  temp: 20 },   // 1950
  { year: 20, temp: -80 }, // 1970
  { year: 40, temp: -150 },// 1990
  { year: 60, temp: -196 },// 2010
  { year: 75, temp: -210 },// 2025 (projection)
];

/**
 * Moore’s‑law curve – exponential growth of “computational power”
 * (or transistor count) that we will plot on the *right* Y‑axis.
 *
 * We map the same `year` axis to a value that grows roughly
 * 2× every 2 years (the classic Moore’s law). The numbers are
 * arbitrary – they only serve to illustrate the overlay.
 */
export const mooreValues: Point[] = Array.from({ length: 76 }, (_, i) => ({
  year: i,
  // start at 1 (e.g. 1 M transistors) and double every 2 years
  temp: Math.pow(2, i / 2), // we reuse the `temp` field for “performance”
}));
