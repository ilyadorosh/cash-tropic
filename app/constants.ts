// Fundamental constants of nature — the "initial constants" from the CV
// (docs/CV.md, "Key Equations & Obsessions"). CODATA 2018+ SI exact values
// where applicable.

export interface NatureConstant {
  symbol: string;
  name: string;
  value: number; // SI units
  display: string;
  unit: string;
  exact: boolean;
  note: string;
}

export const FINE_STRUCTURE: NatureConstant = {
  symbol: "α",
  name: "Fine-structure constant",
  value: 1 / 137.035999084,
  display: "≈ 1/137.036",
  unit: "dimensionless",
  exact: false,
  note: 'Strength of electromagnetic interaction. "One of the greatest damn mysteries of physics" — Feynman. If α were slightly different, atoms wouldn\'t form.',
};

export const SPEED_OF_LIGHT: NatureConstant = {
  symbol: "c",
  name: "Speed of light",
  value: 299_792_458,
  display: "299 792 458",
  unit: "m/s",
  exact: true,
  note: "Not just a speed limit — the ratio of space to time in our universe.",
};

export const REDUCED_PLANCK: NatureConstant = {
  symbol: "ħ",
  name: "Reduced Planck constant",
  value: 1.054571817e-34,
  display: "1.054 571 817 × 10⁻³⁴",
  unit: "J·s",
  exact: true,
  note: "The quantum of action.",
};

export const ELECTRON_CHARGE: NatureConstant = {
  symbol: "e",
  name: "Elementary charge",
  value: 1.602176634e-19,
  display: "1.602 176 634 × 10⁻¹⁹",
  unit: "C",
  exact: true,
  note: "The quantum of EM coupling.",
};

export const VACUUM_PERMITTIVITY: NatureConstant = {
  symbol: "ε₀",
  name: "Vacuum permittivity",
  value: 8.8541878128e-12,
  display: "8.854 187 8128 × 10⁻¹²",
  unit: "F/m",
  exact: false,
  note: "Permittivity of free space — sets how EM fields propagate through the vacuum.",
};

export const BOLTZMANN: NatureConstant = {
  symbol: "k_B",
  name: "Boltzmann constant",
  value: 1.380649e-23,
  display: "1.380 649 × 10⁻²³",
  unit: "J/K",
  exact: true,
  note: "The bridge between temperature and energy — and, via Landauer, between information and physics.",
};

export const NATURE_CONSTANTS: NatureConstant[] = [
  FINE_STRUCTURE,
  SPEED_OF_LIGHT,
  REDUCED_PLANCK,
  ELECTRON_CHARGE,
  VACUUM_PERMITTIVITY,
  BOLTZMANN,
];

// Szilard's insight (1929): erasing one bit costs E_min = k_B · T · ln 2.
// At T = 310 K this is ≈ 3 × 10⁻²¹ J — the thermodynamic floor of computation.
export const LANDAUER_REFERENCE_TEMP_K = 310;

export function landauerLimit(tempK: number): number {
  return BOLTZMANN.value * tempK * Math.LN2;
}

// α = e² / (4π ε₀ ħ c) — verify the coupling of the constants above.
export function deriveFineStructure(): number {
  const numerator = ELECTRON_CHARGE.value ** 2;
  const denominator =
    4 *
    Math.PI *
    VACUUM_PERMITTIVITY.value *
    REDUCED_PLANCK.value *
    SPEED_OF_LIGHT.value;
  return numerator / denominator;
}
