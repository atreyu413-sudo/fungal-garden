// High-level actor <-> engine adapter. This is the whole Foundry-facing surface
// for driving a garden: create it, advance days, plant/cultivate, harvest, breed.
// Each mutating call runs the pure engine on the loaded bundle and persists the
// result back to the actor flag. The engine stays Foundry-free; this layer is the
// only place that touches actor storage.

import type { FungalType, Species } from '../data/types';
import { rngFor } from '../engine/rng';
import { generateWildSpecies } from '../engine/species-generator';
import { cultivate, type GardenWithRegistry } from '../engine/garden';
import { advanceDays, type DayActions } from '../engine/pipeline';
import { getOrCreateBundle, loadBundle, saveBundle } from './store';

/** Ensure the actor has a garden (creating one if needed) and return it. */
export async function initGarden(
  actor: FoundryActor,
  opts: { seed?: number; radius?: number } = {},
): Promise<GardenWithRegistry> {
  return getOrCreateBundle(actor, opts);
}

/** Read the actor's garden without creating one. */
export function getGarden(actor: FoundryActor): GardenWithRegistry | null {
  return loadBundle(actor);
}

/** Advance the actor's garden by N days, then persist. */
export async function advanceGarden(
  actor: FoundryActor,
  days = 1,
  actionsFor?: (day: number) => DayActions,
): Promise<GardenWithRegistry> {
  const bundle = await getOrCreateBundle(actor);
  advanceDays(bundle, days, actionsFor);
  await saveBundle(actor, bundle);
  return bundle;
}

/**
 * Generate a fresh wild species and cultivate it onto a tile. The species roll
 * is seeded from the garden's stable seed + campaignDay + colony count, so it is
 * reproducible and does not disturb the pipeline's per-stage RNG streams.
 */
export async function plantSpecies(
  actor: FoundryActor,
  tileId: string,
  opts: { fungalType?: FungalType } = {},
): Promise<{ bundle: GardenWithRegistry; species: Species | null }> {
  const bundle = await getOrCreateBundle(actor);
  const { garden } = bundle;
  const salt = garden.colonies.length;
  const speciesRng = rngFor(garden.randomSeed, garden.campaignDay, 0xf00d, salt);
  const species = generateWildSpecies(speciesRng, {
    fungalType: opts.fungalType,
    createdDay: garden.campaignDay,
    createdBy: actor.name,
  });
  const cultivateRng = rngFor(garden.randomSeed, garden.campaignDay, 0xbeef, salt);
  const colony = cultivate(bundle, species, tileId, cultivateRng, garden.campaignDay);
  await saveBundle(actor, bundle);
  return { bundle, species: colony ? species : null };
}

/** Convenience: advance one day performing the given actions (breed/harvest). */
export async function stepGarden(actor: FoundryActor, actions: DayActions = {}): Promise<GardenWithRegistry> {
  return advanceGarden(actor, 1, () => actions);
}
