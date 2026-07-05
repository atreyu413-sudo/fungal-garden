import { describe, it, expect } from 'vitest';
import { rngFor } from '../src/engine/rng';
import { generateWildSpecies } from '../src/engine/species-generator';
import { createGarden, withRegistry, cultivate } from '../src/engine/garden';
import { advanceDays, advanceDay } from '../src/engine/pipeline';
import { ColonyStage } from '../src/data/types';

function seededGarden(seed: number, fungalType: 'mold' | 'toadstool' | 'mushroom' = 'mold') {
  const bundle = withRegistry(createGarden({ ownerId: 'ogeez', seed, radius: 3 }));
  const sp = generateWildSpecies(rngFor(seed, 9999), { fungalType });
  const colony = cultivate(bundle, sp, '0,0', rngFor(seed, 8888), 0)!;
  return { bundle, sp, colony };
}

describe('simulation pipeline', () => {
  it('a cultivated mold matures (after spreading to MRUOM) and queues events', () => {
    const { bundle, colony } = seededGarden(2024, 'mold');
    advanceDays(bundle, 400); // enough for any mold to spread to MRUOM and mature
    const c = bundle.garden.colonies.find((x) => x.id === colony.id)!;
    expect(c.stage).toBe(ColonyStage.MATURE);
    expect(c.maturityAgeDays).toBeGreaterThan(0);
    // mold must reach MRUOM to mature, so it must have spread
    expect(bundle.garden.events.some((e) => e.type === 'mature')).toBe(true);
    expect(bundle.garden.events.some((e) => e.type === 'spread')).toBe(true);
    expect(c.myceliumUnits).toBeGreaterThanOrEqual(bundle.garden.species[0]!.physical.rates.mruom);
  });

  it('campaignDay advances exactly one per day', () => {
    const { bundle } = seededGarden(1);
    expect(bundle.garden.campaignDay).toBe(0);
    advanceDay(bundle);
    expect(bundle.garden.campaignDay).toBe(1);
    advanceDays(bundle, 9);
    expect(bundle.garden.campaignDay).toBe(10);
  });

  it('harvest resets maturation and produces an inventory item (no immediate regrowth)', () => {
    const { bundle, colony } = seededGarden(2024, 'mold');
    // advance until mature
    let guard = 0;
    while (bundle.garden.colonies[0]!.stage !== ColonyStage.MATURE && guard++ < 400) {
      advanceDay(bundle);
    }
    const c = bundle.garden.colonies.find((x) => x.id === colony.id)!;
    expect(c.stage).toBe(ColonyStage.MATURE);
    const before = totalInventory(bundle.garden);
    advanceDay(bundle, { harvests: [c.id] });
    expect(totalInventory(bundle.garden)).toBe(before + 1);
    // reset: no longer mature/harvestReady, maturation restarted
    expect(c.harvestReady).toBe(false);
    expect(c.stage).not.toBe(ColonyStage.MATURE);
    expect(c.maturityAgeDays).toBeLessThan(bundle.garden.species[0]!.physical.rates.rtfmDays);
  });

  it('registry tracks living colony count', () => {
    const { bundle } = seededGarden(5);
    const entry = bundle.registry[0]!;
    expect(entry.currentLivingColonies).toBe(1);
  });
});

function totalInventory(garden: ReturnType<typeof createGarden>): number {
  const inv = garden.inventory;
  return inv.spores.length + inv.powders.length + inv.teas.length + inv.toxins.length;
}
