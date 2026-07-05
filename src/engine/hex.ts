// Hex grid utilities. The shell is an axial-coordinate hex grid (q, r). The
// engine treats it as a pure data grid; Foundry's canvas can back it later
// (Phase 4/5) but nothing here depends on Foundry.

import type { Tile } from '../data/types';

// Axial neighbor directions (pointy-top / flat-top agnostic; consistent set).
const AXIAL_DIRECTIONS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

export function tileId(q: number, r: number): string {
  return `${q},${r}`;
}

/**
 * Build a hexagonal shell of the given radius around (0,0). radius 0 = single
 * hex; radius N = a hex with N rings. `edge` marks the outermost ring.
 */
export function buildShell(radius: number): Tile[] {
  const coords: Array<[number, number]> = [];
  for (let q = -radius; q <= radius; q++) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);
    for (let r = rMin; r <= rMax; r++) coords.push([q, r]);
  }
  const idSet = new Set(coords.map(([q, r]) => tileId(q, r)));

  return coords.map(([q, r]) => {
    const neighbors = AXIAL_DIRECTIONS.map(([dq, dr]) => tileId(q + dq, r + dr)).filter((id) =>
      idSet.has(id),
    );
    const ring = hexDistance(0, 0, q, r);
    return {
      id: tileId(q, r),
      q,
      r,
      occupied: false,
      shade: 0,
      edge: ring === radius,
      neighbors,
    } satisfies Tile;
  });
}

export function hexDistance(q1: number, r1: number, q2: number, r2: number): number {
  return (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
}

/** Index tiles by id for O(1) lookup. */
export function indexTiles(tiles: Tile[]): Map<string, Tile> {
  return new Map(tiles.map((t) => [t.id, t]));
}
