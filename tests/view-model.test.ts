import { describe, it, expect } from 'vitest';
import { rngFor } from '../src/engine/rng';
import { generateWildSpecies } from '../src/engine/species-generator';
import { createGarden, withRegistry, cultivate } from '../src/engine/garden';
import { advanceDays } from '../src/engine/pipeline';
import { buildGardenViewModel } from '../src/ui/view-model';
import { colorToHex } from '../src/ui/colors';

function gardenWithColony(seed: number) {
  const bundle = withRegistry(createGarden({ ownerId: 'ogeez', seed, radius: 3 }));
  const sp = generateWildSpecies(rngFor(seed, 1), { fungalType: 'mold' });
  cultivate(bundle, sp, '0,0', rngFor(seed, 2), 0);
  return { bundle, sp };
}

describe('garden view-model', () => {
  it('produces one hex per tile with valid geometry', () => {
    const { bundle } = gardenWithColony(1);
    const vm = buildGardenViewModel(bundle);
    expect(vm.hexes.length).toBe(bundle.garden.tiles.length);
    for (const h of vm.hexes) {
      expect(h.points.split(' ')).toHaveLength(6); // hexagon
      expect(h.cx).toBeGreaterThanOrEqual(0);
      expect(h.cy).toBeGreaterThanOrEqual(0);
      expect(h.cx).toBeLessThanOrEqual(vm.width);
      expect(h.cy).toBeLessThanOrEqual(vm.height);
    }
  });

  it('colors an occupied hex with its species color', () => {
    const { bundle, sp } = gardenWithColony(2);
    const vm = buildGardenViewModel(bundle);
    const center = vm.hexes.find((h) => h.q === 0 && h.r === 0)!;
    expect(center.occupied).toBe(true);
    expect(center.speciesName).toBe(sp.displayName);
    expect(center.fill).toBe(colorToHex(sp.physical.color));
  });

  it('reports accurate stats', () => {
    const { bundle } = gardenWithColony(3);
    const vm = buildGardenViewModel(bundle);
    expect(vm.stats.totalTiles).toBe(bundle.garden.tiles.length);
    expect(vm.stats.occupiedTiles).toBe(1);
    expect(vm.stats.livingColonies).toBe(1);
    expect(vm.stats.activeSpecies).toBe(1);
    expect(vm.stats.discoveredSpecies).toBe(1);
    expect(vm.stats.ecosystemState).toBe('healthy');
  });

  it('builds a discovery journal from the registry', () => {
    const { bundle, sp } = gardenWithColony(4);
    const vm = buildGardenViewModel(bundle);
    expect(vm.journal).toHaveLength(1);
    expect(vm.journal[0]!.name).toBe(sp.displayName);
    expect(vm.journal[0]!.generation).toBe(0);
    expect(vm.journal[0]!.extinct).toBe(false);
    expect(vm.journal[0]!.livingColonies).toBe(1);
  });

  it('surfaces recent events newest-first after simulating', () => {
    const { bundle } = gardenWithColony(5);
    advanceDays(bundle, 200);
    const vm = buildGardenViewModel(bundle, { eventLimit: 10 });
    expect(vm.events.length).toBeGreaterThan(0);
    expect(vm.events.length).toBeLessThanOrEqual(10);
    // newest first
    for (let i = 1; i < vm.events.length; i++) {
      expect(vm.events[i - 1]!.day).toBeGreaterThanOrEqual(vm.events[i]!.day);
    }
  });

  it('occupied count grows as mycelium spreads', () => {
    const { bundle } = gardenWithColony(6);
    advanceDays(bundle, 200);
    const vm = buildGardenViewModel(bundle);
    expect(vm.stats.occupiedTiles).toBeGreaterThan(1);
  });
});
