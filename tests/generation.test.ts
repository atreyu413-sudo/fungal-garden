import { describe, it, expect } from 'vitest';
import { SeededRng } from '../src/engine/rng';
import { generateWildSpecies } from '../src/engine/species-generator';

// Scan many seeds to exercise the generator across the whole trait space.
function sampleSpecies(count: number) {
  const out = [];
  for (let i = 0; i < count; i++) out.push(generateWildSpecies(new SeededRng(1000 + i)));
  return out;
}

describe('species generation', () => {
  it('produces valid, complete species for many seeds', () => {
    for (const sp of sampleSpecies(500)) {
      expect(sp.physical.rates.rtfmDays).toBeGreaterThan(0);
      expect(sp.physical.rates.romgDays).toBeGreaterThan(0);
      expect(sp.physical.rates.mruom).toBeGreaterThan(0);
      expect(sp.physical.flavor.intensity).toBeGreaterThanOrEqual(1);
      expect(sp.physical.flavor.intensity).toBeLessThanOrEqual(6);
      expect(colorsAllowed).toContain(sp.physical.color);
      // Non-mushrooms have a rolled function; mushrooms are edible.
      if (sp.physical.fungalType === 'mushroom') expect(sp.function.category).toBe('edible');
      else expect(['poison', 'healing', 'sporeVirility', 'edible']).toContain(sp.function.category);
      // Mold is opaque by default; it can only become transparent through the
      // "Makes Essence Of Ether" poison override (D15). That poison may then be
      // overridden to edible by a forcesEdible sensitivity (blue mold), so a
      // transparent mold is always either still poison or a blue (forced-edible) one.
      if (sp.physical.fungalType === 'mold' && sp.physical.transparent) {
        expect(sp.function.category === 'poison' || sp.physical.color === 'Blue').toBe(true);
      }
    }
  });

  it('grey growths are never bioluminescent (absolute sensitivity)', () => {
    for (const sp of sampleSpecies(1000)) {
      if (sp.physical.color === 'Grey') expect(sp.physical.bioluminescent).toBe(false);
    }
  });

  it('tart flavor is always Overpowering intensity (absolute sensitivity)', () => {
    let seenTart = false;
    for (const sp of sampleSpecies(2000)) {
      if (sp.physical.flavor.flavor1 === 'Tart') {
        seenTart = true;
        expect(sp.physical.flavor.intensity).toBe(6); // Overpowering
      }
    }
    expect(seenTart).toBe(true);
  });

  it('indigo growths are forced poisonous (unless mushroom)', () => {
    for (const sp of sampleSpecies(2000)) {
      if (sp.physical.color === 'Indigo' && sp.physical.fungalType !== 'mushroom') {
        expect(sp.function.category).toBe('poison');
      }
    }
  });

  it('records applicable sensitivity rule ids', () => {
    const sp = generateWildSpecies(new SeededRng(1), { fungalType: 'mold' });
    expect(Array.isArray(sp.sensitivity.ruleIds)).toBe(true);
  });
});

const colorsAllowed = [
  'Black', 'Brown', 'White', 'Orange', 'Green', 'Blue', 'Red',
  'Yellow', 'Indigo', 'Violet', 'Pink', 'Grey',
];
