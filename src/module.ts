// Foundry entry point. Wires the module lifecycle, registers the UI, and exposes
// the garden API for macros / other modules. All the real work lives in the
// Foundry-free engine (src/engine) behind the src/foundry adapter; this file only
// registers hooks, opens the UI, and publishes the API.

import { MODULE_ID } from './foundry/constants';
import {
  advanceGarden,
  getGarden,
  initGarden,
  plantSpecies,
  stepGarden,
} from './foundry/actor-garden';
import { clearBundle } from './foundry/store';
import { GardenApp, openGardenApp } from './ui/garden-app';
import type { FungalType } from './data/types';
import type { DayActions } from './engine/pipeline';

const TEMPLATES = [`modules/${MODULE_ID}/templates/garden.hbs`];

/** Public API surface, published on the module and on globalThis.fungalGarden. */
const api = {
  /** Open the garden window for an actor (or the id). */
  open: (actor: FoundryActor) => openGardenApp(actor),
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
  /** The application class, for advanced callers. */
  GardenApp,
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
  // Preload the app template so the first open is instant.
  void loadTemplates(TEMPLATES);
});

Hooks.once('ready', () => {
  const mod = game.modules.get(MODULE_ID);
  if (mod) mod.api = api;
  (globalThis as unknown as { fungalGarden: FungalGardenApi }).fungalGarden = api;
  console.log(
    `${MODULE_ID} | Ready — API at game.modules.get('${MODULE_ID}').api and globalThis.fungalGarden`,
  );
});

// Add a header control to actor sheets that opens the garden. Wrapped defensively
// because sheet header APIs vary across Foundry/system versions — verify in a live
// world; the API (fungalGarden.open(actor)) is the guaranteed entry point.
Hooks.on('getActorSheetHeaderButtons', (...args: unknown[]) => {
  try {
    const [sheet, buttons] = args as [{ actor?: FoundryActor }, Array<Record<string, unknown>>];
    const actor = sheet?.actor;
    if (!actor || !Array.isArray(buttons)) return;
    buttons.unshift({
      label: 'Garden',
      class: 'fungal-garden-open',
      icon: 'fas fa-seedling',
      onclick: () => openGardenApp(actor),
    });
  } catch (err) {
    console.warn(`${MODULE_ID} | could not add sheet header button`, err);
  }
});
