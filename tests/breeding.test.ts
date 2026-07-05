import { describe, it, expect } from 'vitest';
import { SeededRng, rngFor } from '../src/engine/rng';
import { generateWildSpecies } from '../src/engine/species-generator';
import { breedSpecies } from '../src/engine/breeding';

describe('breeding resolver', () => {
  it('child generation = max(parents) + 1 and records both parents', () => {
    const a = generateWildSpecies(new SeededRng(11), { fungalType: 'toadstool' });
    const b = generateWildSpecies(new SeededRng(22), { fungalType: 'mold' });
    const child = breedSpecies(a, b, new SeededRng(33));
    expect(child.generation).toBe(1);
    expect(child.parentSpeciesIds).toEqual([a.id, b.id]);
  });

  it('generation increments across multiple crosses', () => {
    const a = generateWildSpecies(new SeededRng(11));
    const b = generateWildSpecies(new SeededRng(22));
    const g1 = breedSpecies(a, b, new SeededRng(1));
    const g2 = breedSpecies(g1, a, new SeededRng(2));
    expect(g2.generation).toBe(2);
  });

  it('a mushroom-typed child is always edible (mushroomAlwaysEdible)', () => {
    // Force both parents mushroom so the child resolves to mushroom.
    const a = generateWildSpecies(new SeededRng(101), { fungalType: 'mushroom' });
    const b = generateWildSpecies(new SeededRng(202), { fungalType: 'mushroom' });
    const child = breedSpecies(a, b, new SeededRng(303));
    expect(child.physical.fungalType).toBe('mushroom');
    expect(child.function.category).toBe('edible');
  });

  it('child inherits a valid fungal type from one parent', () => {
    const a = generateWildSpecies(new SeededRng(11), { fungalType: 'toadstool' });
    const b = generateWildSpecies(new SeededRng(22), { fungalType: 'mold' });
    const child = breedSpecies(a, b, new SeededRng(44));
    expect([a.physical.fungalType, b.physical.fungalType]).toContain(child.physical.fungalType);
  });

  it('breeding is deterministic for a given rng seed', () => {
    const a = generateWildSpecies(new SeededRng(11));
    const b = generateWildSpecies(new SeededRng(22));
    const c1 = breedSpecies(a, b, rngFor(999));
    const c2 = breedSpecies(a, b, rngFor(999));
    expect(JSON.stringify(c1)).toBe(JSON.stringify(c2));
  });

  it('child dimensions match its resolved type (no cross-type leakage, D20)', () => {
    const a = generateWildSpecies(new SeededRng(11), { fungalType: 'toadstool' });
    const b = generateWildSpecies(new SeededRng(22), { fungalType: 'mold' });
    const child = breedSpecies(a, b, new SeededRng(55));
    if (child.physical.fungalType === 'mold') {
      expect(child.physical.dimensions.moldHeight).toBeGreaterThan(0);
      expect(child.physical.dimensions.volvaDiameter).toBeUndefined();
    } else if (child.physical.fungalType === 'toadstool') {
      expect(child.physical.dimensions.volvaDiameter).toBeGreaterThan(0);
      expect(child.physical.dimensions.moldHeight).toBeUndefined();
    }
  });
});
