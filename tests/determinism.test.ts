import { describe, it, expect } from 'vitest';
import { rngFor } from '../src/engine/rng';
import { generateWildSpecies } from '../src/engine/species-generator';
import { createGarden, withRegistry, cultivate } from '../src/engine/garden';
import { advanceDays } from '../src/engine/pipeline';

// Build and run an identical scenario from a seed, twice, and compare.
function runScenario(seed: number) {
  const bundle = withRegistry(createGarden({ ownerId: 'ogeez', seed, radius: 3 }));
  const sp = generateWildSpecies(rngFor(seed, 9999), { fungalType: 'mold' });
  cultivate(bundle, sp, '0,0', rngFor(seed, 8888), 0);
  advanceDays(bundle, 120);
  return bundle;
}

// Strip nothing — everything (ids come from the seed) should be identical.
function snapshot(bundle: ReturnType<typeof runScenario>): string {
  return JSON.stringify({ garden: bundle.garden, registry: bundle.registry });
}

describe('determinism / replay', () => {
  it('same seed produces byte-identical results', () => {
    const a = snapshot(runScenario(777));
    const b = snapshot(runScenario(777));
    expect(a).toBe(b);
  });

  it('different seeds diverge', () => {
    const a = snapshot(runScenario(777));
    const b = snapshot(runScenario(778));
    expect(a).not.toBe(b);
  });

  it('event log grows deterministically', () => {
    const a = runScenario(42);
    const b = runScenario(42);
    expect(a.garden.events.length).toBe(b.garden.events.length);
    expect(a.garden.events).toEqual(b.garden.events);
  });
});
