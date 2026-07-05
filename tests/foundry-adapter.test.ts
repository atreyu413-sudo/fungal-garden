import { describe, it, expect } from 'vitest';
import {
  advanceGarden,
  getGarden,
  initGarden,
  plantSpecies,
} from '../src/foundry/actor-garden';
import { migrateBundle } from '../src/foundry/migration';
import { GARDEN_SCHEMA_VERSION } from '../src/engine/garden';

// A mock Foundry actor whose flags round-trip through JSON, exactly like real
// Foundry document flags. This also proves the bundle is fully serializable.
function mockActor(id = 'actor-1', name = 'Ogeez'): FoundryActor {
  const store: Record<string, Record<string, unknown>> = {};
  const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));
  const actor: FoundryActor = {
    id,
    name,
    getFlag(scope, key) {
      const v = store[scope]?.[key];
      return v === undefined ? undefined : clone(v);
    },
    async setFlag(scope, key, value) {
      (store[scope] ??= {})[key] = clone(value);
      return actor;
    },
    async unsetFlag(scope, key) {
      if (store[scope]) delete store[scope][key];
      return actor;
    },
  };
  return actor;
}

describe('foundry actor adapter', () => {
  it('creates and persists a garden on the actor', async () => {
    const actor = mockActor();
    expect(getGarden(actor)).toBeNull();
    const bundle = await initGarden(actor);
    expect(bundle.garden.version).toBe(GARDEN_SCHEMA_VERSION);
    expect(bundle.garden.ownerId).toBe(actor.id);
    // reload from the flag
    const reloaded = getGarden(actor)!;
    expect(reloaded).not.toBeNull();
    expect(reloaded.garden.tiles.length).toBeGreaterThan(0);
  });

  it('advancing persists the new campaign day across reloads', async () => {
    const actor = mockActor();
    await initGarden(actor);
    await advanceGarden(actor, 5);
    expect(getGarden(actor)!.garden.campaignDay).toBe(5);
    await advanceGarden(actor, 3);
    expect(getGarden(actor)!.garden.campaignDay).toBe(8);
  });

  it('planting cultivates a colony that survives a reload', async () => {
    const actor = mockActor();
    await initGarden(actor);
    const { species } = await plantSpecies(actor, '0,0', { fungalType: 'mold' });
    expect(species).not.toBeNull();
    const reloaded = getGarden(actor)!;
    expect(reloaded.garden.colonies.length).toBe(1);
    expect(reloaded.garden.species.length).toBe(1);
    expect(reloaded.registry.length).toBe(1);
    expect(reloaded.registry[0]!.currentLivingColonies).toBe(1);
  });

  it('same actor id yields a deterministic seed and identical runs', async () => {
    const a1 = mockActor('same-id');
    const a2 = mockActor('same-id');
    await initGarden(a1);
    await initGarden(a2);
    await plantSpecies(a1, '0,0', { fungalType: 'mold' });
    await plantSpecies(a2, '0,0', { fungalType: 'mold' });
    await advanceGarden(a1, 100);
    await advanceGarden(a2, 100);
    expect(JSON.stringify(getGarden(a1))).toBe(JSON.stringify(getGarden(a2)));
  });

  it('migration stamps an older stored garden to the current version', () => {
    const actor = mockActor();
    // hand-craft a minimal old bundle at 0.1.0
    const old = {
      garden: {
        version: '0.1.0',
        ownerId: actor.id,
        campaignDay: 3,
        randomSeed: 1,
        tiles: [],
        colonies: [],
        species: [],
        inventory: { spores: [], powders: [], teas: [], toxins: [] },
        events: [],
        ecosystem: { state: 'healthy', collapsedColonyIds: [] },
      },
    } as never;
    const migrated = migrateBundle(old);
    expect(migrated.garden.version).toBe(GARDEN_SCHEMA_VERSION);
    expect(migrated.registry).toEqual([]); // missing registry defaults to []
    expect(migrated.garden.campaignDay).toBe(3); // data preserved
  });
});
