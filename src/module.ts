// Foundry entry point. Wires the module lifecycle and exposes the garden API for
// macros / other modules. All the real work lives in the Foundry-free engine
// (src/engine) behind the src/foundry adapter; this file only registers hooks and
// publishes the API.

import { MODULE_ID } from './foundry/constants';
import {
  advanceGarden,
  getGarden,
  initGarden,
  plantSpecies,
  stepGarden,
} from './foundry/actor-garden';
import { clearBundle } from './foundry/store';
import type { FungalType } from './data/types';
import type { DayActions } from './engine/pipeline';

/** Public API surface, published on the module and on globalThis.fungalGarden. */
const api = {
  /** Create (or fetch) the garden on an actor. */
  init: (actor: FoundryActor, opts?: { seed?: number; radius?: number }) => initGarden(actor, opts),
  /** Read an actor's garden bundle (or null). */
  get: (actor: FoundryActor) => getGarden(actor),
  /** Advance the garden by N campaign days. GM only. */
  advance: (actor: FoundryActor, days = 1) => gmOnly(() => advanceGarden(actor, days)),
  /** Advance one day, applying breed/harvest actions. GM only. */
  step: (actor: FoundryActor, actions: DayActions = {}) => gmOnly(() => stepGarden(actor, actions)),
  /** Generate a wild species and cultivate it onto a tile. GM only. */
  plant: (actor: FoundryActor, tileId: string, fungalType?: FungalType) =>
    gmOnly(() => plantSpecies(actor, tileId, { fungalType })),
  /** Delete an actor's garden. GM only. */
  clear: (actor: FoundryActor) => gmOnly(() => clearBundle(actor)),
};

export type FungalGardenApi = typeof api;

function gmOnly<T>(fn: () => T): T {
  if (game.user && !game.user.isGM) {
    ui.notifications?.warn('Fungal Garden: only the GM can change the garden.');
    throw new Error('Fungal Garden: GM-only operation');
  }
  return fn();
}

Hooks.once('init', () => {
  console.log(`${MODULE_ID} | Initializing Fungal Garden`);
});

Hooks.once('ready', () => {
  const mod = game.modules.get(MODULE_ID);
  if (mod) mod.api = api;
  (globalThis as unknown as { fungalGarden: FungalGardenApi }).fungalGarden = api;
  console.log(`${MODULE_ID} | Ready — API available as game.modules.get('${MODULE_ID}').api and globalThis.fungalGarden`);
});
