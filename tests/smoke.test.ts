import { describe, it, expect } from 'vitest';
import { SeededRng } from '../src/engine/rng';
import { rollFormula, applyRounding } from '../src/engine/dice';
import { generateWildSpecies } from '../src/engine/species-generator';
import { buildShell } from '../src/engine/hex';

describe('core smoke', () => {
  it('dice formula rolls within range and respects vars', () => {
    const rng = new SeededRng(1);
    const v = rollFormula('8d4', rng);
    expect(v).toBeGreaterThanOrEqual(8);
    expect(v).toBeLessThanOrEqual(32);
    const cap = rollFormula('volvaDiameter + d12', rng, { volvaDiameter: 5 });
    expect(cap).toBeGreaterThanOrEqual(6);
    expect(cap).toBeLessThanOrEqual(17);
    expect(applyRounding(2.1, 'up')).toBe(3);
    expect(applyRounding(2.9, 'down')).toBe(2);
  });

  it('generates a complete wild species', () => {
    const sp = generateWildSpecies(new SeededRng(42));
    expect(sp.id).toMatch(/-/);
    expect(sp.generation).toBe(0);
    expect(['toadstool', 'shelfToadstool', 'mold', 'mushroom']).toContain(sp.physical.fungalType);
    expect(sp.physical.rates.rtfmDays).toBeGreaterThan(0);
    expect(sp.function.category).not.toBeUndefined();
    expect(Array.isArray(sp.sensitivity.ruleIds)).toBe(true);
  });

  it('mushrooms are always edible', () => {
    const sp = generateWildSpecies(new SeededRng(7), { fungalType: 'mushroom' });
    expect(sp.function.category).toBe('edible');
  });

  it('builds a hex shell with correct neighbor topology', () => {
    const tiles = buildShell(1);
    expect(tiles).toHaveLength(7); // center + 6
    const center = tiles.find((t) => t.q === 0 && t.r === 0)!;
    expect(center.neighbors).toHaveLength(6);
    expect(center.edge).toBe(false);
  });
});
