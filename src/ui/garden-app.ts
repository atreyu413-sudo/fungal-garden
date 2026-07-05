// The Garden window — a Foundry v13 ApplicationV2 that renders the hex grid,
// discovery journal, stats, and event log, with a GM control panel. All the
// render data comes from the tested pure view-model (view-model.ts); this class
// only bridges Foundry (actor lookup, persistence, click actions) to it.

import { MODULE_ID } from '../foundry/constants';
import { advanceGarden, getGarden, plantSpecies } from '../foundry/actor-garden';
import { clearBundle } from '../foundry/store';
import { buildGardenViewModel } from './view-model';

const TEMPLATE = `modules/${MODULE_ID}/templates/garden.hbs`;

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class GardenApp extends HandlebarsApplicationMixin(ApplicationV2) {
  actorId: string;
  private activeTab: 'grid' | 'journal' | 'stats' | 'log' = 'grid';
  private selectedTileId: string | null = null;

  constructor(options: { actorId: string } & Record<string, unknown>) {
    super(options);
    this.actorId = options.actorId;
  }

  static DEFAULT_OPTIONS = {
    id: 'fungal-garden-app',
    classes: ['fungal-garden'],
    tag: 'div',
    window: {
      title: 'FUNGAL_GARDEN.title',
      icon: 'fas fa-seedling',
      resizable: true,
    },
    position: { width: 860, height: 760 },
    actions: {
      tab: GardenApp.onTab,
      advance: GardenApp.onAdvance,
      plant: GardenApp.onPlant,
      clear: GardenApp.onClear,
      hex: GardenApp.onHex,
    },
  };

  static PARTS = {
    main: { template: TEMPLATE, scrollable: [''] },
  };

  get actor(): FoundryActor | undefined {
    return game.actors?.get(this.actorId);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async _prepareContext(_options: unknown): Promise<Record<string, unknown>> {
    const actor = this.actor;
    const bundle = actor ? getGarden(actor) : null;
    const vm = bundle ? buildGardenViewModel(bundle) : null;

    // Detail for the currently selected tile, if any.
    let selected: Record<string, unknown> | null = null;
    if (vm && this.selectedTileId) {
      const hex = vm.hexes.find((h) => h.id === this.selectedTileId) ?? null;
      if (hex?.colonyId && bundle) {
        const colony = bundle.garden.colonies.find((c) => c.id === hex.colonyId);
        const species = colony ? bundle.garden.species.find((s) => s.id === colony.speciesId) : undefined;
        selected = { hex, colony, species };
      } else if (hex) {
        selected = { hex, colony: null, species: null };
      }
    }

    return {
      isGM: game.user?.isGM ?? false,
      hasGarden: !!bundle,
      actorName: actor?.name ?? 'Unknown',
      vm,
      selected,
      tab: this.activeTab,
      isGrid: this.activeTab === 'grid',
      isJournal: this.activeTab === 'journal',
      isStats: this.activeTab === 'stats',
      isLog: this.activeTab === 'log',
    };
  }

  // --- action handlers (Foundry calls these with `this` = the app instance) ---

  static onTab(this: GardenApp, _event: Event, target: HTMLElement): void {
    const tab = target.dataset.tab as GardenApp['activeTab'] | undefined;
    if (tab) {
      this.activeTab = tab;
      this.render();
    }
  }

  static async onAdvance(this: GardenApp, _event: Event, target: HTMLElement): Promise<void> {
    if (!this.actor) return;
    const days = Number(target.dataset.days ?? 1) || 1;
    await advanceGarden(this.actor, days);
    this.render();
  }

  static async onPlant(this: GardenApp, _event: Event, target: HTMLElement): Promise<void> {
    if (!this.actor) return;
    const tileId = target.dataset.tileId ?? this.firstEmptyTileId();
    if (!tileId) {
      ui.notifications?.warn('Fungal Garden: no empty tile to plant on.');
      return;
    }
    await plantSpecies(this.actor, tileId);
    this.render();
  }

  static async onClear(this: GardenApp): Promise<void> {
    if (!this.actor) return;
    await clearBundle(this.actor);
    this.selectedTileId = null;
    this.render();
  }

  static async onHex(this: GardenApp, _event: Event, target: HTMLElement): Promise<void> {
    const tileId = target.dataset.tileId;
    if (!tileId || !this.actor) return;
    const bundle = getGarden(this.actor);
    const tile = bundle?.garden.tiles.find((t) => t.id === tileId);
    // GM click on an empty tile plants there; otherwise just select for detail.
    if (game.user?.isGM && tile && !tile.occupied) {
      await plantSpecies(this.actor, tileId);
    }
    this.selectedTileId = tileId;
    this.render();
  }

  private firstEmptyTileId(): string | null {
    const bundle = this.actor ? getGarden(this.actor) : null;
    return bundle?.garden.tiles.find((t) => !t.occupied)?.id ?? null;
  }

  // provided by ApplicationV2 base (loosely typed shim)
  declare render: (force?: boolean) => Promise<unknown>;
}

/** Open (or focus) the garden window for an actor. */
export function openGardenApp(actor: FoundryActor): GardenApp {
  const app = new GardenApp({ actorId: actor.id, window: { title: `${actor.name} — Fungal Garden` } });
  app.render(true);
  return app;
}
