// Seeded, deterministic RNG. Given the same seed, produces the same sequence on
// any machine, so a Garden run is fully replayable (a stated project goal).
// mulberry32 — small, fast, good enough for game randomness.

export class SeededRng {
  private state: number;

  constructor(seed: number) {
    // Force to a 32-bit unsigned integer.
    this.state = seed >>> 0;
  }

  /** Next float in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  /** Roll a single die with `sides` faces (1..sides). */
  die(sides: number): number {
    return this.int(1, sides);
  }

  /** Coin flip. */
  coin(): 'heads' | 'tails' {
    return this.next() < 0.5 ? 'heads' : 'tails';
  }

  /** Pick a uniformly random element. */
  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('pick() from empty array');
    return items[this.int(0, items.length - 1)]!;
  }
}

/**
 * Derive a stable sub-seed from a base seed plus arbitrary integer coordinates
 * (e.g. campaignDay, stageIndex). This lets each pipeline stage on each day get
 * its own independent, reproducible RNG stream regardless of how many rolls
 * earlier stages consumed. Uses a simple integer hash (xorshift-style mix).
 */
export function deriveSeed(base: number, ...coords: number[]): number {
  let h = base >>> 0;
  for (const c of coords) {
    h = (h ^ (c >>> 0)) >>> 0;
    h = Math.imul(h, 0x85ebca6b) >>> 0;
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35) >>> 0;
    h ^= h >>> 16;
  }
  return h >>> 0;
}

/** Convenience: a fresh RNG seeded from a base + coordinates. */
export function rngFor(base: number, ...coords: number[]): SeededRng {
  return new SeededRng(deriveSeed(base, ...coords));
}
