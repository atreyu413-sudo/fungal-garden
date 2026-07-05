// Actor-flag persistence for the Garden. The whole { garden, registry } bundle
// is stored under one actor flag (decision D19: on the actor, no journal
// storage). Everything in the bundle is plain JSON-serializable data, so it
// round-trips through Foundry's flag system unchanged.

import { createGarden, withRegistry, type GardenWithRegistry } from '../engine/garden';
import { FLAG_KEY, MODULE_ID } from './constants';
import { migrateBundle, type StoredBundle } from './migration';

/** Deterministic per-actor seed derived from the actor id, so a garden created
 * without an explicit seed is still stable and replayable for that actor. */
export function seedFromActor(actor: FoundryActor): number {
  let h = 2166136261 >>> 0; // FNV-1a
  for (const ch of actor.id) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

/** Read and migrate the stored bundle, or null if the actor has no garden yet. */
export function loadBundle(actor: FoundryActor): GardenWithRegistry | null {
  const raw = actor.getFlag(MODULE_ID, FLAG_KEY) as StoredBundle | undefined;
  if (!raw || !raw.garden) return null;
  return migrateBundle(raw);
}

/** Persist the bundle back to the actor flag. */
export async function saveBundle(actor: FoundryActor, bundle: GardenWithRegistry): Promise<void> {
  await actor.setFlag(MODULE_ID, FLAG_KEY, bundle);
}

/** Remove the garden from an actor entirely. */
export async function clearBundle(actor: FoundryActor): Promise<void> {
  await actor.unsetFlag(MODULE_ID, FLAG_KEY);
}

/** Load the actor's garden, creating and persisting a fresh one if absent. */
export async function getOrCreateBundle(
  actor: FoundryActor,
  opts: { seed?: number; radius?: number } = {},
): Promise<GardenWithRegistry> {
  const existing = loadBundle(actor);
  if (existing) return existing;
  const bundle = withRegistry(
    createGarden({ ownerId: actor.id, seed: opts.seed ?? seedFromActor(actor), radius: opts.radius }),
  );
  await saveBundle(actor, bundle);
  return bundle;
}
