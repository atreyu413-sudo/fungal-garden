// Maps the game's fungal color names to CSS hex values for the hex-grid render.
// Kept separate from the data library because these are presentation choices,
// not game rules.

export const COLOR_HEX: Record<string, string> = {
  Black: '#20201e',
  Brown: '#6b4423',
  White: '#f2f0e6',
  Orange: '#e08a2b',
  Green: '#4a9e4a',
  Blue: '#3a6ea5',
  Red: '#b23b3b',
  Yellow: '#e8d44d',
  Indigo: '#4b3f8f',
  Violet: '#8a5fb0',
  Pink: '#e39ac0',
  Grey: '#9a9a9a',
};

/** Fill for an empty hex (bare shell). */
export const EMPTY_HEX = '#2b2f28';
/** Stroke for a shell-edge hex. */
export const EDGE_STROKE = '#c9a24b';
/** Default hex stroke. */
export const HEX_STROKE = '#12140f';

export function colorToHex(color: string): string {
  return COLOR_HEX[color] ?? '#8a8f7a';
}

/** Pick a readable text color (black/white) for a given fill. */
export function textOn(fill: string): string {
  const m = /^#(..)(..)(..)$/.exec(fill);
  if (!m) return '#000';
  const [r, g, b] = [m[1]!, m[2]!, m[3]!].map((h) => parseInt(h, 16));
  // relative luminance
  const lum = (0.299 * r! + 0.587 * g! + 0.114 * b!) / 255;
  return lum > 0.6 ? '#111' : '#f4f4ef';
}
